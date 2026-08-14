export type SubCategory = {
  id: string;
  name: string;
  description: string;
  environment: boolean; // maps to API's has_duration
  subjectName: string;
  durationDays: number;
  status: string;
};

export type Category = {
  status: string;
  id: string;
  name: string;
  subCategories: SubCategory[];
};

export type TicketType = {
  id: string;
  name: string;
  status: string;
  categories: Category[];
};

export const uid = () => Math.random().toString(36).slice(2, 10);