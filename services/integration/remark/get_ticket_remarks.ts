import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

// Matches the actual RemarkOption shape returned by GET /api/v1/remarks/get
export interface TicketRemark {
  id: number;
  institution_id: number;
  remark_type: string;
  reason: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getTicketRemarks(
  ticketId: string | number
): Promise<TicketRemark[]> {
  return get<TicketRemark[]>(
    ApiEndpoint.GET_REMARKS,
    {
      params: { ticket_id: ticketId },
      unwrap: true,
    }
  );
}
