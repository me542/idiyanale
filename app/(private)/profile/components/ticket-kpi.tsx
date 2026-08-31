"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";
import { verifyJWT } from "@/lib/auth/verify-jwt";
import {
  getStatusBucket,
  type StatusBucket,
} from "@/app/(private)/Dashboard/components/status_ticket";

export type TicketKpiData = {
  staffId: string;
  firstName: string;
};

interface ResolverKpiCounts {
  total: number;
  ongoing: number;
  resolved: number;
  closed: number;
  cancel: number;
  avgResolutionTime: string;
}

const STATUS_ITEMS: {
  label: string;
  key: keyof ResolverKpiCounts;
  color: string;
  bg: string;
}[] = [
  { label: "Total", key: "total", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Ongoing", key: "ongoing", color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Resolved", key: "resolved", color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Closed", key: "closed", color: "text-slate-500", bg: "bg-slate-100" },
  { label: "Cancelled", key: "cancel", color: "text-red-500", bg: "bg-red-50" },
];

function getResolverTickets(
  tickets: InstitutionTicket[],
  currentUserId: number
): InstitutionTicket[] {
  return tickets.filter((t) => t.resolver_id === currentUserId);
}

function getResolverCounts(
  resolverTickets: InstitutionTicket[]
): ResolverKpiCounts {
  let ongoing = 0;
  let resolved = 0;
  let closed = 0;
  let cancel = 0;
  let totalResolutionSeconds = 0;
  let resolvedCount = 0;

  for (const ticket of resolverTickets) {
    const bucket = getStatusBucket(ticket.status);

    switch (bucket) {
      case "inProgress":
      case "forReview":
        ongoing += 1;
        break;
      case "resolved":
        resolved += 1;
        break;
      case "closed":
        closed += 1;
        break;
      case "cancel":
        cancel += 1;
        break;
    }

    if (bucket === "resolved" && ticket.resolved_at && ticket.started_at) {
      const start = new Date(ticket.started_at).getTime();
      const end = new Date(ticket.resolved_at).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        totalResolutionSeconds += (end - start) / 1000;
        resolvedCount += 1;
      }
    }
  }

  const avgSeconds = resolvedCount > 0 ? totalResolutionSeconds / resolvedCount : 0;

  return {
    total: resolverTickets.length,
    ongoing,
    resolved,
    closed,
    cancel,
    avgResolutionTime: formatDuration(avgSeconds),
  };
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds === 0) return "—";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "<1m";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

interface CategoryKpiRow {
  category: string;
  total: number;
  ongoing: number;
  resolved: number;
  closed: number;
  cancel: number;
  avgResolutionTime: string;
}

function getCategoryKpi(resolverTickets: InstitutionTicket[]): CategoryKpiRow[] {
  const categoryMap = new Map<string, InstitutionTicket[]>();

  for (const ticket of resolverTickets) {
    const catName = ticket.category?.category_name ?? "Uncategorized";
    if (!categoryMap.has(catName)) categoryMap.set(catName, []);
    categoryMap.get(catName)!.push(ticket);
  }

  const rows: CategoryKpiRow[] = [];

  for (const [category, tickets] of categoryMap) {
    let ongoing = 0;
    let resolved = 0;
    let closed = 0;
    let cancel = 0;
    let totalResSec = 0;
    let resCount = 0;

    for (const t of tickets) {
      const bucket = getStatusBucket(t.status);
      switch (bucket) {
        case "inProgress":
        case "forReview":
          ongoing += 1;
          break;
        case "resolved":
          resolved += 1;
          break;
        case "closed":
          closed += 1;
          break;
        case "cancel":
          cancel += 1;
          break;
      }
      if (bucket === "resolved" && t.resolved_at && t.started_at) {
        const s = new Date(t.started_at).getTime();
        const e = new Date(t.resolved_at).getTime();
        if (!isNaN(s) && !isNaN(e) && e > s) {
          totalResSec += (e - s) / 1000;
          resCount += 1;
        }
      }
    }

    const avgSec = resCount > 0 ? totalResSec / resCount : 0;

    rows.push({
      category,
      total: tickets.length,
      ongoing,
      resolved,
      closed,
      cancel,
      avgResolutionTime: formatDuration(avgSec),
    });
  }

  rows.sort((a, b) => b.total - a.total);
  return rows;
}

function escapeCsvValue(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function buildCsvRow(values: string[]): string {
  return values.map(escapeCsvValue).join(",");
}

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function exportToCsv(
  resolverTickets: InstitutionTicket[],
  userFirstName: string,
  userLastName: string
) {
  const lines: string[] = [];

  // ── Sheet 1: Ticket List ──────────────────────────────────
  lines.push("Sheet 1 - Ticket List");
  lines.push(
    buildCsvRow([
      "No.",
      "Ticket ID",
      "Subject",
      "Category",
      "Sub Category",
      "Status",
      "Submitter",
      "Resolver",
      "Created At",
      "Resolved At",
      "Resolution Time",
    ])
  );

  resolverTickets.forEach((t, i) => {
    lines.push(
      buildCsvRow([
        String(i + 1),
        t.ticket_id,
        t.subject,
        t.category?.category_name ?? "—",
        t.subcategory?.sub_category_name ?? "—",
        t.status,
        t.submitter
          ? `${t.submitter.first_name} ${t.submitter.last_name}`
          : "—",
        t.resolver
          ? `${t.resolver.first_name} ${t.resolver.last_name}`
          : "—",
        formatDate(t.created_at),
        formatDate(t.resolved_at),
        t.resolution_time || "—",
      ])
    );
  });

  // ── Blank separator ───────────────────────────────────────
  lines.push("");
  lines.push("");

  // ── Sheet 2: KPI by Category ──────────────────────────────
  lines.push("Sheet 2 - KPI by Category");
  lines.push(
    buildCsvRow([
      "Category",
      "Total",
      "Ongoing",
      "Resolved",
      "Closed",
      "Cancelled",
      "Avg Resolution Time",
    ])
  );

  const categoryRows = getCategoryKpi(resolverTickets);
  for (const row of categoryRows) {
    lines.push(
      buildCsvRow([
        row.category,
        String(row.total),
        String(row.ongoing),
        String(row.resolved),
        String(row.closed),
        String(row.cancel),
        row.avgResolutionTime,
      ])
    );
  }

  // ── Download ──────────────────────────────────────────────
  const fileName = `Ticket_KPI_${userFirstName}_${userLastName}_${dateStamp()}.csv`;
  downloadCsv(lines.join("\n"), fileName);
}

export function TicketKpi({ data }: { data: TicketKpiData }) {
  const [resolverTickets, setResolverTickets] = useState<InstitutionTicket[]>([]);
  const [counts, setCounts] = useState<ResolverKpiCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;

    async function load() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Not authenticated.");
          return;
        }

        const payload = await verifyJWT(token);
        if (!payload?.id) {
          setError("Invalid token.");
          return;
        }

        const storedInstitutionId = localStorage.getItem("institution_id");
        if (!storedInstitutionId) {
          setError("Institution not found.");
          return;
        }

        const tickets = await getAllTicketsByInstitution(storedInstitutionId);
        if (cancel) return;

        const filtered = getResolverTickets(tickets, payload.id);
        setResolverTickets(filtered);
        setCounts(getResolverCounts(filtered));
      } catch (err) {
        if (!cancel) {
          console.error("Failed to load resolver KPI:", err);
          setError("Failed to load ticket data.");
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, []);

  function handleExport() {
    exportToCsv(resolverTickets, data.firstName, data.staffId);
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-700">Ticket KPI</h3>

        {!loading && !error && counts && (
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Download size={14} />
            Export
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center">
          <p className="text-sm text-slate-400">Loading KPI data…</p>
        </div>
      ) : error ? (
        <div className="flex min-h-[180px] items-center justify-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : !counts ? (
        <div className="flex min-h-[180px] items-center justify-center">
          <p className="text-sm font-medium text-slate-300">No KPI data</p>
        </div>
      ) : (
        <>
          {/* Status Cards */}
          <div className="mt-4 grid grid-cols-5 gap-3">
            {STATUS_ITEMS.map((item) => (
              <div
                key={item.key}
                className={`rounded-xl ${item.bg} px-3 py-4 text-center`}
              >
                <div className={`text-2xl font-bold ${item.color}`}>
                  {counts[item.key]}
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Resolution Time KPI */}
          <dl className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-sm font-medium text-slate-500">
                Avg. Resolution Time
              </dt>
              <dd className="text-lg font-bold text-emerald-600">
                {counts.avgResolutionTime}
              </dd>
            </div>
          </dl>
        </>
      )}
    </div>
  );
}
