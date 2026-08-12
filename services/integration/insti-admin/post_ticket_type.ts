import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface AddTicketTypeRequest {
  ticket_type_name: string;
}

export interface AddTicketTypeResponse {
  message?: string;
  ret_code?: string;
}

export const addTicketType = async (
  data: AddTicketTypeRequest
): Promise<AddTicketTypeResponse> => {
  return post(ApiEndpoint.POST_TICKET_TYPE, data);
};