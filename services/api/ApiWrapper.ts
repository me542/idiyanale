import { post, postForm } from "./ApiHelper";
import { ApiEndpoint } from "./ApiEndpoint";
import {
  buildCreateTicketFormData,
  CreateTicketPayload,
  TicketDTO,
} from "@/shared/layout/Activity/api/create-sr";

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
    return post(ApiEndpoint.POST_ADD_INSTI, {
      institution_code: institutionCode,
      institution_name: institutionName,
      description,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  },

  // Ticket
  createTicket(payload: CreateTicketPayload, files: File[] = []) {
    const formData = buildCreateTicketFormData(payload, files);
    // unwrap: true — pulls `.data` out of JSONResponseWithDataV1's
    // { code, message, data } envelope so callers get the ticket directly.
    return postForm<TicketDTO>(ApiEndpoint.POST_CREATE_TICKET, formData, {
      unwrap: true,
    });
  },
};