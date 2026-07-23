'use client';

import React from 'react';

interface TicketData {
  name: string;
  serviceRequest: number;
  changedRequest: number;
  incidentReport: number;
}

const COLORS = {
  serviceRequest: '#6FCF97',
  changedRequest: '#4E8FF0',
  incidentReport: '#EB6A6A',
};

const LEGEND_ITEMS = [
  { key: 'serviceRequest', label: 'Service Request', color: COLORS.serviceRequest },
  { key: 'changedRequest', label: 'Changed Request', color: COLORS.changedRequest },
  { key: 'incidentReport', label: 'Incident Report', color: COLORS.incidentReport },
] as const;

const TicketChart = () => {
  // Fed by the API — empty until real ticket data comes in.
  const data: TicketData[] = [];

  const hasData = data.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Ticket</h3>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center min-h-[250px] bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <div className="text-center px-4">
            <p className="text-sm font-medium text-gray-400">No ticket data</p>
            <p className="text-xs text-gray-400 mt-1">
              Data will appear here once tickets are recorded.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col justify-center gap-8">
            {data.map((row) => {
              const total = row.serviceRequest + row.changedRequest + row.incidentReport;
              const segments = LEGEND_ITEMS.map((item) => ({
                ...item,
                value: row[item.key as keyof Omit<TicketData, 'name'>],
              }));

              return (
                <div key={row.name}>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    {row.name}
                  </p>
                  {total === 0 ? (
                    <div className="h-9 rounded-md bg-gray-100" />
                  ) : (
                    <div className="flex h-9 w-full overflow-hidden rounded-md">
                      {segments
                        .filter((seg) => seg.value > 0)
                        .map((seg) => (
                          <div
                            key={seg.key}
                            style={{
                              width: `${(seg.value / total) * 100}%`,
                              backgroundColor: seg.color,
                            }}
                            title={`${seg.label}: ${seg.value}`}
                          />
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TicketChart;