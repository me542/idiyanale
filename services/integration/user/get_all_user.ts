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

export interface UserDetails {
  id: number;
  username: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  institution_id: number;
  institution_name: string;
  job_position_id: number;
  role: UserRole;
  status: string;
  last_login?: string;
  is_logged_in: boolean;
  created_at: string;
}

export interface GetAllUsersResponse {
  [x: string]: any;
  response?: UserDetails[];
  message?: string;
  ret_code?: string;
}

export const getAllUsers = async (): Promise<GetAllUsersResponse> => {
  return get<GetAllUsersResponse>(ApiEndpoint.GET_USER);
};