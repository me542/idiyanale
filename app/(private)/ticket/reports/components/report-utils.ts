// lib/ticket-report-utils.ts
import { InstitutionTicket } from "@/services/integration/ticket/get_all_ticket_by_insti";
import { CategoryRow } from "./CategoryTable";
import { DateRow } from "./DateTable";
import { DailyTicketPoint } from "./DailyTickets";
import { SliData } from "./Sli";

// ---- Date range filter ----
export function filterTicketsByDateRange(
  tickets: InstitutionTicket[],
  from?: string, // "YYYY-MM-DD"
  to?: string     // "YYYY-MM-DD"
): InstitutionTicket[] {
  if (!from && !to) return tickets;

  const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
  const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity;

  return tickets.filter((ticket) => {
    if (!ticket.created_at) return false;
    const created = new Date(ticket.created_at).getTime();
    if (Number.isNaN(created)) return false;
    return created >= fromTime && created <= toTime;
  });
}

// ---- Daily bar chart ----
export function groupTicketsByDay(tickets: InstitutionTicket[]): DailyTicketPoint[] {
  const grouped = new Map<string, number>();

  tickets.forEach((ticket) => {
    if (!ticket.created_at) return;
    const date = new Date(ticket.created_at);
    if (Number.isNaN(date.getTime())) return;

    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    grouped.set(dateKey, (grouped.get(dateKey) ?? 0) + 1);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, value]) => {
      const [year, month, day] = dateKey.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return {
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value,
      };
    });
}

// ---- Monthly summary table ----
export function groupTicketsByMonth(tickets: InstitutionTicket[]): DateRow[] {
  const grouped: Record<string, DateRow> = {};

  tickets.forEach((ticket) => {
    const date = new Date(ticket.created_at);
    if (Number.isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!grouped[key]) {
      grouped[key] = {
        date: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        total: 0,
        resolved: 0,
        forReview: 0,
        closed: 0,
        cancel: 0,
      };
    }

    grouped[key].total += 1;
    const status = (ticket.status || "").trim().toLowerCase();

    if (status === "resolved") grouped[key].resolved += 1;
    else if (["for review", "for_review", "review"].includes(status)) grouped[key].forReview += 1;
    else if (status === "closed") grouped[key].closed += 1;
    else if (["cancel", "canceled"].includes(status)) grouped[key].cancel += 1;
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, value]) => value);
}

// ---- Category / subcategory table ----
export function groupTicketsByCategory(tickets: InstitutionTicket[]): CategoryRow[] {
  const categories: Record<
    string,
    {
      count: number;
      totalTime: number;
      timeCount: number;
      children: Record<string, { count: number; totalTime: number; timeCount: number }>;
    }
  > = {};

  tickets.forEach((ticket) => {
    const categoryName = ticket.category?.category_name || "Uncategorized";
    const subcategoryName = ticket.subcategory?.sub_category_name || "Uncategorized";

    if (!categories[categoryName]) {
      categories[categoryName] = { count: 0, totalTime: 0, timeCount: 0, children: {} };
    }
    const category = categories[categoryName];
    category.count += 1;

    const resolutionTime = getResolutionTimeMinutes(ticket);
    if (resolutionTime !== null) {
      category.totalTime += resolutionTime;
      category.timeCount += 1;
    }

    if (!category.children[subcategoryName]) {
      category.children[subcategoryName] = { count: 0, totalTime: 0, timeCount: 0 };
    }
    const subcategory = category.children[subcategoryName];
    subcategory.count += 1;
    if (resolutionTime !== null) {
      subcategory.totalTime += resolutionTime;
      subcategory.timeCount += 1;
    }
  });

  return Object.entries(categories)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([name, category]) => ({
      name,
      count: category.count,
      avgTimeMin: category.timeCount > 0 ? category.totalTime / category.timeCount : 0,
      children: Object.entries(category.children)
        .sort(([, a], [, b]) => b.count - a.count)
        .map(([childName, child]) => ({
          name: childName,
          count: child.count,
          avgTimeMin: child.timeCount > 0 ? child.totalTime / child.timeCount : 0,
        })),
    }));
}

// ---- SLI stat cards ----
export function calculateSli(tickets: InstitutionTicket[]): SliData {
  const totalTicket = tickets.length;
  if (totalTicket === 0) {
    return { totalTicket: 0, aveRequestPerDay: 0, completionRate: 0, avgResolutionTimeMin: 0 };
  }

  let completedTickets = 0;
  let excludedTickets = 0;
  let totalResolutionTime = 0;
  let resolutionTimeCount = 0;
  const dates = new Set<string>();

  tickets.forEach((ticket) => {
    const status = (ticket.status || "").trim().toLowerCase();

    if (ticket.created_at) {
      const date = new Date(ticket.created_at);
      if (!Number.isNaN(date.getTime())) dates.add(date.toISOString().split("T")[0]);
    }

    if (status === "resolved" || status === "closed") completedTickets++;
    if (["cancel", "canceled", "rejected", "reject"].includes(status)) excludedTickets++;

    if (ticket.started_at && ticket.resolved_at) {
      const started = new Date(ticket.started_at).getTime();
      const resolved = new Date(ticket.resolved_at).getTime();
      if (!Number.isNaN(started) && !Number.isNaN(resolved) && resolved >= started) {
        totalResolutionTime += (resolved - started) / 60000;
        resolutionTimeCount++;
      }
    }
  });

  const applicableTickets = totalTicket - excludedTickets;
  const completionRate = applicableTickets > 0 ? (completedTickets / applicableTickets) * 100 : 0;
  const aveRequestPerDay = dates.size > 0 ? totalTicket / dates.size : 0;
  const avgResolutionTimeMin =
    resolutionTimeCount > 0 ? totalResolutionTime / resolutionTimeCount : 0;

  return { totalTicket, aveRequestPerDay, completionRate, avgResolutionTimeMin };
}

function getResolutionTimeMinutes(ticket: InstitutionTicket): number | null {
  if (!ticket.started_at || !ticket.resolved_at) return null;
  const started = new Date(ticket.started_at).getTime();
  const resolved = new Date(ticket.resolved_at).getTime();
  if (Number.isNaN(started) || Number.isNaN(resolved)) return null;
  const difference = resolved - started;
  if (difference < 0) return null;
  return difference / 60000;
}