import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface TicketTypeResponse {
  ticket_type_id: number;
  institution_id: number;
  ticket_type_name: string;
  status: string;
}

export async function getTicketTypeById(
  ticketTypeId: string | number
): Promise<TicketTypeResponse> {
  return get<TicketTypeResponse>(
    ApiEndpoint.GET_TICKET_TYPE_BY_ID(ticketTypeId),
    { unwrap: true }
  );
}