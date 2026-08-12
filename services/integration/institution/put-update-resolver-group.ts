import { put } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface UpdateResolverGroupRequest {
  group_name: string;
  member_ids: number[];
  status?: "active" | "inactive";
}

export interface ResolverGroupResponse {
  resolver_group_id: number;
  institution_id: number;
  group_name: string;
  status: "active" | "inactive";
  member_ids: number[];
}

export interface UpdateResolverGroupApiResponse {
  message?: string;
  ret_code?: string;
  response?: ResolverGroupResponse;
}

export const updateResolverGroup = async (
  resolverGroupId: number | string,
  data: UpdateResolverGroupRequest
): Promise<UpdateResolverGroupApiResponse> => {
  return put<UpdateResolverGroupApiResponse>(
    ApiEndpoint.PUT_UPDATE_RESOLVER_GROUP(resolverGroupId),
    data
  );
};