"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  X,
  Check,
  IdCard,
  User,
  Mail,
  Building2,
  Briefcase,
  ShieldCheck,
} from "lucide-react";

import type { NavKey } from "./profile-option";
import { TicketKpi, type TicketKpiData } from "./ticket-kpi";
import { MinorTask, type MinorTaskItem } from "./minor-task";

import { getUserByID } from "@/services/integration/user/get_user_details_by_id";
import { verifyJWT } from "@/lib/auth/verify-jwt";

export type WorkInfo = {
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  institution: string;
  position: string;
  role: string;
};

export function InformationPanel({
  activeNav,
  kpi,
  minorTasks,
  onSave,
}: {
  activeNav: NavKey;
  kpi: TicketKpiData;
  minorTasks?: MinorTaskItem[];
  onSave?: (workInfo: WorkInfo) => void;
}) {
  const [workInfo, setWorkInfo] = useState<WorkInfo>({
    staffId: "",
    firstName: "",
    lastName: "",
    email: "",
    institution: "",
    position: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (activeNav !== "work") {
      return;
    }

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setError("Authentication token not found.");
          return;
        }

        const payload = await verifyJWT(token);

        if (!payload) {
          setError("Invalid authentication token.");
          return;
        }

        if (!payload.id) {
          setError("User ID not found in authentication token.");
          return;
        }

        console.log("JWT Payload:", payload);
        console.log("User ID:", payload.id);

        const result = await getUserByID(payload.id);

        console.log("Get User By ID Response:", result);

        if (!result.response) {
          setError(result.message || "Failed to get user information.");
          return;
        }

        const user = result.response;

        console.log("User Details:", user);

        setWorkInfo({
          staffId: user.staff_id || "",
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          email: user.email || "",
          institution: user.institution?.institution_name || "",
          position: user.job_position?.job_position_name || "",
          role: user.role?.role_name || "",
        });
      } catch (error) {
        console.error("Failed to fetch user details:", error);

        setError("Failed to load user information.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [activeNav]);

  /*
   * Work Information
   */
  if (activeNav === "work") {
    return (
      <div className="w-full flex-1 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <p className="text-sm text-slate-400">
              Loading work information...
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          <WorkInformationView
            workInfo={workInfo}
            onSave={(updatedWorkInfo) => {
              setWorkInfo(updatedWorkInfo);
              onSave?.(updatedWorkInfo);
            }}
          />
        )}
      </div>
    );
  }

  /*
   * Other tabs
   */
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <TicketKpi data={kpi} />
      <MinorTask tasks={minorTasks} />
    </div>
  );
}

/*
 * Work Information View
 */
function WorkInformationView({
  workInfo,
  onSave,
}: {
  workInfo: WorkInfo;
  onSave?: (workInfo: WorkInfo) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formWork, setFormWork] = useState<WorkInfo>(workInfo);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormWork(workInfo);
  }, [workInfo]);

  const handleEditClick = () => {
    setShowConfirm(true);
  };

  const confirmEdit = () => {
    setFormWork(workInfo);
    setIsEditing(true);
    setShowConfirm(false);
  };

  const cancelConfirm = () => {
    setShowConfirm(false);
  };

  const handleCancelEdit = () => {
    setFormWork(workInfo);
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave?.(formWork);
    setIsEditing(false);
  };

  const updateWorkField = (field: keyof WorkInfo, value: string) => {
    setFormWork((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const initials = `${workInfo.firstName?.[0] ?? ""}${
    workInfo.lastName?.[0] ?? ""
  }`.toUpperCase();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
            {initials || <User size={20} strokeWidth={1.75} />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Work Information
            </h2>
            <p className="text-sm text-slate-400">
              {workInfo.position || "—"} · {workInfo.institution || "—"}
            </p>
          </div>
        </div>

        {/*
        Enable this section if you want the edit functionality
        to be visible.

        {!isEditing ? (
          <button
            type="button"
            onClick={handleEditClick}
            title="Edit information"
            className="flex h-9 w-9 items-center justify-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-50"
          >
            <Pencil size={17} strokeWidth={1.75} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              title="Cancel"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100"
            >
              <X size={19} strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={handleSave}
              title="Save"
              className="flex h-9 w-9 items-center justify-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              <Check size={19} strokeWidth={1.75} />
            </button>
          </div>
        )}
        */}
      </div>

      {/* Information */}
      <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        <InfoRow
          icon={IdCard}
          label="Staff ID"
          value={formWork.staffId}
          isEditing={isEditing}
          onChange={(value) => updateWorkField("staffId", value)}
        />

        <InfoRow
          icon={ShieldCheck}
          label="Role"
          value={formWork.role}
          isEditing={isEditing}
          pill
          onChange={(value) => updateWorkField("role", value)}
        />

        <InfoRow
          icon={User}
          label="First name"
          value={formWork.firstName}
          isEditing={isEditing}
          onChange={(value) => updateWorkField("firstName", value)}
        />

        <InfoRow
          icon={User}
          label="Last name"
          value={formWork.lastName}
          isEditing={isEditing}
          onChange={(value) => updateWorkField("lastName", value)}
        />

        <InfoRow
          icon={Mail}
          label="Email"
          value={formWork.email}
          isEditing={isEditing}
          className="sm:col-span-2"
          onChange={(value) => updateWorkField("email", value)}
        />

        <InfoRow
          icon={Building2}
          label="Institution"
          value={formWork.institution}
          isEditing={isEditing}
          onChange={(value) => updateWorkField("institution", value)}
        />

        <InfoRow
          icon={Briefcase}
          label="Position"
          value={formWork.position}
          isEditing={isEditing}
          onChange={(value) => updateWorkField("position", value)}
        />
      </dl>

      {/* Confirmation Modal */}
      {showConfirm && (
        <ConfirmEditModal onConfirm={confirmEdit} onCancel={cancelConfirm} />
      )}
    </div>
  );
}

/*
 * Information Row
 */
function InfoRow({
  icon: Icon,
  label,
  value,
  isEditing,
  pill,
  className = "",
  onChange,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  isEditing?: boolean;
  pill?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <Icon size={16} strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-slate-400">{label}</dt>

        {isEditing ? (
          <input
            type="text"
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
          />
        ) : pill && value ? (
          <dd className="mt-1">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-medium text-emerald-700">
              {value}
            </span>
          </dd>
        ) : (
          <dd className="mt-1 truncate text-sm font-medium text-slate-700">
            {value || "—"}
          </dd>
        )}
      </div>
    </div>
  );
}

/*
 * Edit Confirmation Modal
 */
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