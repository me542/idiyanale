export type SubCategory = {
  environment: boolean;
  id: string;
  name: string;
  description: string;
  // environment: boolean; 
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