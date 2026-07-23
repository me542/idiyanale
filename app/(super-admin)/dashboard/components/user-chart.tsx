"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getAllUsers } from "../../management/user/api/get-user";

type DataPoint = {
  label: string;
  value: number;
  color: string;
};

const COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#14B8A6",
  "#84CC16",
  "#F97316",
];

const UserChart = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const users = await getAllUsers();

      const institutionCount = new Map<string, number>();

      users.forEach((user) => {
        // Change this if your field name is different
        const institution =
          user.institution_name != null
            ? user.institution_name
            : "Unassigned";

        institutionCount.set(
          institution,
          (institutionCount.get(institution) ?? 0) + 1
        );
      });

      const chartData: DataPoint[] = Array.from(
        institutionCount.entries()
      ).map(([label, value], index) => ({
        label,
        value,
        color: COLORS[index % COLORS.length],
      }));

      setData(chartData);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  // Highest value
  const highestValue =
    data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0;

  // Dynamic Y axis
  const maxValue =
    highestValue === 0 ? 5 : highestValue + 1;

  const yAxis = Array.from(
    { length: maxValue + 1 },
    (_, i) => maxValue - i
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">
          USERS BY INSTITUTION
        </h2>
      </div>

      {loading ? (
        <div className="flex h-80 items-center justify-center">
          Loading...
        </div>
      ) : (
        <div className="flex h-80">
          {/* Y Axis */}
          <div className="mr-4 flex h-full flex-col justify-between">
            {yAxis.map((value) => (
              <span
                key={value}
                className="text-xs text-gray-400"
              >
                {value}
              </span>
            ))}
          </div>

          {/* Chart */}
          <div className="relative flex-1">
            {/* Grid */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {yAxis.map((value) => (
                <div
                  key={value}
                  className="border-t border-gray-100"
                />
              ))}
            </div>

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-center gap-8">
              {data.map((item) => (
                <div
                  key={item.label}
                  className="flex h-full flex-col items-center justify-end"
                >
                  <span className="mb-2 text-sm font-semibold">
                    {item.value}
                  </span>

                  <div
                    className="w-16 rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${
                        (item.value / maxValue) * 100
                      }%`,
                      backgroundColor: item.color,
                    }}
                  />

                  <span className="mt-3 max-w-20 text-center text-xs text-gray-600">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserChart;