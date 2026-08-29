import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface ServerResponse {
    project_id: number;
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
    return get<ServerResponse[]>(
        ApiEndpoint.GET_SERVER,
        { unwrap: true }
    );
}