import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface AddCategoryRequest {
  ticket_type_id: number;
  category_name: string;
}

export interface AddCategoryResponse {
  code: string;
  message: string;
}

export async function addCategory(
  data: AddCategoryRequest
): Promise<AddCategoryResponse> {
  return await post<AddCategoryResponse>(
    ApiEndpoint.POST_CATEGORY,
    data,
    {
      unwrap: true,
    }
  );
}