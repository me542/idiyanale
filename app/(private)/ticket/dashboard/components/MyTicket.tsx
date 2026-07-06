"use client";
import { TicketRow } from "./types";

interface Props {
  tickets?: TicketRow[];
}

export default function MyTicket({ tickets = [] }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6">
      <div className="text-[15px] font-extrabold tracking-wide text-slate-800">
        MY TICKET
      </div>

      <hr className="border-t border-slate-200 my-4 -mx-6" />

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-55 px-5 gap-1.5 text-slate-500">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5B6B6C"
            strokeWidth={1.5}
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18" />
            <path d="M8 14h8" />
          </svg>
          <div className="font-bold text-slate-800 text-sm">
            No tickets yet
          </div>
          <div className="text-xs max-w-[220px] leading-relaxed">
            Tickets assigned or submitted by you will show up here.
          </div>
        </div>
      ) : (
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["SR Number", "Status", "Date Needed", "Submitter", "Resolver"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left text-slate-500 text-[11.5px] tracking-wide uppercase pb-2.5"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <tr key={`${t.sr}-${i}`}>
                <td className="pt-3 pb-3 pr-2 border-t border-slate-200 align-top">
                  <a className="text-blue-600 font-semibold" href="#">
                    {t.sr}
                  </a>
                  <br />
                  <span className="text-slate-700">{t.title}</span>
                </td>
                <td className="pt-3 pb-3 pr-2 border-t border-slate-200 align-top text-slate-700">
                  {t.status}
                </td>
                <td className="pt-3 pb-3 pr-2 border-t border-slate-200 align-top text-slate-700">
                  {t.dateNeeded}
                </td>
                <td className="pt-3 pb-3 pr-2 border-t border-slate-200 align-top text-slate-700">
                  {t.submitter}
                </td>
                <td className="pt-3 pb-3 pr-2 border-t border-slate-200 align-top text-slate-700">
                  {t.resolver}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}