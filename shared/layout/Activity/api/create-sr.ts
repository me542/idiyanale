const MAX_ATTACHMENTS = 5;

export interface CreateTicketPayload {
  categoryId: number;
  subCategoryId: number;
  institutionPool: number;
  endorserId: number;
  subject: string;
  description: string;
  dueDate: Date | string;
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
  due_date: string | null;
  institution_pool: number;
  submitter_id: number;
  endorser_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  TicketAttachment?: TicketAttachmentDTO[];
  [key: string]: unknown;
}

export class CreateTicketError extends Error {
  code: string;

  constructor(message: string, code = "validation_error") {
    super(message);
    this.name = "CreateTicketError";
    this.code = code;
  }
}

/** Backend expects RFC3339 (time.Parse(time.RFC3339, ...)). */
function toRFC3339(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new CreateTicketError("Invalid due date");
  }
  return date.toISOString();
}

function assertRequired(payload: CreateTicketPayload) {
  const missing: string[] = [];
  if (!payload.institutionPool) missing.push("institutionPool");
  if (!payload.categoryId) missing.push("categoryId");
  if (!payload.subCategoryId) missing.push("subCategoryId");
  if (!payload.endorserId) missing.push("endorserId");
  if (!payload.subject?.trim()) missing.push("subject");
  if (!payload.description?.trim()) missing.push("description");
  if (!payload.dueDate) missing.push("dueDate");

  if (missing.length > 0) {
    throw new CreateTicketError(
      `Missing required field(s): ${missing.join(", ")}`
    );
  }
}

/**
 * Builds the multipart/form-data body. Field names must match the
 * c.FormValue(...) keys on the Go side exactly.
 */
export function buildCreateTicketFormData(
  payload: CreateTicketPayload,
  files: File[] = []
): FormData {
  assertRequired(payload);

  if (files.length > MAX_ATTACHMENTS) {
    throw new CreateTicketError(
      `Maximum of ${MAX_ATTACHMENTS} attachments allowed`
    );
  }

  const form = new FormData();
  form.append("category_id", String(payload.categoryId));
  form.append("subcategory_id", String(payload.subCategoryId));
  form.append("institution_pool", String(payload.institutionPool));
  form.append("endorser_id", String(payload.endorserId));
  form.append("subject", payload.subject.trim());
  form.append("description", payload.description.trim());
  form.append("due_date", toRFC3339(payload.dueDate));

  // field name must be "file" — multipartForm.File["file"] on the Go side
  for (const file of files) {
    form.append("file", file, file.name);
  }

  return form;
}