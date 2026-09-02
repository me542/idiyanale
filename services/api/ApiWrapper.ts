import { get, post, postForm, patch, del } from "./ApiHelper";
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

  // Chat
  createConversation(title: string, userIds: number[], groupType: string, institutionId: number | undefined) {
    return post(ApiEndpoint.POST_CREATE_CONVERSATION, { title, user_ids: userIds });
  },

  getConversations() {
    return get(ApiEndpoint.GET_CONVERSATIONS);
  },

  getConversationsWithUnread() {
    return get(ApiEndpoint.GET_CONVERSATIONS_UNREAD);
  },

  getConversationById(conversationId: number | string) {
    return get(ApiEndpoint.GET_CONVERSATION_BY_ID(conversationId));
  },

  deleteConversation(conversationId: number | string) {
    return del(ApiEndpoint.DELETE_CONVERSATION(conversationId));
  },

  sendMessage(conversationId: number | string, content: string, messageType: string = 'text') {
    return post(ApiEndpoint.POST_SEND_MESSAGE(conversationId), { content, message_type: messageType });
  },

  getMessages(conversationId: number | string, limit: number = 50, offset: number = 0) {
    return get(ApiEndpoint.GET_MESSAGES(conversationId), { params: { limit, offset } });
  },

  editMessage(messageId: number | string, content: string) {
    return patch(ApiEndpoint.PATCH_EDIT_MESSAGE(messageId), { content });
  },

  deleteMessage(messageId: number | string) {
    return del(ApiEndpoint.DELETE_MESSAGE(messageId));
  },

  addParticipant(conversationId: number | string, userId: number) {
    return post(ApiEndpoint.POST_ADD_PARTICIPANT(conversationId), { user_id: userId });
  },

  removeParticipant(conversationId: number | string, userId: number | string) {
    return del(ApiEndpoint.DELETE_PARTICIPANT(conversationId, userId));
  },

  getParticipants(conversationId: number | string) {
    return get(ApiEndpoint.GET_PARTICIPANTS(conversationId));
  },

  markAsRead(conversationId: number | string) {
    return post(ApiEndpoint.POST_MARK_AS_READ(conversationId));
  },
};

