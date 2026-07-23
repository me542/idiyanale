"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { ChevronDown, Pencil, Plus, Trash2, Check, X } from "lucide-react";

type SubCategory = {
  id: string;
  name: string;
  description: string;
};

type Category = {
  id: string;
  name: string;
  subCategories: SubCategory[];
};

type TicketType = {
  id: string;
  name: string;
  categories: Category[];
};

const uid = () => Math.random().toString(36).slice(2, 10);

const initialTicketTypes: TicketType[] = [];

export default function Page() {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>(
    initialTicketTypes
  );
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<
    string | null
  >(initialTicketTypes[0]?.id ?? null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialTicketTypes[0]?.categories[0]?.id ?? null
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | null
  >(initialTicketTypes[0]?.categories[0]?.subCategories[0]?.id ?? null);

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

  // ---- selection helpers -------------------------------------------------

  function handleSelectTicketType(id: string) {
    setSelectedTicketTypeId(id);
    const type = ticketTypes.find((t) => t.id === id);
    const firstCategory = type?.categories[0] ?? null;
    setSelectedCategoryId(firstCategory?.id ?? null);
    setSelectedSubCategoryId(firstCategory?.subCategories[0]?.id ?? null);
  }

  function handleSelectCategory(id: string) {
    setSelectedCategoryId(id);
    const cat = selectedTicketType?.categories.find((c) => c.id === id);
    setSelectedSubCategoryId(cat?.subCategories[0]?.id ?? null);
  }

  function handleSelectSubCategory(id: string) {
    setSelectedSubCategoryId(id);
  }

  // ---- ticket type CRUD ---------------------------------------------------

  function addTicketType(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newType: TicketType = { id: uid(), name: trimmed, categories: [] };
    setTicketTypes((prev) => [...prev, newType]);
    setSelectedTicketTypeId(newType.id);
    setSelectedCategoryId(null);
    setSelectedSubCategoryId(null);
  }

  function renameTicketType(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setTicketTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: trimmed } : t))
    );
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

  // ---- category CRUD ------------------------------------------------------

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

  // ---- subcategory CRUD ----------------------------------------------------

  function addSubCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed || !selectedTicketTypeId || !selectedCategoryId) return;
    const newSub: SubCategory = { id: uid(), name: trimmed, description: "" };
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

  // ---- description -----------------------------------------------------

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

  return (
    <div className="min-h-screen bg-slate-50 ">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <TemplateDetailsCard
          ticketTypes={ticketTypes}
          selectedTicketType={selectedTicketType}
          selectedCategory={selectedCategory}
          selectedSubCategory={selectedSubCategory}
          onSelectTicketType={handleSelectTicketType}
          onSelectCategory={handleSelectCategory}
          onSelectSubCategory={handleSelectSubCategory}
          onAddTicketType={addTicketType}
          onRenameTicketType={renameTicketType}
          onDeleteTicketType={deleteTicketType}
          onAddCategory={addCategory}
          onRenameCategory={renameCategory}
          onDeleteCategory={deleteCategory}
          onAddSubCategory={addSubCategory}
          onRenameSubCategory={renameSubCategory}
          onDeleteSubCategory={deleteSubCategory}
        />
        <DescriptionCard
          key={selectedSubCategory?.id ?? "none"}
          subCategory={selectedSubCategory}
          onSave={saveDescription}
        />
      </div>
    </div>
  );
}

// Template Details card — Ticket Type / Category / SubCategory selects, each nested under the previous, each with a manager popover (add / rename / delete) behind the pencil icon.
function TemplateDetailsCard({
  ticketTypes,
  selectedTicketType,
  selectedCategory,
  selectedSubCategory,
  onSelectTicketType,
  onSelectCategory,
  onSelectSubCategory,
  onAddTicketType,
  onRenameTicketType,
  onDeleteTicketType,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onAddSubCategory,
  onRenameSubCategory,
  onDeleteSubCategory,
}: {
  ticketTypes: TicketType[];
  selectedTicketType: TicketType | null;
  selectedCategory: Category | null;
  selectedSubCategory: SubCategory | null;
  onSelectTicketType: (id: string) => void;
  onSelectCategory: (id: string) => void;
  onSelectSubCategory: (id: string) => void;
  onAddTicketType: (name: string) => void;
  onRenameTicketType: (id: string, name: string) => void;
  onDeleteTicketType: (id: string) => void;
  onAddCategory: (name: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddSubCategory: (name: string) => void;
  onRenameSubCategory: (id: string, name: string) => void;
  onDeleteSubCategory: (id: string) => void;
}) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-800">
        Template Details
      </h2>

      <div className="mt-6 space-y-5">
        <FieldRow label="Ticket Type">
          <SelectField
            placeholder="Select ticket type"
            value={selectedTicketType?.name ?? ""}
            options={ticketTypes.map((t) => ({ id: t.id, label: t.name }))}
            onSelect={onSelectTicketType}
          />
          <ManagePopover 
            title="Manage ticket types"
            items={ticketTypes.map((t) => ({ id: t.id, label: t.name }))}
            addPlaceholder="New ticket type name"
            onAdd={onAddTicketType}
            onRename={onRenameTicketType}
            onDelete={onDeleteTicketType}
          />
        </FieldRow>

        <FieldRow label="Category">
          <SelectField
            placeholder={
              selectedTicketType
                ? "Select category"
                : "Select ticket type first"
            }
            value={selectedCategory?.name ?? ""}
            disabled={!selectedTicketType}
            options={
              selectedTicketType?.categories.map((c) => ({
                id: c.id,
                label: c.name,
              })) ?? []
            }
            onSelect={onSelectCategory}
          />
          <ManagePopover
            title="Manage categories"
            disabled={!selectedTicketType}
            disabledHint="Select a ticket type first"
            items={
              selectedTicketType?.categories.map((c) => ({
                id: c.id,
                label: c.name,
              })) ?? []
            }
            addPlaceholder="New category name"
            onAdd={onAddCategory}
            onRename={onRenameCategory}
            onDelete={onDeleteCategory}
          />
        </FieldRow>

        <FieldRow label="SubCategory">
          <SelectField
            placeholder={
              selectedCategory ? "Select subcategory" : "Select category first"
            }
            value={selectedSubCategory?.name ?? ""}
            disabled={!selectedCategory}
            options={
              selectedCategory?.subCategories.map((s) => ({
                id: s.id,
                label: s.name,
              })) ?? []
            }
            onSelect={onSelectSubCategory}
          />
          <ManagePopover
            title="Manage subcategories"
            disabled={!selectedCategory}
            disabledHint="Select a category first"
            items={
              selectedCategory?.subCategories.map((s) => ({
                id: s.id,
                label: s.name,
              })) ?? []
            }
            addPlaceholder="New subcategory name"
            onAdd={onAddSubCategory}
            onRename={onRenameSubCategory}
            onDelete={onDeleteSubCategory}
          />
        </FieldRow>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-sm font-medium text-slate-500">
        {label} :
      </span>
      <div className="flex flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

function SelectField({
  value,
  placeholder,
  options,
  onSelect,
  disabled,
}: {
  value: string;
  placeholder: string;
  options: { id: string; label: string }[];
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between border-b pb-1.5 text-sm transition-colors ${
          disabled
            ? "cursor-not-allowed border-slate-100 text-slate-300"
            : "border-slate-200 text-slate-700 hover:border-slate-300"
        }`}
      >
        <span className={value ? "text-slate-700" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">No options yet</p>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1">
              {options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(opt.id);
                      setOpen(false);
                    }}
                    className="block w-full truncate px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ManagePopover({
  title,
  items,
  addPlaceholder,
  onAdd,
  onRename,
  onDelete,
  disabled,
  disabledHint,
}: {
  title: string;
  items: { id: string; label: string }[];
  addPlaceholder: string;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingId(null);
        setConfirmDeleteId(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function startEdit(id: string, label: string) {
    setEditingId(id);
    setEditingValue(label);
    setConfirmDeleteId(null);
  }

  function commitEdit() {
    if (editingId) onRename(editingId, editingValue);
    setEditingId(null);
  }

  function commitAdd() {
    if (newName.trim()) {
      onAdd(newName);
      setNewName("");
    }
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        title={disabled ? disabledHint : title}
        className={`rounded p-1 transition-colors ${
          disabled
            ? "cursor-not-allowed text-slate-300"
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        }`}
      >
        <Pencil size={15} />
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </p>

          {items.length === 0 && (
            <p className="mb-2 text-sm text-slate-400">Nothing added yet</p>
          )}

          <ul className="mb-3 max-h-44 space-y-1 overflow-y-auto">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-1 rounded-md px-1 py-1 hover:bg-slate-50"
              >
                {editingId === item.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none focus:border-slate-400"
                    />
                    <button
                      type="button"
                      onClick={commitEdit}
                      className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : confirmDeleteId === item.id ? (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-500">
                      Delete &ldquo;{item.label}&rdquo;?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(item.id);
                        setConfirmDeleteId(null);
                      }}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                      {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(item.id, item.label)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Rename"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1 border-t border-slate-100 pt-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitAdd()}
              placeholder={addPlaceholder}
              className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <button
              type="button"
              onClick={commitAdd}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              title="Add"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Description card — shows / edits the description that belongs to the currently selected subcategory.
function DescriptionCard({
  subCategory,
  onSave,
}: {
  subCategory: SubCategory | null;
  onSave: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function startEdit() {
    setDraft(subCategory?.description ?? "");
    setEditing(true);
  }

  function save() {
    onSave(draft);
    setEditing(false);
  }

  return (
    <div className="min-h-[480px] flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">
          Description
        </h2>
        {subCategory && !editing && (
          <button
            type="button"
            onClick={startEdit}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Edit description"
          >
            <Pencil size={15} />
          </button>
        )}
      </div>

      <div className="mt-4">
        {!subCategory ? (
          <EmptyState text="Select a ticket type, category and subcategory to view its description." />
        ) : editing ? (
          <div className="space-y-3">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={12}
              placeholder={`Write a description for "${subCategory.name}"...`}
              className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : subCategory.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {subCategory.description}
          </p>
        ) : (
          <EmptyState text="No information available" />
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[380px] items-center justify-center">
      <p className="text-sm font-medium text-slate-300">{text}</p>
    </div>
  );
}