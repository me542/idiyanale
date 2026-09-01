"use client";
import { useEffect, useState } from "react";
import { getAllTicketsByInstitution } from "@/services/integration/ticket/get_all_ticket_by_insti";
import { CategoryItem } from "./types";

const PALETTE = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
];

interface UseCategoryStatsResult {
  categories: CategoryItem[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useCategoryStats(
  institutionId: number | string | null | undefined
): UseCategoryStatsResult {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!institutionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    let cancel = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const tickets = await getAllTicketsByInstitution(institutionId);

        const counts = new Map<number, { label: string; count: number }>();
        for (const t of tickets) {
          const key = t.category_id;
          const label = t.category?.category_name ?? "Uncategorized";
          const existing = counts.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            counts.set(key, { label, count: 1 });
          }
        }

        const totalCount = tickets.length;
        const items: CategoryItem[] = Array.from(counts.values())
          .sort((a, b) => b.count - a.count)
          .map((c, i) => ({
            label: c.label,
            count: c.count,
            pct: totalCount > 0 ? Math.round((c.count / totalCount) * 100) : 0,
            color: PALETTE[i % PALETTE.length],
          }));

        if (!cancel) {
          setCategories(items);
          setTotal(totalCount);
        }
      } catch (e) {
        if (!cancel) {
          setError(e instanceof Error ? e.message : "Failed to load categories");
        }
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [institutionId]);

  return { categories, total, loading, error };
}

export function useTicketTypeStats(
  institutionId: number | string | null | undefined
): UseCategoryStatsResult {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!institutionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    let cancel = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const tickets = await getAllTicketsByInstitution(institutionId);

        const counts = new Map<number, { label: string; count: number }>();
        for (const t of tickets) {
          const key = t.ticket_type_id;
          const label = t.ticket_type?.ticket_type_name ?? "Uncategorized";
          const existing = counts.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            counts.set(key, { label, count: 1 });
          }
        }

        const totalCount = tickets.length;
        const items: CategoryItem[] = Array.from(counts.values())
          .sort((a, b) => b.count - a.count)
          .map((c, i) => ({
            label: c.label,
            count: c.count,
            pct: totalCount > 0 ? Math.round((c.count / totalCount) * 100) : 0,
            color: PALETTE[i % PALETTE.length],
          }));

        if (!cancel) {
          setCategories(items);
          setTotal(totalCount);
        }
      } catch (e) {
        if (!cancel) {
          setError(e instanceof Error ? e.message : "Failed to load ticket types");
        }
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [institutionId]);

  return { categories, total, loading, error };
}