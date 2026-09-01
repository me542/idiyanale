"use client";
import { useEffect, useRef, useState } from "react";
import {
    X, Check, MessageSquare, Paperclip, Send,
    Bold, Italic, Underline, Strikethrough, List, Type,
    ClipboardList, Repeat, Ban, Trash2, Loader2,
} from "lucide-react";
import { InstitutionTicket, TicketUser } from "@/services/integration/ticket/get_all_ticket_by_insti";
import { getTicketRemarks, TicketRemark } from "@/services/integration/remark/get_ticket_remarks";
import { postTicketRemark } from "@/services/integration/remark/post_ticket_remark";
import { getInstitutionResolverGroups } from "@/services/integration/institution/get-insti-by-id-resolver-group";
import { getUsersByInstitution, UserDetails } from "@/services/integration/super_admin/get_user_insti_id";
// NOTE: adjust this path to wherever processTicket actually lives in your
// services folder — guessed to match the other integration/ticket imports.
import { processTicket, TicketProcessAction } from "@/services/integration/ticket/post_ticket_process";
import { getTicketAttachments, deleteTicketAttachment, TicketAttachment as TicketAttachmentFile } from "@/services/integration/ticket/get_ticket_attachments";
import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";
import { getSubCategoryByID } from "@/services/integration/insti-admin/get_sub_category_id";
import { getProjectByID } from "@/services/integration/project/get_project_id";

// ---------------------------------------------------------------------------
// Local-user helpers — reads from localStorage set by VerifyOtp.ts at login.
// ---------------------------------------------------------------------------

interface LocalUser {
    id: number | null;
    staffId: string;
    roleName: string;
    institutionId: number | null;
    permissions: {
        can_create: boolean;
        can_endorse: boolean;
        can_approve: boolean;
        can_resolve: boolean;
        can_audit: boolean;
    };
}

function getLocalUserFull(): LocalUser {
    const empty: LocalUser = {
        id: null,
        staffId: "",
        roleName: "",
        institutionId: null,
        permissions: {
            can_create: false,
            can_endorse: false,
            can_approve: false,
            can_resolve: false,
            can_audit: false,
        },
    };

    if (typeof window === "undefined") return empty;

    try {
        const rawUser = localStorage.getItem("user");
        const rawPerms = localStorage.getItem("permissions");
        const rawInstiId = localStorage.getItem("institution_id");

        const u = rawUser ? JSON.parse(rawUser) : null;
        const p = rawPerms ? JSON.parse(rawPerms) : null;

        return {
            id: u?.id ?? null,
            staffId: u?.staffId ?? "",
            roleName: u?.roleName ?? localStorage.getItem("role") ?? "",
            institutionId: rawInstiId ? Number(rawInstiId) : null,
            permissions: {
                can_create: p?.can_create ?? false,
                can_endorse: p?.can_endorse ?? false,
                can_approve: p?.can_approve ?? false,
                can_resolve: p?.can_resolve ?? false,
                can_audit: p?.can_audit ?? false,
            },
        };
    } catch {
        return empty;
    }
}

// Read the logged-in user's display info from the JWT claims stored at login.

interface ApprovalStep {
    id: string;
    name: string;
    initials: string;
    status: string;
    timestamp?: string;
    duration?: string;
    pending?: boolean;
    /** Resolver-only: which of the 4 sub-states this row is in. Drives which
     * action-button pair renders (ACCEPT/REJECT vs RESOLVED/HOLD vs
     * REJECT/RESUME) and whether the avatar shows initials or is blank. */
    resolverPhase?: "for_review" | "in_progress" | "on_hold" | "resolved";
    /** Set when the ticket was cancelled — marks this step as the stop point. */
    cancelled?: boolean;
    cancelTimestamp?: string;
}

interface TicketDetailPanelProps {
    ticket: InstitutionTicket | null;
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onSendRemark?: (ticketId: string, message: string) => void;
    onAcceptStep?: (stepId: string) => void;
    onRejectStep?: (stepId: string) => void;
    /** Pause an in-progress resolver step. */
    onHoldStep?: (stepId: string) => void;
    /** Resume a resolver step that's on hold. */
    onResumeStep?: (stepId: string) => void;
    /** New: reassign a step (endorser or resolver) to a different user.
     * `newUserId` is whatever the caller collected from the reassign dialog —
     * currently a raw user id typed in, until a picker/API is wired up. */
    onReassignStep?: (stepId: string, newUserId: number) => void;
    /** New: submitter cancels the whole ticket. */
    onCancelTicket?: (ticketId: string) => void;
    /** New: fired right after a successful process/cancel action with the
     * panel's best-effort updated ticket, so the parent can sync its own
     * list/cache instead of relying on a manual page refresh. */
    onTicketUpdated?: (updatedTicket: InstitutionTicket) => void;
}

const PROGRESS_STEPS = [
    "Submitter",
    "Endorser",
    "Approver",
    "Assigned",
    "Resolved",
    "Closed",
];

const PANEL_WIDTH = "64rem";

function fullName(user: TicketUser | null | undefined): string | undefined {
    if (!user) return undefined;
    return `${user.first_name} ${user.last_name}`.trim();
}

function initials(user: TicketUser | null | undefined): string {
    if (!user) return "?";
    return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
}

// TicketUser as documented doesn't expose `.id` explicitly in this file's
// imports — read it defensively the same way `resolver_status` etc. are read
// elsewhere below, so this keeps working once the real type is confirmed.
function userId(user: TicketUser | null | undefined): number | null {
    const id = (user as { id?: number } | null | undefined)?.id;
    return typeof id === "number" ? id : null;
}

function formatDate(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

// Formats a millisecond duration as "MM:SSs" to match the "01:32s" style
// shown for in-progress / resolved resolver rows.
function formatElapsed(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}s`;
}

// Maps ticket.status to how many of PROGRESS_STEPS are "done".
// Grouped the same way as getStatusStyle in DueActivity — keep these two in sync.
function getCompletedSteps(status: string): number {
    const value = status.toLowerCase().trim();

    switch (value) {
        case "closed":
            return 6;
        case "resolved":
            return 5;
        case "in progress":
        case "on hold":
            return 4;
        case "for assignment":
            return 3;
        case "endorsed":
        case "for approval":
            return 2;
        case "for review":
        case "for endorsement":
            return 1;
        case "cancel":
        case "canceled":
            return 0;
        default:
            return 0;
    }
}

// Returns the 0-based index of the PROGRESS_STEP where the ticket was
// stopped (cancelled or rejected). Returns -1 when the ticket is not in
// a terminal stopped state.
//
// We infer the stop-point from the timestamps that are already set:
//   Submitter (0)  → cancel but no endorsed_at
//   Endorser (1)   → endorsed_at but no approved_at
//   Approver (2)   → approved_at but no resolver_id / started_at
//   Assigned (3)   → resolver_id set but not resolved
//   Resolved (4)   → resolved_at set (shouldn't happen for cancel)
function getStopStep(ticket: InstitutionTicket): number {
    const status = ticket.status?.toLowerCase().trim();
    if (status !== "cancel" && status !== "canceled") return -1;

    if (ticket.endorsed_at && ticket.approved_at) return 3; // stopped at Assigned
    if (ticket.endorsed_at) return 2;                       // stopped at Approver
    return 1;                                               // stopped at Endorser
}

// Determines which of the 4 resolver sub-states to show. Prefers an explicit
// `ticket.resolver_status` field if the API provides one; otherwise falls
// back to inferring it from `ticket.status` / completedSteps. Adjust the
// field name here once the real ticket model is confirmed.
function getResolverPhase(
    ticket: InstitutionTicket,
    completedSteps: number
): ApprovalStep["resolverPhase"] {
    const explicit = (ticket as { resolver_status?: string }).resolver_status;
    if (explicit === "for_review" || explicit === "in_progress" || explicit === "on_hold" || explicit === "resolved") {
        return explicit;
    }

    if (completedSteps >= 5) return "resolved";
    if (ticket.status?.toLowerCase().trim() === "on hold") return "on_hold";
    if (completedSteps >= 4) return "in_progress";
    // Approved but resolver hasn't accepted the assignment yet.
    return "for_review";
}

// Maps a UI action (+ resolver sub-phase, where relevant) to the backend's
// TicketProcessAction. Returns null when there's no matching action yet —
// callers should surface that instead of silently no-oping.
//
// Current TicketProcessAction enum: endorse | approve | grab | ungrab |
// resolve | close | cancel. There is NO backend action yet for: reject on
// the endorser/approver rows, hold, resume, or reassign — confirm the real
// action names/endpoints for those with the backend and update this map.
function resolveProcessAction(
    stepId: string,
    kind: "accept" | "reject" | "hold" | "resume" | "reassign" | "cancel",
    phase?: ApprovalStep["resolverPhase"]
): TicketProcessAction | null {
    if (kind === "cancel") return "cancel";
    if (kind === "hold") return "hold";
    if (kind === "resume") return "resume";

    if (stepId === "endorsed" && kind === "accept") return "endorse";
    if (stepId === "approved" && kind === "accept") return "approve";
    if (stepId === "closed" && kind === "accept") return "close";

    if (stepId === "resolved") {
        if (kind === "accept" && phase === "for_review") return "grab";
        if (kind === "accept" && phase === "in_progress") return "resolve";
        // Best guess: rejecting/releasing an assignment maps to "ungrab".
        if (kind === "reject" && (phase === "for_review" || phase === "on_hold")) return "ungrab";
    }

    return null;
}

// Best-effort local patch applied right after a successful processTicket
// call, so the UI reflects the change immediately instead of waiting for a
// page refresh / parent refetch. If the backend response includes the
// updated ticket in `data`, that's preferred over this guess — see the
// confirm handler below. Field names (status strings, resolver_status) are
// guesses consistent with the rest of this file; adjust if they don't match
// the real model.
function deriveOptimisticPatch(
    action: TicketProcessAction
): Partial<InstitutionTicket> & { resolver_status?: string } {
    const now = new Date().toISOString();
    switch (action) {
        case "endorse":
            return { status: "endorsed", endorsed_at: now };
        case "approve":
            return { status: "for assignment", approved_at: now };
        case "grab":
            return { status: "in progress", resolver_status: "in_progress" };
        case "resolve":
            return { status: "resolved", resolved_at: now, resolver_status: "resolved" };
        case "ungrab":
            return { status: "for assignment", resolver_status: "for_review" };
        case "hold":
            return { status: "on hold" };
        case "resume":
            return { status: "in progress" };
        case "cancel":
            return { status: "cancel" };
        case "close":
            return { status: "closed" };
        default:
            return {};
    }
}

function approvalChainFromTicket(ticket: InstitutionTicket, completedSteps: number): ApprovalStep[] {
    const steps: ApprovalStep[] = [];

    // Submitter — always shown once the ticket exists.
    if (ticket.submitter) {
        steps.push({
            id: "submitted",
            name: fullName(ticket.submitter)!,
            initials: initials(ticket.submitter),
            status: "SUBMITTED",
            timestamp: formatDate(ticket.created_at),
        });
    }

    // Endorser — shown as soon as one is assigned. If they haven't
    // endorsed yet, surface it as the current "for review" step.
    if (ticket.endorser) {
        const isDone = completedSteps >= 2;
        steps.push({
            id: "endorsed",
            name: fullName(ticket.endorser)!,
            initials: initials(ticket.endorser),
            status: isDone ? "ENDORSED" : "FOR REVIEW",
            timestamp: isDone ? formatDate(ticket.endorsed_at) : undefined,
            pending: !isDone,
        });
    }

    // Approver — stays hidden until the ticket has actually been endorsed.
    if (ticket.approver && completedSteps >= 2) {
        const isDone = completedSteps >= 3;
        steps.push({
            id: "approved",
            name: fullName(ticket.approver)!,
            initials: initials(ticket.approver),
            status: isDone ? "APPROVED" : "FOR APPROVAL",
            timestamp: isDone ? formatDate(ticket.approved_at) : undefined,
            pending: !isDone,
        });
    }

    // Resolver — stays hidden until the ticket has been approved. Has 4
    // sub-states instead of a simple pending/done toggle: for_review (not
    // yet accepted, blank avatar) -> in_progress (accepted, live timer) ->
    // on_hold (paused) -> resolved (final, with total duration).
    if (completedSteps >= 3 && (ticket.resolver || getResolverPhase(ticket, completedSteps) === "for_review")) {
        const phase = getResolverPhase(ticket, completedSteps);
        const isResolved = phase === "resolved";
        const isForReview = phase === "for_review";

        steps.push({
            id: "resolved",
            name: isForReview ? "" : (fullName(ticket.resolver) ?? ""),
            initials: isForReview ? "" : initials(ticket.resolver),
            status:
                phase === "resolved" ? "RESOLVED" :
                phase === "on_hold" ? "ON HOLD" :
                phase === "in_progress" ? "IN PROGRESS" :
                "FOR REVIEW",
            timestamp: isResolved ? formatDate(ticket.resolved_at) : undefined,
            duration: isResolved ? (ticket.resolution_time || undefined) : undefined,
            pending: phase !== "resolved",
            resolverPhase: phase,
        });
    }

    // If the ticket was cancelled, mark the last step that was active
    // before cancellation as the stop point.
    const status = ticket.status?.toLowerCase().trim();
    if ((status === "cancel" || status === "canceled") && steps.length > 0) {
        const stopIdx = getStopStep(ticket);
        // Map stopStep index (0-based in PROGRESS_STEPS) to approvalChain index.
        // Submit=0→step 0, Endorse=1→step 1, Approve=2→step 2, Assign=3→step 3
        const chainIdx = Math.min(stopIdx, steps.length - 1);
        if (chainIdx >= 0 && steps[chainIdx]) {
            steps[chainIdx].cancelled = true;
            steps[chainIdx].status = "CANCELLED";             steps[chainIdx].cancelTimestamp = formatDate(ticket.cancelled_at);
            steps[chainIdx].pending = false;
        }
    }

    return steps;
}

/**
 * Ticket detail panel. Reuses the same hover-to-expand / click-to-toggle
 * ribbon interaction as ActivityPanel, but the ribbon here carries no icon
 * (just a soft pill handle) so it isn't mistaken for the activity-menu tag.
 */
export default function TicketDetailPanel({
    ticket: ticketProp,
    isOpen,
    onClose,
    onSendRemark,
    onAcceptStep,
    onRejectStep,
    onHoldStep,
    onResumeStep,
    onCancelTicket,
    onTicketUpdated,
}: TicketDetailPanelProps) {
    // The panel keeps its own copy of the ticket so a successful action can
    // update the UI immediately, instead of waiting on the parent to pass a
    // fresh `ticket` prop (which previously meant nothing changed until a
    // full page refresh). Everything below still reads from `ticket` — see
    // the alias right after the sync effect.
    const [liveTicket, setLiveTicket] = useState<InstitutionTicket | null>(ticketProp);

    // Re-sync whenever the parent gives us a genuinely new ticket object —
    // e.g. the user picked a different row, or the parent did its own
    // refetch. If the parent just keeps passing the same stale object back,
    // this won't clobber the optimistic update we made locally.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLiveTicket(ticketProp);
    }, [ticketProp]);

    const ticket = liveTicket;

    const [showFormatBar, setShowFormatBar] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLElement>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isEmpty, setIsEmpty] = useState(true);
    const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        insertUnorderedList: false,
    });
    // Live "MM:SSs" ticker for an in-progress resolver step. Recomputed every
    // second from the resolver's start time so it counts up like the mock.
    const [elapsedTick, setElapsedTick] = useState(0);

    // Remarks state — fetched whenever the active ticket changes.
    const [remarks, setRemarks] = useState<TicketRemark[]>([]);
    const [remarksLoading, setRemarksLoading] = useState(false);
    const remarksEndRef = useRef<HTMLDivElement>(null);

    // Attachments state — fetched whenever the active ticket changes.
    const [ticketAttachments, setTicketAttachments] = useState<TicketAttachmentFile[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [uploadingAttachments, setUploadingAttachments] = useState(false);

    // Subcategory template data — subject_name & description from the template system.
    const [subCategoryTemplate, setSubCategoryTemplate] = useState<{ subject_name: string; description: string } | null>(null);

    // Project name — fetched by project_id so we can show the name instead of the raw ID.
    const [projectName, setProjectName] = useState<string | null>(null);

    // ---------------------------------------------------------------------------
    // Role-based permission state for approval-chain action buttons.
    // ---------------------------------------------------------------------------

    // Whether the logged-in user is a member of the ticket's resolver group.
    const [isResolverGroupMember, setIsResolverGroupMember] = useState(false);

    // Resolver group members with can_resolve — populated for the reassign dropdown.
    const [resolverGroupMembers, setResolverGroupMembers] = useState<UserDetails[]>([]);

    // Confirmation dialog — set to describe the pending action, null when closed.
    // `kind: "reassign"` additionally shows a target-user-id input in the dialog.
    const [pendingAction, setPendingAction] = useState<{
        stepId: string;
        kind: "accept" | "reject" | "hold" | "resume" | "reassign" | "cancel";
        label: string;
        description: string;
        // Resolver sub-phase at the time the dialog was opened — needed to
        // pick the right TicketProcessAction (grab vs resolve vs ungrab).
        phase?: ApprovalStep["resolverPhase"];
    } | null>(null);

    // Draft value for the "reassign to" input, only relevant while the
    // reassign dialog is open.
    const [reassignTarget, setReassignTarget] = useState<number | "">("");

    // Draft value for the "resolution" textarea, only relevant while the
    // resolve confirm dialog is open.
    const [resolutionNote, setResolutionNote] = useState("");

    // Draft value for the "cancel reason" textarea, only relevant while the
    // cancel confirm dialog is open.
    const [cancelReason, setCancelReason] = useState("");

    // In-flight / error state for the confirm dialog's API call.
    const [isProcessing, setIsProcessing] = useState(false);
    const [processError, setProcessError] = useState<string | null>(null);

    // Read the full local user once (it won't change while this panel is open).
    const localUser = getLocalUserFull();

    // canCancel — only the person who submitted the ticket, and only while
    // the ticket has NOT been endorsed yet (before the endorser step).
    const canCancel =
        localUser.id !== null &&
        userId(ticket?.submitter) === localUser.id &&
        ticket?.status?.toLowerCase().trim() !== "cancel" &&
        (ticket ? getCompletedSteps(ticket.status) : 0) < 2;

    // canEndorse — the endorser is pre-assigned on the ticket; that user must
    // also have the role's can_endorse permission before they can act.
    const canEndorse =
        localUser.id !== null &&
        ticket?.endorser_id !== null &&
        localUser.id === ticket?.endorser_id &&
        localUser.permissions.can_endorse;

    // canReassignEndorser — ASSUMPTION: only the submitter can redirect the
    // ticket to a different endorser, and only while it's still awaiting
    // that endorsement (not once it's already endorsed).
    const canReassignEndorser =
        localUser.id !== null && userId(ticket?.submitter) === localUser.id;

    // canApprove — any user whose role carries the can_approve permission.
    const canApprove = localUser.permissions.can_approve;

    // canResolve — users must belong to this ticket's resolver group and have
    // the role's can_resolve permission.
    const canResolve =
        isResolverGroupMember && localUser.permissions.can_resolve;

    // canReassignResolver — resolver group members with can_resolve can
    // reassign while the ticket is still in for_review (not yet grabbed).
    const canReassignResolver = canResolve;

    // Fetch the resolver groups for this ticket's institution and check
    // if the logged-in user is in any active group.
    useEffect(() => {
        const institutionId = ticket?.institution_id ?? localUser.institutionId;
        if (!institutionId || localUser.id === null) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsResolverGroupMember(false);
            setResolverGroupMembers([]);
            return;
        }

        let cancel = false;

        // Fetch resolver groups and all institution users in parallel,
        // then cross-reference to build the list of resolvers.
        Promise.all([
            getInstitutionResolverGroups(institutionId),
            getUsersByInstitution(institutionId),
        ])
            .then(([groupRes, allUsers]) => {
                if (cancel) return;
                const groups = groupRes.response ?? [];
                const isMember = groups.some(
                    (g) =>
                        g.status === "active" &&
                        g.member_ids.includes(localUser.id as number)
                );
                setIsResolverGroupMember(isMember);

                // Collect all member IDs from active resolver groups.
                const activeMemberIds = new Set<number>();
                for (const g of groups) {
                    if (g.status === "active") {
                        for (const id of g.member_ids) activeMemberIds.add(id);
                    }
                }

                // Keep only users who are in an active resolver group AND
                // have the can_resolve permission.
                const resolvers = allUsers.filter(
                    (u) =>
                        activeMemberIds.has(u.id) &&
                        u.role?.can_resolve
                );
                setResolverGroupMembers(resolvers);
            })
            .catch(() => {
                if (!cancel) {
                    setIsResolverGroupMember(false);
                    setResolverGroupMembers([]);
                }
            });

        return () => { cancel = true; };
    // Re-check when the ticket changes (different institution) or when the
    // panel opens for the first time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticket?.institution_id, ticket?.ticket_id]);

    useEffect(() => {
        const id = setInterval(() => setElapsedTick((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    // Fetch remarks whenever the panel opens with a new ticket.
    useEffect(() => {
        if (!ticket?.ticket_id) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRemarks([]);
            return;
        }
        let cancel = false;
        setRemarksLoading(true);
        getTicketRemarks(ticket.ticket_id)
            .then((data) => { if (!cancel) setRemarks(data ?? []); })
            .catch(() => { if (!cancel) setRemarks([]); })
            .finally(() => { if (!cancel) setRemarksLoading(false); });
        return () => { cancel = true; };
    }, [ticket?.ticket_id]);

    // Scroll the remarks list to the bottom whenever new remarks arrive.
    useEffect(() => {
        remarksEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [remarks]);

    // Fetch attachments whenever the panel opens with a new ticket.
    useEffect(() => {
        if (!ticket?.ticket_id) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTicketAttachments([]);
            return;
        }
        let cancel = false;
        setAttachmentsLoading(true);
        getTicketAttachments(ticket.ticket_id)
            .then((data) => { if (!cancel) setTicketAttachments(data ?? []); })
            .catch(() => { if (!cancel) setTicketAttachments([]); })
            .finally(() => { if (!cancel) setAttachmentsLoading(false); });
        return () => { cancel = true; };
    }, [ticket?.ticket_id]);

    // Fetch subcategory template data (subject_name, description) whenever the ticket changes.
    useEffect(() => {
        if (!ticket?.subcategory_id) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSubCategoryTemplate(null);
            return;
        }
        let cancel = false;
        getSubCategoryByID(ticket.subcategory_id)
            .then((res) => {
                if (cancel) return;
                const data = res.response;
                if (data) {
                    setSubCategoryTemplate({
                        subject_name: data.subject_name ?? "",
                        description: data.description ?? "",
                    });
                } else {
                    setSubCategoryTemplate(null);
                }
            })
            .catch(() => { if (!cancel) setSubCategoryTemplate(null); });
        return () => { cancel = true; };
    }, [ticket?.subcategory_id]);

    // Fetch project name whenever the ticket changes.
    useEffect(() => {
        if (!ticket?.project_id) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProjectName(null);
            return;
        }
        let cancel = false;
        getProjectByID(ticket.project_id)
            .then((data) => {
                if (!cancel) setProjectName(data?.project_name ?? null);
            })
            .catch(() => { if (!cancel) setProjectName(null); });
        return () => { cancel = true; };
    }, [ticket?.project_id]);

    // Reflects the current selection's formatting state onto the toolbar
    // so active buttons (bold/italic/etc.) show as "on".
    function refreshActiveFormats() {
        setActiveFormats({
            bold: document.queryCommandState("bold"),
            italic: document.queryCommandState("italic"),
            underline: document.queryCommandState("underline"),
            strikeThrough: document.queryCommandState("strikeThrough"),
            insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        });
    }

    function execFormat(command: string, value?: string) {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        // queryCommandState can lag a tick behind execCommand in some
        // browsers, so defer the read to the next microtask/frame.
        setTimeout(refreshActiveFormats, 0);
    }

    function handleEditorInput() {
        const text = editorRef.current?.innerText ?? "";
        setIsEmpty(text.trim().length === 0);
        refreshActiveFormats();
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        if (files.length) setAttachments((prev) => [...prev, ...files]);
        e.target.value = "";
    }

    function removeAttachment(index: number) {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    }

    // Toast state — shows brief success/error feedback.
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function showToast(message: string, type: "success" | "error" = "success") {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ message, type });
        toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    }

    // Upload pending attachments to the existing ticket.
    const handleUploadAttachments = async () => {
        if (!ticket || attachments.length === 0) return;

        setUploadingAttachments(true);
        try {
            const formData = new FormData();
            for (const file of attachments) {
                formData.append("file", file);
            }

            await post(
                ApiEndpoint.POST_TICKET_ATTACHMENTS(ticket.ticket_id),
                formData,
                { headers: {} } // Let browser set Content-Type for FormData
            );

            // Refresh the attachment list after upload.
            const updated = await getTicketAttachments(ticket.ticket_id);
            setTicketAttachments(updated ?? []);
            setAttachments([]);
            showToast("Attachments uploaded successfully");
        } catch {
            showToast("Failed to upload attachments", "error");
        }
        setUploadingAttachments(false);
    };

    // Delete an existing attachment.
    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!ticket) return;

        try {
            await deleteTicketAttachment(ticket.ticket_id, attachmentId);
            setTicketAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
            showToast("Attachment deleted");
        } catch {
            showToast("Failed to delete attachment", "error");
        }
    };

    // Close ticket — only the submitter can close a resolved ticket.
    const canClose =
        localUser.id !== null &&
        userId(ticket?.submitter) === localUser.id &&
        ticket?.status?.toLowerCase().trim() === "resolved";

    const handleSend = async () => {
        const text = editorRef.current?.innerText?.trim() ?? "";
        if ((!text && attachments.length === 0) || !ticket) return;

        // Optimistically clear the editor immediately.
        if (editorRef.current) editorRef.current.innerHTML = "";
        setIsEmpty(true);
        setAttachments([]);
        setActiveFormats({
            bold: false,
            italic: false,
            underline: false,
            strikeThrough: false,
            insertUnorderedList: false,
        });

        try {
            await postTicketRemark(ticket.ticket_id, text);
            // Refresh the remarks list after a successful post.
            const updated = await getTicketRemarks(ticket.ticket_id);
            setRemarks(updated ?? []);
        } catch {
            // Silently fail — the editor is already cleared so no duplicate send.
        }

        // Still fire the optional prop so parent components can react.
        onSendRemark?.(ticket.ticket_id, text);
    };

    // Keep toolbar active-state in sync when the caret moves via click or
    // arrow keys, not just when typing.
    useEffect(() => {
        function handleSelectionChange() {
            const sel = window.getSelection();
            if (!sel || !editorRef.current) return;
            const anchor = sel.anchorNode;
            if (anchor && editorRef.current.contains(anchor)) {
                refreshActiveFormats();
            }
        }
        document.addEventListener("selectionchange", handleSelectionChange);
        return () => document.removeEventListener("selectionchange", handleSelectionChange);
    }, []);

    // Close the panel when clicking anywhere outside of it.
    // Guard: do NOT close when the confirmation dialog is open — the dialog's
    // backdrop sits outside the aside, so it would otherwise close the panel.
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(e: MouseEvent) {
            if (pendingAction) return;
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose, pendingAction]);

    // Reset the reassign-target, resolution-note, and cancel-reason drafts whenever the dialog closes/opens.
    useEffect(() => {
        if (!pendingAction || pendingAction.kind !== "reassign") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setReassignTarget("");
        }
        // Reset resolution note unless the dialog is showing a resolve action
        // (kind=accept with phase=in_progress on the resolver step).
        const isResolveDialog =
            pendingAction?.kind === "accept" &&
            pendingAction?.phase === "in_progress" &&
            pendingAction?.stepId === "resolved";
        if (!isResolveDialog) {
             
            setResolutionNote("");
        }
        if (!pendingAction || pendingAction.kind !== "cancel") {
             
            setCancelReason("");
        }
    }, [pendingAction]);

    // Clear any stale error/processing state whenever a new dialog opens.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProcessError(null);
        setIsProcessing(false);
    }, [pendingAction?.stepId, pendingAction?.kind]);

    // Nothing to show yet and the panel isn't open — don't render anything.
    if (!ticket && !isOpen) return null;

    const ticketId = ticket?.ticket_id ?? "—";
    const completedSteps = ticket ? getCompletedSteps(ticket.status) : 0;
    const stopStep = ticket ? getStopStep(ticket) : -1;
    const isCancelled = stopStep >= 0;
    const approvalChain = ticket ? approvalChainFromTicket(ticket, completedSteps) : [];

    // NOTE: InstitutionTicket has no remarks/attachment fields yet.

    const isConfirmDisabled =
        (pendingAction?.kind === "reassign" && reassignTarget === "") ||
        (pendingAction?.kind === "accept" && pendingAction?.phase === "in_progress" && resolutionNote.trim() === "") ||
        (pendingAction?.kind === "cancel" && cancelReason.trim() === "");

    return (
        <>
            {/* Sliding panel */}
            <aside
                ref={panelRef}
                style={{ width: PANEL_WIDTH, maxWidth: "100%" }}
                className={`fixed right-0 top-0 h-screen bg-white border-l border-gray-100 z-50
                    shadow-2xl transition-transform duration-300 ease-in-out flex flex-col
                    overflow-hidden
                    ${isOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* Header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100 shrink-0 bg-white">
                    <span className="flex items-center gap-2 font-bold text-[#1E4637] tracking-wide">
                    <ClipboardList size={20} />
                    <span>Ticket Details</span>
                    </span>
                    <div className="flex items-center gap-2">
                        {canCancel && (
                            <button
                                type="button"
                                aria-label="Cancel ticket"
                                onClick={() => setPendingAction({
                                    stepId: "submitted",
                                    kind: "cancel",
                                    label: "Cancel Ticket",
                                    description: "Are you sure you want to cancel this ticket? This cannot be undone.",
                                })}
                                className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0"
                            >
                                <Ban size={12} />
                                CANCEL TICKET
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            aria-label="Close ticket panel"
                            className="text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {!ticket ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                        Select a ticket to view its details.
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-5">
                        <div className="grid grid-cols-2 gap-6 items-start">
                            {/* Left column: ticket fields */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h2 className="font-bold text-lg text-[#1E4637]">{ticketId}</h2>

                                    {/* Submitter: close a resolved ticket */}
                                    {canClose && (
                                        <button
                                            type="button"
                                            aria-label="Close ticket"
                                            onClick={() => setPendingAction({
                                                stepId: "closed",
                                                kind: "accept",
                                                label: "Close Ticket",
                                                description: "Are you sure you want to close this ticket? This confirms the resolution is satisfactory.",
                                            })}
                                            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0"
                                        >
                                            <Check size={12} />
                                            CLOSE TICKET
                                        </button>
                                    )}


                                </div>

                                <Field label="Resolver Pool" value={String(ticket.institution_pool ?? "")} />
                                <Field label="Ticket Type" value={ticket.ticket_type?.ticket_type_name} />
                                <Field label="Category" value={ticket.category?.category_name} />
                                <Field label="Sub-Category" value={ticket.subcategory?.sub_category_name} />
                                <Field label="Created At" value={formatDate(ticket.created_at)} />
                                <Field label="Project" value={projectName ?? String(ticket.project_id ?? "")} />
                                <Field label="Duration" value={ticket.resolution_time} />
                                <Field label="Submitter" value={fullName(ticket.submitter)} />

                                <div className="border border-gray-200 rounded-xl p-4 mt-2 h-56 space-y-3 overflow-y-auto">
                                    <div>
                                        <div className="text-sm text-gray-400 font-semibold mb-1">Subject:</div>
                                        <div className="text-sm text-gray-700">{ticket.subject || "—"}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 font-semibold mb-1">Description:</div>
                                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {ticket.description || "—"}
                                        </div>
                                    </div>

                                </div>

                                <Field label="Date Needed" value={formatDate(ticket.due_date)} />

                                {/* Attachments */}
                                <div className="border border-gray-200 rounded-xl p-4 mt-2">
                                    <div className="text-sm text-gray-400 font-semibold mb-2">Attachments</div>
                                    {attachmentsLoading ? (
                                        <div className="text-xs text-gray-400 text-center py-2">Loading…</div>
                                    ) : ticketAttachments.length === 0 && attachments.length === 0 ? (
                                        <div className="text-xs text-gray-400 text-center py-2">No files attached</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {/* Existing attachments from the server */}
                                            {ticketAttachments.map((a) => (
                                                <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                                    <Paperclip size={12} className="text-gray-400 shrink-0" />
                                                    <span className="text-xs text-gray-700 truncate flex-1">{a.file_name}</span>
                                                    {a.download_url && (
                                                        <a
                                                            href={a.download_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-[#1E4637] font-semibold hover:underline shrink-0"
                                                        >
                                                            Download
                                                        </a>
                                                    )}
                                                    <button
                                                        type="button"
                                                        aria-label="Delete attachment"
                                                        onClick={() => handleDeleteAttachment(a.id)}
                                                        className="text-gray-300 hover:text-rose-500 transition-colors shrink-0"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Pending attachments (not yet uploaded) */}
                                            {attachments.map((file, i) => (
                                                <div key={`pending-${i}`} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                                                    <Paperclip size={12} className="text-amber-400 shrink-0" />
                                                    <span className="text-xs text-gray-700 truncate flex-1">{file.name}</span>
                                                    <span className="text-[10px] text-amber-500 shrink-0">Pending</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAttachment(i)}
                                                        className="text-gray-300 hover:text-gray-500 shrink-0"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload button for pending attachments */}
                                    {attachments.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleUploadAttachments}
                                            disabled={uploadingAttachments}
                                            className="mt-2 w-full text-xs font-semibold text-white bg-[#1E4637] hover:bg-[#16352a] rounded-lg px-3 py-2 transition-colors disabled:opacity-40"
                                        >
                                            {uploadingAttachments ? "Uploading…" : `Upload ${attachments.length} file(s)`}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Right column: progress, approval chain, remarks */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                                    <h3 className="font-bold text-lg text-[#1E4637] mb-4">
                                        Ticket Progress
                                    </h3>

                                    <div className="relative">
                                        {/* Connecting line */}
                                        <div className="absolute top-4 left-[8.33%] right-[8.33%] h-[2px] bg-gray-200" />

                                        {/* Completed connecting line */}
                                        {(() => {
                                            const filledSteps = isCancelled ? stopStep + 1 : completedSteps;
                                            return filledSteps > 1 ? (
                                                <div
                                                    className="absolute top-4 left-[8.33%] h-[2px] bg-emerald-400"
                                                    style={{
                                                        width: `${((filledSteps - 1) / 5) * 83.34}%`,
                                                    }}
                                                />
                                            ) : null;
                                        })()}

                                        {/* Steps */}
                                        <div className="grid grid-cols-6 relative">
                                            {PROGRESS_STEPS.map((step, i) => {
                                                const isStopped = isCancelled && i === stopStep;
                                                const isBeforeStop = isCancelled && i < stopStep;
                                                return (
                                                <div
                                                    key={step}
                                                    className="flex flex-col items-center"
                                                >
                                                    {/* Circle */}
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                                            isStopped
                                                                ? "bg-rose-500"
                                                                : i < completedSteps || isBeforeStop
                                                                ? "bg-emerald-400"
                                                                : "bg-gray-200"
                                                        }`}
                                                    >
                                                        {isStopped ? (
                                                            <X
                                                                size={16}
                                                                className="text-white"
                                                                strokeWidth={3}
                                                            />
                                                        ) : (i < completedSteps || isBeforeStop) && (
                                                            <Check
                                                                size={16}
                                                                className="text-white"
                                                                strokeWidth={3}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Label */}
                                                    <span className="mt-3 text-xs font-semibold text-[#1E4637] whitespace-nowrap">
                                                        {step}
                                                    </span>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                                    <h3 className="font-bold text-[#1E4637] mb-4">Approval Chain</h3>
                                    {approvalChain.length === 0 ? (
                                        <div className="text-sm text-gray-400 text-center py-4">
                                            No approval activity yet.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            {approvalChain.map((step, i) => {
                                                const isResolverRow = step.id === "resolved";
                                                const isEndorserRow = step.id === "endorsed";
                                                const phase = step.resolverPhase;

                                                // Live elapsed label for the in-progress resolver row.
                                                // Uses started_at and hold_at to compute elapsed time,
                                                // pausing the timer while on hold.
                                                const computeElapsed = (): number => {
                                                    const startedAt = (ticket as { started_at?: string }).started_at;
                                                    if (!startedAt) return elapsedTick * 1000;

                                                    const holdAt = (ticket as { hold_at?: string | null }).hold_at;
                                                    const onHold = (ticket as { onhold?: boolean }).onhold;

                                                    if (onHold && holdAt) {
                                                        // Timer frozen at the moment hold was pressed.
                                                        return new Date(holdAt).getTime() - new Date(startedAt).getTime();
                                                    }

                                                    // Running — but if there was a previous hold, account
                                                    // for the paused duration so the timer picks up where
                                                    // it left off after resume.
                                                    const now = Date.now();
                                                    const base = now - new Date(startedAt).getTime();
                                                    return base > 0 ? base : elapsedTick * 1000;
                                                };

                                                const inProgressLabel =
                                                    phase === "in_progress"
                                                        ? `In Progress: ${formatElapsed(computeElapsed())}`
                                                        : undefined;

                                                const onHoldLabel =
                                                    phase === "on_hold"
                                                        ? `On Hold: ${formatElapsed(computeElapsed())}`
                                                        : undefined;

                                                // Resolver row REASSIGN — during for_review (resolver group members)
                                                // or on_hold (only the assigned resolver who grabbed it)
                                                const isAssignedResolver = localUser.id === (ticket as { resolver_id?: number | null }).resolver_id;
                                                const showResolverReassign =
                                                    isResolverRow &&
                                                    ((phase === "for_review" && canReassignResolver) ||
                                                     (phase === "on_hold" && isAssignedResolver));

                                                return (
                                                    <div
                                                        key={step.id}
                                                        className={`flex items-center justify-between py-3 gap-3 ${
                                                            i < approvalChain.length - 1 ? "border-b border-gray-100" : ""
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div
                                                                className={`w-11 h-11 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0 ${
                                                                    phase === "for_review"
                                                                        ? "bg-gray-300"
                                                                        : step.pending
                                                                        ? "bg-gray-400"
                                                                        : "bg-[#1E4637]"
                                                                }`}
                                                            >
                                                                {step.initials}
                                                            </div>
                                                            <div className="min-w-0">
                                                                {phase !== "for_review" && (
                                                                    <div className="font-semibold text-sm text-[#1E4637] truncate">
                                                                        {step.name}
                                                                    </div>
                                                                )}
                                                                <div
                                                                    className={`text-xs ${
                                                                        step.cancelled
                                                                            ? "text-gray-400"
                                                                            : phase === "on_hold" || phase === "for_review"
                                                                            ? "font-bold uppercase tracking-wide text-amber-500"
                                                                            : phase === "in_progress"
                                                                            ? "font-semibold text-violet-500"
                                                                            : "text-gray-400"
                                                                    }`}
                                                                >
                                                                    {step.cancelled
                                                                        ? (step.cancelTimestamp || "Cancelled")
                                                                        : phase === "for_review"
                                                                        ? "For Review"
                                                                        : phase === "on_hold"
                                                                        ? (onHoldLabel ?? "On Hold")
                                                                        : phase === "in_progress"
                                                                        ? inProgressLabel
                                                                        : (step.timestamp || "—")}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {/* ── Resolver row: for_review ── only group members can grab it */}
                                                            {isResolverRow && phase === "for_review" && canResolve && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        aria-label="Accept assignment"
                                                                        onClick={() => setPendingAction({
                                                                            stepId: step.id,
                                                                            kind: "accept",
                                                                            label: "Accept Assignment",
                                                                            description: "Are you sure you want to accept this ticket assignment?",
                                                                            phase,
                                                                        })}
                                                                        className="bg-emerald-400 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                    >
                                                                        ACCEPT
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        aria-label="Reject assignment"
                                                                        onClick={() => setPendingAction({
                                                                            stepId: step.id,
                                                                            kind: "reject",
                                                                            label: "Reject Assignment",
                                                                            description: "Are you sure you want to reject this ticket assignment? The ticket will return to the pool.",
                                                                            phase,
                                                                        })}
                                                                        className="bg-rose-400 hover:bg-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                    >
                                                                        REJECT
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* ── Resolver row: in_progress ── only the assigned resolver */}
                                                            {isResolverRow && phase === "in_progress" && canResolve && localUser.id === (ticket as { resolver_id?: number | null }).resolver_id && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Mark ${step.name} resolved`}
                                                                        onClick={() => setPendingAction({
                                                                            stepId: step.id,
                                                                            kind: "accept",
                                                                            label: "Mark as Resolved",
                                                                            description: "Are you sure you want to mark this ticket as resolved?",
                                                                            phase,
                                                                        })}
                                                                        className="bg-emerald-400 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                    >
                                                                        RESOLVED
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Put ${step.name} on hold`}
                                                                        onClick={() => setPendingAction({
                                                                            stepId: step.id,
                                                                            kind: "hold",
                                                                            label: "Put on Hold",
                                                                            description: "Are you sure you want to put this ticket on hold?",
                                                                            phase,
                                                                        })}
                                                                        className="bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                    >
                                                                        HOLD
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* ── Resolver row: on_hold ── only the assigned resolver */}
                                                            {isResolverRow && phase === "on_hold" && canResolve && localUser.id === (ticket as { resolver_id?: number | null }).resolver_id && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Reject ${step.name}`}
                                                                        onClick={() => setPendingAction({
                                                                            stepId: step.id,
                                                                            kind: "reject",
                                                                            label: "Reject Ticket",
                                                                            description: "Are you sure you want to reject this ticket? It will return to the pool.",
                                                                            phase,
                                                                        })}
                                                                        className="bg-rose-400 hover:bg-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                    >
                                                                        REJECT
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Resume ${step.name}`}
                                                                        onClick={() => setPendingAction({
                                                                            stepId: step.id,
                                                                            kind: "resume",
                                                                            label: "Resume Ticket",
                                                                            description: "Are you sure you want to resume work on this ticket?",
                                                                            phase,
                                                                        })}
                                                                        className="bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                    >
                                                                        RESUME
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* ── Resolver row: REASSIGN ── approver-level action, available
                                                                 whenever the resolver step is still open (any phase but resolved) */}
                                                            {showResolverReassign && (
                                                                <button
                                                                    type="button"
                                                                    aria-label="Reassign resolver"
                                                                    onClick={() => setPendingAction({
                                                                        stepId: step.id,
                                                                        kind: "reassign",
                                                                        label: "Reassign Resolver",
                                                                        description: "Enter the user ID to reassign this ticket's resolver to.",
                                                                    })}
                                                                    className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                >
                                                                    <Repeat size={12} />
                                                                    REASSIGN
                                                                </button>
                                                            )}

                                                            {/* ── Endorser row ── only the assigned endorser can accept/reject */}
                                                            {isEndorserRow && step.pending && canEndorse && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        aria-label="Accept endorsement"
                                                                        onClick={() => setPendingAction({
                                                                            stepId: step.id,
                                                                            kind: "accept",
                                                                            label: "Accept Endorsement",
                                                                            description: "Are you sure you want to endorse this ticket?",
                                                                        })}
                                                                        className="bg-emerald-400 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                    >
                                                                        ACCEPT
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        aria-label="Reject endorsement"
                                                                        onClick={() => setPendingAction({
                                                                            stepId: step.id,
                                                                            kind: "reject",
                                                                            label: "Reject Endorsement",
                                                                            description: "Are you sure you want to reject this endorsement? The ticket will be sent back.",
                                                                        })}
                                                                        className="bg-rose-400 hover:bg-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                    >
                                                                        REJECT
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* ── Endorser row: REASSIGN ── only the submitter, only while
                                                                 the endorser hasn't acted yet */}
                                                            {isEndorserRow && step.pending && canReassignEndorser && (
                                                                <button
                                                                    type="button"
                                                                    aria-label="Reassign endorser"
                                                                    onClick={() => setPendingAction({
                                                                        stepId: step.id,
                                                                        kind: "reassign",
                                                                        label: "Reassign Endorser",
                                                                        description: "Enter the user ID to reassign this ticket's endorser to.",
                                                                    })}
                                                                    className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                >
                                                                    <Repeat size={12} />
                                                                    REASSIGN
                                                                </button>
                                                            )}

                                                            {/* ── Approver row ── accept/reject only, no reassign */}
                                                            {!isResolverRow && step.id === "approved" && step.pending && canResolve && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        aria-label="Accept approval"
                                                                        onClick={() => setPendingAction({
                                                                            stepId: step.id,
                                                                            kind: "accept",
                                                                            label: "Approve Ticket",
                                                                            description: "Are you sure you want to approve this ticket?",
                                                                        })}
                                                                        className="bg-emerald-400 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                    >
                                                                        ACCEPT
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        aria-label="Reject approval"
                                                                        onClick={() => setPendingAction({
                                                                            stepId: step.id,
                                                                            kind: "reject",
                                                                            label: "Reject Approval",
                                                                            description: "Are you sure you want to reject this ticket? The ticket will be sent back.",
                                                                        })}
                                                                        className="bg-rose-400 hover:bg-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                    >
                                                                        REJECT
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* Status badge: shown for completed steps */}
                                                            {(!step.pending && phase !== "in_progress" && phase !== "on_hold" && phase !== "for_review") && (
                                                                <span
                                                                    className={`text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap text-white shrink-0 ${
                                                                        step.cancelled ? "bg-rose-500" : "bg-emerald-400"
                                                                    }`}
                                                                >
                                                                    {step.status}
                                                                    {step.duration && (
                                                                        <span className="text-emerald-100 ml-1">{step.duration}</span>
                                                                    )}
                                                                </span>
                                                            )}

                                                            {/* Fallback badge for pending steps where the current user has no action */}
                                                            {step.pending && isEndorserRow && !canEndorse && (
                                                                <span
                                                                    className="text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap bg-amber-50 text-amber-600 shrink-0"
                                                                >
                                                                    FOR REVIEW
                                                                </span>
                                                            )}
                                                            {step.pending && !isResolverRow && step.id === "approved" && !canResolve && (
                                                                <span
                                                                    className="text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap bg-amber-50 text-amber-600 shrink-0"
                                                                >
                                                                    FOR APPROVAL
                                                                </span>
                                                            )}
                                                            {isResolverRow && step.pending && !canResolve && (
                                                                <span
                                                                    className="text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap bg-amber-50 text-amber-600 shrink-0"
                                                                >
                                                                    FOR RESOLUTION
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}


                                        </div>
                                    )}
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col min-h-64">
                                    <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 shrink-0">
                                        <MessageSquare size={16} className="text-gray-500" />
                                        <h3 className="font-bold text-[#1E4637]">Remarks</h3>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-4 flex flex-col">
                                        {/* Cancellation reason — shown at the top of remarks when present */}
                                        {isCancelled && ticket?.cancellation_reason && (
                                            <div className="flex items-end justify-end gap-3">
                                                <div className="flex flex-col items-end max-w-[75%]">
                                                    <div className="text-sm font-bold text-rose-600 mb-1">
                                                        Cancelled — Reason
                                                    </div>
                                                    <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 text-sm text-rose-700 w-full min-h-[3.25rem]">
                                                        {ticket.cancellation_reason}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-1">                                                         {ticket?.cancelled_at ? formatDate(ticket.cancelled_at) : ""}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {remarksLoading ? (
                                            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center">
                                                Loading remarks…
                                            </div>
                                        ) : remarks.length === 0 ? (
                                            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center">
                                                No remarks yet.
                                            </div>
                                        ) : (
                                            remarks.map((r) => (
                                                <div key={r.remark_id} className="flex items-end justify-end gap-3">
                                                    <div className="flex flex-col items-end max-w-[75%]">
                                                        <div className="text-sm font-bold text-[#1E4637] mb-1">
                                                            {r.remark_type === "resolution" ? "Resolution" : "Remark"}
                                                        </div>
                                                        <div className="bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-700 w-full min-h-[3.25rem]">
                                                            {r.message}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-1">
                                                            {formatDate(r.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={remarksEndRef} />
                                    </div>

                                    <div className="mt-3 shrink-0 bg-gray-100 rounded-2xl overflow-hidden">
                                        {/* Formatting toolbar — shown only when toggled */}
                                        {showFormatBar && (
                                            <div className="flex items-center gap-0.5 px-2 pt-2 pb-1.5 border-b border-gray-200">
                                                <ToolbarBtn aria-label="Bold" active={activeFormats.bold} onClick={() => execFormat("bold")}><Bold size={13} strokeWidth={2.5} /></ToolbarBtn>
                                                <ToolbarBtn aria-label="Italic" active={activeFormats.italic} onClick={() => execFormat("italic")}><Italic size={13} /></ToolbarBtn>
                                                <ToolbarBtn aria-label="Underline" active={activeFormats.underline} onClick={() => execFormat("underline")}><Underline size={13} /></ToolbarBtn>
                                                <ToolbarBtn aria-label="Strikethrough" active={activeFormats.strikeThrough} onClick={() => execFormat("strikeThrough")}><Strikethrough size={13} /></ToolbarBtn>
                                                <div className="w-px h-4 bg-gray-300 mx-1" />
                                                <ToolbarBtn aria-label="Bullet list" active={activeFormats.insertUnorderedList} onClick={() => execFormat("insertUnorderedList")}><List size={13} /></ToolbarBtn>
                                            </div>
                                        )}

                                        {/* Contenteditable editor */}
                                        <div
                                            ref={editorRef}
                                            contentEditable
                                            suppressContentEditableWarning
                                            onInput={handleEditorInput}
                                            onKeyUp={refreshActiveFormats}
                                            onMouseUp={refreshActiveFormats}
                                            onFocus={refreshActiveFormats}
                                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                                            data-placeholder="Write a remark..."
                                            className="min-h-[1.5rem] max-h-32 overflow-y-auto px-3 pt-2 pb-0.5 text-sm text-gray-700 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                                        ></div>

                                        {/* Attachment previews */}
                                        {attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                                                {attachments.map((file, i) => (
                                                    <div key={i} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 max-w-[140px]">
                                                        <Paperclip size={10} className="shrink-0 text-gray-400" />
                                                        <span className="truncate">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => removeAttachment(i)}
                                                            className="shrink-0 text-gray-300 hover:text-gray-500"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Bottom action bar */}
                                        <div className="flex items-center justify-end gap-1 px-2 pb-1.5">
                                            {/* Hidden file input */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />

                                            {/* Format toggle */}
                                            <button
                                                type="button"
                                                aria-label="Toggle formatting"
                                                title="Formatting options"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => setShowFormatBar((v) => !v)}
                                                className={`p-1.5 rounded-lg transition-colors ${
                                                    showFormatBar
                                                        ? "bg-[#1E4637] text-white"
                                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                                                }`}
                                            >
                                                <Type size={14} />
                                            </button>

                                            {/* Attach */}
                                            <button
                                                type="button"
                                                aria-label="Attach file"
                                                title="Attach file"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                                            >
                                                <Paperclip size={14} />
                                            </button>

                                            {/* Send */}
                                            <button
                                                type="button"
                                                aria-label="Send remark"
                                                title="Send"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={handleSend}
                                                disabled={isEmpty && attachments.length === 0}
                                                className="bg-[#1E4637] disabled:opacity-30 text-white w-7 h-7 rounded-xl flex items-center justify-center transition-opacity shrink-0"
                                            >
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* ── Confirmation dialog ── rendered outside the aside so it sits
                 in a true stacking context above the panel overlay. */}
            {pendingAction && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        {/* Icon row */}
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${
                            pendingAction.kind === "accept" || pendingAction.kind === "resume"
                                ? "bg-emerald-100"
                                : pendingAction.kind === "hold"
                                ? "bg-amber-100"
                                : pendingAction.kind === "reassign"
                                ? "bg-gray-100"
                                : "bg-rose-100"
                        }`}>
                            {(pendingAction.kind === "accept" || pendingAction.kind === "resume") && (
                                <Check size={20} className="text-emerald-600" strokeWidth={2.5} />
                            )}
                            {pendingAction.kind === "hold" && (
                                <span className="text-amber-600 font-bold text-sm">||</span>
                            )}
                            {pendingAction.kind === "reassign" && (
                                <Repeat size={18} className="text-gray-600" strokeWidth={2.5} />
                            )}
                            {(pendingAction.kind === "reject" || pendingAction.kind === "cancel") && (
                                <X size={20} className="text-rose-600" strokeWidth={2.5} />
                            )}
                        </div>

                        <h3 className="text-sm font-bold text-[#1E4637] mb-1">
                            {pendingAction.label}
                        </h3>
                        <p className="text-sm text-gray-500 mb-5">
                            {pendingAction.description}
                        </p>

                        {/* Resolution note — required by the backend for the "resolve" action */}
                        {pendingAction.kind === "accept" && pendingAction.phase === "in_progress" && (
                            <textarea
                                autoFocus
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="Resolution note (required)"
                                rows={3}
                                className="w-full mb-5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1E4637] resize-none"
                            />
                        )}

                        {/* Cancellation reason — required by the backend for the "cancel" action */}
                        {pendingAction.kind === "cancel" && (
                            <textarea
                                autoFocus
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Cancellation reason (required)"
                                rows={3}
                                className="w-full mb-5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1E4637] resize-none"
                            />
                        )}

                        {/* Reassign target picker — dropdown of resolver group members with can_resolve */}
                        {pendingAction.kind === "reassign" && (
                            <select
                                autoFocus
                                value={reassignTarget}
                                onChange={(e) => setReassignTarget(e.target.value ? Number(e.target.value) : "")}
                                className="w-full mb-5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1E4637] bg-white"
                            >
                                <option value="" disabled>
                                    Select a resolver…
                                </option>
                                {resolverGroupMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.first_name} {member.last_name} ({member.staff_id})
                                    </option>
                                ))}
                                {resolverGroupMembers.length === 0 && (
                                    <option value="" disabled>
                                        No resolvers available
                                    </option>
                                )}
                            </select>
                        )}

                        {/* Surface API failures (and unmapped actions) instead of
                            closing the dialog as if nothing happened. */}
                        {processError && (
                            <p className="text-xs text-rose-500 mb-3">{processError}</p>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => setPendingAction(null)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isConfirmDisabled || isProcessing}
                                onClick={async () => {
                                    if (!ticket) return;
                                    const { stepId, kind, phase } = pendingAction;
                                    const targetId = Number(reassignTarget);

                                    // Reassign has no backend action yet (needs its own
                                    // endpoint, not processTicket) — say so instead of
                                    // pretending it worked.
                                    if (kind === "reassign") {
                                        if (!Number.isFinite(targetId)) return;
                                        setProcessError("Reassign isn't wired to a backend endpoint yet.");
                                        return;
                                        // Once an endpoint exists:
                                        // onReassignStep?.(stepId, targetId);
                                        // setPendingAction(null);
                                    }

                                    const action = resolveProcessAction(stepId, kind, phase);
                                    if (!action) {
                                        setProcessError(`"${pendingAction.label}" has no matching backend action yet.`);
                                        return;
                                    }

                                    // Build the request payload with action-specific fields.
                                    const payload: { action: typeof action; reason?: string; resolution?: string } = { action };

                                    // The backend requires a resolution note for the "resolve" action.
                                    if (action === "resolve") {
                                        const note = resolutionNote.trim();
                                        if (!note) {
                                            setProcessError("Resolution note is required.");
                                            return;
                                        }
                                        payload.resolution = note;
                                    }

                                    // The backend requires a reason for "cancel" and "reject" (ungrab).
                                    if (kind === "cancel") {
                                        const reason = cancelReason.trim();
                                        if (!reason) {
                                            setProcessError("Cancellation reason is required.");
                                            return;
                                        }
                                        payload.reason = reason;
                                    } else if (kind === "reject") {
                                        payload.reason = "Rejected via ticket detail panel";
                                    }

                                    setIsProcessing(true);
                                    setProcessError(null);
                                    let response;
                                    try {
                                        response = await processTicket(ticket.ticket_id, payload);
                                    } catch (err) {
                                        console.error("processTicket failed", err);
                                        setIsProcessing(false);
                                        setProcessError("Something went wrong sending that action. Please try again.");
                                        return;
                                    }
                                    setIsProcessing(false);
                                    setPendingAction(null);

                                    // Prefer whatever the backend actually returned; fall
                                    // back to a best-effort local guess so the UI still
                                    // moves without a page refresh either way.
                                    // The backend wraps data in the "response" field of JSONResponseWithDataV1.
                                    const serverTicket =
                                        response?.response && typeof response.response === "object"
                                            ? (response.response as Partial<InstitutionTicket>)
                                            : null;
                                    const patch = serverTicket ?? deriveOptimisticPatch(action);

                                    setLiveTicket((prev) =>
                                        prev ? ({ ...prev, ...patch } as InstitutionTicket) : prev
                                    );
                                    onTicketUpdated?.({ ...ticket, ...patch } as InstitutionTicket);

                                    // Keep firing the existing callbacks so the parent can
                                    // refresh its ticket list/local state as before.
                                    if (kind === "accept") onAcceptStep?.(stepId);
                                    else if (kind === "reject") onRejectStep?.(stepId);
                                    else if (kind === "hold") onHoldStep?.(stepId);
                                    else if (kind === "resume") onResumeStep?.(stepId);
                                    else if (kind === "cancel") onCancelTicket?.(ticket.ticket_id);
                                }}
                                className={`rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-40 ${
                                    pendingAction.kind === "accept" || pendingAction.kind === "resume"
                                        ? "bg-emerald-500 hover:bg-emerald-600"
                                        : pendingAction.kind === "hold"
                                        ? "bg-amber-500 hover:bg-amber-600"
                                        : pendingAction.kind === "reassign"
                                        ? "bg-[#1E4637] hover:bg-[#16352a]"
                                        : "bg-rose-500 hover:bg-rose-600"
                                }`}
                            >
                                {isProcessing ? (
                                    <span className="flex items-center gap-1.5">
                                        <Loader2 size={12} className="animate-spin" />
                                        Sending…
                                    </span>
                                ) : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast notification */}
            {toast && (
                <div
                    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold transition-all duration-300 ${
                        toast.type === "error"
                            ? "bg-rose-500 text-white"
                            : "bg-[#1E4637] text-white"
                    }`}
                >
                    {toast.message}
                </div>
            )}
        </>
    );
}

function Field({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="text-sm">
            <span className="text-gray-400 font-semibold">{label}:</span>
            {value && <span className="text-gray-700 ml-1">{value}</span>}
        </div>
    );
}

function ToolbarBtn({
    children,
    "aria-label": ariaLabel,
    onClick,
    active = false,
}: {
    children: React.ReactNode;
    "aria-label": string;
    onClick?: () => void;
    active?: boolean;
}) {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            title={ariaLabel}
            aria-pressed={active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`p-1.5 rounded-md transition-colors ${
                active
                    ? "bg-[#1E4637] text-white"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            }`}
        >
            {children}
        </button>
    );
}