"use client";
import { useEffect, useState } from "react";
import { getTickets } from "./../api/get_ticket"; 
import { mapTicketsToDueActivity } from "./dueativity";
import { DueActivityItem } from "./types";

export default function DueActivity() {
  const [activities, setActivities] = useState<DueActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const tickets = await getTickets();
        if (!cancelled) {
          setActivities(mapTicketsToDueActivity(tickets));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError("Couldn't load due activity.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const overdueCount = activities.filter((a) => a.isOverdue).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6 min-h-[280px] flex flex-col">
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
          !loading && activities.length === 0 ? "justify-center" : "justify-start"
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
            {activities.map((a) => (
              <div
                key={a.ticketId}
                className="group flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg border-t border-slate-200 first:border-t-0 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span
                  className={`shrink-0 w-2 h-2 rounded-full ${
                    a.isOverdue
                      ? "bg-red-500"
                      : a.isToday
                      ? "bg-amber-500"
                      : "bg-slate-300"
                  }`}
                />
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-slate-800 truncate">
                      {a.ticketId}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {a.title}
                    </div>
                  </div>
                <span
                  className={`text-[12px] font-medium whitespace-nowrap ${
                    a.isOverdue
                      ? "text-red-600"
                      : a.isToday
                      ? "text-amber-600"
                      : "text-slate-500"
                  }`}
                >
                  {a.due}
                </span>
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
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5B6B6C" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
      <div className="font-bold text-slate-800 text-sm">Nothing due</div>
      <div className="text-xs max-w-[220px] leading-relaxed">
        Upcoming deadlines and activities will appear here as they come up.
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-1.5 text-slate-500">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      <div className="font-bold text-slate-800 text-sm">{message}</div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-1 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1">
            <div className="h-3 bg-slate-200 rounded w-3/4 mb-1.5" />
            <div className="h-2 bg-slate-100 rounded w-1/4" />
          </div>
          <div className="h-3 bg-slate-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
}