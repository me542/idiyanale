import { post } from "./ApiHelper";
import { ApiEndpoint } from "./ApiEndpoint";

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

export const ApiWrapper = {

  loginOtp(email: string) {
    return post(ApiEndpoint.LOGIN_OTP, { email });
  },

  verifyOtp(email: string, otp: string) {
    return post(ApiEndpoint.VERIFY_OTP, { email, otp });
  },

  register(payload: RegisterPayload) {
    return post(ApiEndpoint.REGISTER, payload);
  },

  addInstitution(institutionCode: string, institutionName: string, description: string) {
    return post(ApiEndpoint.ADD_INSTITUTION, {
      institution_code: institutionCode,
      institution_name: institutionName,
      description,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  },
};