import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface InstitutionResp {
  institution_id: number;
  institution_code: string;
  institution_name: string;
  description: string;
  status: string;
  created_at: string | null;
}

export interface GetInstitutionsResponse {
  message?: string;
  ret_code?: string;
  response?: InstitutionResp[];
}

export const getInstitutions = async (): Promise<GetInstitutionsResponse> => {
  return get<GetInstitutionsResponse>(
    ApiEndpoint.GET_ALL_INSTITUTIONS
  );
};