export const ApiEndpoint = {

  // Login, Logout and Authentication
  LOGIN_OTP: "/api/v1/auth/login-otp",
  VERIFY_OTP: "/api/v1/auth/verify-otp",
  LOGIN_SUPER_ADMIN: "/api/v1/public/login/super-admin",
  LOGOUT_SUPER_ADMIN: "/api/v1/protected/logout/super-admin",
  LOGOUT: "/api/v1/auth/logout",
  REGISTER: "/api/v1/public/register-user", 

  getAllUsers: `/api/v1/protected/get-all-users`,

  // Institution
  ADD_INSTITUTION: "/api/v1/institution/create",
  GET_INSTITUTIONS: "/api/v1/institution/get",
  GET_INSTITUTIONS_PUBLIC: "/api/v1/public/institution/get",
  EDIT_INSTITUTION: (institutionId: number | string) =>
    `/api/v1/institution/edit/${institutionId}`,
};