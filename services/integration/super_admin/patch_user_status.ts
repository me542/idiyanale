import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export type UserStatus = "pending" | "active" | "disabled";

export interface ChangeUserStatusResponse {
  response?: null;
  message?: string;
  ret_code?: string;
}

export const changeUserStatus = async (
  id: number | string,
  status: UserStatus
): Promise<ChangeUserStatusResponse> => {
  return patch(ApiEndpoint.PATCH_CHANGED_USER_STATUS(id), {
    status,
  });
};