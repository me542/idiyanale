import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface Role {
  role_id: number;
  institution_id: number;
  role_name: string;
  can_create: boolean;
  can_endorse: boolean;
  can_approve: boolean;
  can_resolve: boolean;
  can_audit: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetRolesByInstitutionResponse {
  ret_code?: string;
  message?: string;
  data?: Role[];
}

export const getRolesByInstitution = async (
  institutionId: number | string
): Promise<GetRolesByInstitutionResponse> => {
  return get<GetRolesByInstitutionResponse>(
    ApiEndpoint.GET_ROLE_BY_INSTI(institutionId)
  );
};