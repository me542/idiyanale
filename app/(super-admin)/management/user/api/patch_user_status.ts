import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface ChangeUserStatusRequest {
  status: "pending" | "active" | "disabled";
}

export interface ChangeUserStatusResponse {
  code: string;
  message: string;
  data: null;
}

export async function changeUserStatus(
  userId: number | string,
  payload: ChangeUserStatusRequest
): Promise<ChangeUserStatusResponse> {
  return patch<ChangeUserStatusResponse>(
    ApiEndpoint.PATCH_CHANGED_USER_STATUS(userId),
    payload
  );
}