"use client";

import { FieldRow, SelectField, ManagePopover, Switch } from "./ui";
import type { Category, SubCategory } from "./types";

export function SubCategoryField({
  selectedCategory,
  selectedSubCategory,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: {
  selectedCategory: Category | null;
  selectedSubCategory: SubCategory | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const options =
    selectedCategory?.subCategories.map((s) => ({ id: s.id, label: s.name })) ??
    [];

  return (
    <FieldRow label="SubCategory">
      <SelectField
        placeholder={
          selectedCategory ? "Select subcategory" : "Select category first"
        }
        value={selectedSubCategory?.name ?? ""}
        disabled={!selectedCategory}
        options={options}
        onSelect={onSelect}
      />
      <ManagePopover
        title="Manage subcategories"
        disabled={!selectedCategory}
        disabledHint="Select a category first"
        items={options}
        addPlaceholder="New subcategory name"
        onAdd={onAdd}
        onRename={onRename}
        onDelete={onDelete}
      />
    </FieldRow>
  );
}

// Environment toggle belongs to the selected subcategory, so it lives
// alongside it rather than in its own top-level file.
export function EnvironmentField({
  selectedSubCategory,
  onToggle,
}: {
  selectedSubCategory: SubCategory | null;
  onToggle: (enabled: boolean) => void;
}) {
  // return (
  //   <FieldRow label="Environment">
  //     <div className="flex flex-1 items-center gap-2">
  //       <Switch
  //         checked={selectedSubCategory?.environment ?? false}
  //         onChange={onToggle}
  //         disabled={!selectedSubCategory}
  //         label="Toggle environment"
  //       />
  //       <span
  //         className={`text-sm ${
  //           selectedSubCategory ? "text-slate-500" : "text-slate-300"
  //         }`}
  //       >
  //         {!selectedSubCategory
  //           ? "Select a subcategory first"
  //           : selectedSubCategory.environment
  //           ? "Enabled"
  //           : "Disabled"}
  //       </span>
  //     </div>
  //   </FieldRow>
  // );
}