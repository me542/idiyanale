"use client";
import { DueActivityItem } from "./types";

interface Props {
  activities?: DueActivityItem[];
}

export default function DueActivity({ activities = [] }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6 min-h-[280px] flex flex-col">
      <div className="text-[15px] font-extrabold tracking-wide text-slate-800">
        DUE ACTIVITY
      </div>

      <hr className="border-t border-slate-200 my-4 -mx-6" />

      <div
        className={`flex-1 flex flex-col ${
          activities.length ? "justify-start" : "justify-center"
        }`}
      >
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-1.5 text-slate-500">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5B6B6C"
              strokeWidth={1.5}
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <div className="font-bold text-slate-800 text-sm">
              Nothing due
            </div>
            <div className="text-xs max-w-[220px] leading-relaxed">
              Upcoming deadlines and activities will appear here as they come
              up.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {activities.map((a, i) => (
              <div
                key={`${a.title}-${i}`}
                className="flex justify-between gap-3 py-2.5 border-t border-slate-200 text-[13px] text-slate-700"
              >
                <span>{a.title}</span>
                <span className="text-slate-500">{a.due}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}