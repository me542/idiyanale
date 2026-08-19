"use client";
import { useEffect, useRef, useState } from "react";
import {
    X, Check, MessageSquare, Paperclip, Send,
    Bold, Italic, Underline, Strikethrough, List, Type,
} from "lucide-react";
import { InstitutionTicket, TicketUser } from "@/services/integration/ticket/get_all_ticket_by_insti";

interface ApprovalStep {
    id: string;
    name: string;
    initials: string;
    status: string;
    timestamp?: string;
    duration?: string;
    pending?: boolean; // true = this is the current, not-yet-completed step
}

interface TicketDetailPanelProps {
    ticket: InstitutionTicket | null;
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onSendRemark?: (ticketId: string, message: string) => void;
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

    // Resolver — stays hidden until the ticket has been approved.
    if (ticket.resolver && completedSteps >= 3) {
        const isDone = completedSteps >= 5;
        steps.push({
            id: "resolved",
            name: fullName(ticket.resolver)!,
            initials: initials(ticket.resolver),
            status: isDone ? "RESOLVED" : "IN PROGRESS",
            timestamp: isDone ? formatDate(ticket.resolved_at) : undefined,
            duration: isDone ? (ticket.resolution_time || undefined) : undefined,
            pending: !isDone,
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

    const handleSend = () => {
        const text = editorRef.current?.innerText?.trim() ?? "";
        if ((!text && attachments.length === 0) || !ticket) return;
        onSendRemark?.(ticketId, text);
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
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    // Nothing to show yet and the panel isn't open — don't render anything.
    if (!ticket && !isOpen) return null;

    const ticketId = ticket?.ticket_id ?? "—";
const completedSteps = ticket ? getCompletedSteps(ticket.status) : 0;
const approvalChain = ticket ? approvalChainFromTicket(ticket, completedSteps) : [];

    // NOTE: InstitutionTicket has no remarks/attachment fields yet.
    const remarks: {
        id: string | number;
        author: string;
        initials: string;
        message: string;
        timestamp?: string;
    }[] = [];

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
                    <span className="font-bold text-[#1E4637] tracking-wide">{ticketId}</span>
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
                                            {approvalChain.map((step, i) => (
    <div
        key={step.id}
        className={`flex items-center justify-between py-3 ${
            i < approvalChain.length - 1 ? "border-b border-gray-100" : ""
        }`}
    >
        <div className="flex items-center gap-3">
            <div
                className={`w-11 h-11 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0 ${
                    step.pending ? "bg-gray-400" : "bg-[#1E4637]"
                }`}
            >
                {step.initials}
            </div>
            <div>
                <div className="font-semibold text-sm text-[#1E4637]">
                    {step.name}
                </div>
                <div className="text-xs text-gray-400">
                    {step.timestamp || (step.pending ? "Pending" : "—")}
                </div>
            </div>
        </div>
        <span
            className={`text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap text-white ${
                step.pending ? "bg-amber-400" : "bg-emerald-400"
            }`}
        >
            {step.status}
            {step.duration && (
                <span className="text-red-200 ml-1">{step.duration}</span>
            )}
        </span>
    </div>
))}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col h-80">
                                    <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 shrink-0">
                                        <MessageSquare size={16} className="text-gray-500" />
                                        <h3 className="font-bold text-[#1E4637]">Remarks</h3>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-4 flex flex-col">
                                        {remarks.length === 0 ? (
                                            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center">
                                                No remarks yet.
                                            </div>
                                        ) : (
                                            remarks.map((r) => (
                                                <div key={r.id} className="flex items-end justify-end gap-3">
                                                    <div className="flex flex-col items-end max-w-[75%]">
                                                        <div className="text-sm font-bold text-[#1E4637] mb-1">
                                                            {r.author}
                                                        </div>
                                                        <div className="bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-700 w-full min-h-[3.25rem]">
                                                            {r.message}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-1">
                                                            {r.timestamp}
                                                        </div>
                                                    </div>
                                                    <div className="w-5 h-5 rounded-full bg-[#1E4637] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                        {r.initials}
                                                    </div>
                                                </div>
                                            ))
                                        )}
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



