import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface JobPosition {
  position_id: number;
  position_name: string;
}

export interface Role {
  role_id: number;
  role_name: string;
  can_create: boolean;
  can_endorse: boolean;
  can_approve: boolean;
  can_resolve: boolean;
  can_audit: boolean;
}

export interface User {
  id: number;
  username: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  institution_id: number;
  institution_name?: string;
  job_positions: JobPosition;
  role: Role;
  status: string;
  last_login: string;
  is_logged_in: boolean;
  created_at: string;
}

export async function getUsersByInstitutionId(
  institutionId: number | string
) {
  return get<User[]>(
    ApiEndpoint.GET_USER_BY_INSTI_U(institutionId)
  );
}