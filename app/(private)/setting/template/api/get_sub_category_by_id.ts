import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface SubCategoryDetailResponse {
  sub_category_id: number;
  category_id: number;
  subject_name: string;
  sub_category_name: string;
  description: string;
  has_duration: boolean;
  duration_days: number;
  status: string;
}

export async function getSubCategoryById(
  subCategoryId: number | string
): Promise<SubCategoryDetailResponse> {
  return await get<SubCategoryDetailResponse>(
    ApiEndpoint.GET_SUB_CATEGORY_BY_ID(subCategoryId),
    {
      unwrap: true,
    }
  );
}