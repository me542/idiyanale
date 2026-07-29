// "use client";

// type Ticket = {
//   ID: number;
//   TicketID: string;
//   ProjectID: number;
//   InstitutionID: number;
//   InstitutionPool: number;
//   TicketTypeID: number;
//   CategoryID: number;
//   SubCategoryID: number;

//   Subject: string;
//   Description: string;
//   DueDate: string | null;

//   SubmitterID: number;
//   ResolverID: number;
//   EndorserID: number;
//   ApproverID: number;

//   Status: string;

//   CreatedAt: string;
//   UpdatedAt: string;

//   CancelledBy: string;
//   CancelledAt: string | null;
//   CancellationReason: string;

//   StartedAt: string | null;
//   ResolvedAt: string | null;
//   ResolutionTime: string;

//   OnHold: boolean;
//   HoldAt: string | null;

//   ClosedBy: string;
//   ClosedAt: string | null;

//   EndorsedAt: string | null;
//   ApprovedAt: string | null;
// };

// // TODO: Replace with your API response.
// const tickets: Ticket[] = [];

// const columns: { key: keyof Ticket; label: string }[] = [
//   { key: "ID", label: "ID" },
//   { key: "TicketID", label: "Ticket ID" },
//   { key: "ProjectID", label: "Project" },
//   { key: "InstitutionID", label: "Institution" },
//   { key: "InstitutionPool", label: "Institution Pool" },
//   { key: "TicketTypeID", label: "Ticket Type" },
//   { key: "CategoryID", label: "Category" },
//   { key: "SubCategoryID", label: "Subcategory" },

//   { key: "Subject", label: "Subject" },
//   { key: "Description", label: "Description" },
//   { key: "DueDate", label: "Date Needed" },

//   { key: "SubmitterID", label: "Submitter" },
//   { key: "EndorserID", label: "Endorser" },
//   { key: "ApproverID", label: "Approver" },
//   { key: "ResolverID", label: "Resolver" },

//   { key: "Status", label: "Status" },

//   { key: "CreatedAt", label: "Created At" },
//   { key: "UpdatedAt", label: "Updated At" },

//   { key: "EndorsedAt", label: "Endorsed At" },
//   { key: "ApprovedAt", label: "Approved At" },

//   { key: "StartedAt", label: "Started At" },
//   { key: "ResolvedAt", label: "Resolved At" },
//   { key: "ResolutionTime", label: "Resolution Time" },

//   { key: "OnHold", label: "On Hold" },
//   { key: "HoldAt", label: "Hold At" },

//   { key: "CancelledBy", label: "Cancelled By" },
//   { key: "CancelledAt", label: "Cancelled At" },
//   { key: "CancellationReason", label: "Cancellation Reason" },

//   { key: "ClosedBy", label: "Closed By" },
//   { key: "ClosedAt", label: "Closed At" },
// ];

// function formatValue(value: Ticket[keyof Ticket]) {
//   if (value === null || value === undefined || value === "") {
//     return "-";
//   }

//   if (typeof value === "boolean") {
//     return value ? "Yes" : "No";
//   }

//   return String(value);
// }

// export default function TicketsTable() {
//   return (
//     <div className="rounded-xl border border-gray-200 bg-gray-50 shadow-md">
//       <div className="flex items-baseline gap-2 border-b border-gray-200 px-6 py-4">
//         <h2 className="text-base font-semibold text-gray-900">Tickets</h2>
//         <span className="text-sm text-gray-400">
//           {tickets.length} total
//         </span>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[1800px] border-collapse text-sm">
//           <thead className="bg-gray">
//             <tr>
//               {columns.map((col) => (
//                 <th
//                   key={col.key}
//                   className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
//                 >
//                   {col.label}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {tickets.length === 0 ? (
//               <tr>
//                 <td
//                   colSpan={columns.length}
//                   className="px-6 py-16 text-center text-sm text-gray-400"
//                 >
//                   No tickets yet. New tickets will show up here.
//                 </td>
//               </tr>
//             ) : (
//               tickets.map((ticket) => (
//                 <tr
//                   key={ticket.TicketID}
//                   className="border-t border-gray-200 hover:bg-gray-50"
//                 >
//                   {columns.map((col) => (
//                     <td
//                       key={col.key}
//                       className="whitespace-nowrap px-6 py-3 text-gray-700"
//                     >
//                       {formatValue(ticket[col.key])}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }