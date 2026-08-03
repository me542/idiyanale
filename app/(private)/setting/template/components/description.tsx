"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { EmptyState } from "./ui";
import type { SubCategory } from "./types";

export function DescriptionCard({
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