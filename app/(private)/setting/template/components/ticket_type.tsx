"use client";

import { FieldRow, SelectField, ManagePopover } from "./ui";
import type { TicketType } from "./types";

interface TicketTypeFieldProps {
  ticketTypes: TicketType[];
  loading: boolean;
  selectedTicketType: TicketType | null;

  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function TicketTypeField({
  ticketTypes,
  loading,
  selectedTicketType,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: TicketTypeFieldProps) {
  return (
    <FieldRow label="Ticket Type">
      <SelectField
        placeholder={
          loading
            ? "Loading..."
            : "Select ticket type"
        }
        value={selectedTicketType?.name ?? ""}
        disabled={loading}
        options={ticketTypes.map((ticketType) => ({
          id: ticketType.id,
          label: ticketType.name,
        }))}
        onSelect={onSelect}
      />

      <ManagePopover
        title="Manage ticket types"
        items={ticketTypes.map((ticketType) => ({
          id: ticketType.id,
          label: ticketType.name,
        }))}
        addPlaceholder="New ticket type name"
        onAdd={onAdd}
        onRename={onRename}
        onDelete={onDelete}
      />
    </FieldRow>
  );
}