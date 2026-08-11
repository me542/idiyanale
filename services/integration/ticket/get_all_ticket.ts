import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface Ticket {
  id: number;
  ticket_id: string;
  project_id: number;
  institution_id: number;
  ticket_type_id: number;
  category_id: number;
  subcategory_id: number;

  subject: string;
  description: string;

  due_date: string | null;
  institution_pool: number;

  submitter_id: number;
  resolver_id: number;
  endorser_id: number;
  approver_id: number;

  status: string;
  created_at: string;
  updated_at: string;

  cancelled_by: number;
  cancelled_at: string | null;
  cancellation_reason: string;

  started_at: string | null;
  resolved_at: string | null;
  resolution_time: string;

  onhold: boolean;
  hold_at: string | null;

  closed_by: number;
  closed_at: string | null;

  endorsed_at: string | null;
  approved_at: string | null;

  close_token?: string;
  close_token_used?: boolean;

  institution?: unknown;
  submitter?: unknown;
  resolver?: unknown;
  approver?: unknown;
  endorser?: unknown;
  closer?: unknown;
  canceller?: unknown;
  ticket_type?: unknown;
  category?: unknown;
  subcategory?: unknown;

  ticket_attachment?: TicketAttachment[];
}

export interface TicketAttachment {
  id: number;
  ticket_id: string;
  file_name: string;
  file_key: string;
  uploaded_by: number;
}

export async function getAllTickets(): Promise<Ticket[]> {
  return get<Ticket[]>(
    ApiEndpoint.GET_ALL_TICKET,
    {
      unwrap: true,
    }
  );
}