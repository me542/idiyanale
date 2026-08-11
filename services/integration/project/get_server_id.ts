import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface ServerResponse {
  server_id: number;
  institution_id: number;
  server_name: string;
  server_ip: string;
  status: string;
}

export interface GetServerResponse {
  code: string;
  message: string;
  data: ServerResponse;
}

export async function getServerByID(
  serverId: number | string
): Promise<ServerResponse> {
  const response = await get<GetServerResponse>(
    ApiEndpoint.GET_SERVER_BY_ID(serverId)
  );

  return response.data;
}