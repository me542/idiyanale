import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface AddServerRequest {
  server_name: string;
  server_ip: string;
}

export async function addServer(
  data: AddServerRequest
): Promise<void> {
  await post(ApiEndpoint.POST_CREATE_SERVER, data);
}