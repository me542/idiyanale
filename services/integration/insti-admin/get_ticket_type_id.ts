import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface TicketTypeResp {
  ticket_type_id: number;
  institution_id: number;
  ticket_type_name: string;
  status: string;
}

export interface GetTicketTypeResponse {
  response?: TicketTypeResp;
  message?: string;
  ret_code?: string;
}

export const getTicketTypeByID = async (
  ticketTypeId: number | string
): Promise<GetTicketTypeResponse> => {
  return get(ApiEndpoint.GET_TICKET_TYPE_BY_ID(ticketTypeId));
};