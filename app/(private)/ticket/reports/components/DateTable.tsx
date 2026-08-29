"use client";

import { useEffect, useState } from "react";
import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";
import { verifyJWT } from "@/lib/auth/verify-jwt";

export interface DateRow {
  date: string;
  total: number;
  resolved: number;
  forReview: number;
  closed: number;
  cancel: number;
}

interface DateTableProps {
  rows?: DateRow[];
}

export default function DateTable({
  rows: initialRows = [],
}: DateTableProps) {
  const [rows, setRows] = useState<DateRow[]>(initialRows);
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

        const tickets = await getAllTicketsByInstitution(
          payload.institution_id
        );

        setRows(groupTicketsByMonth(tickets));
      } catch (error) {
        console.error("Failed to load ticket data:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Monthly Ticket Summary
        </h3>
      </div>

      <hr className="my-4 -mx-6 border-t border-slate-200" />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-4 py-3 font-medium">
                Month
              </th>

              <th className="px-4 py-3 text-center font-medium">
                Total
              </th>

              <th className="px-4 py-3 text-center font-medium">
                Resolved
              </th>

              <th className="px-4 py-3 text-center font-medium">
                For Review
              </th>

              <th className="px-4 py-3 text-center font-medium">
                Closed
              </th>

              <th className="px-4 py-3 text-center font-medium">
                cancel
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Loading...
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.date}
                  className="border-b border-slate-100 text-slate-700 hover:bg-slate-50"
                >
                  <td className="px-4 py-4 font-semibold text-slate-800">
                    {row.date}
                  </td>

                  <td className="px-4 py-4 text-center font-semibold">
                    {row.total}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {row.resolved}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {row.forReview}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {row.closed}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {row.cancel}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function groupTicketsByMonth(
  tickets: InstitutionTicket[]
): DateRow[] {
  const grouped: Record<string, DateRow> = {};

  tickets.forEach((ticket) => {
    const date = new Date(ticket.created_at);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const year = date.getFullYear();
    const month = date.getMonth();

    const key = `${year}-${String(month + 1).padStart(2, "0")}`;

    if (!grouped[key]) {
      grouped[key] = {
        date: date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        total: 0,
        resolved: 0,
        forReview: 0,
        closed: 0,
        cancel: 0,
      };
    }

    grouped[key].total += 1;

    const status = (ticket.status || "")
      .trim()
      .toLowerCase();

    if (status === "resolved") {
      grouped[key].resolved += 1;
    } else if (
      status === "for review" ||
      status === "for_review" ||
      status === "review"
    ) {
      grouped[key].forReview += 1;
    } else if (status === "closed") {
      grouped[key].closed += 1;
    } else if (
      status === "cancel" ||
      status === "canceled"
    ) {
      grouped[key].cancel += 1;
    }
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, value]) => value);
}