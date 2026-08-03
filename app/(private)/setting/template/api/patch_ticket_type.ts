import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface EditTicketTypeRequest {
  ticket_type_name: string;
  status?: string;
}

export interface EditTicketTypeResponse {
  code: string;
  message: string;
}

export async function editTicketType(
  ticketTypeId: number | string,
  payload: EditTicketTypeRequest
): Promise<EditTicketTypeResponse> {
  return patch<EditTicketTypeResponse>(
    ApiEndpoint.PATCH_TICKET_TYPE(ticketTypeId),
    payload
  );
}