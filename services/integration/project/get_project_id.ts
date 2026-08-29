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

export interface GetProjectResponse {
  code: string;
  message: string;
  data: ProjectResponse;
}

/**
 * Fetch project details by ID.
 *
 * Returns the ProjectResponse (the `data` object returned by the API).
 */
export async function getProjectByID(
  projectId: number | string
): Promise<ProjectResponse> {
  const response = await get<GetProjectResponse>(
    ApiEndpoint.GET_PROJECT_BY_ID(projectId)
  );

  return response.data;
}