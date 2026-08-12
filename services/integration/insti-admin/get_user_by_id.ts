import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface InstitutionResp {
  institution_id: number;
  institution_code: string;
  institution_name: string;
}

export interface RoleResp {
  role_id: number;
  role_name: string;
  can_create: boolean;
  can_endorse: boolean;
  can_approve: boolean;
  can_resolve: boolean;
  can_audit: boolean;
}

export interface JobPositionResp {
  position_id: number;
  position_name: string;
}

export interface UserDetailsResp {
  id: number;
  username: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  institution_id: number;
  institution: InstitutionResp;
  job_positions: JobPositionResp;
  role: RoleResp;
  status: string;
  last_login: string;
  is_logged_in: boolean;
  created_at: string;
}

export interface GetUsersByInstitutionResponse {
  response?: UserDetailsResp[];
  message?: string;
  ret_code?: string;
}

export const getUsersByInstitutionID = async (
  institutionID: number | string
): Promise<GetUsersByInstitutionResponse> => {
  return get(
    `${ApiEndpoint.GET_USER_BY_ID}/${institutionID}`
  );
};