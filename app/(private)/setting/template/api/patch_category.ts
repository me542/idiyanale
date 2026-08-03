import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface UpdateCategoryRequest {
  category_name: string;
}

export interface UpdateCategoryResponse {
  code: string;
  message: string;
}

export async function updateCategory(
  categoryId: number | string,
  data: UpdateCategoryRequest
): Promise<UpdateCategoryResponse> {
  return await patch<UpdateCategoryResponse>(
    ApiEndpoint.PATCH_CATEGORY(categoryId),
    data,
    {
      unwrap: true,
    }
  );
}