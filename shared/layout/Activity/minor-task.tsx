"use client";
import { useState } from "react";
import { Upload } from "lucide-react";

export interface MinorTaskFormData {
    task: string;
    subject: string;
    resolverPool: string;
    description: string;
}

export const EMPTY_MINOR_TASK_FORM: MinorTaskFormData = {
    task: "",
    subject: "",
    resolverPool: "",
    description: "",
};

interface TextFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
    return (
        <div className="border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
            <label className="block text-sm font-bold text-[#1E4637] mb-2">
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700
                    focus:outline-none focus:ring-2 focus:ring-[#1E4637]/30"
            />
        </div>
    );
}

interface MinorTaskPanelViewProps {
    onCancel: () => void;
    onSubmit?: (data: MinorTaskFormData) => void;
}

/**
 * Minor Task form content only — no header, no aside wrapper, no overlay.
 * Single-column layout matching the mockup; pairs with a narrow panel width
 * (same width as the ACTIVITY menu).
 */
export default function MinorTaskPanelView({ onCancel, onSubmit }: MinorTaskPanelViewProps) {
    const [form, setForm] = useState<MinorTaskFormData>(EMPTY_MINOR_TASK_FORM);
    const [fileName, setFileName] = useState<string | null>(null);

    const updateField = (key: keyof MinorTaskFormData) => (value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

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
        setForm(EMPTY_MINOR_TASK_FORM);
        setFileName(null);
        onCancel();
    };

    const handleSubmit = () => {
        onSubmit?.(form);
        setForm(EMPTY_MINOR_TASK_FORM);
        setFileName(null);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-5 px-8 py-6">
                <TextField
                    label="Task"
                    value={form.task}
                    onChange={updateField("task")}
                />
                <TextField
                    label="Subject"
                    value={form.subject}
                    onChange={updateField("subject")}
                />
                <TextField
                    label="Resolver Pool"
                    value={form.resolverPool}
                    onChange={updateField("resolverPool")}
                />

                <div className="border border-gray-200 rounded-2xl px-5 py-4 shadow-sm flex-1 flex flex-col min-h-[220px]">
                    <label className="block text-sm font-bold text-[#1E4637] mb-2">
                        Description
                    </label>
                    <textarea
                        value={form.description}
                        onChange={(e) => updateField("description")(e.target.value)}
                        className="w-full flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2
                            text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E4637]/30"
                    />
                </div>

                <div className="border border-gray-200 rounded-2xl px-5 py-6 shadow-sm flex flex-col items-center justify-center gap-3">
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