import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export type TicketProcessAction =
  | "endorse"
  | "approve"
  | "grab"
  | "ungrab"
  | "resolve"
  | "close"
  | "cancel";

export interface ProcessTicketRequest {
  action: TicketProcessAction;
  reason?: string;
  resolution?: string;
}

export interface ProcessTicketResponse {
  code: string;
  message: string;
  data?: unknown;
}

export async function processTicket(
  ticketId: string | number,
  data: ProcessTicketRequest
): Promise<ProcessTicketResponse> {
  return post<ProcessTicketResponse>(
    ApiEndpoint.POST_PROCESS_TICKET(ticketId),
    data
  );
}