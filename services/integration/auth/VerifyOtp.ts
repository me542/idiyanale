import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";
import { decodeToken, extractPermissions } from "@/lib/auth/jwt";

interface VerifyOtpResponse {
  response?: {
    token: string;
  };
  message?: string;
  ret_code?: string;
}

interface VerifyOtpResult {
  token: string;
  message?: string;
  retCode?: string;
}

function persistSession(token: string) {
  const claims = decodeToken(token);
  if (!claims) {
    throw new Error("Received an invalid or expired token");
  }

  localStorage.setItem("token", token);
  localStorage.setItem("role", claims.role);
  localStorage.setItem(
    "permissions",
    JSON.stringify(extractPermissions(claims))
  );

  if (claims.institution_id !== undefined) {
    localStorage.setItem("institution_id", String(claims.institution_id));
  }

  localStorage.setItem(
    "user",
    JSON.stringify({
      id: claims.id,
      staffId: claims.staff_id,
      roleName: claims.role,
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

  if (!token) {
    throw new Error(res.message || "Invalid OTP");
  }

  persistSession(token);

  return {
    token,
    message: res.message,
    retCode: res.ret_code,
  };
};