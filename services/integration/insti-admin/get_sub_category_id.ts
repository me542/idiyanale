import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface SubCategoryResp {
  sub_category_id: number;
  category_id: number;
  subject_name: string;
  sub_category_name: string;
  description: string;
  has_duration: boolean;
  duration_days: number;
  status: string;
}

export interface GetSubCategoryResponse {
  response?: SubCategoryResp;
  message?: string;
  ret_code?: string;
}

export const getSubCategoryByID = async (
  subCategoryId: number | string
): Promise<GetSubCategoryResponse> => {
  return get(ApiEndpoint.GET_SUB_CATEGORY_BY_ID(subCategoryId));
};