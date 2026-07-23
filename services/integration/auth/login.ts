import { post } from "@/services/api/ApiHelper";
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

export const loginSuperAdmin = async (
  username: string,
  password: string
) => {
  return post(
    ApiEndpoint.LOGIN_SUPER_ADMIN,
    {
      username,
      password,
    },
    { unwrap: true }
  );
};

