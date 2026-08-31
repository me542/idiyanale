import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";
import { verifyJWT } from "@/lib/auth/verify-jwt";

export const loginOTP = async (staffId: string) => {
  return post(ApiEndpoint.LOGIN_OTP, {
    staff_id: staffId,
  });
};

interface SuperAdminLoginResponse {
  token: string;
}

export const loginSuperAdmin = async (
  username: string,
  password: string
) => {
  const res = (await post(
    ApiEndpoint.LOGIN_SUPER_ADMIN,
    { username, password },
    { unwrap: true }
  )) as SuperAdminLoginResponse;

  if (!res?.token) {
    throw new Error("No token received from server");
  }

  // Verify JWT signature and expiration
  const claims = await verifyJWT(res.token);

  if (!claims) {
    throw new Error("Received an invalid or expired token");
  }

  localStorage.setItem("token", res.token);

  localStorage.setItem("role", claims.role ?? "Super-Admin");

  localStorage.setItem(
    "user",
    JSON.stringify({
      id: claims.id,
      username: claims.username ?? username,
    })
  );

  // Super Admin token does not contain can_* permissions
  const maxAge = 60 * 60;

  document.cookie = `token=${res.token}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `role=super-admin; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `user_role=${claims.role ?? "Super-Admin"}; path=/; max-age=${maxAge}; samesite=lax`;

  return res;
};