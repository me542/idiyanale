"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type PanelView = "menu" | "service-request" | "changed-request" | "incident-report" | "problem-management" | "minor-task";

interface ActivityPanelContextValue {
  isOpen: boolean;
  view: PanelView;
  openPanel: (view?: PanelView) => void;
  closePanel: () => void;
  setView: (view: PanelView) => void;
}

const ActivityPanelContext = createContext<ActivityPanelContextValue | null>(null);

export function ActivityPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<PanelView>("menu");

  const openPanel = (targetView: PanelView = "menu") => {
    setView(targetView);
    setIsOpen(true);
  };

  const closePanel = () => {
    setIsOpen(false);
    setView("menu");
  };

  return (
    <ActivityPanelContext.Provider
      value={{ isOpen, view, openPanel, closePanel, setView }}
    >
      {children}
    </ActivityPanelContext.Provider>
  );
}

export function useActivityPanel() {
  const ctx = useContext(ActivityPanelContext);
  if (!ctx) {
    throw new Error("useActivityPanel must be used within an ActivityPanelProvider");
  }
  return ctx;
}