import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface ProjectResponse {
  project_id: number;
  server_id: number;
  project_name: string;
  environment: string;
  description: string;
  status: string;
}

export interface GetProjectsResponse {
  code: string;
  message: string;
  data: ProjectResponse[];
}

export async function getProjectsByServerId(
  serverId: number | string
): Promise<ProjectResponse[]> {
  const response = await get<GetProjectsResponse>(
    ApiEndpoint.GET_PROJECT(serverId)
  );

  return response.data;
}