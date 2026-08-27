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

/**
 * Fetch all projects that belong to a given server.
 * Backend: GET /api/v1/project/get/projects/:server_id
 */
export async function getProjectsByServerID(
  serverId: number | string
): Promise<ProjectResponse[]> {
  return get<ProjectResponse[]>(
    ApiEndpoint.GET_PROJECT(serverId),
    { unwrap: true }
  );
}
