export type SubCategory = {
  id: string;
  name: string;
  description: string;
  environment: boolean;
};

export type Category = {
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