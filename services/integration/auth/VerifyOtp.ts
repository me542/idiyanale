import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

// This matches your backend's actual response shape:
// { response_time, device, ret_code, message, response: { token } }
interface VerifyOtpResponse {
  response_time?: string;
  device?: string;
  ret_code?: string;
  message?: string;
  response?: {
    token?: string;
  };
}

export const verifyOTP = async (staffId: string, otp: string) => {
  const res = (await post(ApiEndpoint.VERIFY_OTP, {
    staff_id: staffId,
    otp,
  })) as VerifyOtpResponse;

  if (!res) {
    throw new Error("No response from server");
  }

  // The token lives at res.response.token, NOT res.data.token —
  // confirmed from the actual browser console output.
  const token = res.response?.token;

  if (!token) {
    throw new Error(res.message || "Invalid OTP");
  }

  return { token, message: res.message, retCode: res.ret_code };
};