export interface DateRow {
  date: string;
  total: number;
  resolved: number;
  forReview: number;
  closed: number;
  cancelled: number;
}

interface DateTableProps {
  rows?: DateRow[];
}

export default function DateTable({ rows = [] }: DateTableProps) {
  const hasData = rows.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
      <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
        <thead>
          <tr className="text-slate-400">
            <th className="pb-2 pl-4 font-medium">Date</th>
            <th className="pb-2 font-medium">Total</th>
            <th className="pb-2 font-medium">Resolved</th>
            <th className="pb-2 font-medium">For Review</th>
            <th className="pb-2 font-medium">Closed</th>
            <th className="pb-2 pr-4 font-medium">Cancelled</th>
          </tr>

          {/* Divider below the header */}
          <tr>
            <th colSpan={6} className="p-0">
              <hr className="border-t border-slate-200 my-2 -mx-6" />
            </th>
          </tr>
        </thead>

        <tbody>
          {hasData ? (
            rows.map((row) => (
              <tr
                key={row.date}
                className="rounded-xl bg-white font-semibold text-slate-800 shadow-md"
              >
                <td className="rounded-l-xl py-3 pl-4">{row.date}</td>
                <td className="py-3">{row.total}</td>
                <td className="py-3">{row.resolved}</td>
                <td className="py-3">{row.forReview}</td>
                <td className="py-3">{row.closed}</td>
                <td className="rounded-r-xl py-3 pr-4">{row.cancelled}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}