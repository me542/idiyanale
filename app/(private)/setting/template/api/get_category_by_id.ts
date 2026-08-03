import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface CategoryDetailResponse {
  category_id: number;
  ticket_type_id: number;
  category_name: string;
  status: string;
}

export async function getCategoryById(
  categoryId: number | string
): Promise<CategoryDetailResponse> {
  return await get<CategoryDetailResponse>(
    ApiEndpoint.GET_CATEGORY_BY_ID(categoryId),
    {
      unwrap: true,
    }
  );
}