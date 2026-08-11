import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";
// Adjust this import path to wherever TicketResponse actually lives
// (the file you pasted with getTicketByTicketId).
import type { TicketResponse } from "./get_ticket_by_id";

export interface GetTicketsResponse {
  code: string;
  message: string;
  data: TicketResponse[];
}

// TODO: swap in your real endpoint constant — this assumes something like
// ApiEndpoint.GET_TICKETS_BY_INSTITUTION(institutionId) exists on your
// ApiEndpoint object (same shape as GET_TICKET_BY_TICKETID).
export const getTicketsByInstitution = async (
  institutionId: number | string
): Promise<TicketResponse[]> => {
  const response = await get<GetTicketsResponse>(
    ApiEndpoint.GET_TICKETS_BY_INSTITUTION(institutionId)
  );
  return response.data;
};

// TODO: swap in your real "all tickets" endpoint constant.
// Used for Super-Admins, who aren't scoped to a single institution.
export const getAllTickets = async (): Promise<TicketResponse[]> => {
  const response = await get<GetTicketsResponse>(ApiEndpoint.GET_ALL_TICKETS);
  return response.data;
};