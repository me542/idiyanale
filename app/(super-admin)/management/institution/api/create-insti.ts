// create-insti.ts
import { post } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export type CreateInstitutionPayload = {
  institution_code: string;
  institution_name: string;
  description: string;
};

export function createInstitution(payload: CreateInstitutionPayload) {
  return post(ApiEndpoint.ADD_INSTITUTION, {
    institution_code: payload.institution_code,
    institution_name: payload.institution_name,
    description: payload.description,
    status: "active",
    createdAt: new Date().toISOString(),
  });
}