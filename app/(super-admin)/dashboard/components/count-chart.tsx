'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface StatusItem {
  label: string;
  color: string;
  value: number;
  // Only items with sliceOfPie are drawn in the donut.
  // The others (e.g. totals) are shown in the list only.
  sliceOfPie?: boolean;
}

type Period = '1d' | '7d' | '1m' | 'custom';

const PERIOD_LABEL: Record<Period, string> = {
  '1d': '1 day',
  '7d': '7 days',
  '1m': '1 month',
  custom: 'Custom',
};

// No backend wired up yet, so every period starts empty (all zeros).
// The shape (labels/colors) is kept so the UI is ready to go the moment
// a real API response is dropped in — just replace these values, or
// better, replace DATA_BY_PERIOD/fetchStatusesForRange with an actual
// fetch call keyed on period (and the custom date range).
function emptyStatuses(): StatusItem[] {
  return [
    { label: 'Service Request', color: '#10b981', value: 0 },
    { label: 'Changed Request', color: '#3b82f6', value: 0 },
    { label: 'Incident Report', color: '#ef4444', value: 0 },
    { label: 'Total Ticket', color: '#8b5cf6', value: 0 },
    { label: 'For Review', color: '#f59e0b', value: 0, sliceOfPie: true },
    { label: 'In Progress', color: '#ec4899', value: 0, sliceOfPie: true },
    { label: 'Resolved', color: '#06b6d4', value: 0, sliceOfPie: true },
    { label: 'Closed', color: '#6b7280', value: 0, sliceOfPie: true },
    { label: 'Cancelled', color: '#dc2626', value: 0, sliceOfPie: true },
  ];
}

const DATA_BY_PERIOD: Record<Exclude<Period, 'custom'>, StatusItem[]> = {
  '1d': emptyStatuses(),
  '7d': emptyStatuses(),
  '1m': emptyStatuses(),
};

const PERIOD_OPTIONS: Period[] = ['1d', '7d', '1m', 'custom'];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fetchStatusesForRange(start: string, end: string): StatusItem[] {
  // Placeholder until there's a real endpoint: no backend yet, so
  // every custom range comes back empty too.
  void start;
  void end;
  return emptyStatuses();
}

// compute initial date range once at module evaluation to avoid calling
// impure Date.now during render
const INITIAL_CUSTOM_START = formatDate(new Date(Date.now() - 6 * 86400000));
const INITIAL_CUSTOM_END = formatDate(new Date());

const CountChart = () => {
  const [period, setPeriod] = useState<Period>('7d');
  const [menuOpen, setMenuOpen] = useState(false);
  const [customStart, setCustomStart] = useState(INITIAL_CUSTOM_START);
  const [customEnd, setCustomEnd] = useState(INITIAL_CUSTOM_END);
  const [appliedCustomStart, setAppliedCustomStart] = useState(INITIAL_CUSTOM_START);
  const [appliedCustomEnd, setAppliedCustomEnd] = useState(INITIAL_CUSTOM_END);
  const menuRef = useRef<HTMLDivElement>(null);

  const statuses = useMemo(() => {
    if (period === 'custom') {
      return fetchStatusesForRange(appliedCustomStart, appliedCustomEnd);
    }
    return DATA_BY_PERIOD[period];
  }, [period, appliedCustomStart, appliedCustomEnd]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectPeriod(p: Period) {
    setPeriod(p);
    if (p !== 'custom') {
      setMenuOpen(false);
    }
  }

  function applyCustomRange() {
    setAppliedCustomStart(customStart);
    setAppliedCustomEnd(customEnd);
    setMenuOpen(false);
  }

  const pieData = statuses.filter((s) => s.sliceOfPie);
  const totalTicketItem = statuses.find((s) => s.label === 'Total Ticket');
  const totalTicketValue = totalTicketItem?.value ?? 0;
  const hasData = totalTicketValue > 0;

  // When there's no data, still draw a ring (flat gray) rather than
  // swapping the chart out for a plain box, and centre a "No data" label.
  const chartData = hasData ? pieData : [{ label: 'No data', color: '#e5e7eb', value: 1 }];

  const triggerLabel =
    period === 'custom' && (customStart || customEnd)
      ? `${customStart || '...'} → ${customEnd || '...'}`
      : PERIOD_LABEL[period];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Count</h3>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="text-xs px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-600 flex items-center gap-2 hover:bg-gray-50"
          >
            <span>{triggerLabel}</span>
            <svg
              className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-1">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => selectPeriod(p)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-md hover:bg-gray-50 ${
                    period === p ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {PERIOD_LABEL[p]}
                </button>
              ))}

              {period === 'custom' && (
                <div className="border-t border-gray-100 mt-1 pt-2 px-2 pb-1 space-y-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      max={customEnd}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded-md text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      min={customStart}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded-md text-gray-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyCustomRange}
                    className="w-full text-xs px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                  >
                    Apply range
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="lg:col-span-2 relative">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={hasData ? 2 : 0}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {hasData ? (
              <span className="text-3xl font-bold text-blue-500">{totalTicketValue}</span>
            ) : (
              <span className="text-sm font-medium text-gray-400">No data</span>
            )}
          </div>
        </div>

        {/* Status List */}
        <div>
          <div className="space-y-3 bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
            {statuses.map((status, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-xs text-gray-600">{status.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">{status.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountChart;