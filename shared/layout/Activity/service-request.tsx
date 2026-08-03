"use client";
import { useState } from "react";
import { RefreshCw, Upload, X } from "lucide-react";
import { ApiWrapper } from "@/services/api/ApiWrapper";
import { CreateTicketError } from "@/shared/layout/Activity/api/create-sr";

export interface NewTicketFormData {
    resolver: string;
    dateNeeded: string; // yyyy-mm-dd from <input type="date">
    projectName: string;
    categoryId: string;
    subcategoryId: string;
    endorserId: string;
    approverPoolId: string;
    duration: string;
    subject: string;
    description: string;
}

export const EMPTY_TICKET_FORM: NewTicketFormData = {
    resolver: "",
    dateNeeded: "",
    projectName: "",
    categoryId: "",
    subcategoryId: "",
    endorserId: "",
    approverPoolId: "",
    duration: "",
    subject: "",
    description: "",
};

interface SelectOption {
    id: string;
    label: string;
}

interface SelectFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options?: SelectOption[];
}

function SelectField({ label, value, onChange, options = [] }: SelectFieldProps) {
    return (
        <div className="border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <label className="block text-xs font-bold text-[#1E4637] mb-1">
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none bg-transparent border border-gray-200 rounded-lg
                        px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2
                        focus:ring-[#1E4637]/30 cursor-pointer"
                >
                    <option value="" />
                    {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <svg
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}

// TODO: replace with real lookups (fetch on mount, filter subcategory by
// the chosen category, etc). Left static so the component compiles/renders.
const TICKET_TYPE_OPTIONS: SelectOption[] = [
    { id: "1", label: "Service Request" },
    { id: "2", label: "Change Request" },
    { id: "3", label: "Incident Report" },
    { id: "4", label: "Problem Report" },
];
const CATEGORY_OPTIONS: SelectOption[] = [
    { id: "1", label: "Hardware" },
    { id: "2", label: "Software" },
    { id: "3", label: "Access" },
];
const SUBCATEGORY_OPTIONS: SelectOption[] = [
    { id: "1", label: "Laptop" },
    { id: "2", label: "License" },
    { id: "3", label: "Account" },
];
const ENDORSER_OPTIONS: SelectOption[] = [
    { id: "1", label: "Manager" },
    { id: "2", label: "Team Lead" },
];
const APPROVER_POOL_OPTIONS: SelectOption[] = [
    { id: "1", label: "Pool A" },
    { id: "2", label: "Pool B" },
];
// No backend field for these two — kept as plain string options.
const RESOLVER_OPTIONS: SelectOption[] = [
    { id: "IT Support", label: "IT Support" },
    { id: "HR", label: "HR" },
    { id: "Facilities", label: "Facilities" },
];
const DURATION_OPTIONS: SelectOption[] = [
    { id: "1 day", label: "1 day" },
    { id: "3 days", label: "3 days" },
    { id: "1 week", label: "1 week" },
];

interface NewTicketPanelViewProps {
    onCancel: () => void;
    onSubmit?: (data: NewTicketFormData) => void;
}

/**
 * Pulls a human-readable message out of whatever createTicket rejects with.
 * Handles: our own CreateTicketError, a generic Error, and an axios-style
 * error with a `response.data.message` (common shape for postForm/ApiHelper
 * failures that aren't caught and re-thrown as CreateTicketError).
 * Adjust the axios-style branch if your ApiHelper throws something else.
 */
function getTicketErrorMessage(err: unknown): string {
    if (err instanceof CreateTicketError) {
        return err.message;
    }

    const anyErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
    };

    return (
        anyErr?.response?.data?.message ||
        anyErr?.message ||
        "Failed to create ticket. Please try again."
    );
}

/**
 * Ticket form content only — no header, no aside wrapper, no overlay.
 * Two-column layout matching the original mockup; needs a wide panel
 * (ActivityPanel widens itself while this view is active).
 */
export default function NewTicketPanelView({ onCancel, onSubmit }: NewTicketPanelViewProps) {
    const [form, setForm] = useState<NewTicketFormData>(EMPTY_TICKET_FORM);
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateField = (key: keyof NewTicketFormData) => (value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleReloadTemplate = () => {
        updateField("description")("");
    };

    const handleFileUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.onchange = () => {
            const selected = input.files ? Array.from(input.files) : [];
            if (selected.length === 0) return;
            setFiles((prev) => {
                const combined = [...prev, ...selected];
                if (combined.length > 5) {
                    setError("Maximum of 5 attachments allowed");
                    return combined.slice(0, 5);
                }
                return combined;
            });
        };
        input.click();
    };

    const removeFile = (name: string) => {
        setFiles((prev) => prev.filter((f) => f.name !== name));
    };

    const resetForm = () => {
        setForm(EMPTY_TICKET_FORM);
        setFiles([]);
        setError(null);
    };

    const handleCancel = () => {
        resetForm();
        onCancel();
    };

    const handleSubmit = async () => {
        setError(null);
        setSubmitting(true);
        try {
            await ApiWrapper.createTicket(
                {
                    categoryId: Number(form.categoryId),
                    subCategoryId: Number(form.subcategoryId),
                    institutionPool: Number(form.approverPoolId),
                    endorserId: Number(form.endorserId),
                    subject: form.subject,
                    description: form.description,
                    dueDate: form.dateNeeded, // "yyyy-mm-dd" parses fine via `new Date(...)`
                },
                files
            );
            onSubmit?.(form);
            resetForm();
        } catch (err) {
            setError(getTicketErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 px-8 py-6">
                {/* Left column */}
                <div className="flex flex-col gap-2.5">
                    <SelectField
                        label="Resolver"
                        value={form.resolver}
                        onChange={updateField("resolver")}
                        options={RESOLVER_OPTIONS}
                    />
                    <div className="border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
                        <label className="block text-xs font-bold text-[#1E4637] mb-1">
                            Date Needed
                        </label>
                        <input
                            type="date"
                            value={form.dateNeeded}
                            onChange={(e) => updateField("dateNeeded")(e.target.value)}
                            className="w-full bg-transparent border border-gray-200 rounded-lg
                                px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2
                                focus:ring-[#1E4637]/30"
                        />
                    </div>
                    <SelectField
                        label="Project Name"
                        value={form.projectName}
                        onChange={updateField("projectName")}
                        options={[
                            { id: "Project Alpha", label: "Project Alpha" },
                            { id: "Project Beta", label: "Project Beta" },
                        ]}
                    />
                    <SelectField
                        label="Category"
                        value={form.categoryId}
                        onChange={updateField("categoryId")}
                        options={CATEGORY_OPTIONS}
                    />
                    <SelectField
                        label="Subcategory"
                        value={form.subcategoryId}
                        onChange={updateField("subcategoryId")}
                        options={SUBCATEGORY_OPTIONS}
                    />
                    <SelectField
                        label="Endorser"
                        value={form.endorserId}
                        onChange={updateField("endorserId")}
                        options={ENDORSER_OPTIONS}
                    />
                    <SelectField
                        label="Approver"
                        value={form.approverPoolId}
                        onChange={updateField("approverPoolId")}
                        options={APPROVER_POOL_OPTIONS}
                    />
                    <SelectField
                        label="Duration"
                        value={form.duration}
                        onChange={updateField("duration")}
                        options={DURATION_OPTIONS}
                    />
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                        <label className="block text-sm font-bold text-[#1E4637] mb-2">
                            Subject:
                        </label>
                        <input
                            type="text"
                            value={form.subject}
                            onChange={(e) => updateField("subject")(e.target.value)}
                            placeholder="Brief summary of the ticket"
                            className="w-full bg-transparent text-sm text-gray-700 focus:outline-none
                                placeholder:text-gray-300"
                        />
                    </div>

                    <div className="border border-gray-200 rounded-2xl px-5 py-4 shadow-sm flex-1 flex flex-col min-h-[280px]">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-[#1E4637]">
                                Description:
                            </label>
                            <button
                                onClick={handleReloadTemplate}
                                className="flex items-center gap-1.5 bg-[#1E4637] text-white text-xs
                                    font-semibold px-3 py-1.5 rounded-full hover:bg-[#16352A] transition-colors"
                            >
                                <RefreshCw size={12} />
                                Reload Template
                            </button>
                        </div>
                        <textarea
                            value={form.description}
                            onChange={(e) => updateField("description")(e.target.value)}
                            placeholder="Describe the request in detail..."
                            className="w-full flex-1 resize-none bg-transparent text-sm text-gray-700
                                focus:outline-none placeholder:text-gray-300"
                        />
                    </div>

                    <div className="border border-gray-200 rounded-2xl px-5 py-6 shadow-sm flex flex-col items-center justify-center gap-3">
                        <label className="self-start text-sm font-bold text-[#1E4637]">
                            Attachment: {files.length > 0 && `(${files.length}/5)`}
                        </label>
                        <button
                            onClick={handleFileUpload}
                            disabled={files.length >= 5}
                            className="flex items-center gap-2 border border-gray-300 rounded-full
                                px-6 py-2.5 font-bold text-sm text-[#1E4637] hover:bg-gray-50 transition-colors
                                disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Upload size={16} />
                            Upload File
                        </button>
                        {files.length > 0 && (
                            <ul className="w-full flex flex-col gap-1">
                                {files.map((f) => (
                                    <li
                                        key={f.name}
                                        className="flex items-center justify-between text-xs text-gray-500 gap-2"
                                    >
                                        <span className="truncate">{f.name}</span>
                                        <button
                                            onClick={() => removeFile(f.name)}
                                            className="shrink-0 text-gray-400 hover:text-gray-600"
                                            aria-label={`Remove ${f.name}`}
                                        >
                                            <X size={12} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="shrink-0 px-8 text-sm text-red-600">{error}</div>
            )}

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-end gap-4 px-8 py-5 border-t border-gray-100">
                <button
                    onClick={handleCancel}
                    disabled={submitting}
                    className="px-8 py-3 rounded-full font-bold text-sm bg-gray-100 text-gray-300
                        hover:bg-gray-200 hover:text-gray-500 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3 rounded-full font-bold text-sm bg-[#1E4637] text-white
                        hover:bg-[#16352A] transition-colors shadow-sm disabled:opacity-60"
                >
                    {submitting ? "Submitting..." : "Submit"}
                </button>
            </div>
        </div>
    );
}