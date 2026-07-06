export interface SliData {
  totalTicket: number;
  aveRequestPerDay: number;
  completionRate: number; // percentage, e.g. 98.0
  avgResolutionTimeMin: number;
}

interface SliProps {
  data?: SliData;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default function Sli({ data }: SliProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        label="Total Ticket"
        value={data ? `${data.totalTicket}` : "-"}
      />
      <StatCard
        label="Ave Request / Day"
        value={data ? `${data.aveRequestPerDay}` : "-"}
      />
      <StatCard
        label="Completion Rate"
        value={data ? `${data.completionRate.toFixed(1)} %` : "-"}
      />
      <StatCard
        label="Avg Resolution Time"
        value={data ? `${data.avgResolutionTimeMin.toFixed(1)} min` : "-"}
      />
    </div>
  );
}