import { post } from "@/services/api/ApiWrapper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export const loginOTP = async (
  staffId: string
) => {
  return post(
    ApiEndpoint.LOGIN_OTP,
    {
      staff_id: staffId,
    }
  );
};