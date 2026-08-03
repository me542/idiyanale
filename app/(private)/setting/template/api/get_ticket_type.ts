import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";
import { getCurrentUser } from "@/shared/layout/Activity/api/current_user";

export interface TicketTypeResponse {
  ticket_type_id: number;
  institution_id: number;
  ticket_type_name: string;
  status: string;
}

export async function getTicketType(): Promise<TicketTypeResponse[]> {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.kind !== "staff") {
    throw new Error("Current user is not a staff.");
  }

  return get<TicketTypeResponse[]>(ApiEndpoint.GET_TICKET_TYPE, {
    unwrap: true,
  });
}