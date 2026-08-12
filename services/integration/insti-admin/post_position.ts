import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface AddPositionRequest {
  position_name: string;
}

export interface AddPositionResponse {
  message?: string;
  ret_code?: string;
}

export const addPosition = async (
  data: AddPositionRequest
): Promise<AddPositionResponse> => {
  return post(ApiEndpoint.POST_POSITION, data);
};