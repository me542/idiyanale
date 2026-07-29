"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Filter, X, Download, Loader2 } from "lucide-react";

type Ticket = {
  ID: number;
  TicketID: string;
  ProjectID: number;
  InstitutionID: number;
  InstitutionPool: number;
  TicketTypeID: number;
  CategoryID: number;
  SubCategoryID: number;

  Subject: string;
  Description: string;
  DueDate: string | null;

  SubmitterID: number;
  ResolverID: number;
  EndorserID: number;
  ApproverID: number;

  Status: string;

  CreatedAt: string;
  UpdatedAt: string;

  CancelledBy: string;
  CancelledAt: string | null;
  CancellationReason: string;

  StartedAt: string | null;
  ResolvedAt: string | null;
  ResolutionTime: string;

  OnHold: boolean;
  HoldAt: string | null;

  ClosedBy: string;
  ClosedAt: string | null;

  EndorsedAt: string | null;
  ApprovedAt: string | null;
};

// TODO: Replace with your API response.
const tickets: Ticket[] = [];

type ColumnType = "text" | "number" | "date" | "boolean" | "status";

type ColumnDef = {
  key: keyof Ticket;
  label: string;
  type: ColumnType;
};

const columns: ColumnDef[] = [
  { key: "ID", label: "ID", type: "number" },
  { key: "TicketID", label: "Ticket ID", type: "text" },
  { key: "ProjectID", label: "Project", type: "number" },
  { key: "InstitutionID", label: "Institution", type: "number" },
  { key: "InstitutionPool", label: "Institution Pool", type: "number" },
  { key: "TicketTypeID", label: "Ticket Type", type: "number" },
  { key: "CategoryID", label: "Category", type: "number" },
  { key: "SubCategoryID", label: "Subcategory", type: "number" },

  { key: "Subject", label: "Subject", type: "text" },
  { key: "Description", label: "Description", type: "text" },
  { key: "DueDate", label: "Date Needed", type: "date" },

  { key: "SubmitterID", label: "Submitter", type: "number" },
  { key: "EndorserID", label: "Endorser", type: "number" },
  { key: "ApproverID", label: "Approver", type: "number" },
  { key: "ResolverID", label: "Resolver", type: "number" },

  { key: "Status", label: "Status", type: "status" },

  { key: "CreatedAt", label: "Created At", type: "date" },
  { key: "UpdatedAt", label: "Updated At", type: "date" },

  { key: "EndorsedAt", label: "Endorsed At", type: "date" },
  { key: "ApprovedAt", label: "Approved At", type: "date" },

  { key: "StartedAt", label: "Started At", type: "date" },
  { key: "ResolvedAt", label: "Resolved At", type: "date" },
  { key: "ResolutionTime", label: "Resolution Time", type: "text" },

  { key: "OnHold", label: "On Hold", type: "boolean" },
  { key: "HoldAt", label: "Hold At", type: "date" },

  { key: "CancelledBy", label: "Cancelled By", type: "text" },
  { key: "CancelledAt", label: "Cancelled At", type: "date" },
  { key: "CancellationReason", label: "Cancellation Reason", type: "text" },

  { key: "ClosedBy", label: "Closed By", type: "text" },
  { key: "ClosedAt", label: "Closed At", type: "date" },
];

type SortDirection = "asc" | "desc" | null;

type SortState = {
  key: keyof Ticket | null;
  direction: SortDirection;
};

type TextFilter = { kind: "text"; value: string };
type NumberFilter = { kind: "number"; value: string };
type BooleanFilter = { kind: "boolean"; value: "all" | "yes" | "no" };
type StatusFilter = { kind: "status"; value: string };
type DateFilter = { kind: "date"; from: string; to: string };

type FilterValue = TextFilter | NumberFilter | BooleanFilter | StatusFilter | DateFilter;

type FiltersState = Partial<Record<keyof Ticket, FilterValue>>;

function emptyFilterFor(type: ColumnType): FilterValue {
  switch (type) {
    case "text":
      return { kind: "text", value: "" };
    case "number":
      return { kind: "number", value: "" };
    case "boolean":
      return { kind: "boolean", value: "all" };
    case "status":
      return { kind: "status", value: "" };
    case "date":
      return { kind: "date", from: "", to: "" };
  }
}

function isFilterActive(f: FilterValue) {
  if (f.kind === "text" || f.kind === "number" || f.kind === "status") return f.value !== "";
  if (f.kind === "boolean") return f.value !== "all";
  if (f.kind === "date") return f.from !== "" || f.to !== "";
  return false;
}

function formatValue(value: Ticket[keyof Ticket]) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

function toDateOnly(value: string) {
  // value like "2024-05-01T10:30:00Z" or "2024-05-01"
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function datePreset(preset: string): { from: string; to: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  switch (preset) {
    case "today": {
      const d = fmt(today);
      return { from: d, to: d };
    }
    case "last7": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: fmt(from), to: fmt(today) };
    }
    case "last30": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: fmt(from), to: fmt(today) };
    }
    case "thisMonth": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: fmt(from), to: fmt(today) };
    }
    case "lastMonth": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: fmt(from), to: fmt(to) };
    }
    default:
      return { from: "", to: "" };
  }
}

const DATE_PRESETS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
];

export default function TicketsTable() {
  const [sort, setSort] = useState<SortState>({ key: null, direction: null });
  const [filters, setFilters] = useState<FiltersState>({});
  const [openFilter, setOpenFilter] = useState<keyof Ticket | null>(null);
  const [filterAnchorRect, setFilterAnchorRect] = useState<DOMRect | null>(null);

  // Close the open filter popover (and drop its anchor) if the user
  // scrolls or resizes the window, since a stale fixed position would
  // otherwise float in the wrong place.
  useEffect(() => {
    if (!openFilter) return;
    const close = () => {
      setOpenFilter(null);
      setFilterAnchorRect(null);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openFilter]);

  // --- Download / export state ---
  const [confirmDownloadOpen, setConfirmDownloadOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.Status) set.add(t.Status);
    });
    return Array.from(set).sort();
  }, []);

  function getFilter(key: keyof Ticket, type: ColumnType): FilterValue {
    return filters[key] ?? emptyFilterFor(type);
  }

  function updateFilter(key: keyof Ticket, value: FilterValue) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilter(key: keyof Ticket, type: ColumnType) {
    setFilters((prev) => ({ ...prev, [key]: emptyFilterFor(type) }));
  }

  function clearAllFilters() {
    setFilters({});
  }

  function toggleSort(key: keyof Ticket) {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      if (prev.direction === "desc") return { key: null, direction: null };
      return { key, direction: "asc" };
    });
  }

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((f) => f && isFilterActive(f)).length;
  }, [filters]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      for (const col of columns) {
        const f = filters[col.key];
        if (!f) continue;
        const raw = ticket[col.key];

        if (f.kind === "text") {
          if (!f.value) continue;
          const cell = raw === null || raw === undefined ? "" : String(raw);
          if (!cell.toLowerCase().includes(f.value.toLowerCase())) return false;
        } else if (f.kind === "number") {
          if (!f.value) continue;
          const cell = raw === null || raw === undefined ? "" : String(raw);
          if (!cell.includes(f.value)) return false;
        } else if (f.kind === "status") {
          if (!f.value) continue;
          if (String(raw ?? "") !== f.value) return false;
        } else if (f.kind === "boolean") {
          if (f.value === "all") continue;
          const wantYes = f.value === "yes";
          if (Boolean(raw) !== wantYes) return false;
        } else if (f.kind === "date") {
          if (!f.from && !f.to) continue;
          if (!raw) return false;
          const cellDate = toDateOnly(String(raw));
          if (f.from && cellDate < f.from) return false;
          if (f.to && cellDate > f.to) return false;
        }
      }
      return true;
    });
  }, [filters]);

  const sortedTickets = useMemo(() => {
    if (!sort.key || !sort.direction) return filteredTickets;
    const key = sort.key;
    const dir = sort.direction === "asc" ? 1 : -1;

    return [...filteredTickets].sort((a, b) => {
      const av = a[key];
      const bv = b[key];

      if (av === null || av === undefined || av === "") return 1;
      if (bv === null || bv === undefined || bv === "") return -1;

      if (typeof av === "boolean" && typeof bv === "boolean") {
        return (Number(av) - Number(bv)) * dir;
      }
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }

      const aStr = String(av);
      const bStr = String(bv);
      return aStr.localeCompare(bStr, undefined, { numeric: true }) * dir;
    });
  }, [filteredTickets, sort]);

  // --- Export logic ---
  // Exports whatever is currently in `sortedTickets`, so if filters are
  // active, only the filtered/sorted rows are exported.
  async function performDownload() {
    setIsDownloading(true);
    try {
      const XLSX = await import("xlsx");

      const rows = sortedTickets.map((ticket) => {
        const row: Record<string, string | number> = {};
        columns.forEach((col) => {
          const raw = ticket[col.key];
          row[col.label] =
            raw === null || raw === undefined
              ? ""
              : typeof raw === "boolean"
              ? raw
                ? "Yes"
                : "No"
              : (raw as string | number);
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

      const dateStr = new Date().toISOString().slice(0, 10);
      const filenameSuffix = activeFilterCount > 0 ? "filtered" : "all";
      XLSX.writeFile(workbook, `tickets-${filenameSuffix}-${dateStr}.xlsx`);

      setConfirmDownloadOpen(false);
    } catch (err) {
      console.error("Failed to export tickets to Excel:", err);
      alert("Something went wrong while generating the Excel file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 shadow-md">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-6 py-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-gray-900">Tickets</h2>
          <span className="text-sm text-gray-400">
            {sortedTickets.length} of {tickets.length} total
          </span>
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
          </button>
        )}
        <button
          onClick={() => setConfirmDownloadOpen(true)}
          disabled={sortedTickets.length === 0}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1800px] border-collapse text-sm">
          <thead>
            <tr className="bg-white/900">
              {columns.map((col) => {
                const isSorted = sort.key === col.key;
                const filter = getFilter(col.key, col.type);
                const isActive = isFilterActive(filter);
                const isOpen = openFilter === col.key;

                return (
                  <th
                    key={col.key}
                    className="relative whitespace-nowrap px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleSort(col.key)}
                        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-800"
                      >
                        {col.label}
                        {isSorted && sort.direction === "asc" && (
                          <ChevronUp className="h-3.5 w-3.5" />
                        )}
                        {isSorted && sort.direction === "desc" && (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                        {!isSorted && (
                          <ChevronsUpDown className="h-3.5 w-3.5 text-gray-300" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          if (openFilter === col.key) {
                            setOpenFilter(null);
                            setFilterAnchorRect(null);
                          } else {
                            setFilterAnchorRect(e.currentTarget.getBoundingClientRect());
                            setOpenFilter(col.key);
                          }
                        }}
                        className={`rounded p-0.5 hover:bg-gray-200 ${
                          isActive ? "text-gray-900" : "text-gray-400"
                        }`}
                        aria-label={`Filter ${col.label}`}
                      >
                        <Filter
                          className="h-3.5 w-3.5"
                          fill={isActive ? "currentColor" : "none"}
                        />
                      </button>
                    </div>

                    {isOpen && filterAnchorRect && (
                      <ColumnFilterPopover
                        col={col}
                        filter={filter}
                        anchorRect={filterAnchorRect}
                        onChange={(v) => updateFilter(col.key, v)}
                        onClear={() => clearFilter(col.key, col.type)}
                        onClose={() => {
                          setOpenFilter(null);
                          setFilterAnchorRect(null);
                        }}
                        statusOptions={statusOptions}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {sortedTickets.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center text-sm text-gray-400"
                >
                  {tickets.length === 0
                    ? "No tickets yet. New tickets will show up here."
                    : "No tickets match the current filters."}
                </td>
              </tr>
            ) : (
              sortedTickets.map((ticket) => (
                <tr
                  key={ticket.TicketID}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="whitespace-nowrap px-4 py-3 text-gray-700"
                    >
                      {formatValue(ticket[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {confirmDownloadOpen && (
        <DownloadConfirmDialog
          rowCount={sortedTickets.length}
          totalCount={tickets.length}
          isFiltered={activeFilterCount > 0}
          isDownloading={isDownloading}
          onCancel={() => setConfirmDownloadOpen(false)}
          onConfirm={performDownload}
        />
      )}
    </div>
  );
}

function DownloadConfirmDialog({
  rowCount,
  totalCount,
  isFiltered,
  isDownloading,
  onCancel,
  onConfirm,
}: {
  rowCount: number;
  totalCount: number;
  isFiltered: boolean;
  isDownloading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-gray-900">Download tickets as Excel?</h3>

        <p className="mt-2 text-sm text-gray-600">
          {isFiltered ? (
            <>
              You have active filters. This will download{" "}
              <span className="font-medium text-gray-900">{rowCount}</span> filtered row
              {rowCount !== 1 ? "s" : ""} (out of {totalCount} total) as an{" "}
              <span className="font-medium text-gray-900">.xlsx</span> file.
            </>
          ) : (
            <>
              This will download all{" "}
              <span className="font-medium text-gray-900">{rowCount}</span> ticket
              {rowCount !== 1 ? "s" : ""} as an <span className="font-medium text-gray-900">.xlsx</span> file.
            </>
          )}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isDownloading}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDownloading}
            className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isDownloading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isDownloading ? "Preparing..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ColumnFilterPopover({
  col,
  filter,
  anchorRect,
  onChange,
  onClear,
  onClose,
  statusOptions,
}: {
  col: ColumnDef;
  filter: FilterValue;
  anchorRect: DOMRect;
  onChange: (v: FilterValue) => void;
  onClear: () => void;
  onClose: () => void;
  statusOptions: string[];
}) {
  const inputBase =
    "w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-gray-400 focus:outline-none";

  return (
    <div
      className="fixed z-20 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg normal-case"
      style={{
        top: `${anchorRect.bottom + 4}px`,
        left: `${anchorRect.left}px`,
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">Filter {col.label}</span>
        <button onClick={onClose} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {filter.kind === "text" && (
        <input
          autoFocus
          type="text"
          value={filter.value}
          onChange={(e) => onChange({ kind: "text", value: e.target.value })}
          placeholder="Contains..."
          className={inputBase}
        />
      )}

      {filter.kind === "number" && (
        <input
          autoFocus
          type="text"
          inputMode="numeric"
          value={filter.value}
          onChange={(e) => onChange({ kind: "number", value: e.target.value })}
          placeholder="Contains..."
          className={inputBase}
        />
      )}

      {filter.kind === "boolean" && (
        <select
          value={filter.value}
          onChange={(e) =>
            onChange({ kind: "boolean", value: e.target.value as "all" | "yes" | "no" })
          }
          className={inputBase}
        >
          <option value="all">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      )}

      {filter.kind === "status" && (
        <select
          value={filter.value}
          onChange={(e) => onChange({ kind: "status", value: e.target.value })}
          className={inputBase}
        >
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}

      {filter.kind === "date" && (
        <>
          <div className="mb-2 flex flex-wrap gap-1">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => onChange({ kind: "date", ...datePreset(p.key) })}
                className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 hover:border-gray-400 hover:text-gray-900"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-gray-500">
              From: 
              <input
                type="date"
                value={filter.from}
                onChange={(e) => onChange({ kind: "date", from: e.target.value, to: filter.to })}
                className="mt-0.5 w-50 rounded-md border border-gray-300 px-1 py-1 text-xs"
              />
            </label>
            <label className="block text-[11px] font-medium text-gray-500">
              To: 
              <input
                type="date"
                value={filter.to}
                onChange={(e) => onChange({ kind: "date", from: filter.from, to: e.target.value })}
                className="mt-0.5 w-54 rounded-md border border-gray-300 px-1 py-1 text-xs"
              />
            </label>
          </div>
        </>
      )}

      <div className="mt-3 flex justify-between border-t border-gray-100 pt-2">
        <button
          onClick={onClear}
          className="text-[11px] font-medium text-gray-500 hover:text-gray-800"
        >
          Clear
        </button>
        <button
          onClick={onClose}
          className="rounded-md bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-gray-800"
        >
          Done
        </button>
      </div>
    </div>
  );
}