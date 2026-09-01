"use client";

import { useEffect, useState } from "react";

import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";

import { verifyJWT } from "@/lib/auth/verify-jwt";

export interface DailyTicketPoint {
  label: string;
  value: number;
}

interface DailyTicketsProps {
  data?: DailyTicketPoint[];
}

export default function DailyTickets({
  data: initialData = [],
}: DailyTicketsProps) {
  const [data, setData] =
    useState<DailyTicketPoint[]>(initialData);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const width = 760;
  const height = 220;

  const padding = {
    top: 20,
    right: 24,
    bottom: 32,
    left: 40,
  };

  useEffect(() => {
    let mounted = true;

    const fetchDailyTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const payload = await verifyJWT(token);

        if (!payload) {
          throw new Error("Invalid or expired token");
        }

        const institutionId = payload.institution_id;

        if (!institutionId) {
          throw new Error(
            "Institution ID not found in authentication token"
          );
        }

        const tickets =
          await getAllTicketsByInstitution(institutionId);

        const dailyData = groupTicketsByDay(tickets);

        if (mounted) {
          setData(dailyData);
        }
      } catch (err) {
        console.error(
          "Failed to fetch daily ticket data:",
          err
        );

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load ticket data"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDailyTickets();

    return () => {
      mounted = false;
    };
  }, []);

  const hasData = data.length > 0;

  const maxValue = hasData
    ? Math.max(...data.map((item) => item.value))
    : 0;

  // Give the chart a little headroom above the highest bar.
  const chartMax = Math.max(maxValue, 1);

  const chartWidth =
    width - padding.left - padding.right;

  const chartHeight =
    height - padding.top - padding.bottom;

  const barGap = 12;

  const barWidth = hasData
    ? Math.max(
        8,
        (chartWidth - barGap * (data.length - 1)) /
          data.length
      )
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">
        Daily Total Tickets
      </h3>

      <hr className="my-4 -mx-6 border-t border-slate-200" />

      {/* Loading */}
      {loading && (
        <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
          Loading ticket data...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex h-[220px] items-center justify-center text-sm text-red-500">
          {error}
        </div>
      )}

      {/* No Data */}
      {!loading && !error && !hasData && (
        <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
          No data
        </div>
      )}

      {/* Bar Chart */}
      {!loading && !error && hasData && (
        <div className="w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[220px] w-full"
            preserveAspectRatio="none"
          >
            {/* Y Axis */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={height - padding.bottom}
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* X Axis */}
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* Y Axis Maximum */}
            <text
              x={padding.left - 8}
              y={padding.top + 4}
              textAnchor="end"
              fontSize="10"
              fill="#64748b"
            >
              {maxValue}
            </text>

            {/* Y Axis Minimum */}
            <text
              x={padding.left - 8}
              y={height - padding.bottom + 4}
              textAnchor="end"
              fontSize="10"
              fill="#64748b"
            >
              0
            </text>

            {/* Bars */}
            {data.map((item, index) => {
              const barHeight =
                (item.value / chartMax) * chartHeight;

              const x =
                padding.left +
                index *
                  (barWidth + barGap);

              const y =
                height -
                padding.bottom -
                barHeight;

              return (
                <g
                  key={`${item.label}-${index}`}
                >
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    fill="#1e293b"
                  />

                  {/* Value */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#475569"
                  >
                    {item.value}
                  </text>

                  {/* X Axis Label */}
                  <text
                    x={x + barWidth / 2}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * Groups tickets according to their created_at date.
 *
 * Example:
 *
 * 2026-08-27 -> 5 tickets
 * 2026-08-28 -> 8 tickets
 * 2026-08-29 -> 3 tickets
 *
 * Result:
 *
 * [
 *   { label: "Aug 27", value: 5 },
 *   { label: "Aug 28", value: 8 },
 *   { label: "Aug 29", value: 3 }
 * ]
 */
function groupTicketsByDay(
  tickets: InstitutionTicket[]
): DailyTicketPoint[] {
  const grouped = new Map<string, number>();

  tickets.forEach((ticket) => {
    if (!ticket.created_at) {
      return;
    }

    const date = new Date(ticket.created_at);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    const currentCount =
      grouped.get(dateKey) ?? 0;

    grouped.set(
      dateKey,
      currentCount + 1
    );
  });

  return Array.from(grouped.entries())
    .sort(([dateA], [dateB]) =>
      dateA.localeCompare(dateB)
    )
    .map(([dateKey, value]) => {
      const [year, month, day] = dateKey
        .split("-")
        .map(Number);

      const date = new Date(
        year,
        month - 1,
        day
      );

      return {
        label: date.toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          }
        ),
        value,
      };
    });
}