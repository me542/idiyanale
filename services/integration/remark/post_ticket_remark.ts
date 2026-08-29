import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface PostTicketRemarkResponse {
  code: string;
  message: string;
}

// Sends a remark to a specific ticket using POST /api/v1/ticket/:ticket_id/remarks.
// remark_type defaults to "info" for general ticket remarks.
export async function postTicketRemark(
  ticketId: string | number,
  message: string,
  remarkType: string = "info"
): Promise<PostTicketRemarkResponse> {
  return post<PostTicketRemarkResponse>(
    ApiEndpoint.POST_TICKET_REMARK(ticketId),
    {
      remark_type: remarkType,
      message,
    }
  );
}
