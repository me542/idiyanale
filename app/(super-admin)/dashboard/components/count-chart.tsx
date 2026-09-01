'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
  Tooltip,
} from 'recharts';

import {
  getInstitutions,
} from '@/services/integration/institution/get-all-insti';

import {
  getAllTicketsByInstitution,
  type InstitutionTicket,
} from '@/services/integration/ticket/get_all_ticket_by_insti';

interface StatusItem {
  label: string;
  color: string;
  value: number;
}

type Period = '1d' | '7d' | '1m' | 'custom';

const PERIOD_LABEL: Record<Period, string> = {
  '1d': '1 day',
  '7d': '7 days',
  '1m': '1 month',
  custom: 'Custom',
};

const COLORS = {
  serviceRequest: '#10b981',
  changedRequest: '#3b82f6',
  incidentReport: '#ef4444',
  totalTicket: '#8b5cf6',
};

const PERIOD_OPTIONS: Period[] = [
  '1d',
  '7d',
  '1m',
  'custom',
];

function formatDate(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getStartDate(
  period: Exclude<Period, 'custom'>
): string {
  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const start = new Date(today);

  if (period === '1d') {
    return formatDate(start);
  }

  if (period === '7d') {
    start.setDate(
      start.getDate() - 6
    );

    return formatDate(start);
  }

  start.setMonth(
    start.getMonth() - 1
  );

  return formatDate(start);
}

function emptyStatuses(): StatusItem[] {
  return [
    {
      label: 'Service Request',
      color: COLORS.serviceRequest,
      value: 0,
    },
    {
      label: 'Changed Request',
      color: COLORS.changedRequest,
      value: 0,
    },
    {
      label: 'Incident Report',
      color: COLORS.incidentReport,
      value: 0,
    },
    {
      label: 'Total Ticket',
      color: COLORS.totalTicket,
      value: 0,
    },
  ];
}

type TicketTooltipItem = {
  value?: number | string;
  payload?: {
    total?: number;
    color?: string;
    label?: string;
  };
};

/*
 * Custom tooltip
 *
 * This appears above the donut when
 * hovering over a ticket type.
 */
function TicketTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TicketTooltipItem[];
}): React.JSX.Element | null {
  if (!active ||
    !payload ||
    !payload.length) {
    return null;
  }

  const item = payload[0];

  const total = item.payload?.total ?? 0;

  const value = item.value ?? 0;
  const numericValue = Number(value);

  const percentage = total > 0
    ? ((numericValue / total) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 min-w-[150px]">

      {/* Ticket type */}
      <div className="flex items-center justify-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor: item.payload?.color,
          }} />

        <span className="text-xs font-semibold text-gray-800">
          {item.payload?.label}
        </span>
      </div>

      {/* Count + percentage */}
      <div className="text-center mt-1">
        <span className="text-sm font-bold text-gray-900">
          {value}
        </span>

        <span className="text-[10px] text-gray-400 ml-1">
          ({percentage}%)
        </span>
      </div>
    </div>
  );
}

interface CountChartProps {
  filters?: { institution: string; ticketType: string };
}

const CountChart = ({ filters }: CountChartProps) => {
  const [period, setPeriod] =
    useState<Period>('7d');

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [customStart, setCustomStart] =
    useState(
      formatDate(
        new Date(
          // eslint-disable-next-line react-hooks/purity
          Date.now() -
            6 * 86400000
        )
      )
    );

  const [customEnd, setCustomEnd] =
    useState(
      formatDate(new Date())
    );

  const [
    appliedCustomStart,
    setAppliedCustomStart,
  ] = useState(customStart);

  const [
    appliedCustomEnd,
    setAppliedCustomEnd,
  ] = useState(customEnd);

  const [statuses, setStatuses] =
    useState<StatusItem[]>(
      emptyStatuses()
    );

  const [loading, setLoading] =
    useState(true);

  const menuRef =
    useRef<HTMLDivElement>(null);

  /*
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  /*
   * Load ticket data
   */
  useEffect(() => {
    const loadTicketData =
      async () => {
        try {
          setLoading(true);

          let startDate: string;
          let endDate: string;

          /*
           * Determine selected date range
           */
          if (period === 'custom') {
            startDate =
              appliedCustomStart;

            endDate =
              appliedCustomEnd;
          } else {
            startDate =
              getStartDate(period);

            endDate =
              formatDate(new Date());
          }

          /*
           * Get institutions
           */
          const institutionResponse =
            await getInstitutions();

          const institutions =
            institutionResponse.response ??
            [];

          if (
            institutions.length === 0
          ) {
            setStatuses(
              emptyStatuses()
            );

            return;
          }

          /*
           * Get tickets from every institution
           * (skip institutions filtered out)
           */
          const filteredInstitutions =
            filters?.institution && filters.institution !== 'ALL'
              ? institutions.filter((i) => i.institution_name === filters.institution)
              : institutions;

          const ticketResults =
            await Promise.all(
              filteredInstitutions.map(
                async (
                  institution
                ) => {
                  try {
                    return await getAllTicketsByInstitution(
                      institution.institution_id
                    );
                  } catch (error) {
                    console.error(
                      `Failed to get tickets for ${institution.institution_name}:`,
                      error
                    );

                    return [] as InstitutionTicket[];
                  }
                }
              )
            );

          /*
           * Combine all tickets
           */
          let allTickets =
            ticketResults.flat();

          /*
           * Filter by ticket type if specified
           */
          if (filters?.ticketType && filters.ticketType !== 'ALL') {
            const typeLower = filters.ticketType.toLowerCase();
            allTickets = allTickets.filter((ticket) => {
              const ticketType = ticket.ticket_type?.ticket_type_name?.trim().toLowerCase() ?? '';
              if (typeLower === 'service request') return ticketType === 'service request';
              if (typeLower === 'changed request' || typeLower === 'change request')
                return ticketType === 'changed request' || ticketType === 'change request';
              if (typeLower === 'incident report' || typeLower === 'incident')
                return ticketType === 'incident report' || ticketType === 'incident';
              return true;
            });
          }

          /*
           * Ticket counters
           */
          let serviceRequest = 0;
          let changedRequest = 0;
          let incidentReport = 0;

          /*
           * Process tickets
           */
          allTickets.forEach(
            (ticket) => {
              if (
                !ticket.created_at
              ) {
                return;
              }

              const ticketDate =
                new Date(
                  ticket.created_at
                );

              if (
                Number.isNaN(
                  ticketDate.getTime()
                )
              ) {
                return;
              }

              const ticketDateOnly =
                formatDate(ticketDate);

              /*
               * Date filtering
               */
              if (
                ticketDateOnly <
                  startDate ||
                ticketDateOnly >
                  endDate
              ) {
                return;
              }

              /*
               * Ticket type
               */
              const ticketType =
                ticket.ticket_type?.ticket_type_name
                  ?.trim()
                  .toLowerCase() ?? '';

              if (
                ticketType ===
                'service request'
              ) {
                serviceRequest++;
              } else if (
                ticketType ===
                  'changed request' ||
                ticketType ===
                  'change request'
              ) {
                changedRequest++;
              } else if (
                ticketType ===
                  'incident report' ||
                ticketType ===
                  'incident'
              ) {
                incidentReport++;
              }
            }
          );

          /*
           * Total ticket
           */
          const totalTicket =
            serviceRequest +
            changedRequest +
            incidentReport;

          setStatuses([
            {
              label:
                'Service Request',
              color:
                COLORS.serviceRequest,
              value:
                serviceRequest,
            },
            {
              label:
                'Changed Request',
              color:
                COLORS.changedRequest,
              value:
                changedRequest,
            },
            {
              label:
                'Incident Report',
              color:
                COLORS.incidentReport,
              value:
                incidentReport,
            },
            {
              label:
                'Total Ticket',
              color:
                COLORS.totalTicket,
              value:
                totalTicket,
            },
          ]);
        } catch (error) {
          console.error(
            'Failed to load count chart:',
            error
          );

          setStatuses(
            emptyStatuses()
          );
        } finally {
          setLoading(false);
        }
      };

    loadTicketData();
  }, [
    period,
    appliedCustomStart,
    appliedCustomEnd,
    filters,
  ]);

  /*
   * Select period
   */
  function selectPeriod(
    selectedPeriod: Period
  ) {
    setPeriod(selectedPeriod);

    if (
      selectedPeriod !== 'custom'
    ) {
      setMenuOpen(false);
    }
  }

  /*
   * Apply custom date range
   */
  function applyCustomRange() {
    if (
      !customStart ||
      !customEnd
    ) {
      return;
    }

    setAppliedCustomStart(
      customStart
    );

    setAppliedCustomEnd(
      customEnd
    );

    setMenuOpen(false);
  }

  /*
   * Only ticket types are
   * displayed in donut
   */
  const pieData =
    statuses.filter(
      (status) =>
        status.label !==
        'Total Ticket'
    );

  /*
   * Total tickets
   */
  const totalTicketValue =
    statuses.find(
      (status) =>
        status.label ===
        'Total Ticket'
    )?.value ?? 0;

  const hasData =
    totalTicketValue > 0;

  /*
   * Chart data
   *
   * Include total in each item
   * so the tooltip can calculate
   * the percentage.
   */
  const chartData = hasData
    ? pieData
        .filter(
          (status) =>
            status.value > 0
        )
        .map((status) => ({
          ...status,
          total:
            totalTicketValue,
        }))
    : [
        {
          label: 'No data',
          color: '#e5e7eb',
          value: 1,
          total: 1,
        },
      ];

  const triggerLabel =
    period === 'custom'
      ? `${appliedCustomStart} → ${appliedCustomEnd}`
      : PERIOD_LABEL[period];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">

        <h3 className="text-sm font-semibold text-gray-700">
          Ticket Type
        </h3>

        <div
          className="relative"
          ref={menuRef}
        >
          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (value) => !value
              )
            }
            className="text-xs px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-600 flex items-center gap-2 hover:bg-gray-50"
          >
            <span>
              {triggerLabel}
            </span>

            <svg
              className={`w-3 h-3 transition-transform ${
                menuOpen
                  ? 'rotate-180'
                  : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-1">

              {PERIOD_OPTIONS.map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      selectPeriod(
                        option
                      )
                    }
                    className={`w-full text-left text-xs px-3 py-2 rounded-md hover:bg-gray-50 ${
                      period === option
                        ? 'bg-gray-100 font-semibold text-gray-900'
                        : 'text-gray-600'
                    }`}
                  >
                    {
                      PERIOD_LABEL[
                        option
                      ]
                    }
                  </button>
                )
              )}

              {/* Custom date range */}
              {period ===
                'custom' && (
                <div className="border-t border-gray-100 mt-1 pt-2 px-2 pb-1 space-y-2">

                  <div>
                    <label className="block text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                      From
                    </label>

                    <input
                      type="date"
                      value={
                        customStart
                      }
                      max={
                        customEnd
                      }
                      onChange={(e) =>
                        setCustomStart(
                          e.target.value
                        )
                      }
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded-md text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                      To
                    </label>

                    <input
                      type="date"
                      value={
                        customEnd
                      }
                      min={
                        customStart
                      }
                      onChange={(e) =>
                        setCustomEnd(
                          e.target.value
                        )
                      }
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded-md text-gray-700"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={
                      applyCustomRange
                    }
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

      {loading ? (
        /* Loading */
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-400">
            Loading ticket data...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* =========================
              DONUT CHART
          ========================== */}
          <div className="lg:col-span-2 relative">

            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <PieChart>

                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}

                  /*
                   * No gaps between slices
                   */
                  paddingAngle={0}

                  dataKey="value"

                  /*
                   * No borders
                   */
                  stroke="none"

                  /*
                   * Slightly enlarge the
                   * hovered slice
                   */
                  activeShape={(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    props: any
                  ) => (
                    <Sector
                      {...props}
                      outerRadius={106}
                      innerRadius={60}
                    />
                  )}
                >
                  {chartData.map(
                    (
                      entry,
                      index
                    ) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.color
                        }
                      />
                    )
                  )}
                </Pie>

                {/* Hover tooltip */}
                <Tooltip
                  content={
                    <TicketTooltip />
                  }
                  cursor={false}

                  /*
                   * Put tooltip above
                   * the donut.
                   *
                   * The custom tooltip
                   * itself is small, so it
                   * won't cover the center.
                   */
                  wrapperStyle={{
                    zIndex: 100,
                    top: '8px',
                    left: '50%',
                    transform:
                      'translateX(-50%)',
                  }}
                />

              </PieChart>
            </ResponsiveContainer>

            {/* =========================
                CENTER TOTAL
            ========================== */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

              {hasData ? (
                <div className="text-center">

                  <span className="block text-3xl font-bold text-blue-500">
                    {
                      totalTicketValue
                    }
                  </span>

                  <span className="text-[10px] text-gray-400">
                    Total Tickets
                  </span>

                </div>
              ) : (
                <span className="text-sm font-medium text-gray-400">
                  No data
                </span>
              )}

            </div>

          </div>

          {/* =========================
              TICKET TYPE LIST
          ========================== */}
          <div>

            <div className="space-y-3 bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">

              {pieData.map(
                (
                  status,
                  index
                ) => (
                  <div
                    key={`${status.label}-${index}`}
                    className="flex items-center justify-between"
                  >

                    {/* Colored circle + label */}
                    <div className="flex items-center gap-2">

                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            status.color,
                        }}
                      />

                      <span className="text-xs text-gray-600">
                        {
                          status.label
                        }
                      </span>

                    </div>

                    {/* Count */}
                    <span className="text-xs font-semibold text-gray-900">
                      {
                        status.value
                      }
                    </span>

                  </div>
                )
              )}

            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default CountChart;