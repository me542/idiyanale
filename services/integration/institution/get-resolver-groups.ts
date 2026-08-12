import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface ResolverGroup {
  resolver_group_id: number;
  institution_id: number;
  group_name: string;
  status: "active" | "inactive";
  member_ids: number[];
}

export interface GetResolverGroupsResponse {
  message?: string;
  ret_code?: string;
  response?: ResolverGroup[];
}

export const getResolverGroups = async (): Promise<GetResolverGroupsResponse> => {
  return get<GetResolverGroupsResponse>(
    ApiEndpoint.GET_RESOLVER_GROUPS
  );
};