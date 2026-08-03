"use client";

import { FieldRow, SelectField, ManagePopover } from "./ui";
import type { TicketType } from "./types";

export function TicketTypeField({
  ticketTypes,
  loading,
  selectedTicketType,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: {
  ticketTypes: TicketType[];
  loading: boolean;
  selectedTicketType: TicketType | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <FieldRow label="Ticket Type">
      <SelectField
        placeholder={loading ? "Loading..." : "Select ticket type"}
        value={selectedTicketType?.name ?? ""}
        disabled={loading}
        options={ticketTypes.map((t) => ({ id: t.id, label: t.name }))}
        onSelect={onSelect}
      />
      <ManagePopover
        title="Manage ticket types"
        items={ticketTypes.map((t) => ({ id: t.id, label: t.name }))}
        addPlaceholder="New ticket type name"
        onAdd={onAdd}
        onRename={onRename}
        onDelete={onDelete}
      />
    </FieldRow>
  );
}