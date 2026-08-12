import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface PositionResp {
  position_id: number;
  position_name: string;
}

export interface GetPositionsResponse {
  response?: PositionResp[];
  message?: string;
  ret_code?: string;
}

export const getPositions = async (): Promise<GetPositionsResponse> => {
  return get(ApiEndpoint.GET_POSITION_BY_INSTITUTION);
};