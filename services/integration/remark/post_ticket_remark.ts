import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface PostTicketRemarkResponse {
  code: string;
  message: string;
}

// Sends a remark using POST /api/v1/remarks/add-options.
// remark_type defaults to "info" for general ticket remarks.
export async function postTicketRemark(
  message: string,
  remarkType: string = "info"
): Promise<PostTicketRemarkResponse> {
  return post<PostTicketRemarkResponse>(
    ApiEndpoint.POST_REMARKS,
    {
      remark_type: remarkType,
      reason: message,
    }
  );
}
