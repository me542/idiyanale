import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

// Matches the TicketRemark model from the backend (ticketremark table)
export interface TicketRemark {
  remark_id: string;
  ticket_id: string;
  user_id: number;
  remark_type: string;
  message: string;
  created_at: string;
}

export async function getTicketRemarks(
  ticketId: string | number
): Promise<TicketRemark[]> {
  return get<TicketRemark[]>(
    ApiEndpoint.GET_TICKET_REMARKS(ticketId),
    {
      unwrap: true,
    }
  );
}
