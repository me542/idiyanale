"use client";
import { useEffect, useRef, useState } from "react";
import {
    X, Check, MessageSquare, Paperclip, Send,
    Bold, Italic, Underline, Strikethrough, List, Type,
    ClipboardList,
} from "lucide-react";
import { InstitutionTicket, TicketUser } from "@/services/integration/ticket/get_all_ticket_by_insti";
import { getTicketRemarks, TicketRemark } from "@/services/integration/remark/get_ticket_remarks";
import { postTicketRemark } from "@/services/integration/remark/post_ticket_remark";
import { getInstitutionResolverGroups } from "@/services/integration/institution/get-insti-by-id-resolver-group";

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
function getLocalUser(): { label: string; initials: string } {
    if (typeof window === "undefined") return { label: "Me", initials: "?" };
    try {
        const raw = localStorage.getItem("user");
        const u = raw ? JSON.parse(raw) : null;
        if (u?.staffId) return { label: String(u.staffId), initials: String(u.staffId).slice(0, 2).toUpperCase() };
    } catch { /* ignore */ }
    const role = localStorage.getItem("role") ?? "Me";
    return { label: role, initials: role.slice(0, 2).toUpperCase() };
}

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
}

interface TicketDetailPanelProps {
    ticket: InstitutionTicket | null;
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onSendRemark?: (ticketId: string, message: string) => void;
    onAcceptStep?: (stepId: string) => void;
    onRejectStep?: (stepId: string) => void;
    /** New: pause an in-progress resolver step. */
    onHoldStep?: (stepId: string) => void;
    /** New: resume a resolver step that's on hold. */
    onResumeStep?: (stepId: string) => void;
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
        case "approved":
        case "for assignment":
            return 3;
        case "endorsed":
        case "for approval":
            return 2;
        case "for review":
        case "for endorsement":
            return 1;
        default:
            return 0;
    }
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

    return steps;
}

/**
 * Ticket detail panel. Reuses the same hover-to-expand / click-to-toggle
 * ribbon interaction as ActivityPanel, but the ribbon here carries no icon
 * (just a soft pill handle) so it isn't mistaken for the activity-menu tag.
 */
export default function TicketDetailPanel({
    ticket,
    isOpen,
    onClose,
    onSendRemark,
    onAcceptStep,
    onRejectStep,
    onHoldStep,
    onResumeStep,
}: TicketDetailPanelProps) {
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

    // ---------------------------------------------------------------------------
    // Role-based permission state for approval-chain action buttons.
    // ---------------------------------------------------------------------------

    // Whether the logged-in user is a member of the ticket's resolver group.
    const [isResolverGroupMember, setIsResolverGroupMember] = useState(false);

    // Confirmation dialog — set to describe the pending action, null when closed.
    const [pendingAction, setPendingAction] = useState<{
        stepId: string;
        kind: "accept" | "reject" | "hold" | "resume";
        label: string;
        description: string;
    } | null>(null);

    // Read the full local user once (it won't change while this panel is open).
    const localUser = getLocalUserFull();

    // canEndorse — the endorser is pre-assigned on the ticket; that user must
    // also have the role's can_endorse permission before they can act.
    const canEndorse =
        localUser.id !== null &&
        ticket?.endorser_id !== null &&
        localUser.id === ticket?.endorser_id &&
        localUser.permissions.can_endorse;

    // canApprove — any user whose role carries the can_approve permission.
    const canApprove = localUser.permissions.can_approve;

    // canResolve — users must belong to this ticket's resolver group and have
    // the role's can_resolve permission.
    const canResolve =
        isResolverGroupMember && localUser.permissions.can_resolve;

    // Fetch the resolver groups for this ticket's institution and check
    // if the logged-in user is in any active group.
    useEffect(() => {
        const institutionId = ticket?.institution_id ?? localUser.institutionId;
        if (!institutionId || localUser.id === null) {
            setIsResolverGroupMember(false);
            return;
        }

        let cancelled = false;

        getInstitutionResolverGroups(institutionId)
            .then((res) => {
                if (cancelled) return;
                const groups = res.response ?? [];
                const isMember = groups.some(
                    (g) =>
                        g.status === "active" &&
                        g.member_ids.includes(localUser.id as number)
                );
                setIsResolverGroupMember(isMember);
            })
            .catch(() => {
                if (!cancelled) setIsResolverGroupMember(false);
            });

        return () => { cancelled = true; };
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
            setRemarks([]);
            return;
        }
        let cancelled = false;
        setRemarksLoading(true);
        getTicketRemarks(ticket.ticket_id)
            .then((data) => { if (!cancelled) setRemarks(data ?? []); })
            .catch(() => { if (!cancelled) setRemarks([]); })
            .finally(() => { if (!cancelled) setRemarksLoading(false); });
        return () => { cancelled = true; };
    }, [ticket?.ticket_id]);

    // Scroll the remarks list to the bottom whenever new remarks arrive.
    useEffect(() => {
        remarksEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [remarks]);

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
            await postTicketRemark(text);
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

    // Nothing to show yet and the panel isn't open — don't render anything.
    if (!ticket && !isOpen) return null;

    const ticketId = ticket?.ticket_id ?? "—";
    const completedSteps = ticket ? getCompletedSteps(ticket.status) : 0;
    const approvalChain = ticket ? approvalChainFromTicket(ticket, completedSteps) : [];

    // NOTE: InstitutionTicket has no remarks/attachment fields yet.

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
                    <button
                        onClick={onClose}
                        aria-label="Close ticket panel"
                        className="text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Content */}
                {!ticket ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                        Select a ticket to view its details.
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-2 gap-6 items-start">
                            {/* Left column: ticket fields */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-2">
                                <h2 className="font-bold text-lg text-[#1E4637] mb-2">{ticketId}</h2>

                                <Field label="Resolver Pool" value={String(ticket.institution_pool ?? "")} />
                                <Field label="Ticket Type" value={ticket.ticket_type?.ticket_type_name} />
                                <Field label="Category" value={ticket.category?.category_name} />
                                <Field label="Sub-Category" value={ticket.subcategory?.sub_category_name} />
                                <Field label="Created At" value={formatDate(ticket.created_at)} />
                                <Field label="Project ID" value={String(ticket.project_id ?? "")} />
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

                                {/* InstitutionTicket has no attachment field yet */}
                                <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm mt-2">
                                    No file attached
                                </div>
                            </div>

                            {/* Right column: progress, approval chain, remarks */}
                            <div className="flex flex-col gap-6">
                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                                    <h3 className="font-bold text-lg text-[#1E4637] mb-8">
                                        Ticket Progress
                                    </h3>

                                    <div className="relative">
                                        {/* Connecting line */}
                                        <div className="absolute top-4 left-[8.33%] right-[8.33%] h-[2px] bg-gray-200" />

                                        {/* Completed connecting line */}
                                        <div
                                            className="absolute top-4 left-[8.33%] h-[2px] bg-emerald-400"
                                            style={{
                                                width:
                                                    completedSteps > 1
                                                        ? `${((completedSteps - 1) / 5) * 83.34}%`
                                                        : "0%",
                                            }}
                                        />

                                        {/* Steps */}
                                        <div className="grid grid-cols-6 relative">
                                            {PROGRESS_STEPS.map((step, i) => (
                                                <div
                                                    key={step}
                                                    className="flex flex-col items-center"
                                                >
                                                    {/* Circle */}
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                                            i < completedSteps
                                                                ? "bg-emerald-400"
                                                                : "bg-gray-200"
                                                        }`}
                                                    >
                                                        {i < completedSteps && (
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
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                                    <h3 className="font-bold text-[#1E4637] mb-4">Approval Chain</h3>
                                    {approvalChain.length === 0 ? (
                                        <div className="text-sm text-gray-400 text-center py-4">
                                            No approval activity yet.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            {approvalChain.map((step, i) => {
                                                const isResolverRow = step.id === "resolved";
                                                const phase = step.resolverPhase;

                                                // Live elapsed label for the in-progress resolver row.
                                                // Falls back to duration if available; otherwise just
                                                // ticks up from 0 while `elapsedTick` re-renders it.
                                                const inProgressLabel =
                                                    phase === "in_progress"
                                                        ? `In Progress: ${
                                                              (ticket as { resolver_started_at?: string }).resolver_started_at
                                                                  ? formatElapsed(
                                                                        Date.now() -
                                                                            new Date(
                                                                                (ticket as { resolver_started_at?: string }).resolver_started_at!
                                                                            ).getTime()
                                                                    )
                                                                  : formatElapsed(elapsedTick * 1000)
                                                          }`
                                                        : undefined;

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
                                                                        phase === "on_hold" || phase === "for_review"
                                                                            ? "font-bold uppercase tracking-wide text-amber-500"
                                                                            : phase === "in_progress"
                                                                            ? "font-semibold text-violet-500"
                                                                            : "text-gray-400"
                                                                    }`}
                                                                >
                                                                    {phase === "for_review"
                                                                        ? "For Review"
                                                                        : phase === "on_hold"
                                                                        ? "On Hold"
                                                                        : phase === "in_progress"
                                                                        ? inProgressLabel
                                                                        : (step.timestamp || "—")}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* ── Resolver row: for_review ── only group members can grab it */}
                                                        {isResolverRow && phase === "for_review" && canResolve && (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    aria-label="Accept assignment"
                                                                    onClick={() => setPendingAction({
                                                                        stepId: step.id,
                                                                        kind: "accept",
                                                                        label: "Accept Assignment",
                                                                        description: "Are you sure you want to accept this ticket assignment?",
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
                                                                    })}
                                                                    className="bg-rose-400 hover:bg-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                >
                                                                    REJECT
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* ── Resolver row: in_progress ── only the assigned resolver (group member) */}
                                                        {isResolverRow && phase === "in_progress" && canResolve && (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Mark ${step.name} resolved`}
                                                                    onClick={() => setPendingAction({
                                                                        stepId: step.id,
                                                                        kind: "accept",
                                                                        label: "Mark as Resolved",
                                                                        description: "Are you sure you want to mark this ticket as resolved?",
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
                                                                    })}
                                                                    className="bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                >
                                                                    HOLD
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* ── Resolver row: on_hold ── only the assigned resolver (group member) */}
                                                        {isResolverRow && phase === "on_hold" && canResolve && (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Reject ${step.name}`}
                                                                    onClick={() => setPendingAction({
                                                                        stepId: step.id,
                                                                        kind: "reject",
                                                                        label: "Reject Ticket",
                                                                        description: "Are you sure you want to reject this ticket? It will return to the pool.",
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
                                                                    })}
                                                                    className="bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
                                                                >
                                                                    RESUME
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* ── Endorser row ── only the assigned endorser can act */}
                                                        {!isResolverRow && step.id === "endorsed" && step.pending && canEndorse && (
                                                            <div className="flex items-center gap-2 shrink-0">
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
                                                            </div>
                                                        )}

                                                        {/* ── Approver row ── only users with can_approve permission */}
                                                        {!isResolverRow && step.id === "approved" && step.pending && canApprove && (
                                                            <div className="flex items-center gap-2 shrink-0">
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
                                                            </div>
                                                        )}

                                                        {(!step.pending && phase !== "in_progress" && phase !== "on_hold" && phase !== "for_review") && (
                                                            <span
                                                                className="text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap text-white bg-emerald-400 shrink-0"
                                                            >
                                                                {step.status}
                                                                {step.duration && (
                                                                    <span className="text-emerald-100 ml-1">{step.duration}</span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col h-80">
                                    <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 shrink-0">
                                        <MessageSquare size={16} className="text-gray-500" />
                                        <h3 className="font-bold text-[#1E4637]">Remarks</h3>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-4 flex flex-col">
                                        {remarksLoading ? (
                                            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center">
                                                Loading remarks…
                                            </div>
                                        ) : remarks.length === 0 ? (
                                            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center">
                                                No remarks yet.
                                            </div>
                                        ) : (
                                            remarks.map((r) => {
                                                const { label: authorName, initials: authorInitials } = getLocalUser();
                                                return (
                                                    <div key={r.id} className="flex items-end justify-end gap-3">
                                                        <div className="flex flex-col items-end max-w-[75%]">
                                                            <div className="text-sm font-bold text-[#1E4637] mb-1">
                                                                {authorName}
                                                            </div>
                                                            <div className="bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-700 w-full min-h-[3.25rem]">
                                                                {r.reason}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400 mt-1">
                                                                {formatDate(r.created_at)}
                                                            </div>
                                                        </div>
                                                        <div className="w-5 h-5 rounded-full bg-[#1E4637] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                            {authorInitials}
                                                        </div>
                                                    </div>
                                                );
                                            })
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
                                : "bg-rose-100"
                        }`}>
                            {(pendingAction.kind === "accept" || pendingAction.kind === "resume") && (
                                <Check size={20} className="text-emerald-600" strokeWidth={2.5} />
                            )}
                            {pendingAction.kind === "hold" && (
                                <span className="text-amber-600 font-bold text-sm">||</span>
                            )}
                            {pendingAction.kind === "reject" && (
                                <X size={20} className="text-rose-600" strokeWidth={2.5} />
                            )}
                        </div>

                        <h3 className="text-sm font-bold text-[#1E4637] mb-1">
                            {pendingAction.label}
                        </h3>
                        <p className="text-sm text-gray-500 mb-5">
                            {pendingAction.description}
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPendingAction(null)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const { stepId, kind } = pendingAction;
                                    setPendingAction(null);
                                    if (kind === "accept") onAcceptStep?.(stepId);
                                    else if (kind === "reject") onRejectStep?.(stepId);
                                    else if (kind === "hold") onHoldStep?.(stepId);
                                    else if (kind === "resume") onResumeStep?.(stepId);
                                }}
                                className={`rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors ${
                                    pendingAction.kind === "accept" || pendingAction.kind === "resume"
                                        ? "bg-emerald-500 hover:bg-emerald-600"
                                        : pendingAction.kind === "hold"
                                        ? "bg-amber-500 hover:bg-amber-600"
                                        : "bg-rose-500 hover:bg-rose-600"
                                }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
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
