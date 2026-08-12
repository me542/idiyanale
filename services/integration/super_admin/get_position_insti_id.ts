import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface Position {
  position_id: number;
  position_name: string;
}

export interface GetPositionsByInstitutionResponse {
  response?: Position[];
  message?: string;
  ret_code?: string;
}

export const getPositionsByInstitutionId = async (
  institutionId: number | string
): Promise<GetPositionsByInstitutionResponse> => {
  return get(ApiEndpoint.GET_POSITION_BY_INSTI(institutionId));
};