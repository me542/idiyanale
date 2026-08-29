"use client";

import { useEffect, useState } from "react";
import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";
import { lightTheme } from "@/shared/theme/theme_provider";
import { mapTicketsToDueActivity } from "./dueativity";
import { DueActivityItem } from "./types";
import TicketDetailPanel from "@/shared/layout/ticket_progress"; // adjust path to match where you place it

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
    case "canceled":
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

export default function DueActivity() {
  const [activities, setActivities] = useState<DueActivityItem[]>([]);
  // Raw tickets kept alongside the mapped due-activity rows so the detail
  // panel has the full record to show when a row is clicked.
  const [tickets, setTickets] = useState<InstitutionTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected ticket + panel open state.
  const [selectedTicket, setSelectedTicket] = useState<InstitutionTicket | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    let cancel = false;

    async function loadDueActivity() {
      try {
        setLoading(true);
        setError(null);

        const storedInstitutionId =
          localStorage.getItem("institution_id");

        if (!storedInstitutionId) {
          throw new Error("Institution ID not found.");
        }

        const institutionId = Number(storedInstitutionId);

        if (!Number.isInteger(institutionId) || institutionId <= 0) {
          throw new Error("Invalid institution ID.");
        }

        const fetchedTickets =
          await getAllTicketsByInstitution(institutionId);

        if (!cancel) {
          setTickets(fetchedTickets);
          setActivities(mapTicketsToDueActivity(fetchedTickets));
        }
      } catch (err) {
        console.error("Failed to load due activity:", err);

        if (!cancel) {
          setError("Couldn't load due activity.");
          setActivities([]);
          setTickets([]);
        }
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    }

    loadDueActivity();

    return () => {
      cancel = true;
    };
  }, []);

  const overdueCount = activities.filter(
    (a) => a.isOverdue
  ).length;

  function handleSelectTicket(ticketId: string) {
    // InstitutionTicket's unique display id is `ticket_id` (e.g. "SR000001").
    // DueActivityItem.ticketId should be mapped from that same field in
    // mapTicketsToDueActivity — if it isn't, update one side to match.
    const ticket = tickets.find((t) => t.ticket_id === ticketId);

    setSelectedTicket(ticket ?? null);
    setIsPanelOpen(true);
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl shadow-md p-5 h-[370px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-[15px] font-extrabold tracking-wide text-slate-800">
            DUE ACTIVITY
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

        <div
          className={`flex-1 flex flex-col ${
            !loading && activities.length === 0
              ? "justify-center"
              : "justify-start"
          }`}
        >
          {loading ? (
            <SkeletonList />
          ) : error ? (
            <ErrorState message={error} />
          ) : activities.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-1">
              {/* Column Headers */}
              <div className="grid grid-cols-[1.2fr_1.1fr_1fr_1fr] gap-3 px-2 pb-2">
                <div className="text-slate-500 text-[10.5px] tracking-wide uppercase">
                  SR Number
                </div>

                <div className="text-center text-slate-500 text-[10.5px] tracking-wide uppercase">
                  Status
                </div>

                <div className="text-center text-slate-500 text-[10.5px] tracking-wide uppercase">
                  Date Created
                </div>

                <div className="text-center text-slate-500 text-[10.5px] tracking-wide uppercase">
                  Date Needed
                </div>
              </div>

              {/* Rows - shows 5 at a time, scrolls for the rest */}
              <div className="flex flex-col gap-1 max-h-[248px] overflow-y-auto overflow-x-hidden pr-1 scroll-thin">
                {activities.map((a) => (
                  <div
                    key={a.ticketId}
                    onClick={() => handleSelectTicket(a.ticketId)}
                    className={`grid grid-cols-[1.2fr_1.1fr_1fr_1fr] items-center gap-3 py-2.5 px-3 -mx-2 rounded-lg border-t transition-colors cursor-pointer ${
                      a.isOverdue
                        ? "bg-red-50 border-red-200 hover:bg-red-100 pl-4"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {/* SR Number */}
                    <div className="min-w-0">
                      <div
                        className={`text-[13px] font-semibold truncate ${
                          a.isOverdue ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        {a.ticketId}
                      </div>

                      {a.isOverdue && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span className="text-[9px] font-semibold text-red-500 uppercase tracking-wide">
                            Past due date
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex justify-center">
                      <span
                        className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-semibold capitalize min-w-[95px] whitespace-nowrap"
                        style={getStatusStyle(a.status)}
                      >
                        {a.status}
                      </span>
                    </div>

                    {/* Date Created */}
                    <div className="text-[11px] text-slate-500 text-center whitespace-nowrap">
                      {a.dateCreated}
                    </div>

                    {/* Date Needed */}
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div
                        className={`text-[11px] font-medium text-center whitespace-nowrap ${
                          a.isOverdue
                            ? "text-red-600 font-bold"
                            : a.isToday
                            ? "text-amber-600 font-semibold"
                            : "text-slate-500"
                        }`}
                      >
                        {a.due}
                      </div>

                      {a.isOverdue && (
                        <span className="inline-flex items-center rounded-full bg-red-600 text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide">
                          Overdue
                        </span>
                      )}

                      {!a.isOverdue && a.isToday && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide">
                          Due Today
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel for whichever ticket was last clicked */}
      <TicketDetailPanel
        ticket={selectedTicket}
        isOpen={isPanelOpen}
        onOpen={() => setIsPanelOpen(true)}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-1.5 text-slate-500">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#5B6B6C"
        strokeWidth={1.5}
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>

      <div className="font-bold text-slate-800 text-sm">
        Nothing due
      </div>

      <div className="text-xs max-w-[220px] leading-relaxed">
        Upcoming deadlines and activities will appear here as
        they come up.
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-1.5 text-slate-500">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ef4444"
        strokeWidth={1.5}
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>

      <div className="font-bold text-slate-800 text-sm">
        {message}
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {/* Header skeleton */}
      <div className="grid grid-cols-[1.2fr_1.1fr_1fr_1fr] gap-3 px-2">
        <div className="h-2 bg-slate-200 rounded w-16" />
        <div className="h-2 bg-slate-200 rounded w-12 mx-auto" />
        <div className="h-2 bg-slate-200 rounded w-20 mx-auto" />
        <div className="h-2 bg-slate-200 rounded w-20 mx-auto" />
      </div>

      {/* Row skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[1.2fr_1.1fr_1fr_1fr] items-center gap-3 py-2.5 px-2 animate-pulse"
        >
          <div>
            <div className="h-3 bg-slate-200 rounded w-20 mb-1.5" />
            <div className="h-2 bg-slate-100 rounded w-24" />
          </div>

          <div className="h-5 bg-slate-200 rounded-full w-20 mx-auto" />

          <div className="h-3 bg-slate-200 rounded w-20 mx-auto" />

          <div className="h-3 bg-slate-200 rounded w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}