"use client";

import { useEffect, useState } from "react";
import { TicketRow } from "./types";
import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";
import { lightTheme } from "@/shared/theme/theme_provider";
// Adjust this import path if TicketDetailPanel lives elsewhere relative to this file.
import TicketDetailPanel from "@/shared/layout/ticket_progress";

interface Props {
  tickets?: TicketRow[];
}

// Number of rows to show before the list becomes scrollable.
const VISIBLE_ROWS = 8;
// Approximate height (px) of a single table row, used to size the scroll area.
const ROW_HEIGHT_PX = 68;

function getStatusStyle(status: string) {
  const value = status.toLowerCase().trim();

  switch (value) {
    case "for review":
    case "for endorsement":
    case "endorsed":
    case "for approval":
    case "approved":
    case "for assignment":
      return {
        backgroundColor: lightTheme.for_review,
        color: "#fff",
      };

    case "in progress":
    case "on hold":
      return {
        backgroundColor: lightTheme.in_progress,
        color: "#fff",
      };

    case "resolved":
      return {
        backgroundColor: lightTheme.resolved,
        color: "#fff",
      };

    case "closed":
      return {
        backgroundColor: lightTheme.closed,
        color: "#fff",
      };

    case "cancel":
      return {
        backgroundColor: lightTheme.cancel,
        color: "#fff",
      };

    default:
      return {
        backgroundColor: lightTheme.secondary,
        color: "#fff",
      };
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";

  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) {
    return dateStr;
  }

  return d.toISOString().slice(0, 10);
}

function getUserName(
  user: InstitutionTicket["submitter"] | null,
  fallback: string
) {
  if (!user) return fallback;

  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }

  if (user.first_name) {
    return user.first_name;
  }

  if (user.last_name) {
    return user.last_name;
  }

  if (user.staff_id) {
    return user.staff_id;
  }

  if (user.email) {
    return user.email;
  }

  return fallback;
}

function mapApiToRow(api: InstitutionTicket): TicketRow {
  const submitter = getUserName(
    api.submitter,
    api.submitter_id ? `ID: ${api.submitter_id}` : "Unknown"
  );

  const resolver = getUserName(
    api.resolver,
    api.resolver_id ? `ID: ${api.resolver_id}` : "Unassigned"
  );

  return {
    sr: api.ticket_id,
    title: api.subject,
    status: api.status,
    dateNeeded: formatDate(api.due_date),
    submitter,
    resolver,
  };
}

// Builds a minimal InstitutionTicket-shaped object from a TicketRow, for the
// case where this component was handed already-flattened rows (via the
// `tickets` prop) and has no raw API object to look up. The detail panel
// degrades gracefully — it only renders fields that are present.
function rowToFallbackTicket(row: TicketRow): InstitutionTicket {
  return {
    ticket_id: row.sr,
    subject: row.title,
    status: row.status,
    due_date: row.dateNeeded,
    submitter: row.submitter
      ? ({ first_name: row.submitter, last_name: "" } as InstitutionTicket["submitter"])
      : null,
    resolver:
      row.resolver && row.resolver !== "Unassigned"
        ? ({ first_name: row.resolver, last_name: "" } as InstitutionTicket["resolver"])
        : null,
  } as InstitutionTicket;
}

export default function MyTicket({ tickets = [] }: Props) {
  const [fetched, setFetched] = useState<TicketRow[] | null>(null);
  const [rawTickets, setRawTickets] = useState<InstitutionTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTicket, setSelectedTicket] = useState<InstitutionTicket | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    // If tickets were passed from the parent, don't fetch.
    if (tickets.length > 0) {
      return;
    }

    let cancel = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const storedInstitutionId =
          localStorage.getItem("institution_id");

        if (!storedInstitutionId) {
          throw new Error("Institution ID not found.");
        }

        const institutionId = Number(storedInstitutionId);

        if (!Number.isInteger(institutionId) || institutionId <= 0) {
          throw new Error("Invalid institution ID.");
        }

        const apiRows = await getAllTicketsByInstitution(institutionId);

        if (cancel) return;

        const mapped = apiRows.map(mapApiToRow);

        setRawTickets(apiRows);
        setFetched(mapped);
      } catch (err: unknown) {
        if (cancel) return;

        const message =
          err instanceof Error
            ? err.message
            : "Failed to load tickets. Check your network or authentication.";

        setError(message);
        setFetched([]);
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancel = true;
    };
  }, [tickets]);

  const displayTickets =
    tickets.length > 0
      ? tickets
      : fetched ?? [];

  // Only turn on the scroll container once we actually have more rows than fit.
  const needsScroll = displayTickets.length > VISIBLE_ROWS;

  function openTicket(row: TicketRow) {
    const raw = rawTickets.find((t) => t.ticket_id === row.sr);
    setSelectedTicket(raw ?? rowToFallbackTicket(row));
    setIsPanelOpen(true);
  }

  function closePanel() {
    setIsPanelOpen(false);
  }

  function handleSendRemark(ticketId: string, message: string) {
    // TODO: wire this up once a remarks endpoint exists.
    console.log("Send remark for", ticketId, message);
  }

  // Count overdue tickets (past due_date, not completed/cancelled)
  const completedStatuses = new Set(["resolved", "closed", "cancel", "canceled"]);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const overdueCount = rawTickets.filter((t) => {
    const status = t.status?.toLowerCase().trim().replace(/[\s_-]+/g, "");
    if (completedStatuses.has(status)) return false;
    if (!t.due_date) return false;
    return new Date(t.due_date) < startOfToday;
  }).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-extrabold tracking-wide text-slate-800">
          RECENT TICKET
        </div>

        {overdueCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
              {overdueCount} overdue
            </span>
          </div>
        )}
      </div>

      <hr className="border-t border-slate-200 my-4 -mx-6" />

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-500">
          Loading tickets...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-center py-6 px-5 gap-1.5 text-red-600">
          <div className="font-bold text-red-700 text-sm">
            Error loading tickets
          </div>

          <div className="text-xs max-w-[320px] leading-relaxed">
            {error}
          </div>
        </div>
      ) : displayTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-55 px-5 gap-1.5 text-slate-500">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5B6B6C"
            strokeWidth={1.5}
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18" />
            <path d="M8 14h8" />
          </svg>

          <div className="font-bold text-slate-800 text-sm">
            No tickets yet
          </div>

          <div className="text-xs max-w-[220px] leading-relaxed">
            Tickets assigned or submitted by you will show up here.
          </div>
        </div>
      ) : (
        <div
          className={needsScroll ? "overflow-y-auto pr-1" : ""}
          style={
            needsScroll
              ? { maxHeight: `${VISIBLE_ROWS * ROW_HEIGHT_PX}px` }
              : undefined
          }
        >
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="text-left text-slate-500 text-[11.5px] tracking-wide uppercase pb-2.5">
                  SR Number
                </th>

                <th className="text-center text-slate-500 text-[11.5px] tracking-wide uppercase pb-2.5">
                  Status
                </th>

                <th className="text-center text-slate-500 text-[11.5px] tracking-wide uppercase pb-2.5">
                  Date Needed
                </th>

                <th className="text-center text-slate-500 text-[11.5px] tracking-wide uppercase pb-2.5">
                  Submitter
                </th>

                <th className="text-center text-slate-500 text-[11.5px] tracking-wide uppercase pb-2.5">
                  Resolver
                </th>
              </tr>
            </thead>

            <tbody>
              {displayTickets.map((t, i) => (
                <tr
                  key={`${t.sr}-${i}`}
                  onClick={() => openTicket(t)}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="pt-3 pb-3 pr-2 border-t border-slate-200 align-top">
                    <a
                      className="text-blue-600 font-semibold"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openTicket(t);
                      }}
                    >
                      {t.sr}
                    </a>

                    <br />

                    <span className="text-slate-700">
                      {t.title}
                    </span>
                  </td>

                  <td className="pt-3 pb-3 pr-2 border-t border-slate-200 align-middle text-center">
                    <span
                      className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold capitalize min-w-[110px]"
                      style={getStatusStyle(t.status)}
                    >
                      {t.status}
                    </span>
                  </td>

                  <td className="pt-3 pb-3 pr-2 border-t border-slate-200 align-middle text-slate-700 text-center">
                    {t.dateNeeded}
                  </td>

                  <td className="pt-3 pb-3 pr-2 border-t border-slate-200 align-middle text-slate-700 text-center">
                    {t.submitter}
                  </td>

                  <td className="pt-3 pb-3 pr-2 border-t border-slate-200 align-middle text-slate-700 text-center">
                    {t.resolver}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TicketDetailPanel
        ticket={selectedTicket}
        isOpen={isPanelOpen}
        onOpen={() => setIsPanelOpen(true)}
        onClose={closePanel}
        onSendRemark={handleSendRemark}
      />
    </div>
  );
}