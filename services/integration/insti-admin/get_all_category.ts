import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface CategoryResp {
  category_id: number;
  ticket_type_id: number;
  category_name: string;
  status: string;
}

export interface GetCategoriesResponse {
  response?: CategoryResp[];
  message?: string;
  ret_code?: string;
}

export const getCategories = async (
  ticketTypeId: number | string
): Promise<GetCategoriesResponse> => {
  return get(ApiEndpoint.GET_CATEGORY(ticketTypeId));
};