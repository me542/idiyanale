"use client";

import { useEffect, useState } from "react";
import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";
import { StatusCounts } from "./types";

const DEFAULT: StatusCounts = {
  total: 0,
  forReview: 0,
  inProgress: 0,
  resolved: 0,
  closed: 0,
  cancelled: 0,
};

// Adjust these according to your actual backend status values.
const STATUS_MAP: Record<
  string,
  keyof Omit<StatusCounts, "total">
> = {
  forreview: "forReview",
  forresolution: "forReview",
  forassignment: "forReview",
  forendorsement: "forReview",
  endorsed: "forReview",
  forapproval: "forReview",
  approved: "forReview",

  inprogress: "inProgress",

  resolved: "resolved",

  closed: "closed",

  cancelled: "cancelled",
  canceled: "cancelled",
};

function normalizeStatus(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getStatusCounts(
  tickets: InstitutionTicket[]
): StatusCounts {
  const counts: StatusCounts = {
    ...DEFAULT,
    total: tickets.length,
  };

  for (const ticket of tickets) {
    const key = STATUS_MAP[normalizeStatus(ticket.status)];

    if (key) {
      counts[key] += 1;
    }
  }

  return counts;
}

export default function StatusTickets() {
  const [data, setData] = useState<StatusCounts>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
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

        const tickets =
          await getAllTicketsByInstitution(institutionId);

        if (cancelled) return;

        setData(getStatusCounts(tickets));
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Failed to load institution tickets:",
            err
          );

          setData(DEFAULT);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    {
      label: "Total Ticket",
      value: data.total,
      color: "#4E86F0",
    },
    {
      label: "For Review",
      value: data.forReview,
      color: "#F0B429",
    },
    {
      label: "In Progress",
      value: data.inProgress,
      color: "#8B6BF0",
    },
    {
      label: "Resolved",
      value: data.resolved,
      color: "#2FBF87",
    },
    {
      label: "Closed",
      value: data.closed,
      color: "#8C97A0",
    },
    {
      label: "Cancelled",
      value: data.cancelled,
      color: "#E85C5C",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-xl shadow-md border border-slate-200 px-5 pt-[14px] pb-[22px] w-full"
          style={{
            borderTop: `4px solid ${item.color}`,
          }}
        >
          <div className="text-[12px] font-bold uppercase tracking-wide text-slate-700">
            {item.label}
          </div>

          <div className="mt-2 text-[34px] font-extrabold text-slate-900">
            {loading ? "…" : item.value}
          </div>
        </div>
      ))}
    </div>
  );
}