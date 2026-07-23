"use client";

import { useState } from "react";
import { Pencil, X, Check } from "lucide-react";
import type { NavKey } from "./profile-option";
import { TicketKpi, type TicketKpiData } from "./ticket-kpi";
import { MinorTask, type MinorTaskItem } from "./minor-task";

export type WorkInfo = {
  staffId: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  institution: string;
  position: string;
  role: string;
};

export type UnitInfo = {
  laptop: string;
  serialNumber: string;
  macAddress: string;
  ipAddress: string;
};

export function InformationPanel({
  activeNav,
  workInfo,
  unitInfo,
  kpi,
  minorTasks,
  onSave,
}: {
  activeNav: NavKey;
  workInfo: WorkInfo;
  unitInfo: UnitInfo;
  kpi: TicketKpiData;
  minorTasks?: MinorTaskItem[];
  /** Called when the user confirms their edits (Save button). */
  onSave?: (workInfo: WorkInfo, unitInfo: UnitInfo) => void;
}) {
  if (activeNav === "work") {
    return (
      <div className="min-h-[680px] w-full flex-1 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <WorkInformationView
          workInfo={workInfo}
          unitInfo={unitInfo}
          onSave={onSave}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <TicketKpi data={kpi} />
      <MinorTask tasks={minorTasks} />
    </div>
  );
}

function WorkInformationView({
  workInfo,
  unitInfo,
  onSave,
}: {
  workInfo: WorkInfo;
  unitInfo: UnitInfo;
  onSave?: (workInfo: WorkInfo, unitInfo: UnitInfo) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formWork, setFormWork] = useState<WorkInfo>(workInfo);
  const [formUnit, setFormUnit] = useState<UnitInfo>(unitInfo);

  const handleEditClick = () => setShowConfirm(true);

  const confirmEdit = () => {
    // start editing from the latest known values
    setFormWork(workInfo);
    setFormUnit(unitInfo);
    setIsEditing(true);
    setShowConfirm(false);
  };

  const cancelConfirm = () => setShowConfirm(false);

  const handleCancelEdit = () => {
    setFormWork(workInfo);
    setFormUnit(unitInfo);
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave?.(formWork, formUnit);
    setIsEditing(false);
  };

  const updateWorkField = (field: keyof WorkInfo, value: string) =>
    setFormWork((prev) => ({ ...prev, [field]: value }));

  const updateUnitField = (field: keyof UnitInfo, value: string) =>
    setFormUnit((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Work Information
        </h2>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleEditClick}
            title="Edit information"
            className="rounded-full p-1 text-emerald-600 transition-colors hover:bg-emerald-50"
          >
            <Pencil size={26} strokeWidth={1.75} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              title="Cancel"
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100"
            >
              <X size={24} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={handleSave}
              title="Save"
              className="rounded-full p-1 text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              <Check size={24} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>

      <dl className="mt-6 space-y-4">
        <InfoRow
          label="Staff ID"
          value={formWork.staffId}
          isEditing={isEditing}
          onChange={(v) => updateWorkField("staffId", v)}
        />
        <InfoRow
          label="First name"
          value={formWork.firstName}
          isEditing={isEditing}
          onChange={(v) => updateWorkField("firstName", v)}
        />
        <InfoRow
          label="Last name"
          value={formWork.lastName}
          isEditing={isEditing}
          onChange={(v) => updateWorkField("lastName", v)}
        />
        <InfoRow
          label="Contact Number"
          value={formWork.contactNumber}
          isEditing={isEditing}
          onChange={(v) => updateWorkField("contactNumber", v)}
        />
        <InfoRow
          label="Email"
          value={formWork.email}
          isEditing={isEditing}
          onChange={(v) => updateWorkField("email", v)}
        />
        <InfoRow
          label="Institution"
          value={formWork.institution}
          isEditing={isEditing}
          onChange={(v) => updateWorkField("institution", v)}
        />
        <InfoRow
          label="Position"
          value={formWork.position}
          isEditing={isEditing}
          onChange={(v) => updateWorkField("position", v)}
        />
        <InfoRow
          label="Role"
          value={formWork.role}
          isEditing={isEditing}
          onChange={(v) => updateWorkField("role", v)}
        />
      </dl>

      <h3 className="mt-10 text-lg font-semibold text-slate-800">
        Unit Information
      </h3>

      <dl className="mt-6 space-y-4">
        <InfoRow
          label="Laptop"
          value={formUnit.laptop}
          isEditing={isEditing}
          onChange={(v) => updateUnitField("laptop", v)}
        />
        <InfoRow
          label="Serial Number"
          value={formUnit.serialNumber}
          isEditing={isEditing}
          onChange={(v) => updateUnitField("serialNumber", v)}
        />
        <InfoRow
          label="MAC Address"
          value={formUnit.macAddress}
          isEditing={isEditing}
          onChange={(v) => updateUnitField("macAddress", v)}
        />
        <InfoRow
          label="IP Address"
          value={formUnit.ipAddress}
          isEditing={isEditing}
          onChange={(v) => updateUnitField("ipAddress", v)}
        />
      </dl>

      {showConfirm && (
        <ConfirmEditModal onConfirm={confirmEdit} onCancel={cancelConfirm} />
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  isEditing,
  onChange,
}: {
  label: string;
  value: string;
  isEditing?: boolean;
  onChange?: (value: string) => void;
}) {
  if (isEditing) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <dt className="w-40 shrink-0 font-semibold text-slate-400">
          {label}:
        </dt>
        <dd className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
          />
        </dd>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <dt className="font-semibold text-slate-400">{label}:</dt>
      <dd className="font-medium text-slate-600">{value || "—"}</dd>
    </div>
  );
}

function ConfirmEditModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="text-base font-semibold text-slate-800">
          Edit Information?
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          You&apos;re about to edit this record. Do you want to continue?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Yes, edit
          </button>
        </div>
      </div>
    </div>
  );
}