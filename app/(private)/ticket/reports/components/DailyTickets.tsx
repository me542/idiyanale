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
  const padding = 24;

  useEffect(() => {
    let mounted = true;

    const fetchDailyTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get JWT token from localStorage
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Authentication token not found");
        }

        // Verify JWT and get institution_id
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

        // Get all tickets for the authenticated institution
        const tickets =
          await getAllTicketsByInstitution(institutionId);

        // Convert tickets into daily totals
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

  const max = hasData
    ? Math.max(...data.map((item) => item.value))
    : 0;

  const min = hasData
    ? Math.min(...data.map((item) => item.value))
    : 0;

  const range = max - min || 1;

  const points = hasData
    ? data.map((item, index) => {
        const x =
          padding +
          (index / Math.max(data.length - 1, 1)) *
            (width - padding * 2);

        const y =
          height -
          padding -
          ((item.value - min) / range) *
            (height - padding * 2);

        return {
          x,
          y,
        };
      })
    : [];

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

      {/* Chart */}
      {!loading && !error && hasData && (
        <div className="w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[220px] w-full"
            preserveAspectRatio="none"
          >
            {/* Y Axis */}
            <line
              x1={padding}
              y1={padding - 8}
              x2={padding}
              y2={height - padding}
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* X Axis */}
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding + 8}
              y2={height - padding}
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* Chart Line */}
            <polyline
              points={points
                .map((point) => `${point.x},${point.y}`)
                .join(" ")}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.75"
            />

            {/* Data Points */}
            {points.map((point, index) => (
              <circle
                key={`${data[index].label}-${index}`}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="#1e293b"
              />
            ))}

            {/* X Axis Labels */}
            {points.map((point, index) => (
              <text
                key={`label-${data[index].label}-${index}`}
                x={point.x}
                y={height - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {data[index].label}
              </text>
            ))}

            {/* Y Axis Maximum */}
            <text
              x={padding - 5}
              y={padding}
              textAnchor="end"
              fontSize="10"
              fill="#64748b"
            >
              {max}
            </text>

            {/* Y Axis Minimum */}
            <text
              x={padding - 5}
              y={height - padding}
              textAnchor="end"
              fontSize="10"
              fill="#64748b"
            >
              {min}
            </text>
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

    // Use YYYY-MM-DD as the internal grouping key.
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    const currentCount = grouped.get(dateKey) ?? 0;

    grouped.set(dateKey, currentCount + 1);
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
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value,
      };
    });
}