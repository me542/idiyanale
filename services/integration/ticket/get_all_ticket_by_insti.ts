import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface TicketUser {
  id: number;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface TicketInstitution {
  institution_id: number;
  institution_code: string;
  institution_name: string;
}

export interface TicketType {
  ticket_type_id: number;
  ticket_type_name: string;
}

export interface TicketCategory {
  category_id: number;
  category_name: string;
}

export interface TicketSubCategory {
  sub_category_id: number;
  sub_category_name: string;
}

export interface InstitutionTicket {
  id: number;
  ticket_id: string;
  project_id: number;

  institution_id: number;
  institution: TicketInstitution;

  ticket_type_id: number;
  ticket_type: TicketType;

  category_id: number;
  category: TicketCategory;

  subcategory_id: number;
  subcategory: TicketSubCategory;

  subject: string;
  description: string;

  due_date: string | null;
  institution_pool: number;

  submitter_id: number;
  submitter: TicketUser;

  resolver_id: number | null;
  resolver: TicketUser | null;

  endorser_id: number | null;
  endorser: TicketUser | null;

  approver_id: number | null;
  approver: TicketUser | null;

  status: string;
  created_at: string;
  updated_at: string;

  cancelled_by: number | null;
  canceller: TicketUser | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;

  started_at: string | null;
  resolved_at: string | null;

  resolution_time: string;

  onhold: boolean;
  hold_at: string | null;

  closed_by: number | null;
  closer: TicketUser | null;
  closed_at: string | null;

  endorsed_at: string | null;
  approved_at: string | null;
}

export async function getAllTicketsByInstitution(
  institutionId: number | string
): Promise<InstitutionTicket[]> {
  return get<InstitutionTicket[]>(
    ApiEndpoint.GET_ALL_TICKET_BY_INSTI(institutionId),
    {
      unwrap: true,
    }
  );
}