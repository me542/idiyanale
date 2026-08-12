import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface AddInstitutionRequest {
  institution_code: string;
  institution_name: string;
  description: string;
}

export interface AddInstitutionResponse {
  message?: string;
  ret_code?: string;
  response?: unknown;
}

export const addInstitution = async (
  data: AddInstitutionRequest
): Promise<AddInstitutionResponse> => {
  return post<AddInstitutionResponse>(
    ApiEndpoint.POST_ADD_INSTI,
    data
  );
};