import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface EditTicketTypeRequest {
  ticket_type_name: string;
  status: string;
}

export interface EditTicketTypeResponse {
  message?: string;
  ret_code?: string;
}

export const editTicketType = async (
  ticketTypeId: number | string,
  data: EditTicketTypeRequest
): Promise<EditTicketTypeResponse> => {
  return patch(
    ApiEndpoint.PATCH_TICKET_TYPE(ticketTypeId),
    data
  );
};