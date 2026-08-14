import { post } from "../../api/ApiHelper";
import { ApiEndpoint } from "../../api/ApiEndpoint";

interface RegisterPayload {
  staff_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_no: string;
  institution_id: number;
  job_position: string;
  status: string;
}

export async function registerUser(payload: RegisterPayload) {
  return post<{
    ret_code: boolean; message?: string 
}>(ApiEndpoint.REGISTER, payload);
}