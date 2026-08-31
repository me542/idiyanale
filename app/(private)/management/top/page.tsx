"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getAllTicketsByInstitution,
  InstitutionTicket,
  TicketUser,
} from "@/services/integration/ticket/get_all_ticket_by_insti";

/* ─── helpers ─── */

function getUserName(user: TicketUser | null, fallback: string): string {
  if (!user) return fallback;
  if (user.first_name && user.last_name)
    return `${user.first_name} ${user.last_name}`;
  if (user.first_name) return user.first_name;
  if (user.last_name) return user.last_name;
  if (user.staff_id) return user.staff_id;
  if (user.email) return user.email;
  return fallback;
}

interface RankedUser {
  id: number;
  name: string;
  count: number;
}

function rankByField(
  tickets: InstitutionTicket[],
  field: "submitter_id" | "resolver_id",
  userField: "submitter" | "resolver"
): RankedUser[] {
  const map = new Map<number, { name: string; count: number }>();

  for (const t of tickets) {
    const id = t[field];
    if (id == null) continue;

    const user = t[userField];
    const name = getUserName(user, `ID: ${id}`);

    const existing = map.get(id);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(id, { name, count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([id, { name, count }]) => ({ id, name, count }))
    .sort((a, b) => b.count - a.count);
}

function groupTicketsByUser(
  tickets: InstitutionTicket[],
  field: "submitter_id" | "resolver_id"
): Map<number, InstitutionTicket[]> {
  const map = new Map<number, InstitutionTicket[]>();
  for (const t of tickets) {
    const id = t[field];
    if (id == null) continue;
    const list = map.get(id);
    if (list) list.push(t);
    else map.set(id, [t]);
  }
  return map;
}

const MEDAL_COLORS: Record<number, string> = {
  0: "#FFD700",
  1: "#C0C0C0",
  2: "#CD7F32",
};

function getStatusBadge(status: string) {
  const s = status.toLowerCase().trim();
  if (s === "in progress") return { bg: "#A78BFA", text: "In Progress" };
  if (s === "resolved") return { bg: "#34D399", text: "Resolved" };
  if (s === "closed") return { bg: "#9CA3AF", text: "Closed" };
  if (s === "cancel" || s === "canceled") return { bg: "#FFA1A1", text: "Cancel" };
  if (
    s === "for review" ||
    s === "for endorsement" ||
    s === "endorsed" ||
    s === "for approval" ||
    s === "approved" ||
    s === "for assignment"
  )
    return { bg: "#FBBF24", text: status };
  return { bg: "#C3C3C3", text: status };
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ─── page ─── */

export default function TopPage() {
  const [tickets, setTickets] = useState<InstitutionTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const storedId = localStorage.getItem("institution_id");
        if (!storedId) throw new Error("Institution ID not found.");
        const institutionId = Number(storedId);
        if (!Number.isInteger(institutionId) || institutionId <= 0)
          throw new Error("Invalid institution ID.");
        const data = await getAllTicketsByInstitution(institutionId);
        if (!cancel) setTickets(data);
      } catch (err) {
        if (!cancel)
          setError(err instanceof Error ? err.message : "Failed to load tickets.");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => { cancel = true; };
  }, []);

  const submitterRanking = useMemo(
    () => rankByField(tickets, "submitter_id", "submitter"),
    [tickets]
  );
  const resolverRanking = useMemo(
    () => rankByField(tickets, "resolver_id", "resolver"),
    [tickets]
  );

  const ticketsByResolver = useMemo(
    () => groupTicketsByUser(tickets, "resolver_id"),
    [tickets]
  );

  const topSubmitters = submitterRanking.slice(0, 5);

  if (loading) {
    return (
      <main className="p-6">
        <SkeletonCards />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <div className="bg-white border border-red-200 rounded-xl shadow-md p-8 text-center text-red-600">
          <div className="font-bold mb-1">Error loading data</div>
          <div className="text-sm">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-wide">
          Leaderboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit rankings and resolver leaderboard with ticket details.
        </p>
      </div>

      {/* ─── Two-column layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">

        {/* ── LEFT: All Submitters ── */}
        <section>
          <h2 className="text-[15px] font-extrabold text-slate-800 tracking-wide mb-4">
            ALL SUBMITTERS
          </h2>
          {submitterRanking.length === 0 ? (
            <EmptyCard message="No submitted tickets yet." />
          ) : (
            <FullTable
              data={submitterRanking}
              accentColor="#F59E0B"
            />
          )}
        </section>

        {/* ── RIGHT: Top 5 Submitters + All Resolvers ── */}
        <div className="space-y-6">

          {/* Top 5 Submitters */}
          <section>
            <h2 className="text-[15px] font-extrabold text-slate-800 tracking-wide mb-4 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              TOP 5 SUBMITTERS
            </h2>
            {topSubmitters.length === 0 ? (
              <EmptyCard message="No submitted tickets yet." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                {topSubmitters.map((user, idx) => (
                  <TopCard key={user.id} rank={idx + 1} user={user} accent="#F59E0B" />
                ))}
              </div>
            )}
          </section>

          {/* All Resolvers */}
          <section>
            <h2 className="text-[15px] font-extrabold text-slate-800 tracking-wide mb-4 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              ALL RESOLVERS
            </h2>
            {resolverRanking.length === 0 ? (
              <EmptyCard message="No resolved tickets yet." />
            ) : (
              <div className="space-y-3">
                {resolverRanking.map((user, idx) => {
                  const userTickets = ticketsByResolver.get(user.id) ?? [];
                  return (
                    <ResolverRow
                      key={user.id}
                      rank={idx + 1}
                      user={user}
                      tickets={userTickets}
                    />
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}

/* ─── Sub-components ─── */

function TopCard({
  rank,
  user,
  accent,
}: {
  rank: number;
  user: RankedUser;
  accent: string;
}) {
  const medal = MEDAL_COLORS[rank - 1];

  return (
    <div
      className="bg-white border rounded-xl shadow-md p-5 text-center transition-shadow hover:shadow-lg"
      style={{
        borderTop: `4px solid ${medal ?? accent}`,
        borderColor: medal ? undefined : "#E5E7EB",
      }}
    >
      {/* Rank badge */}
      <div
        className="mx-auto w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-extrabold mb-3"
        style={
          medal
            ? {
                backgroundColor: medal,
                color: rank === 1 ? "#7C5E00" : rank === 2 ? "#555" : "#6B3A00",
              }
            : { backgroundColor: "#E5E7EB", color: "#6B7280" }
        }
      >
        {rank}
      </div>

      <div className="text-[14px] font-bold text-slate-800 truncate mb-1">
        {user.name}
      </div>

      <div className="text-[22px] font-extrabold" style={{ color: accent }}>
        {user.count}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
        {user.count === 1 ? "ticket" : "tickets"}
      </div>
    </div>
  );
}

function FullTable({ data, accentColor }: { data: RankedUser[]; accentColor: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-4" style={{ borderTop: `4px solid ${accentColor}` }}>
        <div className="text-[14px] font-extrabold tracking-wide text-slate-800">
          RANKING
        </div>
      </div>
      <hr className="border-t border-slate-100" />
      <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-slate-500 text-[11px] uppercase tracking-wide">
              <th className="pb-2 w-10">#</th>
              <th className="pb-2">Name</th>
              <th className="pb-2 text-right">Tickets</th>
            </tr>
          </thead>
          <tbody>
            {data.map((user, idx) => {
              const medal = MEDAL_COLORS[idx];
              return (
                <tr
                  key={user.id}
                  className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2.5">
                    {medal ? (
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
                        style={{
                          backgroundColor: medal,
                          color: idx === 0 ? "#7C5E00" : idx === 1 ? "#555" : "#6B3A00",
                        }}
                      >
                        {idx + 1}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">{idx + 1}</span>
                    )}
                  </td>
                  <td className="py-2.5 font-medium text-slate-800">{user.name}</td>
                  <td className="py-2.5 text-right font-bold text-slate-600">{user.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResolverRow({
  rank,
  user,
  tickets,
}: {
  rank: number;
  user: RankedUser;
  tickets: InstitutionTicket[];
}) {
  const [open, setOpen] = useState(false);
  const medal = MEDAL_COLORS[rank - 1];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
      {/* Header row — clickable */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
        style={{ borderLeft: `4px solid ${medal ?? "#10B981"}` }}
      >
        {/* Rank */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-extrabold"
          style={
            medal
              ? {
                  backgroundColor: medal,
                  color: rank === 1 ? "#7C5E00" : rank === 2 ? "#555" : "#6B3A00",
                }
              : { backgroundColor: "#E5E7EB", color: "#6B7280" }
          }
        >
          {rank}
        </div>

        {/* Name & count */}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-slate-800 truncate">
            {user.name}
          </div>
          <div className="text-[11px] text-slate-400">
            {user.count} {user.count === 1 ? "ticket" : "tickets"} resolved
          </div>
        </div>

        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="2"
          className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded ticket list */}
      {open && (
        <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50">
          {tickets.length === 0 ? (
            <div className="text-sm text-slate-400 py-3 text-center">No tickets.</div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-sm">
                  <tr className="text-left text-slate-500 text-[10px] uppercase tracking-wide">
                    <th className="pb-1.5 pr-3">SR #</th>
                    <th className="pb-1.5 pr-3">Subject</th>
                    <th className="pb-1.5 pr-3">Status</th>
                    <th className="pb-1.5 pr-3">Created</th>
                    <th className="pb-1.5">Resolved</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const badge = getStatusBadge(t.status);
                    return (
                      <tr
                        key={t.id}
                        className="border-t border-slate-200/60 hover:bg-white transition-colors"
                      >
                        <td className="py-2 pr-3 font-semibold text-blue-600">
                          {t.ticket_id}
                        </td>
                        <td className="py-2 pr-3 text-slate-700 max-w-[200px] truncate">
                          {t.subject}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap"
                            style={{ backgroundColor: badge.bg }}
                          >
                            {badge.text}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">
                          {formatDate(t.created_at)}
                        </td>
                        <td className="py-2 text-slate-500 whitespace-nowrap">
                          {formatDate(t.resolved_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md p-8 text-center text-slate-400 text-sm">
      {message}
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-56" />
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
        {/* Left skeleton */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6">
          <div className="h-4 bg-slate-200 rounded w-32 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-7 h-7 bg-slate-200 rounded-full" />
              <div className="flex-1 h-3 bg-slate-200 rounded" />
              <div className="h-3 bg-slate-200 rounded w-6" />
            </div>
          ))}
        </div>
        {/* Right skeleton */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl shadow-md p-5">
                <div className="w-10 h-10 bg-slate-200 rounded-full mx-auto mb-3" />
                <div className="h-3 bg-slate-200 rounded w-20 mx-auto mb-2" />
                <div className="h-5 bg-slate-200 rounded w-8 mx-auto" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded w-28 mb-1.5" />
                    <div className="h-2 bg-slate-100 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
