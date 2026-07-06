export interface StatusCounts {
  total: number;
  forReview: number;
  inProgress: number;
  resolved: number;
  closed: number;
  cancelled: number;
}

export interface TicketRow {
  sr: string;
  title: string;
  status: string;
  dateNeeded: string;
  submitter: string;
  resolver: string;
}

export interface CategoryItem {
  label: string;
  pct: number;
  color: string;
}

export interface DueActivityItem {
  title: string;
  due: string;
}
