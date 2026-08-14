import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface RegisterUserRequest {
  staff_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_no: string;
  position_id: number;
  institution_id?: number;
  status?: string;
}

export interface RegisterUserResponse {
  response?: null;
  message?: string;
  ret_code?: string;
}

export const registerUser = async (
  data: RegisterUserRequest
): Promise<RegisterUserResponse> => {
  return await post<RegisterUserResponse>(
    ApiEndpoint.POST_REGISTER_USER,
    data
  );
};