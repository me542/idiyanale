import type { ReactNode } from "react";
import Sidebar from "@/shared/layout/sidebar";
import Header from "@/shared/layout/header";
import { Metadata } from "next";
import ActivityPanel from "@/shared/layout/activity-panel";
import { ActivityPanelProvider } from "@/shared/layout/activity-panel-context";

export const metadata: Metadata = {
  title: "IDIYANALE",
  description: "IDIYANALE Staff Portal",
};

export default function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ActivityPanelProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar />

        {/* Right-side Activity panel */}
        <ActivityPanel />

        {/* Main Content */}
        <div className="ml-20">
          {/* Header */}
          <Header />

          {/* Page */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </ActivityPanelProvider>
  );
}