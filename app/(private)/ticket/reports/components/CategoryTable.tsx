"use client";

import { Fragment, useEffect, useState } from "react";
import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";
import { verifyJWT } from "@/lib/auth/verify-jwt";

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

export default function CategoryTable({
  rows: initialRows = [],
}: CategoryTableProps) {
  const [rows, setRows] = useState<CategoryRow[]>(initialRows);
  const [loading, setLoading] = useState(true);

  const [expandedCategories, setExpandedCategories] =
    useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Token not found");
        }

        const payload = await verifyJWT(token);

        if (!payload?.institution_id) {
          throw new Error("Institution ID not found");
        }

        const tickets = await getAllTicketsByInstitution(
          payload.institution_id
        );

        setRows(groupTicketsByCategory(tickets));
      } catch (error) {
        console.error(
          "Failed to load category data:",
          error
        );

        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((previous) => ({
      ...previous,
      [categoryName]: !previous[categoryName],
    }));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-slate-400">
            <th className="pb-4 font-medium">
              Category
            </th>

            <th className="pb-4 font-medium">
              Count
            </th>

            <th className="pb-4 font-medium">
              Avg Time
            </th>
          </tr>

          <tr>
            <th colSpan={3} className="p-0">
              <hr className="my-2 -mx-6 border-t border-slate-200" />
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={3}
                className="py-8 text-center text-slate-400"
              >
                Loading...
              </td>
            </tr>
          ) : rows.length > 0 ? (
            rows.map((row) => {
              const isExpanded =
                expandedCategories[row.name] ?? false;

              const hasChildren =
                Boolean(row.children?.length);

              return (
                <Fragment key={row.name}>
                  {/* Category */}
                  <tr className="font-semibold text-slate-800">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() =>
                              toggleCategory(row.name)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            aria-label={
                              isExpanded
                                ? `Hide ${row.name} subcategories`
                                : `Show ${row.name} subcategories`
                            }
                          >
                            <svg
                              className={`h-4 w-4 transition-transform ${
                                isExpanded
                                  ? "rotate-90"
                                  : ""
                              }`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.06-1.06l4.24 4.24a.75.75 0 010 1.06l-4.24 4.24a.75.75 0 01-1.08 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        ) : (
                          <span className="h-6 w-6" />
                        )}

                        <span>{row.name}</span>
                      </div>
                    </td>

                    <td className="py-2">
                      {row.count}
                    </td>

                    <td className="py-2">
                      {formatTime(row.avgTimeMin)}
                    </td>
                  </tr>

                  {/* Subcategories */}
                  {isExpanded &&
                    row.children?.map((child) => (
                      <tr
                        key={`${row.name}-${child.name}`}
                        className="text-slate-700"
                      >
                        <td className="border-l-2 border-slate-200 py-2 pl-12">
                          {child.name}
                        </td>

                        <td className="py-2 text-slate-400">
                          {child.count}
                        </td>

                        <td className="py-2">
                          {formatTime(
                            child.avgTimeMin
                          )}
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={3}
                className="py-8 text-center text-slate-400"
              >
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function groupTicketsByCategory(
  tickets: InstitutionTicket[]
): CategoryRow[] {
  const categories: Record<
    string,
    {
      count: number;
      totalTime: number;
      timeCount: number;
      children: Record<
        string,
        {
          count: number;
          totalTime: number;
          timeCount: number;
        }
      >;
    }
  > = {};

  tickets.forEach((ticket) => {
    const categoryName =
      ticket.category?.category_name ||
      "Uncategorized";

    const subcategoryName =
      ticket.subcategory?.sub_category_name ||
      "Uncategorized";

    if (!categories[categoryName]) {
      categories[categoryName] = {
        count: 0,
        totalTime: 0,
        timeCount: 0,
        children: {},
      };
    }

    const category =
      categories[categoryName];

    category.count += 1;

    const resolutionTime =
      getResolutionTimeMinutes(ticket);

    if (resolutionTime !== null) {
      category.totalTime += resolutionTime;
      category.timeCount += 1;
    }

    if (!category.children[subcategoryName]) {
      category.children[subcategoryName] = {
        count: 0,
        totalTime: 0,
        timeCount: 0,
      };
    }

    const subcategory =
      category.children[subcategoryName];

    subcategory.count += 1;

    if (resolutionTime !== null) {
      subcategory.totalTime += resolutionTime;
      subcategory.timeCount += 1;
    }
  });

  return Object.entries(categories)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([name, category]) => ({
      name,
      count: category.count,
      avgTimeMin:
        category.timeCount > 0
          ? category.totalTime /
            category.timeCount
          : 0,
      children: Object.entries(
        category.children
      )
        .sort(
          ([, a], [, b]) =>
            b.count - a.count
        )
        .map(([childName, child]) => ({
          name: childName,
          count: child.count,
          avgTimeMin:
            child.timeCount > 0
              ? child.totalTime /
                child.timeCount
              : 0,
        })),
    }));
}

function getResolutionTimeMinutes(
  ticket: InstitutionTicket
): number | null {
  if (
    !ticket.started_at ||
    !ticket.resolved_at
  ) {
    return null;
  }

  const started =
    new Date(ticket.started_at).getTime();

  const resolved =
    new Date(ticket.resolved_at).getTime();

  if (
    Number.isNaN(started) ||
    Number.isNaN(resolved)
  ) {
    return null;
  }

  const difference =
    resolved - started;

  if (difference < 0) {
    return null;
  }

  return difference / 60000;
}