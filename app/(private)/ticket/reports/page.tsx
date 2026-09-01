// page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Filter, { DateRange } from "./components/Filter";
import DailyTickets from "./components/DailyTickets";
import Sli from "./components/Sli";
import DateTable from "./components/DateTable";
import CategoryTable from "./components/CategoryTable";
import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";
import { verifyJWT } from "@/lib/auth/verify-jwt";
import {
  filterTicketsByDateRange,
  groupTicketsByDay,
  groupTicketsByMonth,
  groupTicketsByCategory,
  calculateSli,
} from "./components/report-utils";

export default function Page() {
  const [tickets, setTickets] = useState<InstitutionTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });

  useEffect(() => {
    const loadData = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("access_token");
        if (!token) throw new Error("Token not found");

        const payload = await verifyJWT(token);
        if (!payload?.institution_id) throw new Error("Institution ID not found");

        const data = await getAllTicketsByInstitution(payload.institution_id);
        setTickets(data);
      } catch (error) {
        console.error("Failed to load ticket data:", error);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredTickets = useMemo(
    () => filterTicketsByDateRange(tickets, range.from, range.to),
    [tickets, range]
  );

  const dailyData = useMemo(() => groupTicketsByDay(filteredTickets), [filteredTickets]);
  const dateRows = useMemo(() => groupTicketsByMonth(filteredTickets), [filteredTickets]);
  const categoryRows = useMemo(
    () => groupTicketsByCategory(filteredTickets),
    [filteredTickets]
  );
  const sliData = useMemo(() => calculateSli(filteredTickets), [filteredTickets]);

  function handleDownload() {
    const header = ["created_at", "status", "category", "subcategory"];
    const csvRows = filteredTickets.map((t) =>
      [
        t.created_at ?? "",
        t.status ?? "",
        t.category?.category_name ?? "",
        t.subcategory?.sub_category_name ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${range.from || "all"}_${range.to || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="reports-page">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-6">
        <Filter
          onFilterChange={setRange}
          onClear={() => setRange({ from: "", to: "" })}
          onDownload={handleDownload}
        />

        <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-3">
          <div className="flex flex-col gap-6 overflow-hidden lg:col-span-2">
            <DailyTickets data={dailyData} />
            <DateTable rows={dateRows} />
          </div>

          <div className="flex flex-col gap-6 overflow-hidden">
            <Sli data={sliData} loading={loading} />
            <CategoryTable rows={categoryRows} />
          </div>
        </div>
      </div>
    </main>
  );
}