import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface AddRoleRequest {
  role_name: string;
  can_create: boolean;
  can_endorse: boolean;
  can_approve: boolean;
  can_resolve: boolean;
  can_audit: boolean;
}

export interface AddRoleResponse {
  ret_code?: string;
  message?: string;
}

export const addRole = async (
  data: AddRoleRequest
): Promise<AddRoleResponse> => {
  return post<AddRoleResponse>(ApiEndpoint.POST_ROLE, data);
};