"use client";

import StatusTickets from "./components/StatusTickets";
import MyTicket from "./components/RecentTicket";
import ByCategory from "./components/ByCategory";
import DueActivity from "./components/DueActivity";
import { useCategoryStats } from "./components/cagetory";
import { useAuth } from "@/lib/auth/permission";

export default function DashboardPage() {
  const { institutionId, loading: authLoading } = useAuth();

  const {
    categories,
    total: categoryTotal,
    loading: categoryLoading,
    error: categoryError,
  } = useCategoryStats(institutionId);

  if (authLoading) {
    return (
      <main className="status-tickets">
        <div className="text-sm text-slate-500 p-6">Loading dashboard…</div>
      </main>
    );
  }

  if (!institutionId) {
    return (
      <main className="status-tickets">
        <div className="text-sm text-red-500 p-6">
          You are not associated with an institution. Please contact your administrator.
        </div>
      </main>
    );
  }

  return (
    <main className="status-tickets">
      <StatusTickets />

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1.1fr] gap-5 items-start">
        <MyTicket tickets={[]} />

        <div className="flex flex-col gap-5">
          <DueActivity />
          <ByCategory
            categories={categories}
            total={categoryTotal}
            loading={categoryLoading}
            error={categoryError}
          />
        </div>
      </div>
    </main>
  );
}