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
  code: string;
  message: string;
}

export async function addSubCategory(
  data: AddSubCategoryRequest
): Promise<AddSubCategoryResponse> {
  return await post<AddSubCategoryResponse>(
    ApiEndpoint.POST_SUB_CATEGORY,
    data,
    {
      unwrap: true,
    }
  );
}