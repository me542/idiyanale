import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface EditInstitutionRequest {
  institution_code: string;
  institution_name: string;
  description: string;
  institution_color: string;
  logo?: File | null;
}

export interface EditInstitutionResponse {
  message?: string;
  ret_code?: string;
  response?: unknown;
}

export const editInstitution = async (
  institutionId: number | string,
  data: EditInstitutionRequest
): Promise<EditInstitutionResponse> => {
  const formData = new FormData();

  formData.append("institution_code", data.institution_code);
  formData.append("institution_name", data.institution_name);
  formData.append("description", data.description);
  formData.append("institution_color", data.institution_color);

  if (data.logo) {
    formData.append("logo", data.logo);
  }

  return post<EditInstitutionResponse>(
    ApiEndpoint.POST_EDIT_INSTI_BY_ID(institutionId),
    formData
  );
};