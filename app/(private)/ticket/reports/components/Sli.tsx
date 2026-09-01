// components/Sli.tsx
"use client";

export interface SliData {
  totalTicket: number;
  aveRequestPerDay: number;
  completionRate: number;
  avgResolutionTimeMin: number;
}

interface SliProps {
  data?: SliData;
  loading?: boolean;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default function Sli({ data, loading }: SliProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Total Ticket" value={loading ? "..." : `${data?.totalTicket ?? 0}`} />
      <StatCard
        label="Ave Request / Day"
        value={loading ? "..." : `${data?.aveRequestPerDay ?? 0}`}
      />
      <StatCard
        label="Completion Rate"
        value={loading ? "..." : `${(data?.completionRate ?? 0).toFixed(1)} %`}
      />
      <StatCard
        label="Avg Resolution Time"
        value={loading ? "..." : `${(data?.avgResolutionTimeMin ?? 0).toFixed(1)} min`}
      />
    </div>
  );
}