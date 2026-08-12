import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface SuperAccount {
  id: number;
  username: string;
  role: string;
  email: string;
  password?: string;
  is_logged_in?: boolean;
}

export interface GetSuperAdminResponse {
  response?: SuperAccount;
  message?: string;
  ret_code?: string;
}

export const getSuperAdminById = async (
  id: number | string
): Promise<GetSuperAdminResponse> => {
  return get(ApiEndpoint.GET_SUPER_ADMIN_BY_ID(id));
};