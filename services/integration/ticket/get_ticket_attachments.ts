import { get, del } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface TicketAttachment {
  id: number;
  ticket_id: string;
  file_name: string;
  file_key: string;
  uploaded_by: number;
  download_url: string;
}

export async function getTicketAttachments(
  ticketId: string | number
): Promise<TicketAttachment[]> {
  return get<TicketAttachment[]>(
    ApiEndpoint.GET_TICKET_ATTACHMENTS(ticketId),
    {
      unwrap: true,
    }
  );
}

export async function deleteTicketAttachment(
  ticketId: string | number,
  attachmentId: number
): Promise<void> {
  return del(
    ApiEndpoint.DELETE_TICKET_ATTACHMENT(ticketId, attachmentId)
  );
}
