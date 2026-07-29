import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";
import { decodeToken, extractPermissions } from "@/lib/auth/jwt";

interface VerifiedUser {
  id: number;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  institution_id: number;
  institution_name: string;
  role_name: string;
}

interface VerifyOtpResponse {
  response?: {
    token: string;
    user: VerifiedUser;
  };
  message?: string;
  ret_code?: string;
}

interface VerifyOtpResult {
  token: string;
  message?: string;
  retCode?: string;
}

function persistSession(token: string, user: VerifiedUser) {
  const claims = decodeToken(token);
  if (!claims) {
    throw new Error("Received an invalid or expired token");
  }

  localStorage.setItem("token", token);
  localStorage.setItem("role", claims.role);
  localStorage.setItem("permissions", JSON.stringify(extractPermissions(claims)));
  localStorage.setItem("institution_id", String(user.institution_id));
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: user.id,
      staffId: user.staff_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      institutionName: user.institution_name,
      roleName: user.role_name,
    })
  );

  const maxAge = 60 * 60;
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `role=staff; path=/; max-age=${maxAge}; samesite=lax`;
}

export const verifyOTP = async (
  staffId: string,
  otp: string
): Promise<VerifyOtpResult> => {
  const res = (await post(ApiEndpoint.VERIFY_OTP, {
    staff_id: staffId,
    otp,
  })) as VerifyOtpResponse;

  if (!res) {
    throw new Error("No response from server");
  }

  const token = res.response?.token;
  const user = res.response?.user;

  if (!token || !user) {
    throw new Error(res.message || "Invalid OTP");
  }

  persistSession(token, user);

  return {
    token,
    message: res.message,
    retCode: res.ret_code,
  };
};

