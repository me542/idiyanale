import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface CategoryResp {
  category_id: number;
  ticket_type_id: number;
  category_name: string;
  status: string;
}

export interface GetCategoryResponse {
  response?: CategoryResp;
  message?: string;
  ret_code?: string;
}

export const getCategoryByID = async (
  categoryId: number | string
): Promise<GetCategoryResponse> => {
  return get(ApiEndpoint.GET_CATEGORY_BY_ID(categoryId));
};