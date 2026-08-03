// Place this file at: src/shared/layout/Activity/api/create-sr.ts

import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint"; // adjust to your actual path

const SERVICE_REQUEST_TICKET_TYPE_ID = 1;
 
export interface CreateTicketPayload {
  categoryId: number;
  subCategoryId: number;
  institutionPool: number;
  endorserId: number;
  subject: string;
  description: string;
  dueDate: string; // "yyyy-mm-dd" from <input type="date">
}
 
export interface TicketAttachmentDTO {
  id: number;
  ticket_id: string;
  file_name: string;
  file_key: string;
  uploaded_by: number;
}
 
export interface TicketDTO {
  id: number;
  ticket_id: string;
  institution_id: number;
  ticket_type_id: number;
  category_id: number;
  subcategory_id: number;
  subject: string;
  description: string;
  due_date: string;
  institution_pool: number;
  submitter_id: number;
  endorser_id: number;
  attachments?: TicketAttachmentDTO[];
}
 
export class CreateTicketError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
 
/**
 * Builds the multipart FormData for creating a Service Request ticket.
 * Runs client-side validation up front (file count, due date format) and
 * throws CreateTicketError before any network call if something's off.
 * The actual request/unwrap is handled by ApiWrapper.createTicket via postForm.
 */
export function buildCreateTicketFormData(
  payload: CreateTicketPayload,
  files: File[] = []
): FormData {
  if (files.length > 5) {
    throw new CreateTicketError(400, "400", "Maximum of 5 attachments allowed");
  }
 
  const parsedDate = new Date(payload.dueDate);
  if (isNaN(parsedDate.getTime())) {
    throw new CreateTicketError(400, "400", "Invalid due date");
  }
  const dueDateIso = parsedDate.toISOString(); // "yyyy-mm-dd" -> RFC3339, required by the backend
 
  const form = new FormData();
  form.append("ticket_type_id", String(SERVICE_REQUEST_TICKET_TYPE_ID));
  form.append("category_id", String(payload.categoryId));
  form.append("subcategory_id", String(payload.subCategoryId));
  form.append("subject", payload.subject);
  form.append("description", payload.description);
  form.append("due_date", dueDateIso);
  form.append("institution_pool", String(payload.institutionPool));
  form.append("endorser_id", String(payload.endorserId));
 
  files.forEach((file) => form.append("file", file));
 
  return form;
}