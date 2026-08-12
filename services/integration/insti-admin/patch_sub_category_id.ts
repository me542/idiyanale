import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface EditSubCategoryRequest {
  sub_category_name: string;
  subject_name: string;
  description: string;
  has_duration: boolean;
  duration_days: number;
  status: string;
}

export interface EditSubCategoryResponse {
  message?: string;
  ret_code?: string;
}

export const editSubCategory = async (
  subCategoryId: number | string,
  data: EditSubCategoryRequest
): Promise<EditSubCategoryResponse> => {
  return patch(
    ApiEndpoint.PATCH_SUB_CATEGORY(subCategoryId),
    data
  );
};