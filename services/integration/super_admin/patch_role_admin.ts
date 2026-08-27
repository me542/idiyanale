import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface ChangeRoleToAdminResponse {
  response?: null;
  message?: string;
  ret_code?: string;
}

export const changeRoleToAdmin = async (
  id: number | string
) => {
  return patch(
    ApiEndpoint.PATCH_CHANGED_ROLE_ADMIN(id)
  );
};