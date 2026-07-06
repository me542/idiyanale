"use client";

type Ticket = {
  ticketId: string;
  status: string;
  submitter: string;
  ticketType: string;
  category: string;
  subcategory: string;
  institution: string;
  dateNeeded: string;
  subject: string;
  description: string;
  endorser: string;
  endorserat: string;
  approver: string;
  approverat: string;
  assignee: string;
};

// No data yet — wire this up to your API / DB fetch.
const tickets: Ticket[] = [];

const columns: { key: keyof Ticket; label: string }[] = [
  { key: "ticketId", label: "Ticket ID" },
  { key: "status", label: "Status" },
  { key: "submitter", label: "Submitter" },
  { key: "ticketType", label: "Ticket Type" },
  { key: "category", label: "Category" },
  { key: "subcategory", label: "Subcategory" },
  { key: "institution", label: "Institution" },
  { key: "dateNeeded", label: "Date Needed" },
  { key: "subject", label: "Subject" },
  { key: "description", label: "Description" },
  { key: "endorser", label: "Endorser" },
  { key: "endorserat", label: "Endorser At" },
  { key: "approver", label: "Approver" },
  { key: "approverat", label: "Approver At" },
  { key: "assignee", label: "Assignee" },
];

export default function TicketsTable() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 shadow-md">
      <div className="flex items-baseline gap-2 border-b border-gray-200 px-6 py-4">
        <h2 className="text-base font-semibold text-gray-900">Tickets</h2>
        <span className="text-sm text-gray-400">{tickets.length} total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center text-sm text-gray-400"
                >
                  No tickets yet. New tickets will show up here.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.ticketId} className="border-t border-gray-100">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="whitespace-nowrap px-6 py-3 text-gray-800"
                    >
                      {ticket[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}