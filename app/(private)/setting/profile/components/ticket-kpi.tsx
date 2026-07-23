"use client";

export type TicketKpiData = {
  staffId: string;
  firstName: string;
};

export function TicketKpi({ data }: { data: TicketKpiData }) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-700">Ticket KPI</h3>

      <div className="flex min-h-[180px] items-center justify-center">
            <p className="text-sm font-medium text-slate-300">
              No KPI  yet
            </p>
          </div>

      <dl className="mt-6 space-y-4">

      </dl>
    </div>
  );
}

