"use client";
import { useState } from "react";
import { RefreshCw, Upload } from "lucide-react";

export interface NewTicketFormData {
    ticketType: string;
    resolver: string;
    dateNeeded: string;
    projectName: string;
    category: string;
    subcategory: string;
    endorser: string;
    approverPool: string;
    duration: string;
    subject: string;
    description: string;
}

export const EMPTY_TICKET_FORM: NewTicketFormData = {
    ticketType: "",
    resolver: "",
    dateNeeded: "",
    projectName: "",
    category: "",
    subcategory: "",
    endorser: "",
    approverPool: "",
    duration: "",
    subject: "",
    description: "",
};

interface SelectFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options?: string[];
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
                        <option key={opt} value={opt}>
                            {opt}
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

interface NewTicketPanelViewProps {
    onCancel: () => void;
    onSubmit?: (data: NewTicketFormData) => void;
}

/**
 * Ticket form content only — no header, no aside wrapper, no overlay.
 * Two-column layout matching the original mockup; needs a wide panel
 * (ActivityPanel widens itself while this view is active).
 */
export default function NewTicketPanelView({ onCancel, onSubmit }: NewTicketPanelViewProps) {
    const [form, setForm] = useState<NewTicketFormData>(EMPTY_TICKET_FORM);
    const [fileName, setFileName] = useState<string | null>(null);

    const updateField = (key: keyof NewTicketFormData) => (value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleReloadTemplate = () => {
        updateField("description")("");
    };

    const handleFileUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.onchange = () => {
            const file = input.files?.[0];
            if (file) setFileName(file.name);
        };
        input.click();
    };

    const handleCancel = () => {
        setForm(EMPTY_TICKET_FORM);
        setFileName(null);
        onCancel();
    };

    const handleSubmit = () => {
        onSubmit?.(form);
        setForm(EMPTY_TICKET_FORM);
        setFileName(null);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 px-8 py-6">
                {/* Left column */}
                <div className="flex flex-col gap-2.5">
                    <SelectField
                        label="Ticket Type"
                        value={form.ticketType}
                        onChange={updateField("ticketType")}
                        options={["Service Request", "Change Request", "Incident Report", "Problem Report"]}
                    />
                    <SelectField
                        label="Resolver"
                        value={form.resolver}
                        onChange={updateField("resolver")}
                        options={["IT Support", "HR", "Facilities"]}
                    />
                    <SelectField
                        label="Date Needed"
                        value={form.dateNeeded}
                        onChange={updateField("dateNeeded")}
                        options={["Today", "Tomorrow", "This Week", "Next Week"]}
                    />
                    <SelectField
                        label="Project Name"
                        value={form.projectName}
                        onChange={updateField("projectName")}
                        options={["Project Alpha", "Project Beta"]}
                    />
                    <SelectField
                        label="Category"
                        value={form.category}
                        onChange={updateField("category")}
                        options={["Hardware", "Software", "Access"]}
                    />
                    <SelectField
                        label="Subcategory"
                        value={form.subcategory}
                        onChange={updateField("subcategory")}
                        options={["Laptop", "License", "Account"]}
                    />
                    <SelectField
                        label="Endorser"
                        value={form.endorser}
                        onChange={updateField("endorser")}
                        options={["Manager", "Team Lead"]}
                    />
                    <SelectField
                        label="Approver"
                        value={form.approverPool}
                        onChange={updateField("approverPool")}
                        options={["Pool A", "Pool B"]}
                    />
                    <SelectField
                        label="Duration"
                        value={form.duration}
                        onChange={updateField("duration")}
                        options={["1 day", "3 days", "1 week"]}
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
                            Attachment:
                        </label>
                        <button
                            onClick={handleFileUpload}
                            className="flex items-center gap-2 border border-gray-300 rounded-full
                                px-6 py-2.5 font-bold text-sm text-[#1E4637] hover:bg-gray-50 transition-colors"
                        >
                            <Upload size={16} />
                            Upload File
                        </button>
                        {fileName && (
                            <span className="text-xs text-gray-500 truncate max-w-full">
                                {fileName}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-end gap-4 px-8 py-5 border-t border-gray-100">
                <button
                    onClick={handleCancel}
                    className="px-8 py-3 rounded-full font-bold text-sm bg-gray-100 text-gray-300
                        hover:bg-gray-200 hover:text-gray-500 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    className="px-8 py-3 rounded-full font-bold text-sm bg-[#1E4637] text-white
                        hover:bg-[#16352A] transition-colors shadow-sm"
                >
                    Submit
                </button>
            </div>
        </div>
    );
}