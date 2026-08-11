import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface ServerResponse {
  server_id: number;
  server_name: string;
  server_ip: string;
  institution_id: number;
}

export interface GetServersResponse {
  code: string;
  message: string;
  data: ServerResponse[];
}

export async function getServers(): Promise<ServerResponse[]> {
  const response = await get<GetServersResponse>(
    ApiEndpoint.GET_SERVER
  );

  return response.data;
}