"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getUsersByInstitution,
  type UserByInstitutionResponse,
} from "@/app/(super-admin)/management/user/api/get_user_by_insti_id";

import {
  getInstitutions,
  type InstitutionResp,
} from "@/services/integration/institution/get-all-insti";

import {
  changeUserStatus,
  type ChangeUserStatusRequest,
} from "@/services/integration/super_admin/patch_user_status";

import { changeRoleToAdmin } from "@/services/integration/super_admin/patch_role_admin";

import {
  getPositionsByInstitutionId,
  type Position,
} from "@/services/integration/super_admin/get_position_insti_id";

import { patchUserPosition } from "@/services/integration/insti-admin/patch_position";

import AddUserModal from "./register/register";

type Status = "active" | "inactive";

type Staff = {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  username: string;
  number: string;
  email: string;
  roleName: string;
  positionId: number | null;
  positionName: string;
  status: Status;
};

type InstitutionGroup = {
  id: string;
  name: string;
  color: string;
  positions: Position[];
  staff: Staff[];
};

const FALLBACK_COLOR = "#3C4046";

/* ============================================================
   API STATUS MAPPING
   ============================================================ */

function toApiStatus(
  status: Status
): ChangeUserStatusRequest["status"] {
  return status === "active" ? "active" : "disabled";
}

function fromApiStatus(
  status: string | undefined
): Status {
  return status?.toLowerCase() === "active"
    ? "active"
    : "inactive";
}

/* ============================================================
   MAP USERS
   ============================================================ */

function toStaff(
  users: UserByInstitutionResponse[]
): Staff[] {
  return users.map((user) => ({
    id: String(user.id),
    staffId: user.staff_id ?? "",
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    username: user.username ?? "",
    number: user.phone_no ?? "",
    email: user.email ?? "",
    roleName: user.role?.role_name ?? "—",
    positionId: user.job_positions?.position_id ?? null,
    positionName: user.job_positions?.position_name ?? "—",
    status: fromApiStatus(user.status),
  }));
}

/* ============================================================
   MAP INSTITUTION
   ============================================================ */

function toGroup(
  institution: InstitutionResp,
  users: UserByInstitutionResponse[],
  positions: Position[]
): InstitutionGroup {
  return {
    id: String(institution.institution_id),
    name:
      institution.institution_name ||
      "Unassigned",
    color: FALLBACK_COLOR,
    positions,
    staff: toStaff(users),
  };
}

/* ============================================================
   PAGE
   ============================================================ */

export default function UserManagementPage() {
  const [groups, setGroups] =
    useState<InstitutionGroup[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [savingIds, setSavingIds] =
    useState<Set<string>>(new Set());

  const [statusError, setStatusError] =
    useState<string | null>(null);

  const [savingRoleIds, setSavingRoleIds] =
    useState<Set<string>>(new Set());

  const [roleError, setRoleError] =
    useState<string | null>(null);

  const [savingPositionIds, setSavingPositionIds] =
    useState<Set<string>>(new Set());

  const [positionError, setPositionError] =
    useState<string | null>(null);

  /*
   * Stores which institutions are expanded.
   */
  const [expandedGroups, setExpandedGroups] =
    useState<Set<string>>(new Set());

  /*
   * Controls Add User modal.
   */
  const [showAddUserModal, setShowAddUserModal] =
    useState(false);

  /* ============================================================
     LOAD DATA
     ============================================================ */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatusError(null);
    setRoleError(null);
    setPositionError(null);

    try {
      const institutionResult =
        await getInstitutions();

      const institutions =
        institutionResult.response ?? [];

      if (institutions.length === 0) {
        setGroups([]);
        setExpandedGroups(new Set());
        return;
      }

      const institutionGroups =
        await Promise.all(
          institutions.map(
            async (institution) => {
              try {
                const [users, positions] = await Promise.all([
                  getUsersByInstitution(institution.institution_id),
                  getPositionsByInstitutionId(institution.institution_id),
                ]);

                return toGroup(
                  institution,
                  users,
                  positions.response ?? []
                );
              } catch (userError) {
                console.error(
                  `Failed to load users for institution ${institution.institution_id}:`,
                  userError
                );

                return toGroup(
                  institution,
                  [],
                  []
                );
              }
            }
          )
        );

      setGroups(institutionGroups);

      /*
       * Start with all institutions expanded.
       */
      setExpandedGroups(
        new Set(
          institutionGroups.map(
            (group) => group.id
          )
        )
      );
    } catch (err) {
      console.error(
        "Failed to load institutions:",
        err
      );

      setGroups([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load institution data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ============================================================
     TOGGLE INSTITUTION
     ============================================================ */

  function toggleGroup(groupId: string) {
    setExpandedGroups((previous) => {
      const next = new Set(previous);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      return next;
    });
  }

  /* ============================================================
     UPDATE STAFF POSITION
     ============================================================ */

  async function updateStaffPosition(
    groupId: string,
    staffId: string,
    nextPositionId: number
  ) {
    const group = groups.find((group) => group.id === groupId);
    const staff = group?.staff.find((staff) => staff.id === staffId);
    const nextPosition = group?.positions.find(
      (position) => position.position_id === nextPositionId
    );

    if (!staff || !nextPosition || staff.positionId === nextPositionId) {
      return;
    }

    const previousPositionId = staff.positionId;
    const previousPositionName = staff.positionName;

    patchLocalStaff(groupId, staffId, {
      positionId: nextPosition.position_id,
      positionName: nextPosition.position_name,
    });

    setSavingPositionIds((previous) => {
      const next = new Set(previous);
      next.add(staffId);
      return next;
    });
    setPositionError(null);

    try {
      await patchUserPosition(staffId, nextPositionId);
    } catch (err) {
      patchLocalStaff(groupId, staffId, {
        positionId: previousPositionId,
        positionName: previousPositionName,
      });
      setPositionError(
        err instanceof Error
          ? err.message
          : "Failed to update user position. Please try again."
      );
    } finally {
      setSavingPositionIds((previous) => {
        const next = new Set(previous);
        next.delete(staffId);
        return next;
      });
    }
  }

  /* ============================================================
     PATCH LOCAL STAFF
     ============================================================ */

  function patchLocalStaff(
    groupId: string,
    staffId: string,
    patch: Partial<Staff>
  ) {
    setGroups((previousGroups) =>
      previousGroups.map(
        (group) =>
          group.id !== groupId
            ? group
            : {
                ...group,
                staff: group.staff.map(
                  (staff) =>
                    staff.id === staffId
                      ? {
                          ...staff,
                          ...patch,
                        }
                      : staff
                ),
              }
      )
    );
  }

  /* ============================================================
     UPDATE STAFF STATUS
     ============================================================ */

  async function updateStaffStatus(
    groupId: string,
    staffId: string,
    nextStatus: Status
  ) {
    const group = groups.find(
      (group) => group.id === groupId
    );

    const staff = group?.staff.find(
      (staff) => staff.id === staffId
    );

    if (!staff || staff.status === nextStatus) {
      return;
    }

    const previousStatus = staff.status;

    /*
     * Optimistic update.
     */
    patchLocalStaff(
      groupId,
      staffId,
      {
        status: nextStatus,
      }
    );

    setSavingIds((previous) => {
      const next = new Set(previous);
      next.add(staffId);
      return next;
    });

    setStatusError(null);

    try {
      await changeUserStatus(
        Number(staffId),
        { status: toApiStatus(nextStatus) }
      );
    } catch (err) {
      /*
       * Rollback if API fails.
       */
      patchLocalStaff(
        groupId,
        staffId,
        {
          status: previousStatus,
        }
      );

      setStatusError(
        err instanceof Error
          ? err.message
          : "Failed to update user status. Please try again."
      );
    } finally {
      setSavingIds((previous) => {
        const next = new Set(previous);
        next.delete(staffId);
        return next;
      });
    }
  }

  /* ============================================================
     UPDATE STAFF ROLE
     ============================================================ */

  async function updateStaffRole(
    groupId: string,
    staffId: string,
    nextRole: string
  ) {
    const group = groups.find(
      (group) => group.id === groupId
    );

    const staff = group?.staff.find(
      (staff) => staff.id === staffId
    );

    if (!staff || staff.roleName === nextRole) {
      return;
    }

    const previousRole = staff.roleName;

    /*
     * Currently available API changes the user
     * specifically to Insti-Admin.
     */
    if (nextRole !== "Insti-Admin") {
      return;
    }

    /*
     * Optimistic update.
     */
    patchLocalStaff(
      groupId,
      staffId,
      {
        roleName: nextRole,
      }
    );

    setSavingRoleIds((previous) => {
      const next = new Set(previous);
      next.add(staffId);
      return next;
    });

    setRoleError(null);

    try {
      await changeRoleToAdmin(
        Number(staffId)
      );
    } catch (err) {
      /*
       * Rollback.
       */
      patchLocalStaff(
        groupId,
        staffId,
        {
          roleName: previousRole,
        }
      );

      setRoleError(
        err instanceof Error
          ? err.message
          : "Failed to update role. Please try again."
      );
    } finally {
      setSavingRoleIds((previous) => {
        const next = new Set(previous);
        next.delete(staffId);
        return next;
      });
    }
  }

  /* ============================================================
     ADD USER
     ============================================================ */

  function openAddUserModal() {
    setShowAddUserModal(true);
  }

  function closeAddUserModal() {
    setShowAddUserModal(false);
  }

  /*
   * Called after registerUser succeeds.
   *
   * Reloads the institution/user list so the newly
   * registered user immediately appears in the table.
   */
  async function handleUserCreated() {
    await loadData();
  }

  /* ============================================================
     TOTAL STAFF
     ============================================================ */

  const totalStaff =
    groups.reduce(
      (total, group) =>
        total + group.staff.length,
      0
    );

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <>
      <div className="min-h-screen py-1 sm:px-2">
        <div className="mx-auto max-w-15xl overflow-hidden rounded-2xl border border-[#E7E9ED] bg-white shadow-sm">

          {/* ======================================================
              HEADER
          ====================================================== */}

          <div className="flex items-center justify-between border-b border-[#EDEFF2] px-6 py-4">

            <div>
              <h1 className="text-[15px] font-semibold text-[#111318]">
                User Management
              </h1>

              {!loading &&
                groups.length > 0 && (
                  <p className="mt-0.5 text-[12px] text-[#9AA0A8]">
                    {groups.length}{" "}
                    {groups.length === 1
                      ? "institution"
                      : "institutions"}{" "}
                    · {totalStaff}{" "}
                    {totalStaff === 1
                      ? "staff member"
                      : "staff members"}
                  </p>
                )}
            </div>

            {!loading &&
              groups.length > 0 && (
                <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={loadData}
    title="Refresh"
    aria-label="Refresh user data"
    className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-[#8A9099] transition-all hover:border-[#E1E3E7] hover:bg-[#F8F9FA] hover:text-[#3C4046]"
  >
    <RefreshIcon className="h-3.5 w-3.5" />
  </button>

  <button
    type="button"
    onClick={openAddUserModal}
    className="flex h-8 items-center gap-1.5 rounded-full border border-[#D9DCE1] bg-white px-3 text-[12px] font-semibold text-[#3C4046] shadow-sm transition-all hover:border-[#C5C9D0] hover:bg-[#F8F9FA] hover:text-[#111318] active:scale-[0.98]"
  >
    <PlusIcon className="h-3.5 w-3.5 text-[#6B717A]" />
    Add User
  </button>
</div>
              )}
          </div>

          {/* ======================================================
              ROLE ERROR
          ====================================================== */}

          {roleError && (
            <div className="mx-6 mt-4 rounded-lg border border-[#F3C6C6] bg-[#FDF2F2] px-4 py-2.5 text-[13px] font-medium text-[#B3261E]">
              {roleError}
            </div>
          )}

          {/* ======================================================
              STATUS ERROR
          ====================================================== */}

          {statusError && (
            <div className="mx-6 mt-4 rounded-lg border border-[#F3C6C6] bg-[#FDF2F2] px-4 py-2.5 text-[13px] font-medium text-[#B3261E]">
              {statusError}
            </div>
          )}

          {positionError && (
            <div className="mx-6 mt-4 rounded-lg border border-[#F3C6C6] bg-[#FDF2F2] px-4 py-2.5 text-[13px] font-medium text-[#B3261E]">
              {positionError}
            </div>
          )}

          {/* ======================================================
              LOADING
          ====================================================== */}

          {loading && (
            <div className="px-6 py-8">
              {[0, 1, 2].map(
                (index) => (
                  <div
                    key={index}
                    className="animate-pulse border-b border-[#F1F2F4] py-5"
                  >
                    <div className="mb-4 h-4 w-56 rounded bg-[#EDEFF2]" />

                    <div className="grid grid-cols-7 gap-4">
                      {[0, 1, 2, 3, 4, 5, 6].map(
                        (column) => (
                          <div
                            key={column}
                            className="h-4 rounded bg-[#F3F4F6]"
                          />
                        )
                      )}
                    </div>

                    <div className="mt-4 h-4 w-full rounded bg-[#F8F9FA]" />
                  </div>
                )
              )}
            </div>
          )}

          {/* ======================================================
              ERROR / NO DATA
          ====================================================== */}

          {!loading &&
            (error ||
              groups.length === 0) && (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F2F4] text-[#9AA0A8]">
                  <BuildingIcon />
                </div>

                <p className="text-[14px] font-medium text-[#5B616B]">
                  {error
                    ? "Unable to load data"
                    : "No institutions available"}
                </p>

                <p className="max-w-sm text-[13px] leading-5 text-[#9AA0A8]">
                  {error
                    ? "We couldn't reach the server just now. Please try again."
                    : "Once institutions are added, they will appear here automatically."}
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <button
                    type="button"
                    onClick={loadData}
                    className="rounded-full border border-[#D8DBE0] px-4 py-1.5 text-[13px] font-semibold text-[#3C4046] transition hover:border-[#B8BCC4] hover:bg-[#F7F8FA]"
                  >
                    Refresh
                  </button>

                  {!error && (
                    <button
                      type="button"
                      onClick={openAddUserModal}
                      className="flex items-center gap-1.5 rounded-full bg-[#111318] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#2B2F35]"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Register User
                    </button>
                  )}

                </div>
              </div>
            )}

          {/* ======================================================
              MAIN TABLE
          ====================================================== */}

          {!loading &&
            !error &&
            groups.length > 0 && (
              <div className="overflow-x-auto px-6 pb-8">

                <table className="w-full min-w-[1150px] border-collapse text-left">

                  {/* ==================================================
                      COLUMN HEADER
                  ================================================== */}

                  <thead>
                    <tr className="border-b border-[#E7E9ED] text-[11px] uppercase tracking-[0.08em] text-[#9AA0A8]">

                      <th className="w-[145px] py-3 pr-4 font-semibold">
                        Staff ID
                      </th>

                      <th className="w-[190px] py-3 pr-4 font-semibold">
                        Name
                      </th>

                      <th className="w-[170px] py-3 pr-4 font-semibold">
                        Username
                      </th>

                      <th className="w-[145px] py-3 pr-4 font-semibold">
                        Phone
                      </th>

                      <th className="min-w-[250px] py-3 pr-4 font-semibold">
                        Email
                      </th>

                      <th className="w-[150px] py-3 pr-4 font-semibold">
                        Role
                      </th>

                      <th className="w-[170px] py-3 pr-4 font-semibold">
                        Position
                      </th>

                      <th className="w-[115px] py-3 font-semibold">
                        Status
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {groups.map((group) => {
                      const isExpanded =
                        expandedGroups.has(
                          group.id
                        );

                      return (
                        <Fragment key={group.id}>

                          {/* ==========================================
                              INSTITUTION ROW
                          ========================================== */}

                          <tr>
                            <td
                              colSpan={8}
                              className="border-b border-[#E7E9ED] pt-3"
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  toggleGroup(
                                    group.id
                                  )
                                }
                                className="group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-[#F8F9FA]"
                                aria-expanded={
                                  isExpanded
                                }
                              >

                                <div className="flex items-center gap-2">

                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#737982] transition group-hover:bg-[#EDEFF2]">
                                    <ChevronRightIcon
                                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                        isExpanded
                                          ? "rotate-90"
                                          : ""
                                      }`}
                                    />
                                  </div>

                                  <span className="text-[14px] font-bold text-[#3C4046]">
                                    {group.name}
                                  </span>

                                </div>

                                <span className="rounded-full bg-[#F5F6F8] px-2.5 py-1 text-[11px] font-semibold text-[#8A9099]">
                                  {group.staff.length}{" "}
                                  staff
                                </span>

                              </button>

                            </td>
                          </tr>

                          {/* ==========================================
                              STAFF CONTENT
                          ========================================== */}

                          {isExpanded && (
                            <>
                              {group.staff.length ===
                              0 ? (
                                <tr>
                                  <td
                                    colSpan={8}
                                    className="border-b border-[#F0F1F3] py-7 text-center"
                                  >
                                    <span className="text-[13px] text-[#9AA0A8]">
                                      No staff members
                                      in this
                                      institution.
                                    </span>
                                  </td>
                                </tr>
                              ) : (
                                group.staff.map(
                                  (staff) => {
                                    const isSaving =
                                      savingIds.has(
                                        staff.id
                                      );

                                    const isRoleSaving =
                                      savingRoleIds.has(
                                        staff.id
                                      );

                                    const isPositionSaving =
                                      savingPositionIds.has(
                                        staff.id
                                      );

                                    return (
                                      <tr
                                        key={
                                          staff.id
                                        }
                                        className="group border-b border-[#F0F1F3] transition-colors hover:bg-[#FAFBFC]"
                                      >

                                        {/* STAFF ID */}

                                        <td className="py-3.5 pl-3 pr-4 text-[13px] font-semibold text-[#111318]">
                                          {staff.staffId ||
                                            "—"}
                                        </td>

                                        {/* NAME */}

                                        <td className="py-3.5 pr-4">
                                          <span className="text-[13px] font-semibold text-[#111318]">
                                            {
                                              staff.firstName
                                            }{" "}
                                            {
                                              staff.lastName
                                            }
                                          </span>
                                        </td>

                                        {/* USERNAME */}

                                        <td className="py-3.5 pr-4 text-[13px] font-medium text-[#5B616B]">
                                          {staff.username ||
                                            "—"}
                                        </td>

                                        {/* PHONE */}

                                        <td className="py-3.5 pr-4 text-[13px] font-medium text-[#5B616B]">
                                          {staff.number ||
                                            "—"}
                                        </td>

                                        {/* EMAIL */}

                                        <td className="py-3.5 pr-4">

                                          {staff.email ? (
                                            <a
                                              href={`mailto:${staff.email}`}
                                              className="text-[13px] font-medium text-[#3C4046] underline decoration-[#C5C8CD] underline-offset-2 transition hover:decoration-[#3C4046]"
                                            >
                                              {
                                                staff.email
                                              }
                                            </a>
                                          ) : (
                                            <span className="text-[13px] text-[#A3A7AE]">
                                              —
                                            </span>
                                          )}

                                        </td>

                                        {/* ROLE */}

                                        <td className="py-3.5 pr-4">
                                          <div className="relative inline-flex items-center">

                                            <select
                                              value={
                                                staff.roleName
                                              }
                                              disabled={
                                                isRoleSaving
                                              }
                                              onChange={(
                                                event
                                              ) =>
                                                updateStaffRole(
                                                  group.id,
                                                  staff.id,
                                                  event
                                                    .target
                                                    .value
                                                )
                                              }
                                              className={`cursor-pointer appearance-none rounded-md py-1 pl-2.5 pr-7 text-[12px] font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                staff.roleName
                                                  .toLowerCase() ===
                                                "insti-admin"
                                                  ? "bg-[#EEF4FF] text-[#3B6FD8]"
                                                  : "bg-[#F5F6F8] text-[#5B616B]"
                                              }`}
                                            >
                                              <option
                                                value={
                                                  staff.roleName
                                                }
                                              >
                                                {
                                                  staff.roleName
                                                }
                                              </option>

                                              {staff.roleName.toLowerCase() !==
                                                "insti-admin" && (
                                                <option value="Insti-Admin">
                                                  Insti-Admin
                                                </option>
                                              )}
                                            </select>

                                            <ChevronIcon className="pointer-events-none absolute right-2 h-3 w-3" />

                                          </div>
                                        </td>

                                        {/* POSITION */}

                                        <td className="py-3.5 pr-4">
                                          <div className="relative inline-flex items-center">
                                            <select
                                              value={staff.positionId ?? ""}
                                              disabled={
                                                isPositionSaving ||
                                                group.positions.length === 0
                                              }
                                              onChange={(event) =>
                                                updateStaffPosition(
                                                  group.id,
                                                  staff.id,
                                                  Number(event.target.value)
                                                )
                                              }
                                              className="max-w-[170px] cursor-pointer appearance-none truncate rounded-md bg-[#F5F6F8] py-1 pl-2.5 pr-7 text-[12px] font-semibold text-[#5B616B] outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                              {staff.positionId === null && (
                                                <option value="">
                                                  {staff.positionName}
                                                </option>
                                              )}
                                              {group.positions.map((position) => (
                                                <option
                                                  key={position.position_id}
                                                  value={position.position_id}
                                                >
                                                  {position.position_name}
                                                </option>
                                              ))}
                                            </select>

                                            <ChevronIcon className="pointer-events-none absolute right-2 h-3 w-3" />
                                          </div>
                                        </td>

                                        {/* STATUS */}

                                        <td className="py-3.5">

                                          <div className="relative inline-flex items-center">

                                            <select
                                              value={
                                                staff.status
                                              }
                                              disabled={
                                                isSaving
                                              }
                                              onChange={(
                                                event
                                              ) =>
                                                updateStaffStatus(
                                                  group.id,
                                                  staff.id,
                                                  event
                                                    .target
                                                    .value as Status
                                                )
                                              }
                                              className={`cursor-pointer appearance-none rounded-full py-1 pl-2.5 pr-7 text-[12px] font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                staff.status ===
                                                "active"
                                                  ? "bg-[#EAF8F1] text-[#159A63]"
                                                  : "bg-[#F1F2F4] text-[#8A9099]"
                                              }`}
                                            >

                                              <option value="active">
                                                Active
                                              </option>

                                              <option value="inactive">
                                                Inactive
                                              </option>

                                            </select>

                                            <ChevronIcon className="pointer-events-none absolute right-2 h-3 w-3" />

                                          </div>

                                        </td>

                                      </tr>
                                    );
                                  }
                                )
                              )}
                            </>
                          )}

                        </Fragment>
                      );
                    })}

                  </tbody>
                </table>

              </div>
            )}

        </div>
      </div>

      {/* ==========================================================
          ADD USER MODAL
      ========================================================== */}

      <AddUserModal
        open={showAddUserModal}
        onClose={closeAddUserModal}
        onCreated={handleUserCreated}
      />
    </>
  );
}

/* ============================================================
   PLUS ICON
   ============================================================ */

function PlusIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/* ============================================================
   REFRESH ICON
   ============================================================ */

function RefreshIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
      <path d="M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
      <path d="M20 19v-4h-4" />
    </svg>
  );
}

/* ============================================================
   CHEVRON DOWN
   ============================================================ */

function ChevronIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-3.5 w-3.5 ${className}`}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ============================================================
   CHEVRON RIGHT
   ============================================================ */

function ChevronRightIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/* ============================================================
   BUILDING ICON
   ============================================================ */

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 21V6a1 1 0 011-1h6a1 1 0 011 1v15" />
      <path d="M14 21V10a1 1 0 011-1h4a1 1 0 011 1v11" />
      <path d="M2 21h20M7 8h1M7 12h1M7 16h1" />
    </svg>
  );
}
