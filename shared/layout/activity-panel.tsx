"use client";
import { useState } from "react";
import { Plus, X, Ticket, ArrowLeft } from "lucide-react";
import NewTicketPanelView, { NewTicketFormData } from "./create-ticket";
import MinorTaskPanelView, { MinorTaskFormData } from "./create-minor-task";

interface ActivityAction {
    id: string;
    label: string;
    disabled?: boolean;
    onClick?: () => void;
}

interface ActivityPanelProps {
    actions?: ActivityAction[];
}

const DEFAULT_ACTIONS: ActivityAction[] = [
    { id: "ticket", label: "Ticket" },
    { id: "minor-task", label: "Minor Task" },
];

type PanelView = "menu" | "ticket" | "minor-task";

const PANEL_TITLES: Record<PanelView, string> = {
    menu: "ACTIVITY",
    ticket: "NEW TICKET",
    "minor-task": "MINOR TASK",
};

// Narrow menu vs. wider single-column minor-task vs. wide two-column ticket form.
const PANEL_WIDTHS: Record<PanelView, string> = {
    menu: "24rem",
    ticket: "56rem",
    "minor-task": "32rem",
};

export default function ActivityPanel({
    actions = DEFAULT_ACTIONS,
}: ActivityPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [view, setView] = useState<PanelView>("menu");

    // Ribbon shows its icon whenever it's expanded, either from hover or
    // because the panel itself is open.
    const isExpanded = isHovered || isOpen;
    const panelWidth = PANEL_WIDTHS[view];

    const handleActionClick = (action: ActivityAction) => {
        setSelectedAction(action.id);

        if (action.onClick) {
            action.onClick();
        } else if (action.id === "ticket") {
            setView("ticket");
        } else if (action.id === "minor-task") {
            setView("minor-task");
        }
    };

    const handleBackToMenu = () => {
        setView("menu");
        setSelectedAction(null);
    };

    const handleClosePanel = () => {
        setIsOpen(false);
        setView("menu");
        setSelectedAction(null);
    };

    const handleTicketSubmit = (data: NewTicketFormData) => {
        // Wire this up to your API / mutation of choice.
        console.log("New ticket submitted:", data);
        handleBackToMenu();
    };

    const handleMinorTaskSubmit = (data: MinorTaskFormData) => {
        // Wire this up to your API / mutation of choice.
        console.log("Minor task submitted:", data);
        handleBackToMenu();
    };

    return (
        <>
            {/* Dark overlay, shown only when open, click to close */}
            <div
                onClick={handleClosePanel}
                className={`fixed inset-0  z-40 transition-opacity duration-300 ${
                    isOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
            />

            {/* Ribbon trigger - thin sliver by default, widens + reveals icon on hover.
                Stays attached to the panel's left edge (visible) when open, instead of
                sliding away, so it doubles as the close handle. Tracks the panel's
                current width (narrow menu vs. wide ticket form). */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                aria-label={isOpen ? "Close activity panel" : "Open activity panel"}
                style={{ right: isOpen ? panelWidth : 0 }}
                className={`fixed top-50 -translate-y-1/2 z-50 bg-[#1E4637]
                    flex items-center justify-center rounded-l-xl shadow-lg
                    transition-[width,right] duration-300 ease-in-out overflow-hidden
                    ${isExpanded ? "w-14 h-16" : "w-5 h-16"}`}
            >
                <Ticket
                    size={20}
                    className={`text-white shrink-0 transition-opacity duration-200 ${
                        isExpanded ? "opacity-100" : "opacity-0"
                    }`}
                />
            </button>

            {/* Sliding panel — width animates between the narrow menu/minor-task
                views and the wide two-column ticket form. */}
            <aside
                style={{ width: panelWidth, maxWidth: "100%" }}
                className={`fixed right-0 top-0 h-screen bg-white border-l border-gray-100 z-50
                    shadow-2xl transition-[transform,width] duration-300 ease-in-out flex flex-col
                    overflow-hidden
                    ${isOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* Header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2 text-[#1E4637]">
                        {view !== "menu" ? (
                            <button
                                onClick={handleBackToMenu}
                                aria-label="Back to activity menu"
                                className="hover:opacity-70 transition-opacity"
                            >
                                <ArrowLeft size={20} strokeWidth={2.5} />
                            </button>
                        ) : (
                            <Plus size={20} strokeWidth={2.5} />
                        )}
                        <span className="font-bold tracking-wide text-sm">
                            {PANEL_TITLES[view]}
                        </span>
                    </div>
                    <button
                        onClick={handleClosePanel}
                        aria-label="Close activity panel"
                        className="text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Content */}
                {view === "menu" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8">
                        {actions.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => handleActionClick(action)}
                                className={`w-full max-w-xs py-4 rounded-2xl font-bold text-sm tracking-wide
                                    transition-colors shadow-sm
                                    ${
                                        action.disabled
                                            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                            : selectedAction === action.id
                                            ? "bg-[#1E4637] text-white"
                                            : "bg-gray-300 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {action.label.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}

                {view === "ticket" && (
                    <NewTicketPanelView
                        onCancel={handleBackToMenu}
                        onSubmit={handleTicketSubmit}
                    />
                )}

                {view === "minor-task" && (
                    <MinorTaskPanelView
                        onCancel={handleBackToMenu}
                        onSubmit={handleMinorTaskSubmit}
                    />
                )}
            </aside>
        </>
    );
}