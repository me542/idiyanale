"use client";
import { CategoryItem } from "./types";

interface Props {
  categories?: CategoryItem[];
  total?: number;
  loading?: boolean;
  error?: string | null;
}

export default function ByCategory({
  categories = [],
  total = 0,
  loading = false,
  error = null,
}: Props) {
  const size = 130;
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const hasData = categories.length > 0 && total > 0;

  let offset = 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6">
      <div className="text-[15px] font-extrabold tracking-wide text-slate-800">
        BY CATEGORY
      </div>

      <hr className="border-t border-slate-200 my-4 -mx-6" />

      {loading ? (
        <div className="text-xs text-slate-500">Loading categories…</div>
      ) : error ? (
        <div className="text-xs text-red-500">{error}</div>
      ) : (
        <div className="flex items-center gap-5 flex-wrap">
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={hasData ? { transform: "rotate(-90deg)" } : undefined}
            >
              {hasData ? (
                categories.map((c) => {
                  const len = (c.count / total) * circumference;
                  const dashOffset = -offset;
                  offset += len;
                  return (
                    <circle
                      key={c.label}
                      cx={size / 2}
                      cy={size / 2}
                      r={r}
                      fill="none"
                      stroke={c.color}
                      strokeWidth={18}
                      strokeDasharray={`${len} ${circumference - len}`}
                      strokeDashoffset={dashOffset}
                    />
                  );
                })
              ) : (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke="#E7ECEE"
                  strokeWidth={18}
                />
              )}
            </svg>
            <div
              className={`absolute inset-0 flex items-center justify-center font-extrabold ${
                hasData ? "text-blue-600 text-[26px]" : "text-slate-500 text-[13px]"
              }`}
            >
              {hasData ? total : "No data"}
            </div>
          </div>

          <div className="flex-1 min-w-[150px]">
            {hasData ? (
              categories.map((c) => (
                <div
                  key={c.label}
                  className="flex justify-between gap-4 text-[13px] py-[3px] text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-[9px] h-[9px] rounded-sm inline-block"
                      style={{ background: c.color }}
                    />
                    {c.label}
                  </span>
                  <strong>
                    {c.count} = {c.pct}%
                  </strong>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500">No category data to show yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}