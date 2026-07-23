"use client";

import { StatusCounts } from "./types";

interface Props {
  data?: Partial<StatusCounts>;
}

const DEFAULT: StatusCounts = {
  total: 0,
  forReview: 0,
  inProgress: 0,
  resolved: 0,
  closed: 0,
  cancelled: 0,
};

export default function StatusTickets({ data }: Props) {
  const d: StatusCounts = { ...DEFAULT, ...data };

  const items = [
    { label: "Total Ticket", value: d.total, color: "#4E86F0" },
    { label: "For Review", value: d.forReview, color: "#F0B429" },
    { label: "In Progress", value: d.inProgress, color: "#8B6BF0" },
    { label: "Resolved", value: d.resolved, color: "#2FBF87" },
    { label: "Closed", value: d.closed, color: "#8C97A0" },
    { label: "Cancelled", value: d.cancelled, color: "#E85C5C" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-xl shadow-md border border-slate-200 px-5 pt-[14px] pb-[22px] w-full"
          style={{ borderTop: `4px solid ${item.color}` }}
        >
          <div className="text-[12px] font-bold uppercase tracking-wide text-slate-700">
            {item.label}
          </div>

          <div className="mt-2 text-[34px] font-extrabold text-slate-900">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}