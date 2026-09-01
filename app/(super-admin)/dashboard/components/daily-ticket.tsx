'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import {
  getInstitutions,
} from '@/services/integration/institution/get-all-insti';

import {
  getAllTicketsByInstitution,
  type InstitutionTicket,
} from '@/services/integration/ticket/get_all_ticket_by_insti';

interface DailyData {
  date: string;
  serviceRequest: number;
  changedRequest: number;
  incidentReport: number;
}

type Period = 7 | 30;

interface DailyTicketProps {
  filters?: { institution: string; ticketType: string };
}

const DailyTicket = ({ filters }: DailyTicketProps) => {
  const [data, setData] = useState<DailyData[]>([]);
  const [period, setPeriod] = useState<Period>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDailyTickets = async () => {
      try {
        setLoading(true);

        /*
         * Get all institutions
         */
        const institutionResponse =
          await getInstitutions();

        const institutions =
          institutionResponse.response ?? [];

        if (institutions.length === 0) {
          setData([]);
          return;
        }

        /*
         * Filter institutions if needed
         */
        const filteredInstitutions =
          filters?.institution && filters.institution !== 'ALL'
            ? institutions.filter((i) => i.institution_name === filters.institution)
            : institutions;

        /*
         * Get tickets from every institution
         */
        const results = await Promise.all(
          filteredInstitutions.map(async (institution) => {
            try {
              const tickets =
                await getAllTicketsByInstitution(
                  institution.institution_id
                );

              return tickets;
            } catch (error) {
              console.error(
                `Failed to get tickets for institution ${institution.institution_name}:`,
                error
              );

              return [] as InstitutionTicket[];
            }
          })
        );

        /*
         * Flatten all tickets
         */
        let allTickets =
          results.flat();

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
         * Create date range
         *
         * Example:
         * 7 days = today + previous 6 days
         * 30 days = today + previous 29 days
         */
        const today = new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );

        const startDate = new Date(today);

        startDate.setDate(
          startDate.getDate() - (period - 1)
        );

        /*
         * Create an object containing every day.
         *
         * This makes sure days with zero tickets
         * are still displayed on the chart.
         */
        const dailyMap =
          new Map<string, DailyData>();

        for (
          let i = 0;
          i < period;
          i++
        ) {
          const date = new Date(startDate);

          date.setDate(
            startDate.getDate() + i
          );

          const key =
            formatDateKey(date);

          dailyMap.set(key, {
            date: formatDisplayDate(date),
            serviceRequest: 0,
            changedRequest: 0,
            incidentReport: 0,
          });
        }

        /*
         * Count tickets by created_at
         */
        allTickets.forEach((ticket) => {
          if (!ticket.created_at) {
            return;
          }

          const ticketDate =
            new Date(ticket.created_at);

          /*
           * Normalize ticket date
           */
          ticketDate.setHours(
            0,
            0,
            0,
            0
          );

          /*
           * Ignore tickets outside
           * the selected period.
           */
          if (
            ticketDate < startDate ||
            ticketDate > today
          ) {
            return;
          }

          const dateKey =
            formatDateKey(ticketDate);

          const row =
            dailyMap.get(dateKey);

          if (!row) {
            return;
          }

          const ticketType =
            ticket.ticket_type?.ticket_type_name
              ?.trim()
              .toLowerCase();

          if (
            ticketType ===
              'service request'
          ) {
            row.serviceRequest++;
          } else if (
            ticketType ===
              'changed request' ||
            ticketType ===
              'change request'
          ) {
            row.changedRequest++;
          } else if (
            ticketType ===
              'incident report' ||
            ticketType === 'incident'
          ) {
            row.incidentReport++;
          }
        });

        /*
         * Convert Map to array
         */
        setData(
          Array.from(dailyMap.values())
        );
      } catch (error) {
        console.error(
          'Failed to load daily ticket data:',
          error
        );

        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadDailyTickets();
  }, [period, filters]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Daily Ticket
        </h3>

        <select
          value={period}
          onChange={(e) =>
            setPeriod(
              Number(
                e.target.value
              ) as Period
            )
          }
          className="text-xs px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>
            7 days
          </option>

          <option value={30}>
            30 days
          </option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-400 text-center">
            Loading daily ticket data...
          </p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-400 text-center">
            No daily ticket data available
          </p>
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
            />

            <XAxis
              dataKey="date"
              tick={{
                fontSize: 11,
              }}
              tickLine={false}
            />

            <YAxis
              allowDecimals={false}
              tick={{
                fontSize: 11,
              }}
              tickLine={false}
            />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="serviceRequest"
              stroke="#10b981"
              name="Service Request"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="changedRequest"
              stroke="#3b82f6"
              name="Changed Request"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="incidentReport"
              stroke="#ef4444"
              name="Incident Report"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

/*
 * YYYY-MM-DD
 *
 * Used internally for grouping tickets.
 */
function formatDateKey(
  date: Date
): string {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/*
 * Display format for chart
 *
 * Example:
 * Aug 17
 */
function formatDisplayDate(
  date: Date
): string {
  return date.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
    }
  );
}

export default DailyTicket;