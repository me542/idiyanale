// edit-insti.ts
import { postForm } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export type EditInstitutionPayload = {
  institution_code: string;
  institution_name: string;
  description: string;
  institution_color?: string; // must be "#fff" or "#ffffff" — validated server-side too
  logo?: File | null;
};

export function editInstitution(
  institutionId: number | string,
  payload: EditInstitutionPayload
) {
  const formData = new FormData();
  formData.append("institution_code", payload.institution_code);
  formData.append("institution_name", payload.institution_name);
  formData.append("description", payload.description);

  if (payload.institution_color) {
    formData.append("institution_color", payload.institution_color);
  }
  if (payload.logo) {
    formData.append("logo", payload.logo);
  }

  return postForm(ApiEndpoint.EDIT_INSTITUTION(institutionId), formData, {
    unwrap: true,
  });
}