"use client";
import { useState } from "react";
import {
    Plus,
    X,
    ArrowLeft,
    ClipboardList,
    HandPlatter,
    Bug,
    MessageCircleWarning,
    Wand,
    Stone,
} from "lucide-react";
import NewTicketPanelView, { NewTicketFormData } from "./Activity/service-request";
import MinorTaskPanelView, { MinorTaskFormData } from "./Activity/minor-task";
import { useActivityPanel } from "./activity-panel-context";

interface ActivityAction {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    disabled?: boolean;
    onClick?: () => void;
}

interface ActivityPanelProps {
    actions?: ActivityAction[];
}

const DEFAULT_ACTIONS: ActivityAction[] = [
    { id: "service-request", label: "Service Request", icon: HandPlatter },
    { id: "changed-request", label: "Changed Request", icon: Wand },
    { id: "incident-report", label: "Incident Report", icon: MessageCircleWarning },
    { id: "problem-management", label: "Problem Management", icon: Bug },
    { id: "minor-task", label: "Minor Task", icon: Stone },
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
    const { isOpen, view, openPanel, closePanel, setView } = useActivityPanel();
    const [isHovered, setIsHovered] = useState(false);
    const [selectedAction, setSelectedAction] = useState<string | null>(null);

    // Ribbon shows its icon whenever it's expanded, either from hover or
    // because the panel itself is open.
    const isExpanded = isHovered || isOpen;
    const panelWidth = PANEL_WIDTHS[view];

    const handleActionClick = (action: ActivityAction) => {
        setSelectedAction(action.id);

        if (action.onClick) {
            action.onClick();
        } else if (action.id === "minor-task") {
            setView("minor-task");
        }
        // service-request, changed-request, incident-report, and
        // problem-management have no wired behavior yet.
    };

    const handleBackToMenu = () => {
        setView("menu");
        setSelectedAction(null);
    };

    const handleClosePanel = () => {
        closePanel();
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
            {/* Ribbon trigger with invisible hover area */}
            {/* Ribbon trigger with invisible hover area */}
            <div
                className="fixed top-1/2 z-50 h-20 w-24 -translate-y-1/2"
                style={{ right: isOpen ? panelWidth : 0 }}
            >
                <button
                    onClick={() => (isOpen ? handleClosePanel() : openPanel())}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    aria-label={isOpen ? "Close activity panel" : "Open activity panel"}
                    className={`absolute right-0 -top-60 -translate-y-1/2
                        bg-[#1E4637]
                        flex items-center justify-center rounded-l-xl shadow-lg
                        transition-all duration-300 ease-in-out overflow-hidden
                        ${isExpanded ? "w-14 h-16" : "w-8 h-16"}`}
                >
                    <ClipboardList
                        size={20}
                        className={`text-white shrink-0 transition-opacity duration-200 ${
                            isExpanded ? "opacity-100" : "opacity-0"
                        }`}
                    />
                </button>
            </div>

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
                        {actions.map((action, index) => {
                            const Icon = action.icon;
                            const isLast = index === actions.length - 1;
                            return (
                                <div
                                    key={action.id}
                                    className={`w-full max-w-xs flex flex-col items-center ${
                                        isLast ? "mt-6 pt-6 border-t border-gray-200" : ""
                                    }`}
                                >
                                    <button
                                        onClick={() => handleActionClick(action)}
                                        className={`w-full py-4 px-5 rounded-2xl font-bold text-sm tracking-wide
                                            transition-colors shadow-lg flex items-center gap-3
                                            ${
                                                action.disabled
                                                    ? "bg-gray-100 text-[#1E4637] cursor-not-allowed"
                                                    : selectedAction === action.id
                                                    ? "bg-[#1E4637] text-white"
                                                    : "bg-white/80 text-[#1E4637] hover:bg-[#1E4637] hover:text-white"
                                            }`}
                                    >
                                        <Icon size={18} className="shrink-0" />
                                        <span>{action.label.toUpperCase()}</span>
                                    </button>
                                </div>
                            );
                        })}
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