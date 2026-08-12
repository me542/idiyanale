import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface EditRoleRequest {
  role_name: string;
  can_create: boolean;
  can_endorse: boolean;
  can_approve: boolean;
  can_resolve: boolean;
  can_audit: boolean;
}

export interface EditRoleResponse {
  ret_code?: string;
  message?: string;
  data?: unknown;
}

export const editRole = async (
  roleId: number | string,
  data: EditRoleRequest
): Promise<EditRoleResponse> => {
  return patch<EditRoleResponse>(
    ApiEndpoint.PATCH_EDIT_ROLE(roleId),
    data
  );
};