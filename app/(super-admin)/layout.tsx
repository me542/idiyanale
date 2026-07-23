import type { ReactNode } from "react";
import SuperAdminSidebar from "@/shared/layout/super-admin-sidebar";
import Header from "@/shared/layout/header";
import { Metadata } from "next";
import { ActivityPanelProvider } from "@/shared/layout/activity-panel-context";

export const metadata: Metadata = {
  title: "IDIYANALE",
  description: "IDIYANALE Staff Portal",
};

export default function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ActivityPanelProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <SuperAdminSidebar />

        {/* Main Content */}
        <div className="ml-20">
          {/* Header */}
          <Header />

          {/* Page */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </ActivityPanelProvider>
  );
}