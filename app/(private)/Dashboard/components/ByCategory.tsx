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
  const strokeWidth = 18;

  const circumference = 2 * Math.PI * r;
  const hasData = categories.length > 0 && total > 0;

  return (
    <div>
      <div className="text-[15px] font-extrabold tracking-wide text-slate-800">
        BY CATEGORY
      </div>

      <hr className="border-t border-slate-200 my-4" />

      {loading ? (
        <div className="text-xs text-slate-500">
          Loading categories…
        </div>
      ) : error ? (
        <div className="text-xs text-red-500">
          {error}
        </div>
      ) : (
        <div className="flex items-center gap-5 flex-wrap">
          {/* Donut */}
          <div
            className="relative shrink-0"
            style={{
              width: size,
              height: size,
            }}
          >
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="block"
            >
              {/* Rotate donut so it starts at 12 o'clock */}
              <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                {hasData ? (
                  <>
                    {categories.map((category, index) => {
                      const categoryLength =
                        (category.count / total) * circumference;

                      const previousLength = categories
                        .slice(0, index)
                        .reduce(
                          (sum, item) =>
                            sum + (item.count / total) * circumference,
                          0
                        );

                      return (
                        <circle
                          key={category.label}
                          cx={size / 2}
                          cy={size / 2}
                          r={r}
                          fill="none"
                          stroke={category.color}
                          strokeWidth={strokeWidth}
                          strokeLinecap="butt"
                          strokeDasharray={`${categoryLength} ${
                            circumference - categoryLength
                          }`}
                          strokeDashoffset={-previousLength}
                        />
                      );
                    })}
                  </>
                ) : (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="#E7ECEE"
                    strokeWidth={strokeWidth}
                  />
                )}
              </g>
            </svg>

            {/* Center value */}
            <div
              className={`absolute inset-0 flex items-center justify-center font-extrabold ${
                hasData
                  ? "text-blue-600 text-[26px]"
                  : "text-slate-500 text-[13px]"
              }`}
            >
              {hasData ? total : "No data"}
            </div>
          </div>

          {/* Category legend */}
          <div className="flex-1 min-w-[150px]">
            {hasData ? (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.label}
                    className="flex justify-between items-center gap-4 text-[13px] text-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-[9px] h-[9px] rounded-full inline-block shrink-0"
                        style={{
                          backgroundColor: category.color,
                        }}
                      />

                      <span>{category.label}</span>
                    </span>

                    <strong className="whitespace-nowrap text-slate-700">
                      {category.count} = {category.pct}%
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                No category data to show yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}