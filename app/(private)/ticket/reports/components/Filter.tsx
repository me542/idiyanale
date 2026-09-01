"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Download } from "lucide-react";

export interface DateRange {
  from: string; // "YYYY-MM-DD"
  to: string;
}

interface FilterProps {
  onFilterChange?: (range: DateRange) => void;
  onClear?: () => void;
  onDownload?: () => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PRESETS = [
  "Today",
  "Last 3 Days",
  "Last 7 Days",
  "Last 30 Days",
  "Last 3 Months",
  "Last 6 Months",
  "Last 1 Year",
] as const;

function toDateStr(d: Date) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDateStr(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(s: string) {
  if (!s) return "";
  const d = parseDateStr(s);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPresetRange(preset: (typeof PRESETS)[number]): DateRange {
  const now = new Date();
  const to = toDateStr(now);
  const start = new Date(now);

  switch (preset) {
    case "Today":
      return { from: to, to };
    case "Last 3 Days":
      start.setDate(now.getDate() - 2);
      break;
    case "Last 7 Days":
      start.setDate(now.getDate() - 6);
      break;
    case "Last 30 Days":
      start.setDate(now.getDate() - 29);
      break;
    case "Last 3 Months":
      start.setMonth(now.getMonth() - 3);
      break;
    case "Last 6 Months":
      start.setMonth(now.getMonth() - 6);
      break;
    case "Last 1 Year":
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { from: toDateStr(start), to };
}

function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

/**
 * When the two endpoints fall in different months, the month containing
 * the *start* date shades every full week strictly after the start week,
 * and the month containing the *end* date shades every full week up to
 * and including the end week. When both endpoints share a month, plain
 * day-by-day range shading is used instead (handled separately below).
 */
function getShadedRowIndices(
  weeks: (number | null)[][],
  year: number,
  month: number,
  fromDate: Date | null,
  toDate: Date | null
): Set<number> {
  const shaded = new Set<number>();
  if (!fromDate || !toDate) return shaded;

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const fromInMonth =
    fromDate.getFullYear() === year && fromDate.getMonth() === month;
  const toInMonth =
    toDate.getFullYear() === year && toDate.getMonth() === month;

  if (fromInMonth && toInMonth) return shaded;

  if (fromInMonth && !toInMonth) {
    const fromRow = weeks.findIndex((week) =>
      week.some((d) => d === fromDate.getDate())
    );
    weeks.forEach((_, idx) => {
      if (idx > fromRow) shaded.add(idx);
    });
    return shaded;
  }

  if (!fromInMonth && toInMonth) {
    const toRow = weeks.findIndex((week) =>
      week.some((d) => d === toDate.getDate())
    );
    weeks.forEach((_, idx) => {
      if (idx <= toRow) shaded.add(idx);
    });
    return shaded;
  }

  if (
    monthStart.getTime() > fromDate.getTime() &&
    monthEnd.getTime() < toDate.getTime()
  ) {
    weeks.forEach((_, idx) => shaded.add(idx));
  }

  return shaded;
}

interface MonthCalendarProps {
  year: number;
  month: number;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
  from: string;
  to: string;
  onSelectDay: (dateStr: string) => void;
}

function MonthCalendar({
  year,
  month,
  onYearChange,
  onMonthChange,
  from,
  to,
  onSelectDay,
}: MonthCalendarProps) {
  const weeks = buildCalendarGrid(year, month);
  const fromDate = from ? parseDateStr(from) : null;
  const toDate = to ? parseDateStr(to) : null;
  const fromTime = fromDate ? fromDate.getTime() : null;
  const toTime = toDate ? toDate.getTime() : null;

  const sameMonthRange =
    fromDate &&
    toDate &&
    fromDate.getFullYear() === year &&
    fromDate.getMonth() === month &&
    toDate.getFullYear() === year &&
    toDate.getMonth() === month;

  const shadedRows = getShadedRowIndices(weeks, year, month, fromDate, toDate);

  const yearOptions = Array.from({ length: 12 }, (_, i) => year - 6 + i);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <select
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="cursor-pointer appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        <div className="relative">
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="cursor-pointer appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {WEEKDAYS.map((w, idx) => (
              <th
                key={`${w}-${idx}`}
                className="pb-2 text-center text-sm font-semibold text-slate-700"
              >
                {w}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {weeks.map((week, wIdx) => {
            const realIndices = week.reduce<number[]>((acc, d, i) => {
              if (d !== null) acc.push(i);
              return acc;
            }, []);
            const firstRealIdx = realIndices[0];
            const lastRealIdx = realIndices[realIndices.length - 1];
            const rowIsShaded = shadedRows.has(wIdx);

            return (
              <tr key={wIdx}>
                {week.map((day, dIdx) => {
                  if (day === null) {
                    return <td key={dIdx} className="h-11 w-11" />;
                  }

                  const cellDate = new Date(year, month, day);
                  const cellTime = cellDate.getTime();
                  const cellStr = toDateStr(cellDate);

                  const isFrom = from === cellStr;
                  const isTo = to === cellStr;
                  const isEndpoint = isFrom || isTo;

                  const inSameMonthRange =
                    sameMonthRange &&
                    fromTime !== null &&
                    toTime !== null &&
                    cellTime > fromTime &&
                    cellTime < toTime;

                  const shaded = rowIsShaded || inSameMonthRange;

                  return (
                    <td key={dIdx} className="h-11 w-11 p-0 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectDay(cellStr)}
                        className={[
                          "flex h-11 w-11 items-center justify-center text-sm transition-colors",
                          isEndpoint
                            ? "bg-blue-700 font-semibold text-white"
                            : shaded
                            ? "bg-blue-50 text-slate-700"
                            : "text-slate-700 hover:bg-slate-100",
                          !isEndpoint && shaded && dIdx === firstRealIdx
                            ? "rounded-l-md"
                            : "",
                          !isEndpoint && shaded && dIdx === lastRealIdx
                            ? "rounded-r-md"
                            : "",
                          isEndpoint ? "rounded-md" : "",
                        ].join(" ")}
                      >
                        {day}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Filter({
  onFilterChange,
  onClear,
  onDownload,
}: FilterProps) {
  const [open, setOpen] = useState(false);

  // Applied (committed) range — shown in the trigger input
  const [appliedRange, setAppliedRange] = useState<DateRange>({
    from: "",
    to: "",
  });

  // Pending (in-progress) range — edited inside the dropdown, discarded on Cancel
  const [pendingRange, setPendingRange] = useState<DateRange>({
    from: "",
    to: "",
  });

  const [activePreset, setActivePreset] = useState<string | null>(null);

  const today = new Date();
  const [fromView, setFromView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [toView, setToView] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1 > 11 ? 0 : today.getMonth() + 1,
  });

  // Lock page scroll while the modal is open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openPicker() {
    setPendingRange(appliedRange);
    setOpen(true);
  }

  function handlePresetClick(preset: (typeof PRESETS)[number]) {
    setActivePreset(preset);
    const range = getPresetRange(preset);
    setPendingRange(range);

    const fromDate = parseDateStr(range.from);
    setFromView({ year: fromDate.getFullYear(), month: fromDate.getMonth() });
    const toDate = parseDateStr(range.to);
    setToView({ year: toDate.getFullYear(), month: toDate.getMonth() });
  }

  function handleSelectDay(dateStr: string) {
    setActivePreset(null);
    setPendingRange((prev) => {
      if (!prev.from || (prev.from && prev.to)) {
        return { from: dateStr, to: "" };
      }
      if (dateStr < prev.from) {
        return { from: dateStr, to: prev.from };
      }
      return { from: prev.from, to: dateStr };
    });
  }

  function handleClearFilters() {
    setPendingRange({ from: "", to: "" });
    setActivePreset(null);
  }

  function handleCancel() {
    setPendingRange(appliedRange);
    setOpen(false);
  }

  function handleApply() {
    setAppliedRange(pendingRange);
    onFilterChange?.(pendingRange);
    setOpen(false);
  }

  const displayText =
    appliedRange.from && appliedRange.to
      ? `${formatDisplay(appliedRange.from)}  —  ${formatDisplay(
          appliedRange.to
        )}`
      : "Select date range";

  return (
    <div className="flex w-full items-center justify-between">
      {/* Left: date range trigger */}
      <div className="inline-block">
        <button
          type="button"
          onClick={openPicker}
          className="flex min-w-[280px] items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-md outline-none hover:border-slate-300"
        >
          <span className={appliedRange.from ? "" : "text-slate-400"}>
            {displayText}
          </span>
        </button>
      </div>

      {/* Centered modal with blurred backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={handleCancel}
        >
          <div
            className="flex w-[900px] max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar */}
            <div className="w-52 shrink-0 border-r border-slate-100 py-2">
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-semibold text-slate-800">
                  Customised
                </span>
                <ChevronDown
                  size={16}
                  className="-rotate-90 text-slate-400"
                />
              </div>
              <div className="border-t border-slate-100" />

              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`block w-full border-t border-slate-100 px-5 py-3 text-left text-sm first:border-t-0 ${
                    activePreset === preset
                      ? "font-semibold text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Main panel */}
            <div className="flex-1 p-6">
              {/* Top bar */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700">
                  <span className={pendingRange.from ? "" : "text-slate-400"}>
                    {pendingRange.from
                      ? formatDisplay(pendingRange.from)
                      : "Start date"}
                  </span>
                  <span className="text-slate-300">—</span>
                  <span className={pendingRange.to ? "" : "text-slate-400"}>
                    {pendingRange.to
                      ? formatDisplay(pendingRange.to)
                      : "End date"}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!pendingRange.from || !pendingRange.to}
                    className="rounded-md bg-blue-200 px-5 py-2 text-sm font-semibold text-blue-800 transition-colors enabled:bg-blue-600 enabled:text-white enabled:hover:bg-blue-700 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Calendars */}
              <div className="grid grid-cols-2 gap-10">
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    From
                  </p>
                  <MonthCalendar
                    year={fromView.year}
                    month={fromView.month}
                    onYearChange={(y) =>
                      setFromView((v) => ({ ...v, year: y }))
                    }
                    onMonthChange={(m) =>
                      setFromView((v) => ({ ...v, month: m }))
                    }
                    from={pendingRange.from}
                    to={pendingRange.to}
                    onSelectDay={handleSelectDay}
                  />
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    To
                  </p>
                  <MonthCalendar
                    year={toView.year}
                    month={toView.month}
                    onYearChange={(y) => setToView((v) => ({ ...v, year: y }))}
                    onMonthChange={(m) =>
                      setToView((v) => ({ ...v, month: m }))
                    }
                    from={pendingRange.from}
                    to={pendingRange.to}
                    onSelectDay={handleSelectDay}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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