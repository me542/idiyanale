"use client";

import { useEffect, useState } from "react";
import { Pencil, X, Check } from "lucide-react";

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

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token");

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
          setError(
            result.message || "Failed to get user information."
          );
          return;
        }

        const user = result.response;

        console.log("User Details:", user);

        setWorkInfo({
          staffId: user.staff_id || "",
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          email: user.email || "",
          institution:
            user.institution?.institution_name || "",
          position:
            user.job_position?.job_position_name || "",
          role: user.role?.role_name || "",
        });
      } catch (error) {
        console.error(
          "Failed to fetch user details:",
          error
        );

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
            <p className="text-sm text-red-500">
              {error}
            </p>
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

  const [formWork, setFormWork] =
    useState<WorkInfo>(workInfo);

  useEffect(() => {
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

  const updateWorkField = (
    field: keyof WorkInfo,
    value: string
  ) => {
    setFormWork((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Work Information
        </h2>

        {/* 
        Enable this section if you want the edit functionality
        to be visible.

        {!isEditing ? (
          <button
            type="button"
            onClick={handleEditClick}
            title="Edit information"
            className="rounded-full p-1 text-emerald-600 transition-colors hover:bg-emerald-50"
          >
            <Pencil
              size={18}
              strokeWidth={1.75}
            />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              title="Cancel"
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100"
            >
              <X
                size={24}
                strokeWidth={1.75}
              />
            </button>

            <button
              type="button"
              onClick={handleSave}
              title="Save"
              className="rounded-full p-1 text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              <Check
                size={24}
                strokeWidth={1.75}
              />
            </button>
          </div>
        )}
        */}
      </div>

      {/* Information */}
      <dl className="mt-7 space-y-5">
        <InfoRow
          label="Staff ID"
          value={formWork.staffId}
          isEditing={isEditing}
          onChange={(value) =>
            updateWorkField("staffId", value)
          }
        />

        <InfoRow
          label="First name"
          value={formWork.firstName}
          isEditing={isEditing}
          onChange={(value) =>
            updateWorkField("firstName", value)
          }
        />

        <InfoRow
          label="Last name"
          value={formWork.lastName}
          isEditing={isEditing}
          onChange={(value) =>
            updateWorkField("lastName", value)
          }
        />

        <InfoRow
          label="Email"
          value={formWork.email}
          isEditing={isEditing}
          onChange={(value) =>
            updateWorkField("email", value)
          }
        />

        <InfoRow
          label="Institution"
          value={formWork.institution}
          isEditing={isEditing}
          onChange={(value) =>
            updateWorkField("institution", value)
          }
        />

        <InfoRow
          label="Position"
          value={formWork.position}
          isEditing={isEditing}
          onChange={(value) =>
            updateWorkField("position", value)
          }
        />

        <InfoRow
          label="Role"
          value={formWork.role}
          isEditing={isEditing}
          onChange={(value) =>
            updateWorkField("role", value)
          }
        />
      </dl>

      {/* Confirmation Modal */}
      {showConfirm && (
        <ConfirmEditModal
          onConfirm={confirmEdit}
          onCancel={cancelConfirm}
        />
      )}
    </div>
  );
}

/*
 * Information Row
 */
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
  /*
   * Editing state
   */
  if (isEditing) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <dt className="w-28 shrink-0 font-semibold text-slate-400">
          {label}:
        </dt>

        <dd className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(event) =>
              onChange?.(event.target.value)
            }
            className="w-full max-w-xl rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
          />
        </dd>
      </div>
    );
  }

  /*
   * Normal state
   */
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
      <dt className="w-28 shrink-0 font-semibold text-slate-400">
        {label}:
      </dt>

      <dd className="font-medium text-slate-600">
        {value || "—"}
      </dd>
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
          You&apos;re about to edit this record. Do you want
          to continue?
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