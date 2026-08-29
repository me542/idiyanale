"use client";

import { useEffect, useState } from "react";
import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";
import { verifyJWT } from "@/lib/auth/verify-jwt";

export interface SliData {
  totalTicket: number;
  aveRequestPerDay: number;
  completionRate: number;
  avgResolutionTimeMin: number;
}

interface SliProps {
  data?: SliData;
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-2xl font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

export default function Sli({
  data: initialData,
}: SliProps) {
  const [data, setData] = useState<SliData | undefined>(
    initialData
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Token not found");
        }

        const payload = await verifyJWT(token);

        if (!payload?.institution_id) {
          throw new Error("Institution ID not found");
        }

        const tickets =
          await getAllTicketsByInstitution(
            payload.institution_id
          );

        setData(calculateSli(tickets));
      } catch (error) {
        console.error(
          "Failed to load SLI data:",
          error
        );

        setData(undefined);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Ticket" value="..." />
        <StatCard
          label="Ave Request / Day"
          value="..."
        />
        <StatCard
          label="Completion Rate"
          value="..."
        />
        <StatCard
          label="Avg Resolution Time"
          value="..."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        label="Total Ticket"
        value={
          data
            ? `${data.totalTicket}`
            : "-"
        }
      />

      <StatCard
        label="Ave Request / Day"
        value={
          data
            ? `${data.aveRequestPerDay}`
            : "-"
        }
      />

      <StatCard
        label="Completion Rate"
        value={
          data
            ? `${data.completionRate.toFixed(1)} %`
            : "-"
        }
      />

      <StatCard
        label="Avg Resolution Time"
        value={
          data
            ? `${data.avgResolutionTimeMin.toFixed(
                1
              )} min`
            : "-"
        }
      />
    </div>
  );
}

function calculateSli(
  tickets: InstitutionTicket[]
): SliData {
  const totalTicket = tickets.length;

  if (totalTicket === 0) {
    return {
      totalTicket: 0,
      aveRequestPerDay: 0,
      completionRate: 0,
      avgResolutionTimeMin: 0,
    };
  }

  let completedTickets = 0;
  let excludedTickets = 0;
  let totalResolutionTime = 0;
  let resolutionTimeCount = 0;

  const dates = new Set<string>();

  tickets.forEach((ticket) => {
    const status = (ticket.status || "")
      .trim()
      .toLowerCase();

    /*
     * Count unique request days.
     */
    if (ticket.created_at) {
      const date = new Date(
        ticket.created_at
      );

      if (!Number.isNaN(date.getTime())) {
        dates.add(
          date.toISOString().split("T")[0]
        );
      }
    }

    /*
     * Resolved and Closed are completed.
     */
    if (
      status === "resolved" ||
      status === "closed"
    ) {
      completedTickets++;
    }

    /*
     * cancel and Rejected are excluded
     * from the completion-rate calculation.
     */
    if (
      status === "cancel" ||
      status === "canceled" ||
      status === "rejected" ||
      status === "reject"
    ) {
      excludedTickets++;
    }

    /*
     * Calculate resolution time.
     */
    if (
      ticket.started_at &&
      ticket.resolved_at
    ) {
      const started = new Date(
        ticket.started_at
      ).getTime();

      const resolved = new Date(
        ticket.resolved_at
      ).getTime();

      if (
        !Number.isNaN(started) &&
        !Number.isNaN(resolved) &&
        resolved >= started
      ) {
        totalResolutionTime +=
          (resolved - started) / 60000;

        resolutionTimeCount++;
      }
    }
  });

  /*
   * Remove cancel/rejected tickets
   * from the completion-rate denominator.
   *
   * Example:
   *
   * Total = 5
   * cancel = 0
   * Rejected = 0
   * Completed = 4
   *
   * 4 / 5 * 100 = 80%
   */
  const applicableTickets =
    totalTicket - excludedTickets;

  const completionRate =
    applicableTickets > 0
      ? (completedTickets /
          applicableTickets) *
        100
      : 0;

  /*
   * Average requests per day.
   */
  const aveRequestPerDay =
    dates.size > 0
      ? totalTicket / dates.size
      : 0;

  /*
   * Average resolution time.
   */
  const avgResolutionTimeMin =
    resolutionTimeCount > 0
      ? totalResolutionTime /
        resolutionTimeCount
      : 0;

  return {
    totalTicket,
    aveRequestPerDay,
    completionRate,
    avgResolutionTimeMin,
  };
}