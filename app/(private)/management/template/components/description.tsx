"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { EmptyState, Switch } from "./ui";
import type { SubCategory } from "./types";

export type SubCategoryDetails = {
  subjectName: string;
  description: string;
  environment: boolean;
  durationDays: number;
  status: string;
};

export function DescriptionCard({
  subCategory,
  onSave,
}: {
  subCategory: SubCategory | null;
  onSave: (details: SubCategoryDetails) => void;
}) {
  const [editing, setEditing] = useState(false);

  const [draft, setDraft] =
    useState<SubCategoryDetails>({
      subjectName: "",
      description: "",
      environment: false,
      durationDays: 0,
      status: "Active",
    });

  function startEdit() {
    setDraft({
      subjectName:
        subCategory?.subjectName ?? "",
      description:
        subCategory?.description ?? "",
      environment:
        subCategory?.environment ?? false,
      durationDays:
        subCategory?.durationDays ?? 0,
      status: subCategory?.status || "Active",
    });

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
          Template Details
        </h2>

        {subCategory && !editing && (
          <button
            type="button"
            onClick={startEdit}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Edit details"
          >
            <Pencil size={15} />
          </button>
        )}
      </div>

      <div className="mt-4">
        {!subCategory ? (
          <EmptyState text="Select a ticket type, category and subcategory to view its details." />
        ) : editing ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Subject Name
              </label>

              <input
                type="text"
                autoFocus
                value={draft.subjectName}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    subjectName:
                      e.target.value,
                  }))
                }
                placeholder="e.g. Network Access Request"
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Description
              </label>

              <textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    description:
                      e.target.value,
                  }))
                }
                rows={8}
                placeholder={`Write a description for "${subCategory.name}"...`}
                className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.environment}
                  onChange={(enabled) =>
                    setDraft((d) => ({
                      ...d,
                      environment: enabled,
                    }))
                  }
                  label="Toggle has duration"
                />

                <span className="text-sm text-slate-600">
                  Has Duration
                </span>
              </div>

              {draft.environment && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-500">
                    Days
                  </label>

                  <select
                    value={draft.durationDays}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        durationDays: Number(e.target.value),
                      }))
                    }
                    className="w-24 rounded-lg border border-slate-200 p-1.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                  >
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Status
              </label>

              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    status: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="Active">
                  Active
                </option>
                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  setEditing(false)
                }
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
        ) : (
          <div className="space-y-5">
            <div>
              <div className="text-xs font-medium text-slate-400">
                Subject Name
              </div>

              <div className="mt-1 text-sm text-slate-700">
                {subCategory.subjectName || (
                  <span className="text-slate-300">
                    —
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-400">
                Description
              </div>

              {subCategory.description ? (
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {subCategory.description}
                </p>
              ) : (
                <div className="mt-1">
                  <EmptyState text="No information available" />
                </div>
              )}
            </div>

            <div className="flex gap-8">
              <div>
                <div className="text-xs font-medium text-slate-400">
                  Has Duration
                </div>

                <div className="mt-1 text-sm text-slate-700">
                  {subCategory.environment
                    ? "Enabled"
                    : "Disabled"}
                </div>
              </div>

              {subCategory.environment && (
                <div>
                  <div className="text-xs font-medium text-slate-400">
                    Duration (days)
                  </div>

                  <div className="mt-1 text-sm text-slate-700">
                    {subCategory.durationDays}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-medium text-slate-400">
                  Status
                </div>

                <div className="mt-1 text-sm text-slate-700">
                  {subCategory.status || "Active"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}