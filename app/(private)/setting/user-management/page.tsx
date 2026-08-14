"use client";

import { useEffect, useState } from "react";
import AddUserModal from "./register/register";
import {getUsersByInstitutionId, UserDetails, } from "@/services/integration/super_admin/get_user_insti_id";
import { changeUserStatus, UserStatus, } from "@/services/integration/super_admin/patch_user_status"; // adjust path to wherever you saved this
import { changeUserRole, } from "@/services/integration/role/patch_changed_user_role";
import { addRole, AddRoleRequest, } from "@/services/integration/role/post_role"; // adjust path to wherever you saved this
import { getRolesByInstitution, Role, } from "@/services/integration/role/get_role_by_insti"; // adjust path to wherever you saved this
import { verifyJWT } from "@/lib/auth/verify-jwt";

// ---------- Types ----------

type Status = "active" | "pending" | "disabled";

interface UserRow {
  id: number;
  staffId: string;
  firstName: string;
  lastName: string;
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

// ---------- Helpers ----------

function mapUserToRow(user: UserDetails): UserRow {
  const status = user.status?.toLowerCase();

  return {
    id: user.id,
    staffId: user.staff_id,
    firstName: user.first_name,
    lastName: user.last_name,
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

  // ---------- Fetch Roles ----------

  const fetchRoles = async (
    instId: number | string
  ): Promise<RoleOption[]> => {
    try {
      const result = await getRolesByInstitution(instId);

      if (result.data) {
        const options = result.data.map(mapRoleToOption);
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
  }, []);

  // ---------- UI ----------

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-8xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h1 className="text-lg font-semibold text-slate-800">
            BAKAWAN Data Analytics, Inc - User
          </h1>

          <button
            onClick={() => setIsAddOpen(true)}
            aria-label="Add user"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400 text-emerald-500 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <PlusIcon />
          </button>
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left">

            {/* Header */}

            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold tracking-wide text-slate-400">

                <th className="px-6 py-3">
                  STAFF ID
                </th>

                <th className="px-4 py-3">
                  FIRST NAME
                </th>

                <th className="px-4 py-3">
                  LAST NAME
                </th>

                <th className="px-4 py-3">
                  INSTITUTION
                </th>

                <th className="px-4 py-3">
                  EMAIL
                </th>

                <th className="px-4 py-3">
                  ROLE
                </th>

                <th className="px-4 py-3">
                  POLICY
                </th>

                <th className="px-4 py-3">
                  STATUS
                </th>

                <th className="px-4 py-3">
                  CREATED AT
                </th>

              </tr>
            </thead>

            {/* Body */}

            <tbody>

              {/* Loading */}

              {loading ? (
                <tr>
                  <td
                    colSpan={9}
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
                      {row.institution}
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
    </main>
  );
}