import { get } from "@/services/api/ApiHelper";
import { ApiEndpoint } from "@/services/api/ApiEndpoint";

export interface CategoryResponse {
  category_id: number;
  ticket_type_id: number;
  category_name: string;
  status: string;
}

export async function getCategories(
  ticketTypeId: number | string
): Promise<CategoryResponse[]> {
  return await get<CategoryResponse[]>(
    ApiEndpoint.GET_CATEGORY(ticketTypeId),
    {
      unwrap: true,
    }
  );
}