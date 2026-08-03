"use client";

import { FieldRow, SelectField, ManagePopover } from "./ui";
import type { TicketType, Category } from "./types";

export function CategoryField({
  selectedTicketType,
  selectedCategory,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: {
  selectedTicketType: TicketType | null;
  selectedCategory: Category | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const options =
    selectedTicketType?.categories.map((c) => ({ id: c.id, label: c.name })) ??
    [];

  return (
    <FieldRow label="Category">
      <SelectField
        placeholder={
          selectedTicketType ? "Select category" : "Select ticket type first"
        }
        value={selectedCategory?.name ?? ""}
        disabled={!selectedTicketType}
        options={options}
        onSelect={onSelect}
      />
      <ManagePopover
        title="Manage categories"
        disabled={!selectedTicketType}
        disabledHint="Select a ticket type first"
        items={options}
        addPlaceholder="New category name"
        onAdd={onAdd}
        onRename={onRename}
        onDelete={onDelete}
      />
    </FieldRow>
  );
}