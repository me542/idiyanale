"use client";

import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  UserDetails,
} from "@/services/integration/user/get_all_user";
import {
  getInstitutions,
  InstitutionResp,
} from "@/services/integration/institution/get-all-insti";

type DataPoint = {
  label: string;
  value: number;
  color: string;
};

const COLORS = [
  "#4F46E5",
  "#059669",
  "#DC2626",
  "#D97706",
  "#0891B2",
  "#7C3AED",
  "#DB2777",
  "#65A30D",
];

const BAR_COLUMN_WIDTH = 96;

interface UserChartProps {
  filters?: { institution: string; ticketType: string };
}

const UserChart = ({ filters }: UserChartProps) => {
  const [allData, setAllData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [usersRes, institutionsRes] = await Promise.all([
          getAllUsers(),
          getInstitutions(),
        ]);

        const users: UserDetails[] = usersRes.response ?? [];
        const institutions: InstitutionResp[] =
          institutionsRes.response ?? [];

        // Count users per institution
        const countMap = new Map<number, number>();

        users.forEach((user) => {
          countMap.set(
            user.institution_id,
            (countMap.get(user.institution_id) ?? 0) + 1
          );
        });

        // Build chart data
        const chartData: DataPoint[] = institutions.map(
          (institution, index) => ({
            label: institution.institution_name,
            value:
              countMap.get(institution.institution_id) ?? 0,
            color: COLORS[index % COLORS.length],
          })
        );

        setAllData(chartData);
      } catch (err) {
        console.error(
          "Failed to load user/institution data:",
          err
        );

        setError("Failed to load chart data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply institution filter
  const data = allData.filter((item) => {
    if (filters?.institution && filters.institution !== "ALL") {
      return item.label === filters.institution;
    }
    return true;
  });

  /*
   * Generate a clean maximum for the chart.
   */
  const getChartScale = (value: number) => {
    if (value <= 5) return 5;
    if (value <= 10) return 10;
    if (value <= 20) return 20;
    if (value <= 50) return 50;
    if (value <= 100) return 100;

    const magnitude = Math.pow(
      10,
      Math.floor(Math.log10(value))
    );

    const normalized = value / magnitude;

    let niceNumber: number;

    if (normalized <= 2) {
      niceNumber = 2;
    } else if (normalized <= 5) {
      niceNumber = 5;
    } else {
      niceNumber = 10;
    }

    return niceNumber * magnitude;
  };

  const highestValue =
    data.length > 0
      ? Math.max(...data.map((item) => item.value))
      : 0;

  const maxValue = getChartScale(highestValue);

  /*
   * Only 3 guide levels:
   *
   * MAX
   * HALF
   * 0
   */
  const middleValue = Math.ceil(maxValue / 2);

  const yAxis = [
    maxValue,
    middleValue,
    0,
  ];

  /*
   * Show tooltip
   */
  const handleMouseEnter = (
    event: React.MouseEvent<HTMLDivElement>,
    label: string
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setTooltip({
      label,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <>
      <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700">
            USERS BY INSTITUTION
          </h2>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex h-80 items-center justify-center text-sm text-gray-400">
            Loading chart data...
          </div>
        ) : error ? (
          /* Error */
          <div className="flex h-80 items-center justify-center text-sm text-red-500">
            {error}
          </div>
        ) : data.length === 0 ? (
          /* Empty */
          <div className="flex h-80 items-center justify-center text-sm text-gray-400">
            No data available.
          </div>
        ) : (
          <div className="flex min-w-0">
            {/* =========================
                Y AXIS
            ========================== */}
            <div className="mr-4 flex h-80 shrink-0 flex-col justify-between">
              {yAxis.map((value) => (
                <span
                  key={value}
                  className="text-xs leading-none text-gray-400"
                >
                  {value}
                </span>
              ))}
            </div>

            {/* =========================
                CHART AREA
            ========================== */}
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div
                style={{
                  minWidth:
                    data.length * BAR_COLUMN_WIDTH,
                }}
              >
                {/* =========================
                    PLOT
                ========================== */}
                <div className="relative h-80">
                  {/* Guide Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {yAxis.map((value) => (
                      <div
                        key={value}
                        className="border-t border-gray-100"
                      />
                    ))}
                  </div>

                  {/* =========================
                      BARS
                  ========================== */}
                  <div className="absolute inset-0 flex items-end">
                    {data.map((item) => {
                      const heightPct =
                        maxValue > 0
                          ? (item.value / maxValue) * 100
                          : 0;

                      return (
                        <div
                          key={item.label}
                          className="relative h-full shrink-0"
                          style={{
                            width: BAR_COLUMN_WIDTH,
                          }}
                          onMouseEnter={(event) =>
                            handleMouseEnter(
                              event,
                              item.label
                            )
                          }
                          onMouseLeave={handleMouseLeave}
                        >
                          {/* =========================
                              COUNT
                          ========================== */}
                          <div
                            className="
                              absolute
                              left-1/2
                              z-10
                              -translate-x-1/2
                              whitespace-nowrap
                              text-sm
                              font-semibold
                              text-gray-700
                            "
                            style={{
                              bottom: `calc(${heightPct}% + 8px)`,
                            }}
                          >
                            {item.value}
                          </div>

                          {/* =========================
                              BAR
                          ========================== */}
                          <div
                            className="
                              absolute
                              bottom-0
                              left-1/2
                              w-16
                              -translate-x-1/2
                              rounded-t-lg
                              transition-all
                              duration-500
                            "
                            style={{
                              height: `${heightPct}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================
          FIXED TOOLTIP
      ========================== */}
      {tooltip && (
        <div
          className="
            pointer-events-none
            fixed
            z-[9999]
            max-w-[90vw]
            -translate-x-1/2
            -translate-y-full
            rounded-md
            bg-gray-800
            px-3
            py-2
            text-xs
            font-medium
            text-white
            shadow-lg
          "
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
          }}
        >
          {tooltip.label}
        </div>
      )}
    </>
  );
};

export default UserChart;