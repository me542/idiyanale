import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface PatchUserPositionRequest {
  position_id: number;
}

export interface PatchUserPositionResponse {
  message: string;
}

export const patchUserPosition = async (
  userId: number | string,
  positionId: number
): Promise<PatchUserPositionResponse> => {
  const response = await patch<PatchUserPositionResponse>(
    ApiEndpoint.PATCH_POSITION(userId),
    {
      position_id: positionId,
    }
  );

  return response;
};