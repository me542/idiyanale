"use client";

export interface DailyTicketPoint {
  label: string;
  value: number;
}

interface DailyTicketsProps {
  data?: DailyTicketPoint[];
}

export default function DailyTickets({ data = [] }: DailyTicketsProps) {
  const width = 760;
  const height = 220;
  const padding = 24;

  const hasData = data.length > 0;

  const max = hasData ? Math.max(...data.map((d) => d.value)) : 0;
  const min = hasData ? Math.min(...data.map((d) => d.value)) : 0;
  const range = max - min || 1;

  const points = hasData
    ? data.map((d, i) => {
        const x =
          padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
        const y =
          height - padding - ((d.value - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
    : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">
        Daily Total Tickets
      </h3>

      <hr className="border-t border-slate-200 my-4 -mx-6" />

      {hasData ? (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[220px]"
          preserveAspectRatio="none"
        >
          {/* axes */}
          <line
            x1={padding}
            y1={padding - 8}
            x2={padding}
            y2={height - padding}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding + 8}
            y2={height - padding}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* line */}
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="#1e293b"
            strokeWidth="1.75"
          />
        </svg>
      ) : (
        <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
          No data
        </div>
      )}
    </div>
  );
}