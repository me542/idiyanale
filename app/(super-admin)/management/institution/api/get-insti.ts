// get-insti.ts
import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export type InstitutionResp = {
  institution_id: number;
  institution_code: string;
  institution_name: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
};

// unwrap:true pulls data.response out for you (see ApiHelper.handleResponse),
// so this resolves directly to the array — no res.data indirection needed.
export function getInstitutions() {
  return get<InstitutionResp[]>(ApiEndpoint.GET_INSTITUTIONS, {
    unwrap: true,
  });
}