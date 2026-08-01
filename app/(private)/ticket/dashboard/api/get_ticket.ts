// services/api/get_ticket.ts

import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export type TicketResponse = {
  ticket_id: number;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at?: string;

  // Requestor
  requestor_id?: number;
  requestor_name?: string;
  requestor_email?: string;

  // Assignee
  assigned_to?: number;
  assigned_name?: string;

  // Institution
  institution_id?: number;
  institution_name?: string;
};

export async function getTickets(): Promise<TicketResponse[]> {
  return get<TicketResponse[]>(ApiEndpoint.GET_ALL_TICKET, {
    unwrap: true,
  });
}