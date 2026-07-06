"use client";

import { Fragment } from "react";

export interface CategorySubRow {
  name: string;
  count: number;
  avgTimeMin: number;
}

export interface CategoryRow {
  name: string;
  count: number;
  avgTimeMin: number;
  children?: CategorySubRow[];
}

interface CategoryTableProps {
  rows?: CategoryRow[];
}

function formatTime(min: number) {
  return min === 0 ? "0 min" : `${min.toFixed(1)} min`;
}

export default function CategoryTable({ rows = [] }: CategoryTableProps) {
  const hasData = rows.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-slate-400">
            <th className="pb-4 font-medium">Category</th>
            <th className="pb-4 font-medium">Count</th>
            <th className="pb-4 font-medium">Avg Time</th>
          </tr>

          {/* Divider below the header */}
          <tr>
            <th colSpan={6} className="p-0">
              <hr className="border-t border-slate-200 my-2 -mx-6" />
            </th>
          </tr>
        </thead>
        <tbody>
          {hasData ? (
            rows.map((row) => (
              <Fragment key={row.name}>
                <tr className="font-semibold text-slate-800">
                  <td className="py-2">{row.name}</td>
                  <td className="py-2">{row.count}</td>
                  <td className="py-2">{formatTime(row.avgTimeMin)}</td>
                </tr>
                {row.children?.map((child) => (
                  <tr key={child.name} className="text-slate-700">
                    <td className="border-l-2 border-slate-200 py-2 pl-4">
                      {child.name}
                    </td>
                    <td className="py-2 text-slate-400">{child.count}</td>
                    <td className="py-2">{formatTime(child.avgTimeMin)}</td>
                  </tr>
                ))}
              </Fragment>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="py-8 text-center text-slate-400">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}