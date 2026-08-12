import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface CreateResolverGroupRequest {
  group_name: string;
  member_ids: number[];
}

export interface ResolverGroupResponse {
  resolver_group_id: number;
  institution_id: number;
  group_name: string;
  status: string;
  member_ids: number[];
}

export interface CreateResolverGroupApiResponse {
  message?: string;
  ret_code?: string;
  response?: ResolverGroupResponse;
}

export const createResolverGroup = async (
  data: CreateResolverGroupRequest
): Promise<CreateResolverGroupApiResponse> => {
  return post<CreateResolverGroupApiResponse>(
    ApiEndpoint.POST_CREATE_RESOLVER_GROUP,
    data
  );
};