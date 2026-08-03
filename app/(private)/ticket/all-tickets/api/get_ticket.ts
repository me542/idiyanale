import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface TicketResponse {
  id: number;
  ticket_id: string;
  subject: string;
  description: string;
  status: string;

  due_date: string;
  created_at: string;
  updated_at: string;

  submitter_id: number;
  resolver_id: number;

  Submitter?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
  };

  Resolver?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
  };
}

export async function getTickets(): Promise<TicketResponse[]> {
  return get<TicketResponse[]>(ApiEndpoint.GET_ALL_TICKET, {
    unwrap: true,
  });
}