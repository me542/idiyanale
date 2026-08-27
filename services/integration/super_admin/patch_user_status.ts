import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export type UserStatus = "pending" | "active" | "disabled";

export interface ChangeUserStatusRequest {
  status: UserStatus;
}

export interface ChangeUserStatusResponse {
  code?: string;
  message?: string;
  data?: null;
  response?: null;
  ret_code?: string;
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