import { patch } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface ChangeInstitutionStatusRequest {
  status: "active" | "inactive";
}

export interface ChangeInstitutionStatusResponse {
  message?: string;
  ret_code?: string;
  response?: unknown;
}

export const changeInstitutionStatus = async (
  institutionId: number | string,
  status: "active" | "inactive"
): Promise<ChangeInstitutionStatusResponse> => {
  return patch<ChangeInstitutionStatusResponse>(
    ApiEndpoint.PATCH_CHANGED_STATUS_INSTI_ID(institutionId),
    {
      status,
    }
  );
};