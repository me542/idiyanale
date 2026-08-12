import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface AddCategoryRequest {
  ticket_type_id: number;
  category_name: string;
}

export interface AddCategoryResponse {
  message?: string;
  ret_code?: string;
}

export const addCategory = async (
  data: AddCategoryRequest
): Promise<AddCategoryResponse> => {
  return post(ApiEndpoint.POST_CATEGORY, data);
};