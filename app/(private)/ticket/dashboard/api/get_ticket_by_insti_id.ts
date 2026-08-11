import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";
import { TicketRow } from "../components/types";

export interface UserResp {
  id: number;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface InstitutionResp {
  institution_id: number;
  institution_code: string;
  institution_name: string;
}

export interface TicketTypeResp {
  ticket_type_id: number;
  ticket_type_name: string;
}

export interface CategoryResp {
  category_id: number;
  category_name: string;
}

export interface SubCategoryResp {
  sub_category_id: number;
  sub_category_name: string;
}

export interface TicketResponse {
  map(mapApiToRow: (api: TicketResponse) => TicketRow): unknown;
  id: number;
  ticket_id: string;
  project_id: number;

  institution_id: number;
  institution: InstitutionResp;

  ticket_type_id: number;
  ticket_type: TicketTypeResp;

  category_id: number;
  category: CategoryResp;

  subcategory_id: number;
  subcategory: SubCategoryResp;

  subject: string;
  description: string;

  due_date: string | null;
  institution_pool: number;

  submitter_id: number;
  submitter: UserResp;

  resolver_id: number;
  resolver: UserResp;

  endorser_id: number;
  endorser: UserResp;

  approver_id: number;
  approver: UserResp;

  status: string;

  created_at: string;
  updated_at: string;

  cancelled_by: number;
  canceller: UserResp;
  cancelled_at: string | null;

  started_at: string | null;
  resolved_at: string | null;

  resolution_time: string;

  onhold: boolean;
  hold_at: string | null;

  closed_by: number;
  closer: UserResp;
  closed_at: string | null;

  endorsed_at: string | null;
  approved_at: string | null;
}

export interface GetTicketByTicketIdResponse {
  code: string;
  message: string;
  data: TicketResponse;
}

export const getTicketByTicketId = async (
  ticketId: number | string
): Promise<TicketResponse> => {
  const response = await get<GetTicketByTicketIdResponse>(
    ApiEndpoint.GET_TICKET_BY_TICKETID(ticketId)
  );

  return response.data;
};