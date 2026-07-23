import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export const logoutUser = async () => {
  return post(ApiEndpoint.LOGOUT, {});
};

export const logoutSuperAdmin = async () => {
  return post(
    ApiEndpoint.LOGOUT_SUPER_ADMIN,
    {}
  );
};