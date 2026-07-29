import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface SuperAdmin {
  id: number;
  username: string;
  role: string;
  email: string;
  password: string;
  is_logged_in: boolean;
}

interface GetSuperAdminResponse {
  response: SuperAdmin;
}

export async function getSuperAdminById(id: number) {
  return get<GetSuperAdminResponse>(
    ApiEndpoint.GET_SUPER_ADMIN_BY_ID(id)
  );
}