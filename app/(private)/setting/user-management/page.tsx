"use client";

import { useEffect, useState } from "react";
import AddUserModal from "./register/register";
import {getUsersByInstitutionId, UserDetails, } from "@/services/integration/super_admin/get_user_insti_id";
import { changeUserStatus, UserStatus, } from "@/services/integration/super_admin/patch_user_status"; 
import { changeUserRole, } from "@/services/integration/role/patch_changed_user_role";
import { addRole, AddRoleRequest, } from "@/services/integration/role/post_role"; 
import { getRolesByInstitution, Role, } from "@/services/integration/role/get_role_by_insti"; 
import { verifyJWT } from "@/lib/auth/verify-jwt";
import {
  createResolverGroup,
  CreateResolverGroupRequest,
} from "@/services/integration/institution/post-create-resolver-group";
import {
  updateResolverGroup,
  UpdateResolverGroupRequest,
} from "@/services/integration/institution/put-update-resolver-group";
import {
  getResolverGroups,
  ResolverGroup,
} from "@/services/integration/institution/get-resolver-groups";
import {
  setInstitutionAccess,
  SetInstitutionAccessRequest,
} from "@/services/integration/institution/post-set-allow-insti-ticket";
import {
  getInstitutions,
  InstitutionResp,
} from "@/services/integration/institution/get-all-insti";

// ---------- Types ----------

type Status = "active" | "pending" | "disabled";

interface UserRow {
  id: number;
  staffId: string;
  firstName: string;
  lastName: string;
  position: string;
  institution: string;
  email: string;
  role: string;
  roleId: number;
  policy: string;
  status: Status;
  createdAt: string;
}

interface RoleOption {
  id: number;
  name: string;
}

// Sentinel value used in the role <select> to trigger the "add new role"
// flow instead of an actual role assignment.
const ADD_NEW_ROLE_VALUE = "__add_new_role__";

const EMPTY_ROLE_FORM: AddRoleRequest = {
  role_name: "",
  can_create: false,
  can_endorse: false,
  can_approve: false,
  can_resolve: false,
  can_audit: false,
};

const EMPTY_RESOLVER_GROUP_FORM: { group_name: string; member_ids: number[] } = {
  group_name: "",
  member_ids: [],
};

const STATUS_STYLES: Record<Status, string> = {
  active: "text-emerald-500",
  pending: "text-amber-500",
  disabled: "text-slate-400",
};

// ---------- Icons ----------

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function UsersGroupIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

// ---------- Add Role Modal ----------

interface AddRoleModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (roleName: string) => void;
}

const PERMISSION_FIELDS: { key: keyof AddRoleRequest; label: string }[] = [
  { key: "can_create", label: "Can Create" },
  { key: "can_endorse", label: "Can Endorse" },
  { key: "can_approve", label: "Can Approve" },
  { key: "can_resolve", label: "Can Resolve" },
  { key: "can_audit", label: "Can Audit" },
];

function AddRoleModal({ open, onClose, onCreated }: AddRoleModalProps) {
  const [form, setForm] = useState<AddRoleRequest>(EMPTY_ROLE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const togglePermission = (key: keyof AddRoleRequest) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!form.role_name.trim()) {
      setError("Role name is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await addRole(form);

      if (
        result.ret_code &&
        result.ret_code !== "0" &&
        result.ret_code !== "200"
      ) {
        throw new Error(result.message ?? "Failed to create role.");
      }

      const createdRoleName = form.role_name;
      setForm(EMPTY_ROLE_FORM);
      onClose();
      onCreated(createdRoleName);
    } catch (err) {
      console.error("Failed to create role:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create role."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-base font-semibold text-slate-800">
          Add New Role
        </h2>

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Role Name
        </label>
        <input
          type="text"
          value={form.role_name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, role_name: e.target.value }))
          }
          placeholder="e.g. Reviewer"
          className="mb-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />

        <p className="mb-2 text-xs font-semibold text-slate-500">
          Permissions
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {PERMISSION_FIELDS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={() => togglePermission(key)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
              />
              {label}
            </label>
          ))}
        </div>

        {error && (
          <p className="mb-3 text-sm text-red-500">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setForm(EMPTY_ROLE_FORM);
              setError("");
              onClose();
            }}
            disabled={submitting}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Resolver Groups Modal ----------
// Lets a super admin create new resolver groups and edit existing ones
// (rename, change members, toggle active/inactive) using the
// createResolverGroup / updateResolverGroup / getResolverGroups APIs.

interface ResolverGroupsModalProps {
  open: boolean;
  onClose: () => void;
  users: UserRow[];
  groups: ResolverGroup[];
  loadingGroups: boolean;
  onRefresh: () => Promise<void>;
}

function ResolverGroupsModal({
  open,
  onClose,
  users,
  groups,
  loadingGroups,
  onRefresh,
}: ResolverGroupsModalProps) {
  // "create" form state
  const [createForm, setCreateForm] = useState(EMPTY_RESOLVER_GROUP_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // inline edit state (only one group editable at a time)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UpdateResolverGroupRequest>({
    group_name: "",
    member_ids: [],
    status: "active",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  if (!open) return null;

  const resetCreateForm = () => {
    setCreateForm(EMPTY_RESOLVER_GROUP_FORM);
    setCreateError("");
    setShowCreateForm(false);
  };

  const toggleCreateMember = (userId: number) => {
    setCreateForm((prev) => ({
      ...prev,
      member_ids: prev.member_ids.includes(userId)
        ? prev.member_ids.filter((id) => id !== userId)
        : [...prev.member_ids, userId],
    }));
  };

  const handleCreate = async () => {
    if (!createForm.group_name.trim()) {
      setCreateError("Group name is required.");
      return;
    }

    if (createForm.member_ids.length === 0) {
      setCreateError("Select at least one member.");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const payload: CreateResolverGroupRequest = {
        group_name: createForm.group_name,
        member_ids: createForm.member_ids,
      };

      const result = await createResolverGroup(payload);

      if (
        result.ret_code &&
        result.ret_code !== "0" &&
        result.ret_code !== "200"
      ) {
        throw new Error(result.message ?? "Failed to create resolver group.");
      }

      resetCreateForm();
      await onRefresh();
    } catch (err) {
      console.error("Failed to create resolver group:", err);
      setCreateError(
        err instanceof Error ? err.message : "Failed to create resolver group."
      );
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (group: ResolverGroup) => {
    setEditingGroupId(group.resolver_group_id);
    setEditForm({
      group_name: group.group_name,
      member_ids: [...group.member_ids],
      status: group.status,
    });
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingGroupId(null);
    setEditError("");
  };

  const toggleEditMember = (userId: number) => {
    setEditForm((prev) => ({
      ...prev,
      member_ids: prev.member_ids.includes(userId)
        ? prev.member_ids.filter((id) => id !== userId)
        : [...prev.member_ids, userId],
    }));
  };

  const handleSaveEdit = async (groupId: number) => {
    if (!editForm.group_name.trim()) {
      setEditError("Group name is required.");
      return;
    }

    if (editForm.member_ids.length === 0) {
      setEditError("Select at least one member.");
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      const result = await updateResolverGroup(groupId, editForm);

      if (
        result.ret_code &&
        result.ret_code !== "0" &&
        result.ret_code !== "200"
      ) {
        throw new Error(result.message ?? "Failed to update resolver group.");
      }

      setEditingGroupId(null);
      await onRefresh();
    } catch (err) {
      console.error("Failed to update resolver group:", err);
      setEditError(
        err instanceof Error ? err.message : "Failed to update resolver group."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const memberNames = (memberIds: number[]) =>
    memberIds
      .map((id) => {
        const u = users.find((row) => row.id === id);
        return u ? `${u.firstName} ${u.lastName}` : `#${id}`;
      })
      .join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Resolver Groups
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Existing groups */}

        {loadingGroups ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Loading resolver groups...
          </p>
        ) : groups.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">
            No resolver groups yet.
          </p>
        ) : (
          <div className="mb-4 space-y-3">
            {groups.map((group) => {
              const isEditing = editingGroupId === group.resolver_group_id;

              return (
                <div
                  key={group.resolver_group_id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  {!isEditing ? (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {group.group_name}{" "}
                          <span
                            className={`ml-2 text-xs font-medium capitalize ${
                              group.status === "active"
                                ? "text-emerald-500"
                                : "text-slate-400"
                            }`}
                          >
                            {group.status}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {group.member_ids.length} member
                          {group.member_ids.length === 1 ? "" : "s"}:{" "}
                          {memberNames(group.member_ids) || "-"}
                        </p>
                      </div>
                      <button
                        onClick={() => startEdit(group)}
                        className="shrink-0 rounded-md px-3 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">
                        Group Name
                      </label>
                      <input
                        type="text"
                        value={editForm.group_name}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            group_name: e.target.value,
                          }))
                        }
                        className="mb-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      />

                      <label className="mb-1 block text-xs font-semibold text-slate-500">
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            status: e.target.value as "active" | "inactive",
                          }))
                        }
                        className="mb-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>

                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        Members
                      </p>
                      <div className="mb-3 max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-100 p-2">
                        {users.map((u) => (
                          <label
                            key={u.id}
                            className="flex items-center gap-2 text-sm text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={editForm.member_ids.includes(u.id)}
                              onChange={() => toggleEditMember(u.id)}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                            />
                            {u.firstName} {u.lastName}{" "}
                            <span className="text-xs text-slate-400">
                              ({u.role})
                            </span>
                          </label>
                        ))}
                      </div>

                      {editError && (
                        <p className="mb-2 text-sm text-red-500">
                          {editError}
                        </p>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEdit}
                          disabled={savingEdit}
                          className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(group.resolver_group_id)}
                          disabled={savingEdit}
                          className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                        >
                          {savingEdit ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create new group */}

        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full rounded-md border border-dashed border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
          >
            + New Resolver Group
          </button>
        ) : (
          <div className="rounded-lg border border-slate-200 p-3">
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Group Name
            </label>
            <input
              type="text"
              value={createForm.group_name}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  group_name: e.target.value,
                }))
              }
              placeholder="e.g. Tier 1 Resolvers"
              className="mb-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />

            <p className="mb-2 text-xs font-semibold text-slate-500">
              Members
            </p>
            <div className="mb-3 max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-100 p-2">
              {users.length === 0 ? (
                <p className="text-xs text-slate-400">No users available.</p>
              ) : (
                users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={createForm.member_ids.includes(u.id)}
                      onChange={() => toggleCreateMember(u.id)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                    />
                    {u.firstName} {u.lastName}{" "}
                    <span className="text-xs text-slate-400">({u.role})</span>
                  </label>
                ))
              )}
            </div>

            {createError && (
              <p className="mb-3 text-sm text-red-500">{createError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={resetCreateForm}
                disabled={creating}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Institution Access Modal ----------
// Lets a super admin allow or revoke another institution's ability to
// raise tickets against this institution, using setInstitutionAccess.
// getInstitutions doesn't tell us which targets are currently allowed,
// so state shown here reflects only what's been set during this session
// ("Unknown" until toggled) rather than a persisted allow-list.

type AccessState = "unknown" | "allowed" | "disallowed";

interface InstitutionAccessModalProps {
  open: boolean;
  onClose: () => void;
  institutions: InstitutionResp[];
  loadingInstitutions: boolean;
  currentInstitutionId: number | null;
}

function InstitutionAccessModal({
  open,
  onClose,
  institutions,
  loadingInstitutions,
  currentInstitutionId,
}: InstitutionAccessModalProps) {
  const [accessState, setAccessState] = useState<
    Record<number, AccessState>
  >({});
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSetAccess = async (
    targetInstitutionId: number,
    isAllowed: boolean
  ) => {
    setPendingId(targetInstitutionId);
    setError("");

    try {
      const payload: SetInstitutionAccessRequest = {
        target_institution_id: targetInstitutionId,
        is_allowed: isAllowed,
        ...(currentInstitutionId
          ? { source_institution_id: currentInstitutionId }
          : {}),
      };

      const result = await setInstitutionAccess(payload);

      if (
        result.ret_code &&
        result.ret_code !== "0" &&
        result.ret_code !== "200"
      ) {
        throw new Error(result.message ?? "Failed to update institution access.");
      }

      setAccessState((prev) => ({
        ...prev,
        [targetInstitutionId]: isAllowed ? "allowed" : "disallowed",
      }));
    } catch (err) {
      console.error("Failed to update institution access:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update institution access."
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Institution Ticket Access
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-xs text-slate-500">
          Allow or revoke other institutions&apos; ability to raise tickets
          against your institution.
        </p>

        {error && (
          <p className="mb-3 text-sm text-red-500">{error}</p>
        )}

        {loadingInstitutions ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Loading institutions...
          </p>
        ) : institutions.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">
            No institutions found.
          </p>
        ) : (
          <div className="space-y-2">
            {institutions.map((inst) => {
              const isCurrent = inst.institution_id === currentInstitutionId;
              const state = accessState[inst.institution_id] ?? "unknown";
              const isPending = pendingId === inst.institution_id;

              return (
                <div
                  key={inst.institution_id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isCurrent
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-slate-200"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {inst.institution_name}
                      {isCurrent && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                          Your institution
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {inst.institution_code}
                      {!isCurrent && state !== "unknown" && (
                        <span
                          className={`ml-2 font-medium ${
                            state === "allowed"
                              ? "text-emerald-500"
                              : "text-red-400"
                          }`}
                        >
                          {state === "allowed" ? "Allowed" : "Disallowed"}
                        </span>
                      )}
                    </p>
                  </div>

                  {!isCurrent && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => handleSetAccess(inst.institution_id, true)}
                        disabled={isPending}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                          state === "allowed"
                            ? "bg-emerald-500 text-white"
                            : "border border-emerald-400 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {isPending ? "..." : "Allow"}
                      </button>
                      <button
                        onClick={() => handleSetAccess(inst.institution_id, false)}
                        disabled={isPending}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                          state === "disallowed"
                            ? "bg-slate-500 text-white"
                            : "border border-slate-300 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {isPending ? "..." : "Disallow"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Helpers ----------

function mapUserToRow(user: UserDetails): UserRow {
  const status = user.status?.toLowerCase();

  return {
    id: user.id,
    staffId: user.staff_id,
    firstName: user.first_name,
    lastName: user.last_name,
    position: user.job_positions?.position_name ?? "-",
    institution: user.institution?.institution_name ?? "-",
    email: user.email,

    role: user.role?.role_name ?? "-",
    roleId: user.role?.role_id ?? 0,

    policy: "-",

    status:
      status === "active" ||
      status === "pending" ||
      status === "disabled"
        ? status
        : "disabled",

    createdAt: user.created_at
      ? new Date(user.created_at).toLocaleDateString()
      : "-",
  };
}

// Maps the full Role record (from getRolesByInstitution) down to what the
// dropdown needs. This is now the source of truth for available roles —
// it includes roles that exist but aren't assigned to anyone yet.
function mapRoleToOption(role: Role): RoleOption {
  return { id: role.role_id, name: role.role_name };
}

// ---------- Page ----------

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [institutionId, setInstitutionId] = useState<number | string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [addRoleTargetRow, setAddRoleTargetRow] = useState<UserRow | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Resolver groups
  const [resolverGroups, setResolverGroups] = useState<ResolverGroup[]>([]);
  const [loadingResolverGroups, setLoadingResolverGroups] = useState(false);
  const [isResolverGroupsOpen, setIsResolverGroupsOpen] = useState(false);

  // Institution access
  const [institutions, setInstitutions] = useState<InstitutionResp[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [isInstitutionAccessOpen, setIsInstitutionAccessOpen] = useState(false);
  // Numeric institution id from the JWT, kept separately from
  // `institutionId` since that state gets overwritten with the display
  // name once users load — this one stays numeric for API calls.
  const [currentInstitutionNumericId, setCurrentInstitutionNumericId] =
    useState<number | null>(null);

  // ---------- Fetch Roles ----------

const fetchRoles = async (
  instId: number | string
): Promise<RoleOption[]> => {
  try {
    const result = await getRolesByInstitution(instId);

    if (result.response) {
      const options = result.response.map(mapRoleToOption);
      setRoleOptions(options);
      return options;
    }

    console.error("Failed to fetch roles:", result.message);
    return [];
  } catch (err) {
    console.error("Failed to fetch roles:", err);
    return [];
  }
};

  // ---------- Fetch Resolver Groups ----------

  const fetchResolverGroups = async () => {
    try {
      setLoadingResolverGroups(true);

      const result = await getResolverGroups();

      if (result.response) {
        setResolverGroups(result.response);
      } else {
        console.error("Failed to fetch resolver groups:", result.message);
      }
    } catch (err) {
      console.error("Failed to fetch resolver groups:", err);
    } finally {
      setLoadingResolverGroups(false);
    }
  };

  // ---------- Fetch Institutions ----------

  const fetchInstitutions = async () => {
    try {
      setLoadingInstitutions(true);

      const result = await getInstitutions();

      if (result.response) {
        setInstitutions(result.response);
      } else {
        console.error("Failed to fetch institutions:", result.message);
      }
    } catch (err) {
      console.error("Failed to fetch institutions:", err);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  // ---------- Fetch Users ----------

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      // Get JWT
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token");

      if (!token) {
        setError("Authentication token not found.");
        setRows([]);
        return;
      }

      // Verify JWT
      const payload = await verifyJWT(token);

      if (!payload) {
        setError("Invalid authentication token.");
        setRows([]);
        return;
      }

      // Get institution ID from JWT
      const institutionIdFromToken = payload.institution_id;

      if (!institutionIdFromToken) {
        setError("Institution ID not found in JWT.");
        setRows([]);
        return;
      }

      setInstitutionId(institutionIdFromToken);
      setCurrentInstitutionNumericId(Number(institutionIdFromToken));

      console.log(
        "Fetching users for institution:",
        institutionIdFromToken
      );

      // Call new API
      const result = await getUsersByInstitutionId(
        institutionIdFromToken
      );

      console.log("Users API response:", result);

      if (result.response) {
  const mappedUsers = result.response.map(mapUserToRow);

  setRows(mappedUsers);

  // Get institution name from the user's institution
  const firstUser = result.response[0];

  if (firstUser?.institution?.institution_name) {
    setInstitutionId(firstUser.institution.institution_name);
  }

        // Roles now come from getRolesByInstitution (source of truth),
        // not inferred from the users list — fetch in parallel.
        fetchRoles(institutionIdFromToken);
      } else {
        setRows([]);
        setError(
          result.message ?? "Failed to fetch users."
        );
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);

      setRows([]);
      setError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Update Status ----------

  const handleStatusChange = async (row: UserRow, newStatus: Status) => {
    const previousStatus = row.status;

    // Optimistic update
    setRows((prev) =>
      prev.map((item) =>
        item.id === row.id ? { ...item, status: newStatus } : item
      )
    );

    setUpdatingId(row.id);

    try {
      const result = await changeUserStatus(
        row.id,
        newStatus as UserStatus
      );

      if (
        result.ret_code &&
        result.ret_code !== "0" &&
        result.ret_code !== "200"
      ) {
        throw new Error(result.message ?? "Failed to update status.");
      }
    } catch (err) {
      console.error("Failed to update user status:", err);

      // Roll back on failure
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? { ...item, status: previousStatus }
            : item
        )
      );

      setError("Failed to update user status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ---------- Update Role ----------

  const handleRoleChange = async (
    row: UserRow,
    newRoleId: number
  ) => {
    const previousRoleId = row.roleId;
    const previousRoleName = row.role;

    // Optimistic role update — also update the label so the UI
    // doesn't flash back to the old name while the request is in flight
    const newRoleName =
      roleOptions.find((r) => r.id === newRoleId)?.name ?? row.role;

    setRows((prev) =>
      prev.map((item) =>
        item.id === row.id
          ? {
              ...item,
              roleId: newRoleId,
              role: newRoleName,
            }
          : item
      )
    );

    setUpdatingRoleId(row.id);
    setError("");

    try {
      const result = await changeUserRole(row.id, {
        role_id: newRoleId,
      });

      if (
        result.ret_code &&
        result.ret_code !== "0" &&
        result.ret_code !== "200"
      ) {
        throw new Error(
          result.message ?? "Failed to update user role."
        );
      }

      // Reload users so role id/name come straight from
      // get_user_insti_id (source of truth) again
      await fetchUsers();
    } catch (err) {
      console.error("Failed to update user role:", err);

      // Roll back
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                roleId: previousRoleId,
                role: previousRoleName,
              }
            : item
        )
      );

      setError("Failed to update user role.");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  // ---------- New Role Created ----------

  const handleRoleCreated = async (roleName: string) => {
    if (!institutionId) {
      setAddRoleTargetRow(null);
      return;
    }

    // Refresh roles from the actual roles endpoint — this is now our
    // source of truth, so we don't depend on addRole's response shape
    // (which only returns ret_code/message) to know the new role's id.
    const freshOptions = await fetchRoles(institutionId);

    // Find the role we just created by name so we can auto-assign it.
    // Note: this assumes role_name is unique per institution. If your
    // backend allows duplicate names, matching by the most recently
    // created role (via Role.created_at) would be more reliable —
    // let me know if you'd like that instead.
    const createdRole = freshOptions
      .slice()
      .reverse()
      .find((r) => r.name === roleName);

    if (!createdRole) {
      setNotice(
        `Role "${roleName}" was created, but couldn't be found in the refreshed list — try refreshing the page.`
      );
      setAddRoleTargetRow(null);
      return;
    }

    setNotice("");

    if (addRoleTargetRow) {
      handleRoleChange(addRoleTargetRow, createdRole.id);
    }

    setAddRoleTargetRow(null);
  };

  // ---------- Initial Load ----------

  useEffect(() => {
    fetchUsers();
    fetchResolverGroups();
    fetchInstitutions();
  }, []);

  // ---------- UI ----------

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h1 className="text-lg font-semibold text-slate-800">
            {institutionId} - User
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInstitutionAccessOpen(true)}
              className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <BuildingIcon />
              Institution Access
            </button>

            <button
              onClick={() => setIsResolverGroupsOpen(true)}
              className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <UsersGroupIcon />
              Resolver Groups
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              aria-label="Add user"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400 text-emerald-500 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        {/* Error banner (non-blocking when we still have rows to show) */}

        {error && rows.length > 0 && (
          <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-6 py-2 text-sm text-red-600">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss"
              className="ml-4 text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Notice banner (non-blocking, e.g. after role creation) */}

        {notice && (
          <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-6 py-2 text-sm text-amber-700">
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss"
              className="ml-4 text-amber-500 hover:text-amber-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Table */}

        {/* Table */}

<div
  className="overflow-x-auto"
  style={{ WebkitOverflowScrolling: "touch" }}
>
  <table className="w-full min-w-[1100px] border-collapse text-left whitespace-nowrap">

    {/* Header */}

    <thead>
      <tr className="border-b border-slate-200 text-xs font-semibold tracking-wide text-slate-400">
        <th className="px-6 py-3">STAFF ID</th>
        <th className="px-4 py-3">FIRST NAME</th>
        <th className="px-4 py-3">LAST NAME</th>
        <th className="px-4 py-3">POSITION</th>
        <th className="px-4 py-3">EMAIL</th>
        <th className="px-4 py-3">ROLE</th>
        <th className="px-4 py-3">POLICY</th>
        <th className="px-4 py-3">STATUS</th>
        <th className="px-4 py-3">CREATED AT</th>
      </tr>
    </thead>

    {/* ...tbody stays the same, just make sure each <td> also has whitespace-nowrap if you want them to force scroll (or leave INSTITUTION/EMAIL to wrap if you'd rather keep those readable) */}

            {/* Body */}

            <tbody>

              {/* Loading */}

              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center text-sm text-slate-400"
                  >
                    Loading users...
                  </td>
                </tr>

              ) : error && rows.length === 0 ? (

                /* Error (only takes over the table when we have no rows to show) */

                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center text-sm text-red-400"
                  >
                    {error}
                  </td>
                </tr>

              ) : rows.length > 0 ? (

                /* Users */

                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 text-sm text-slate-700"
                  >

                    <td className="px-6 py-4 font-medium text-slate-800">
                      {row.staffId}
                    </td>

                    <td className="px-4 py-4">
                      {row.firstName}
                    </td>

                    <td className="px-4 py-4">
                      {row.lastName}
                    </td>

                    <td className="px-4 py-4">
                      {row.position}
                    </td>

                    <td className="px-4 py-4">
                      <a
                        href={`mailto:${row.email}`}
                        className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
                      >
                        {row.email}
                      </a>
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={row.roleId}
                        disabled={updatingRoleId === row.id}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (value === ADD_NEW_ROLE_VALUE) {
                            // Remember which row triggered this so the
                            // newly created role can be assigned to them.
                            // Controlled <select> reverts to row.roleId
                            // on re-render since we don't update state here.
                            setAddRoleTargetRow(row);
                            setIsAddRoleOpen(true);
                            return;
                          }

                          handleRoleChange(row, Number(value));
                        }}
                        className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {/* Fallback: if this user's current role isn't in
                            the known list (e.g. unmapped roleId), show it
                            as-is instead of silently defaulting */}
                        {!roleOptions.some((r) => r.id === row.roleId) && (
                          <option value={row.roleId}>{row.role}</option>
                        )}

                        {roleOptions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}

                        <option value={ADD_NEW_ROLE_VALUE}>
                          + Add New Role
                        </option>
                      </select>
                    </td>

                    <td className="px-4 py-4">
                      {row.policy}
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={row.status}
                        disabled={updatingId === row.id}
                        onChange={(e) =>
                          handleStatusChange(row, e.target.value as Status)
                        }
                        className={`rounded-md bg-white px-3 py-1.5 text-sm font-semibold capitalize outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-50 ${
                          STATUS_STYLES[row.status]
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {row.createdAt}
                    </td>

                  </tr>
                ))

              ) : (

                /* Empty */

                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center text-sm text-slate-400"
                  >
                    No users found.
                  </td>
                </tr>

              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}

      <AddUserModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={() => {
          fetchUsers();
          setIsAddOpen(false);
        }}
      />

      {/* Add Role Modal */}

      <AddRoleModal
        open={isAddRoleOpen}
        onClose={() => {
          setIsAddRoleOpen(false);
          setAddRoleTargetRow(null);
        }}
        onCreated={handleRoleCreated}
      />

      {/* Resolver Groups Modal */}

      <ResolverGroupsModal
        open={isResolverGroupsOpen}
        onClose={() => setIsResolverGroupsOpen(false)}
        users={rows}
        groups={resolverGroups}
        loadingGroups={loadingResolverGroups}
        onRefresh={fetchResolverGroups}
      />

      {/* Institution Access Modal */}

      <InstitutionAccessModal
        open={isInstitutionAccessOpen}
        onClose={() => setIsInstitutionAccessOpen(false)}
        institutions={institutions}
        loadingInstitutions={loadingInstitutions}
        currentInstitutionId={currentInstitutionNumericId}
      />
    </main>
  );
}