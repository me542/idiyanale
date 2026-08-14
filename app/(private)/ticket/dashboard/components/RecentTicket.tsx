"use client";

import { useEffect, useState } from "react";
import { TicketRow } from "./types";
import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";
import { lightTheme } from "@/shared/theme/theme_provider";

interface Props {
  tickets?: TicketRow[];
}

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

export default function MyTicket({ tickets = [] }: Props) {
  const [fetched, setFetched] = useState<TicketRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If tickets were passed from the parent, don't fetch.
    if (tickets.length > 0) {
      return;
    }

    let cancelled = false;

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

        if (cancelled) return;

        const mapped = apiRows.map(mapApiToRow);

        setFetched(mapped);
      } catch (err: any) {
        if (cancelled) return;

        setError(
          err?.message ||
            "Failed to load tickets. Check your network or authentication."
        );

        setFetched([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tickets]);

  const displayTickets =
    tickets.length > 0
      ? tickets
      : fetched ?? [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6">
      <div className="text-[15px] font-extrabold tracking-wide text-slate-800">
        RECENT TICKET
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
        <table className="w-full border-collapse text-[13px]">
          <thead>
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
              <tr key={`${t.sr}-${i}`}>
                <td className="pt-3 pb-3 pr-2 border-t border-slate-200 align-top">
                  <a
                    className="text-blue-600 font-semibold"
                    href="#"
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
      )}
    </div>
  );
}