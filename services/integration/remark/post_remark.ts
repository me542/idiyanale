import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export type RemarkType =
  | "info"
  | "cancel"
  | "onhold"
  | "resolution";

export interface AddRemarkOptionRequest {
  institution_id?: number;
  remark_type: RemarkType;
  reason: string;
}

export interface AddRemarkOptionResponse {
  code: string;
  message: string;
}

export async function addRemarkOption(
  data: AddRemarkOptionRequest
): Promise<AddRemarkOptionResponse> {
  return post<AddRemarkOptionResponse>(
    ApiEndpoint.POST_REMARKS,
    data
  );
}