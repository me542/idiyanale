'use client';

import React, { useEffect, useState } from 'react';

import {
  getInstitutions,
  type InstitutionResp,
} from '@/services/integration/institution/get-all-insti';

import {
  getAllTicketsByInstitution,
  type InstitutionTicket,
} from '@/services/integration/ticket/get_all_ticket_by_insti';

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
  {
    key: 'serviceRequest',
    label: 'Service Request',
    color: COLORS.serviceRequest,
  },
  {
    key: 'changedRequest',
    label: 'Changed Request',
    color: COLORS.changedRequest,
  },
  {
    key: 'incidentReport',
    label: 'Incident Report',
    color: COLORS.incidentReport,
  },
] as const;

interface TicketChartProps {
  filters?: { institution: string; ticketType: string };
}

const TicketChart = ({ filters }: TicketChartProps) => {
  const [allData, setAllData] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTicketData = async () => {
      try {
        setLoading(true);

        // Get all institutions
        const institutionResponse = await getInstitutions();

        const institutions =
          institutionResponse.response ?? [];

        if (institutions.length === 0) {
          setAllData([]);
          return;
        }

        /*
         * Get tickets for every institution
         */
        const institutionTicketResults =
          await Promise.all(
            institutions.map(async (institution) => {
              try {
                const tickets =
                  await getAllTicketsByInstitution(
                    institution.institution_id
                  );

                return {
                  institution,
                  tickets,
                };
              } catch (error) {
                console.error(
                  `Failed to get tickets for institution ${institution.institution_name}:`,
                  error
                );

                return {
                  institution,
                  tickets: [] as InstitutionTicket[],
                };
              }
            })
          );

        /*
         * Convert the API response into chart data
         */
        const chartData: TicketData[] =
          institutionTicketResults.map(
            ({ institution, tickets }) => {
              let serviceRequest = 0;
              let changedRequest = 0;
              let incidentReport = 0;

              tickets.forEach((ticket) => {
                const ticketType =
                  ticket.ticket_type?.ticket_type_name
                    ?.trim()
                    .toLowerCase();

                if (
                  ticketType === 'service request'
                ) {
                  serviceRequest++;
                } else if (
                  ticketType === 'changed request' ||
                  ticketType === 'change request'
                ) {
                  changedRequest++;
                } else if (
                  ticketType === 'incident report' ||
                  ticketType === 'incident'
                ) {
                  incidentReport++;
                }
              });

              return {
                name: institution.institution_name,
                serviceRequest,
                changedRequest,
                incidentReport,
              };
            }
          );

        setAllData(chartData);
      } catch (error) {
        console.error(
          'Failed to load ticket chart:',
          error
        );

        setAllData([]);
      } finally {
        setLoading(false);
      }
    };

    loadTicketData();
  }, []);

  // Apply filters
  const data = allData.filter((row) => {
    // Filter by institution
    if (filters?.institution && filters.institution !== 'ALL') {
      if (row.name !== filters.institution) return false;
    }
    // Filter by ticket type
    if (filters?.ticketType && filters.ticketType !== 'ALL') {
      const type = filters.ticketType.toLowerCase();
      if (type === 'service request' && row.serviceRequest === 0) return false;
      if ((type === 'changed request' || type === 'change request') && row.changedRequest === 0) return false;
      if ((type === 'incident report' || type === 'incident') && row.incidentReport === 0) return false;
    }
    return true;
  });

  const hasData = data.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Ticket
      </h3>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[250px]">
          <p className="text-sm text-gray-400">
            Loading ticket data...
          </p>
        </div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center min-h-[250px] bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <div className="text-center px-4">
            <p className="text-sm font-medium text-gray-400">
              No ticket data
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Data will appear here once tickets are recorded.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col justify-center gap-8">
            {data.map((row) => {
              const total =
                row.serviceRequest +
                row.changedRequest +
                row.incidentReport;

              const segments = LEGEND_ITEMS.map(
                (item) => ({
                  ...item,
                  value:
                    row[
                      item.key as keyof Omit<
                        TicketData,
                        'name'
                      >
                    ],
                })
              );

              return (
                <div key={row.name}>
                  {/* Institution name + total */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate"
                      title={row.name}
                    >
                      {row.name}
                    </p>

                    <span className="text-xs font-semibold text-gray-400 shrink-0">
                      {total}
                    </span>
                  </div>

                  {total === 0 ? (
                    <div className="h-9 rounded-md bg-gray-100" />
                  ) : (
                    <div className="flex h-9 w-full overflow-hidden rounded-md">
                      {segments
                        .filter(
                          (segment) =>
                            segment.value > 0
                        )
                        .map((segment) => (
                          <div
                            key={segment.key}
                            style={{
                              width: `${
                                (segment.value /
                                  total) *
                                100
                              }%`,
                              backgroundColor:
                                segment.color,
                            }}
                            title={`${segment.label}: ${segment.value}`}
                          />
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100">
            {LEGEND_ITEMS.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-1.5"
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{
                    backgroundColor: item.color,
                  }}
                />

                <span className="text-xs font-medium text-gray-500">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TicketChart;