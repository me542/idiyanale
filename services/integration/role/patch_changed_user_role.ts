import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface ChangeUserRoleRequest {
  role_id: number;
}

export interface ChangeUserRoleResponse {
  ret_code?: string;
  message?: string;
  data?: unknown;
}

export const changeUserRole = async (
  userId: number | string,
  data: ChangeUserRoleRequest
): Promise<ChangeUserRoleResponse> => {
  return patch<ChangeUserRoleResponse>(
    ApiEndpoint.PATCH_CHANGED_ROLE(userId),
    data
  );
};