"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface FilterProps {
  options?: string[];
  onFilterChange?: (value: string) => void;
  onClear?: () => void;
  onDownload?: () => void;
}

export default function Filter({
  options = [""],
  onFilterChange,
  onClear,
  onDownload,
}: FilterProps) {
  const [value, setValue] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue(e.target.value);
    onFilterChange?.(e.target.value);
  }

  function handleClear() {
    setValue("");
    onClear?.();
  }

  return (
    <div className="flex w-full items-center justify-between">
      {/* Left: Filter + Clear */}
      <div className="flex items-center gap-2">
        <div className="flex w-64 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-md">
          <span className="whitespace-nowrap text-sm font-semibold tracking-wide text-slate-700">
            FILTER :
          </span>

          <select
            value={value}
            onChange={handleChange}
            className="w-full border-b border-slate-200 bg-transparent py-1 text-sm text-slate-600 outline-none"
          >
            <option value="" disabled hidden></option>

            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold tracking-wide text-emerald-800 shadow-md transition-colors hover:bg-emerald-50"
        >
          CLEAR FILTER
        </button>
      </div>

      {/* Right: Download */}
      <button
        type="button"
        onClick={onDownload}
        className="flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold tracking-wide text-white shadow-md transition-colors hover:bg-emerald-800"
      >
        <Download size={17} strokeWidth={2.5} />
        DOWNLOAD
      </button>
    </div>
  );
}

