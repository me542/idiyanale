import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface EditCategoryRequest {
  category_name: string;
  status: string;
}

export interface EditCategoryResponse {
  message?: string;
  ret_code?: string;
}

export const editCategory = async (
  categoryId: number | string,
  data: EditCategoryRequest
): Promise<EditCategoryResponse> => {
  return patch(
    ApiEndpoint.PATCH_CATEGORY(categoryId),
    data
  );
};