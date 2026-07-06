import type { ReactNode } from "react";
import Sidebar from "@/shared/layout/sidebar";
import SuperAdminSidebar from "@/shared/layout/super-admin-sidebar";
import Header from "@/shared/layout/header";
import { Metadata } from "next";
import ActivityPanel from "@/shared/layout/activity-panel";

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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SuperAdminSidebar />

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
  );
}
 