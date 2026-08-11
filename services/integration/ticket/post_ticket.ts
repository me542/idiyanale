import { postForm } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface CreateTicketRequest {
  ticket_type_id: number;
  category_id: number;
  subcategory_id: number;
  subject: string;
  description: string;
  due_date: string;
  institution_pool: number;
  endorser_id: number;
  files?: File[];
}

export interface CreateTicketResponse {
  code: string;
  message: string;
  data?: unknown;
}

export async function createTicket(
  data: CreateTicketRequest
): Promise<CreateTicketResponse> {
  const formData = new FormData();

  formData.append("ticket_type_id", String(data.ticket_type_id));
  formData.append("category_id", String(data.category_id));
  formData.append("subcategory_id", String(data.subcategory_id));
  formData.append("subject", data.subject);
  formData.append("description", data.description);
  formData.append("due_date", data.due_date);
  formData.append("institution_pool", String(data.institution_pool));
  formData.append("endorser_id", String(data.endorser_id));

  if (data.files) {
    data.files.slice(0, 5).forEach((file) => {
      formData.append("file", file);
    });
  }

  return postForm<CreateTicketResponse>(
    ApiEndpoint.POST_CREATE_TICKET,
    formData
  );
}