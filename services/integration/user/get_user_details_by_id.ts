import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface UserRole {
  role_id: number;
  role_name: string;
  can_create: boolean;
  can_endorse: boolean;
  can_approve: boolean;
  can_resolve: boolean;
  can_audit: boolean;
}

export interface UserInstitution {
  institution_id: number;
  institution_code: string;
  institution_name: string;
}

export interface UserJobPosition {
  job_position_id: number;
  job_position_name: string;
}

export interface UserDetails {
  id: number;
  username: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;

  institution_id: number;
  institution: UserInstitution;

  job_position_id: number;
  job_position: UserJobPosition;

  role: UserRole;

  status: string;
  last_login?: string;
  is_logged_in: boolean;
  created_at: string;
}

export interface GetUserByIDResponse {
  response: UserDetails;
  message: string;
  ret_code: string;
}

export const getUserByID = async (
  id: number | string
): Promise<GetUserByIDResponse> => {
  return get<GetUserByIDResponse>(
    ApiEndpoint.GET_USER_BY_ID_U(id)
  );
};