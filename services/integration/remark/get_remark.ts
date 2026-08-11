import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export type RemarkType =
  | "info"
  | "cancel"
  | "onhold"
  | "resolution";

export interface RemarkOption {
  id: number;
  institution_id: number;
  remark_type: RemarkType;
  reason: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getRemarkOptions(
  remarkType?: RemarkType
): Promise<RemarkOption[]> {
  return get<RemarkOption[]>(
    ApiEndpoint.GET_REMARKS,
    {
      params: {
        ...(remarkType ? { remark_type: remarkType } : {}),
      },
      unwrap: true,
    }
  );
}