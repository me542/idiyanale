import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface EditRemarkOptionRequest {
  id: number;
  reason: string;
}

export interface EditRemarkOptionResponse {
  code: string;
  message: string;
}

export async function editRemarkOption(
  data: EditRemarkOptionRequest
): Promise<EditRemarkOptionResponse> {
  return patch<EditRemarkOptionResponse>(
    ApiEndpoint.PATCH_REMARKS,
    data
  );
}