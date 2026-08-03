import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface UpdateSubCategoryRequest {
  sub_category_name: string;
  subject_name: string;
  description: string;
  has_duration: boolean;
  duration_days: number;
  status: string;
}

export interface UpdateSubCategoryResponse {
  code: string;
  message: string;
}

export async function updateSubCategory(
  subCategoryId: number | string,
  data: UpdateSubCategoryRequest
): Promise<UpdateSubCategoryResponse> {
  return await patch<UpdateSubCategoryResponse>(
    ApiEndpoint.PATCH_SUB_CATEGORY(subCategoryId),
    data,
    {
      unwrap: true,
    }
  );
}