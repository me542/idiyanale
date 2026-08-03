import { TicketResponse } from "./../api/get_ticket"; 
import { DueActivityItem } from "./types";

const CLOSED_STATUSES = ["resolved", "closed", "cancelled"];



function formatDueLabel(dueDate: Date, now: Date): { label: string; isOverdue: boolean; isToday: boolean } {
  const msPerDay = 1000 * 60 * 60 * 24;
  const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / msPerDay);

  if (diffDays === 0) return { label: "Due today", isOverdue: false, isToday: true };
  if (diffDays === 1) return { label: "Due tomorrow", isOverdue: false, isToday: false };
  if (diffDays > 1) return { label: `Due in ${diffDays} days`, isOverdue: false, isToday: false };

  const overdueDays = Math.abs(diffDays);
  return {
    label: overdueDays === 1 ? "Overdue by 1 day" : `Overdue by ${overdueDays} days`,
    isOverdue: true,
    isToday: false,
  };
}

function formatCreatedLabel(createdDate: Date): string {
  return `Created ${createdDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function mapTicketsToDueActivity(
  tickets: TicketResponse[],
  limit = 6
): DueActivityItem[] {
  const now = new Date();

  return tickets
    .filter((t) => t.due_date && !CLOSED_STATUSES.includes(t.status?.toLowerCase()))
    .map((t) => {
      const dueDate = new Date(t.due_date);
      const createdDate = new Date(t.created_at);
      const { label, isOverdue, isToday } = formatDueLabel(dueDate, now);
      return {
        ticketId: t.ticket_id,
        title: t.subject,
        due: label,
        createdLabel: formatCreatedLabel(createdDate),
        status: t.status,
        isOverdue,
        isToday,
        _sortDate: dueDate.getTime(),
      };
    })
    .sort((a, b) => a._sortDate - b._sortDate)
    .slice(0, limit)
    .map(({ _sortDate, ...item }) => item);
}