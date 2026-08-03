import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface AddTicketTypeRequest {
  ticket_type_name: string;
}

export interface AddTicketTypeResponse {
  code: string;
  message: string;
}

export async function addTicketType(
  payload: AddTicketTypeRequest
): Promise<AddTicketTypeResponse> {
  return post<AddTicketTypeResponse>(
    ApiEndpoint.POST_TICKET_TYPE,
    payload
  );
}