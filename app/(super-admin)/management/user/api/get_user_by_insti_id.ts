import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface InstitutionResponse {
  institution_id: number;
  institution_code: string;
  institution_name: string;
}

export interface JobPositionResponse {
  position_id: number;
  position_name: string;
}

export interface RoleResponse {
  role_id: number;
  role_name: string;
  can_create: boolean;
  can_endorse: boolean;
  can_approve: boolean;
  can_resolve: boolean;
  can_audit: boolean;
}

export interface UserByInstitutionResponse {
  id: number;
  username: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;

  institution: InstitutionResponse;
  job_positions: JobPositionResponse;
  role: RoleResponse;

  status: string;
  last_login: string;
  is_logged_in: boolean;
  created_at: string;
}

export async function getUsersByInstitution(
  institutionId: number | string
): Promise<UserByInstitutionResponse[]> {
  const endpoint = ApiEndpoint.GET_USER_BY_INSTI_SA(institutionId);

  return get<UserByInstitutionResponse[]>(endpoint, {
    unwrap: true,
  });
}