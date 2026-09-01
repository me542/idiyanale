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

  // Only tickets that actually have a resolver assigned to them.
  // Anything without a resolver_id (unassigned / not yet grabbed) is
  // excluded from the resolver leaderboard and its ticket list entirely.
  const assignedTickets = useMemo(
    () => tickets.filter((t) => t.resolver_id != null && t.resolver_id !== 0),
    [tickets]
  );

  const resolverRanking = useMemo(
    () => rankByField(assignedTickets, "resolver_id", "resolver"),
    [assignedTickets]
  );

  const ticketsByResolver = useMemo(
    () => groupTicketsByUser(assignedTickets, "resolver_id"),
    [assignedTickets]
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
      </div>

      {/* ─── Two-column layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">

        {/* ── LEFT: All Submitters ── */}
        <section>
          {submitterRanking.length === 0 ? (
            <EmptyCard message="No submitted tickets yet." />
          ) : (
            <FullTable
              title="ALL SUBMITTERS"
              data={submitterRanking}
              accentColor="#F59E0B"
            />
          )}
        </section>

        {/* ── RIGHT: Top 5 Submitters + All Resolvers ── */}
        <div className="space-y-6">

          {/* Top 5 Submitters */}
          <section>
            {topSubmitters.length === 0 ? (
              <>
                <h2 className="text-[15px] font-extrabold text-slate-800 tracking-wide mb-4 flex items-center gap-2">
                  <TrophyIcon color="#F59E0B" />
                  TOP 5 SUBMITTERS
                </h2>
                <EmptyCard message="No submitted tickets yet." />
              </>
            ) : (
              <FullTable
                title="TOP 5 SUBMITTERS"
                icon={<TrophyIcon color="#F59E0B" />}
                data={topSubmitters}
                accentColor="#F59E0B"
              />
            )}
          </section>

          {/* All Resolvers */}
          <section>
            {resolverRanking.length === 0 ? (
              <>
                <h2 className="text-[15px] font-extrabold text-slate-800 tracking-wide mb-4 flex items-center gap-2">
                  <CheckIcon color="#10B981" />
                  ALL RESOLVERS
                </h2>
                <EmptyCard message="No resolved tickets yet." />
              </>
            ) : (
              <ResolverTable
                title="ALL RESOLVERS"
                icon={<CheckIcon color="#10B981" />}
                data={resolverRanking}
                accentColor="#10B981"
                ticketsByResolver={ticketsByResolver}
              />
            )}
          </section>

        </div>
      </div>
    </main>
  );
}

/* ─── Icons ─── */

function TrophyIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/* ─── Sub-components ─── */

/** Shared card+table shell, matching the "Ranking" look. Used for
 *  All Submitters and Top 5 Submitters. */
function FullTable({
  data,
  accentColor,
  title,
  icon,
}: {
  data: RankedUser[];
  accentColor: string;
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
      <div
        className="px-6 py-4 flex items-center gap-2"
        style={{ borderTop: `4px solid ${accentColor}` }}
      >
        {icon}
        <div className="text-[14px] font-extrabold tracking-wide text-slate-800">
          {title}
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

/** Same card+table shell as FullTable, but each row expands to show
 *  that resolver's tickets. Used for All Resolvers.
 *  Only receives pre-filtered "assigned" tickets, so unassigned /
 *  ungrabbed tickets never appear here or in a resolver's expanded list. */
function ResolverTable({
  data,
  accentColor,
  title,
  icon,
  ticketsByResolver,
}: {
  data: RankedUser[];
  accentColor: string;
  title: string;
  icon?: React.ReactNode;
  ticketsByResolver: Map<number, InstitutionTicket[]>;
}) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
      <div
        className="px-6 py-4 flex items-center gap-2"
        style={{ borderTop: `4px solid ${accentColor}` }}
      >
        {icon}
        <div className="text-[14px] font-extrabold tracking-wide text-slate-800">
          {title}
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
              const isOpen = openId === user.id;
              const userTickets = ticketsByResolver.get(user.id) ?? [];

              return (
                <>
                  <tr
                    key={user.id}
                    onClick={() => setOpenId(isOpen ? null : user.id)}
                    className="border-t border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
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
                    <td className="py-2.5 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        {user.name}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#94A3B8"
                          strokeWidth="2.5"
                          className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-600">{user.count}</td>
                  </tr>

                  {isOpen && (
                    <tr key={`${user.id}-detail`} className="bg-slate-50/50">
                      <td colSpan={3} className="px-0 py-3">
                        {userTickets.length === 0 ? (
                          <div className="text-sm text-slate-400 py-3 text-center">
                            No tickets.
                          </div>
                        ) : (
                          <div className="max-h-[260px] overflow-y-auto">
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
                                {userTickets.map((t) => {
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
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6">
            <div className="h-4 bg-slate-200 rounded w-40 mb-4" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-7 h-7 bg-slate-200 rounded-full" />
                <div className="flex-1 h-3 bg-slate-200 rounded" />
                <div className="h-3 bg-slate-200 rounded w-6" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6">
            <div className="h-4 bg-slate-200 rounded w-32 mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-7 h-7 bg-slate-200 rounded-full" />
                <div className="flex-1 h-3 bg-slate-200 rounded" />
                <div className="h-3 bg-slate-200 rounded w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}