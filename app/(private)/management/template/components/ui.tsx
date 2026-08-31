"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown, Pencil, Plus, Trash2, Check, X } from "lucide-react";

// Generic "label : control" row used by every field in the Template Details card.
export function FieldRow({
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

// Generic dropdown selector used for Ticket Type / Category / SubCategory.
export function SelectField({
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

// Generic add / rename / delete popover, used behind the pencil icon for
// Ticket Type / Category / SubCategory management.
export function ManagePopover({
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

// Small, accessible on/off control used for the Environment field.
export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${
        disabled
          ? "cursor-not-allowed bg-slate-100"
          : checked
          ? "bg-emerald-500"
          : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// Centered placeholder text used whenever a card has nothing to show.
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[380px] items-center justify-center">
      <p className="text-sm font-medium text-slate-300">{text}</p>
    </div>
  );
}