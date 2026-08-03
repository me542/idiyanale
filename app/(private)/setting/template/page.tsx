"use client";

import { useMemo, useState, useEffect } from "react";
import { editTicketType } from "./api/patch_ticket_type";
import { getTicketTypeById } from "./api/get_ticket_type_by_id";
import { getTicketType } from "./api/get_ticket_type";
import { getCategories } from "./api/get_category";

import type { TicketType, Category, SubCategory } from "./components/types";
import { uid } from "./components/types";
import { TicketTypeField } from "./components/ticket_type";
import { CategoryField } from "./components/category";
import { SubCategoryField, EnvironmentField } from "./components/sub_category";
import { DescriptionCard } from "./components/description";

export default function Page() {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [loadedCategoryTicketTypeIds, setLoadedCategoryTicketTypeIds] =
    useState<Set<string>>(new Set());
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string | null>(
    null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(
    null
  );

  const selectedTicketType = useMemo(
    () => ticketTypes.find((t) => t.id === selectedTicketTypeId) ?? null,
    [ticketTypes, selectedTicketTypeId]
  );

  const selectedCategory = useMemo(
    () =>
      selectedTicketType?.categories.find(
        (c) => c.id === selectedCategoryId
      ) ?? null,
    [selectedTicketType, selectedCategoryId]
  );

  const selectedSubCategory = useMemo(
    () =>
      selectedCategory?.subCategories.find(
        (s) => s.id === selectedSubCategoryId
      ) ?? null,
    [selectedCategory, selectedSubCategoryId]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTicketTypes() {
      setLoading(true);
      try {
        const list = await getTicketType();
        if (cancelled) return;

        const mapped: TicketType[] = list.map((t) => ({
          id: String(t.ticket_type_id),
          name: t.ticket_type_name,
          status: t.status,
          categories: [],
        }));

        setTicketTypes(mapped);
        setSelectedTicketTypeId(mapped[0]?.id ?? null);

        if (mapped[0]) {
          const categories = await ensureCategoriesLoaded(mapped[0].id);
          setSelectedCategoryId(categories[0]?.id ?? null);
          setSelectedSubCategoryId(categories[0]?.subCategories[0]?.id ?? null);
        } else {
          setSelectedCategoryId(null);
          setSelectedSubCategoryId(null);
        }
      } catch (err) {
        console.error(err);
        if (err instanceof Error) alert(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTicketTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  async function ensureCategoriesLoaded(
    ticketTypeId: string
  ): Promise<Category[]> {
    if (loadedCategoryTicketTypeIds.has(ticketTypeId)) {
      return (
        ticketTypes.find((t) => t.id === ticketTypeId)?.categories ?? []
      );
    }

    setCategoriesLoading(true);
    try {
      const list = await getCategories(ticketTypeId);
      const mapped: Category[] = list.map((c) => ({
        id: String(c.category_id),
        name: c.category_name,
        subCategories: [],
      }));

      setTicketTypes((prev) =>
        prev.map((t) =>
          t.id === ticketTypeId ? { ...t, categories: mapped } : t
        )
      );
      setLoadedCategoryTicketTypeIds((prev) => new Set(prev).add(ticketTypeId));
      return mapped;
    } catch (err) {
      console.error(err);
      if (err instanceof Error) alert(err.message);
      return [];
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function handleSelectTicketType(id: string) {
    setSelectedTicketTypeId(id);
    setSelectedCategoryId(null);
    setSelectedSubCategoryId(null);

    const categories = await ensureCategoriesLoaded(id);
    setSelectedCategoryId(categories[0]?.id ?? null);
    setSelectedSubCategoryId(categories[0]?.subCategories[0]?.id ?? null);
  }

  function handleSelectCategory(id: string) {
    setSelectedCategoryId(id);
    const cat = selectedTicketType?.categories.find((c) => c.id === id);
    setSelectedSubCategoryId(cat?.subCategories[0]?.id ?? null);
  }

  function handleSelectSubCategory(id: string) {
    setSelectedSubCategoryId(id);
  }

  function addTicketType(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newType: TicketType = {
      id: uid(),
      name: trimmed,
      categories: [],
      status: "",
    };
    setTicketTypes((prev) => [...prev, newType]);
    setLoadedCategoryTicketTypeIds((prev) => new Set(prev).add(newType.id));
    setSelectedTicketTypeId(newType.id);
    setSelectedCategoryId(null);
    setSelectedSubCategoryId(null);
  }

  async function renameTicketType(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      await editTicketType(id, {
        ticket_type_name: trimmed,
        status: ticketTypes.find((t) => t.id === id)?.status ?? "active",
      });

      const latest = await getTicketTypeById(id);

      setTicketTypes((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                name: latest.ticket_type_name ?? t.name,
                status: latest.status ?? t.status,
              }
            : t
        )
      );
    } catch (err) {
      console.error(err);
      if (err instanceof Error) alert(err.message);
    }
  }

  function deleteTicketType(id: string) {
    setTicketTypes((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (selectedTicketTypeId === id) {
        const nextType = next[0] ?? null;
        setSelectedTicketTypeId(nextType?.id ?? null);
        const nextCategory = nextType?.categories[0] ?? null;
        setSelectedCategoryId(nextCategory?.id ?? null);
        setSelectedSubCategoryId(nextCategory?.subCategories[0]?.id ?? null);
      }
      return next;
    });
  }

  function addCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed || !selectedTicketTypeId) return;
    const newCat: Category = { id: uid(), name: trimmed, subCategories: [] };
    setTicketTypes((prev) =>
      prev.map((t) =>
        t.id === selectedTicketTypeId
          ? { ...t, categories: [...t.categories, newCat] }
          : t
      )
    );
    setSelectedCategoryId(newCat.id);
    setSelectedSubCategoryId(null);
  }

  function renameCategory(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed || !selectedTicketTypeId) return;
    setTicketTypes((prev) =>
      prev.map((t) =>
        t.id === selectedTicketTypeId
          ? {
              ...t,
              categories: t.categories.map((c) =>
                c.id === id ? { ...c, name: trimmed } : c
              ),
            }
          : t
      )
    );
  }

  function deleteCategory(id: string) {
    if (!selectedTicketTypeId) return;
    setTicketTypes((prev) =>
      prev.map((t) => {
        if (t.id !== selectedTicketTypeId) return t;
        const next = t.categories.filter((c) => c.id !== id);
        if (selectedCategoryId === id) {
          setSelectedCategoryId(next[0]?.id ?? null);
          setSelectedSubCategoryId(next[0]?.subCategories[0]?.id ?? null);
        }
        return { ...t, categories: next };
      })
    );
  }

  function addSubCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed || !selectedTicketTypeId || !selectedCategoryId) return;
    const newSub: SubCategory = {
      id: uid(),
      name: trimmed,
      description: "",
      environment: false,
    };
    setTicketTypes((prev) =>
      prev.map((t) =>
        t.id === selectedTicketTypeId
          ? {
              ...t,
              categories: t.categories.map((c) =>
                c.id === selectedCategoryId
                  ? { ...c, subCategories: [...c.subCategories, newSub] }
                  : c
              ),
            }
          : t
      )
    );
    setSelectedSubCategoryId(newSub.id);
  }

  function renameSubCategory(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed || !selectedTicketTypeId || !selectedCategoryId) return;
    setTicketTypes((prev) =>
      prev.map((t) =>
        t.id === selectedTicketTypeId
          ? {
              ...t,
              categories: t.categories.map((c) =>
                c.id === selectedCategoryId
                  ? {
                      ...c,
                      subCategories: c.subCategories.map((s) =>
                        s.id === id ? { ...s, name: trimmed } : s
                      ),
                    }
                  : c
              ),
            }
          : t
      )
    );
  }

  function deleteSubCategory(id: string) {
    if (!selectedTicketTypeId || !selectedCategoryId) return;
    setTicketTypes((prev) =>
      prev.map((t) => {
        if (t.id !== selectedTicketTypeId) return t;
        return {
          ...t,
          categories: t.categories.map((c) => {
            if (c.id !== selectedCategoryId) return c;
            const next = c.subCategories.filter((s) => s.id !== id);
            if (selectedSubCategoryId === id) {
              setSelectedSubCategoryId(next[0]?.id ?? null);
            }
            return { ...c, subCategories: next };
          }),
        };
      })
    );
  }

  function saveDescription(text: string) {
    if (!selectedTicketTypeId || !selectedCategoryId || !selectedSubCategoryId)
      return;
    setTicketTypes((prev) =>
      prev.map((t) =>
        t.id === selectedTicketTypeId
          ? {
              ...t,
              categories: t.categories.map((c) =>
                c.id === selectedCategoryId
                  ? {
                      ...c,
                      subCategories: c.subCategories.map((s) =>
                        s.id === selectedSubCategoryId
                          ? { ...s, description: text }
                          : s
                      ),
                    }
                  : c
              ),
            }
          : t
      )
    );
  }

  function toggleEnvironment(enabled: boolean) {
    if (!selectedTicketTypeId || !selectedCategoryId || !selectedSubCategoryId)
      return;
    setTicketTypes((prev) =>
      prev.map((t) =>
        t.id === selectedTicketTypeId
          ? {
              ...t,
              categories: t.categories.map((c) =>
                c.id === selectedCategoryId
                  ? {
                      ...c,
                      subCategories: c.subCategories.map((s) =>
                        s.id === selectedSubCategoryId
                          ? { ...s, environment: enabled }
                          : s
                      ),
                    }
                  : c
              ),
            }
          : t
      )
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 ">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">
            Template Details
          </h2>

          <div className="mt-6 space-y-5">
            <TicketTypeField
              ticketTypes={ticketTypes}
              loading={loading}
              selectedTicketType={selectedTicketType}
              onSelect={handleSelectTicketType}
              onAdd={addTicketType}
              onRename={renameTicketType}
              onDelete={deleteTicketType}
            />

            <CategoryField
              selectedTicketType={selectedTicketType}
              selectedCategory={selectedCategory}
              loading={categoriesLoading}
              onSelect={handleSelectCategory}
              onAdd={addCategory}
              onRename={renameCategory}
              onDelete={deleteCategory}
            />

            <SubCategoryField
              selectedCategory={selectedCategory}
              selectedSubCategory={selectedSubCategory}
              onSelect={handleSelectSubCategory}
              onAdd={addSubCategory}
              onRename={renameSubCategory}
              onDelete={deleteSubCategory}
            />

            <EnvironmentField
              selectedSubCategory={selectedSubCategory}
              onToggle={toggleEnvironment}
            />
          </div>
        </div>

        <DescriptionCard
          key={selectedSubCategory?.id ?? "none"}
          subCategory={selectedSubCategory}
          onSave={saveDescription}
        />
      </div>
    </div>
  );
}