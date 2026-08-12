import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface TicketTypeResp {
  ticket_type_id: number;
  ticket_type_name: string;
}

export interface GetTicketTypesResponse {
  response?: TicketTypeResp[];
  message?: string;
  ret_code?: string;
}

export const getTicketTypes = async (): Promise<GetTicketTypesResponse> => {
  return get(ApiEndpoint.GET_TICKET_TYPE);
};