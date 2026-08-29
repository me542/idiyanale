import { InstitutionTicket } from "@/services/integration/ticket/get_all_ticket_by_insti";
import { DueActivityItem } from "./types";

function normalizeStatus(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function mapTicketsToDueActivity(
  tickets: InstitutionTicket[]
): DueActivityItem[] {
  const now = new Date();

  const completedStatuses = new Set([
    "resolved",
    "closed",
    "cancel",
    "canceled",
  ]);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  return tickets
    // Don't display completed/cancel tickets
    .filter((ticket) => {
      const status = normalizeStatus(ticket.status);

      return !completedStatuses.has(status);
    })

    // Only display tickets that have a due date
    .filter((ticket) => ticket.due_date)

    .map((ticket) => {
      const dueDate = new Date(ticket.due_date!);

      const isOverdue = dueDate < startOfToday;

      const isToday =
        dueDate >= startOfToday &&
        dueDate <= endOfToday;

      return {
        ticketId: ticket.ticket_id,
        title: ticket.subject,

        // IMPORTANT:
        // This comes directly from your API's created_at
        dateCreated: formatDate(ticket.created_at),

        // This comes from your API's due_date
        due: formatDate(ticket.due_date),

        status: ticket.status,

        isOverdue,
        isToday,
      };
    })
    .sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) {
        return a.isOverdue ? -1 : 1;
      }

      return 0;
    });
}