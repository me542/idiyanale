import { patchForm } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface UpdateTicketRequest {
  ticket_type_id: number;
  category_id: number;
  subcategory_id: number;
  subject: string;
  description: string;
  due_date: string;
  endorser_id: number;
}

export interface UpdateTicketResponse {
  code: string;
  message: string;
  data?: unknown;
}

export async function updateTicket(
  ticketId: string | number,
  data: UpdateTicketRequest
): Promise<UpdateTicketResponse> {
  const formData = new FormData();

  formData.append("ticket_type_id", String(data.ticket_type_id));
  formData.append("category_id", String(data.category_id));
  formData.append("subcategory_id", String(data.subcategory_id));
  formData.append("subject", data.subject);
  formData.append("description", data.description);
  formData.append("due_date", data.due_date);
  formData.append("endorser_id", String(data.endorser_id));

  return patchForm<UpdateTicketResponse>(
    ApiEndpoint.PATCH_UPDATE_TICKET(ticketId),
    formData
  );
}