"use client";

import StatusTickets from "./components/StatusTickets";
import MyTicket from "./components/RecentTicket";
import ByCategory from "./components/ByCategory";
import DueActivity from "./components/DueActivity";
import ByTicketType from "./components/ByTicketType";
import { useCategoryStats, useTicketTypeStats } from "./components/cagetory";
import { useAuth } from "@/lib/auth/permission";

export default function DashboardPage() {
  const { institutionId, loading: authLoading } = useAuth();

  const {
    categories,
    total: categoryTotal,
    loading: categoryLoading,
    error: categoryError,
  } = useCategoryStats(institutionId);

  const {
    categories: ticketTypes,
    total: ticketTypeTotal,
    loading: ticketTypeLoading,
    error: ticketTypeError,
  } = useTicketTypeStats(institutionId);

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

          {/* Combined card: Ticket Type on top, Category below */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6">
            <ByTicketType
              categories={ticketTypes}
              total={ticketTypeTotal}
              loading={ticketTypeLoading}
              error={ticketTypeError}
            />

            <hr className="border-t border-slate-200 my-5" />

            <ByCategory
              categories={categories}
              total={categoryTotal}
              loading={categoryLoading}
              error={categoryError}
            />
          </div>
        </div>
      </div>
    </main>
  );
}