import { post, clearAuth } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export const logoutUser = async () => {
  try {
    return await post(ApiEndpoint.LOGOUT, {});
  } finally {
    clearAuth();
  }
};

export const logoutSuperAdmin = async () => {
  try {
    return await post(ApiEndpoint.LOGOUT_SUPER_ADMIN, {});
  } finally {
    clearAuth();
  }
};