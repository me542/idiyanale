import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface SubCategoryResponse {
  sub_category_id: number;
  category_id: number;
  subject_name: string;
  sub_category_name: string;
  description: string;
  has_duration: boolean;
  duration_days: number;
  status: string;
}

export async function getSubCategories(
  categoryId: number | string
): Promise<SubCategoryResponse[]> {
  return await get<SubCategoryResponse[]>(
    ApiEndpoint.GET_SUB_CATEGORY(categoryId),
    {
      unwrap: true,
    }
  );
}