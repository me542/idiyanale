import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface SetInstitutionAccessRequest {
  source_institution_id?: number;
  target_institution_id: number;
  is_allowed: boolean;
}

export interface SetInstitutionAccessResponse {
  message?: string;
  ret_code?: string;
  response?: unknown;
}

export const setInstitutionAccess = async (
  data: SetInstitutionAccessRequest
): Promise<SetInstitutionAccessResponse> => {
  return post<SetInstitutionAccessResponse>(
    ApiEndpoint.POST_SET_ALLOW_INSTI_TICKET,
    data
  );
};