import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface AddProjectRequest {
  server_id: number;
  project_name: string;
  environment: string;
  description: string;
}

export async function addProject(
  data: AddProjectRequest
): Promise<void> {
  await post(ApiEndpoint.POST_CREATE_PROJECT, data);
}