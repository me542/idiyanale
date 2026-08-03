"use client";

import { FieldRow, SelectField, ManagePopover } from "./ui";
import type { TicketType, Category } from "./types";

export function CategoryField({
  selectedTicketType,
  selectedCategory,
  loading,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: {
  selectedTicketType: TicketType | null;
  selectedCategory: Category | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const options =
    selectedTicketType?.categories.map((c) => ({ id: c.id, label: c.name })) ??
    [];

  const disabled = !selectedTicketType || loading;

  return (
    <FieldRow label="Category">
      <SelectField
        placeholder={
          !selectedTicketType
            ? "Select ticket type first"
            : loading
            ? "Loading..."
            : "Select category"
        }
        value={selectedCategory?.name ?? ""}
        disabled={disabled}
        options={options}
        onSelect={onSelect}
      />
      <ManagePopover
        title="Manage categories"
        disabled={disabled}
        disabledHint={
          !selectedTicketType ? "Select a ticket type first" : undefined
        }
        items={options}
        addPlaceholder="New category name"
        onAdd={onAdd}
        onRename={onRename}
        onDelete={onDelete}
      />
    </FieldRow>
  );
}