"use client";
import { useState } from "react";

interface FilterProps {
  options?: string[];
  onFilterChange?: (value: string) => void;
  onClear?: () => void;
}

export default function Filter({
  options = [""],
  onFilterChange,
  onClear,
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
    // Outer wrapper: no longer full width, content hugs the left
    <div className="flex justify-start">
      <div className="flex items-center gap-2 w-fit">
        <div className="flex items-center gap-3 border border-slate-200 rounded-xl bg-white px-4 py-3 shadow-md w-64">
          <span className="text-sm font-semibold tracking-wide text-slate-700 whitespace-nowrap">
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
          onClick={handleClear}
          className="whitespace-nowrap border border-slate-200 rounded-full bg-white px-6 py-3 text-sm font-semibold tracking-wide text-emerald-800 shadow-md hover:bg-emerald-50 transition-colors"
        >
          CLEAR FILTER
        </button>
      </div>
    </div>
  );
}