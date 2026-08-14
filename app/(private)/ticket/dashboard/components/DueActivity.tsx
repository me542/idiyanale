"use client";

import { useEffect, useState } from "react";
import { getAllTicketsByInstitution } from "@/services/integration/ticket/get_all_ticket_by_insti";
import { lightTheme } from "@/shared/theme/theme_provider";
import { mapTicketsToDueActivity } from "./dueativity";
import { DueActivityItem } from "./types";

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

    case "cancelled":
    case "canceled":
      return {
        backgroundColor: lightTheme.cancelled,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

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

        const tickets =
          await getAllTicketsByInstitution(institutionId);

        if (!cancelled) {
          setActivities(mapTicketsToDueActivity(tickets));
        }
      } catch (err) {
        console.error("Failed to load due activity:", err);

        if (!cancelled) {
          setError("Couldn't load due activity.");
          setActivities([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDueActivity();

    return () => {
      cancelled = true;
    };
  }, []);

  const overdueCount = activities.filter(
    (a) => a.isOverdue
  ).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6 min-h-[280px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-extrabold tracking-wide text-slate-800">
          DUE ACTIVITY
        </div>

        {overdueCount > 0 && (
          <span className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-full px-2.5 py-0.5">
            {overdueCount} overdue
          </span>
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

            {/* Rows */}
            {activities.map((a) => (
              <div
                key={a.ticketId}
                className="grid grid-cols-[1.2fr_1.1fr_1fr_1fr] items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg border-t border-slate-200 first:border-t-0 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {/* SR Number */}
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-blue-600 truncate">
                    {a.ticketId}
                  </div>
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
                <div
                  className={`text-[11px] font-medium text-center whitespace-nowrap ${
                    a.isOverdue
                      ? "text-red-600"
                      : a.isToday
                      ? "text-amber-600"
                      : "text-slate-500"
                  }`}
                >
                  {a.due}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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