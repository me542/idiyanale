import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface AddSubCategoryRequest {
  category_id: number;
  subject_name: string;
  sub_category_name: string;
  description: string;
  has_duration: boolean;
  duration_days: number;
}

export interface AddSubCategoryResponse {
  message?: string;
  ret_code?: string;
}

export const addSubCategory = async (
  data: AddSubCategoryRequest
): Promise<AddSubCategoryResponse> => {
  return post(ApiEndpoint.POST_SUB_CATEGORY, data);
};