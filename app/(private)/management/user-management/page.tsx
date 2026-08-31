"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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
import { changeUserRole } from "@/services/integration/role/patch_changed_user_role";
import { getRolesByInstitution, type Role } from "@/services/integration/role/get_role_by_insti";
import { addRole } from "@/services/integration/role/post_role";
import { editRole, toggleRoleStatus } from "@/services/integration/role/patch_user_role";

import {
  getPositionsByInstitutionId,
  type Position,
} from "@/services/integration/super_admin/get_position_insti_id";

import { patchUserPosition } from "@/services/integration/insti-admin/patch_position";

import {
  createResolverGroup,
  type CreateResolverGroupRequest,
} from "@/services/integration/institution/post-create-resolver-group";

import {
  getResolverGroups,
  type ResolverGroup,
} from "@/services/integration/institution/get-resolver-groups";

import {
  updateResolverGroup,
} from "@/services/integration/institution/put-update-resolver-group";

import AddUserModal from "./register/register";

// Adjust this import path to wherever verifyJWT actually lives in your project.
import { verifyJWT, type JwtPayload } from "@/lib/auth/verify-jwt";

type Status = "active" | "inactive";

type TabKey = "users" | "roles";

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
  canResolve: boolean;
};

type InstitutionGroup = {
  id: string;
  name: string;
  color: string;
  positions: Position[];
  staff: Staff[];
};

/*
 * Flattened staff row carrying a reference back to its
 * institution. Used for search / filter / pagination, then
 * re-grouped by institution for display.
 */
type FlatStaff = Staff & {
  institutionId: string;
  institutionName: string;
};

const FALLBACK_COLOR = "#3C4046";
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

// Name of the cookie holding the JWT. Change this if your app uses a
// different cookie name (e.g. "accessToken").
const TOKEN_COOKIE_NAME = "token";

/* ============================================================
   AUTH: READ + VERIFY THE LOGGED-IN USER'S JWT
   ============================================================ */

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  if (!match) return null;

  return decodeURIComponent(match.split("=").slice(1).join("="));
}

async function getCurrentUser(): Promise<JwtPayload | null> {
  const token = getCookie(TOKEN_COOKIE_NAME);

  if (!token) return null;

  return verifyJWT(token);
}

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
    canResolve: user.role?.can_resolve ?? false,
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

  /*
   * The logged-in user's decoded JWT. Drives which institution's
   * data this page is allowed to load/show.
   */
  const [currentUser, setCurrentUser] =
    useState<JwtPayload | null>(null);

  const [authError, setAuthError] =
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

  const [institutionRoles, setInstitutionRoles] =
    useState<Role[]>([]);

  const [resolverGroups, setResolverGroups] =
    useState<ResolverGroup[]>([]);

  const [showCreateGroupModal, setShowCreateGroupModal] =
    useState(false);

  const [newGroupName, setNewGroupName] = useState("");

  const [selectedMemberIds, setSelectedMemberIds] =
    useState<number[]>([]);

  const [savingGroup, setSavingGroup] = useState(false);

  const [editingGroup, setEditingGroup] =
    useState<ResolverGroup | null>(null);

  const [editGroupName, setEditGroupName] = useState("");

  const [editMemberIds, setEditMemberIds] =
    useState<number[]>([]);

  const [editGroupStatus, setEditGroupStatus] =
    useState<"active" | "inactive">("active");

  const [togglingGroupId, setTogglingGroupId] =
    useState<number | null>(null);

  const [showAddRoleModal, setShowAddRoleModal] =
    useState(false);

  const [newRoleName, setNewRoleName] =
    useState("");

  const [newRolePermissions, setNewRolePermissions] =
    useState({
      can_create: false,
      can_endorse: false,
      can_approve: false,
      can_resolve: false,
      can_audit: false,
    });

  const [savingRoleStatusIds, setSavingRoleStatusIds] =
    useState<Set<number>>(new Set());

  const [editingRole, setEditingRole] =
    useState<Role | null>(null);

  const [editRoleName, setEditRoleName] =
    useState("");

  const [editRolePermissions, setEditRolePermissions] =
    useState({
      can_create: false,
      can_endorse: false,
      can_approve: false,
      can_resolve: false,
      can_audit: false,
    });

  /*
   * Controls Add User modal.
   */
  const [showAddUserModal, setShowAddUserModal] =
    useState(false);

  /*
   * Top-level Users / Roles / Permissions tabs.
   */
  const [activeTab, setActiveTab] =
    useState<TabKey>("users");

  /*
   * Search + role filter, shared across tabs.
   */
  const [searchQuery, setSearchQuery] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("All Roles");

  /*
   * Pagination (Users tab).
   */
  const [itemsPerPage, setItemsPerPage] =
    useState(ITEMS_PER_PAGE_OPTIONS[0]);

  const [page, setPage] = useState(1);

  /*
   * Which role is selected in the Roles tab, drives the
   * Permission panel on the right.
   */
  const [selectedRoleId, setSelectedRoleId] =
    useState<number | null>(null);

  /* ============================================================
     LOAD DATA — SCOPED TO THE LOGGED-IN USER'S INSTITUTION
     ============================================================ */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(null);
    setStatusError(null);
    setRoleError(null);
    setPositionError(null);

    try {
      // 1. Identify the logged-in user and their institution from the JWT.
      const user = await getCurrentUser();
      setCurrentUser(user);

      if (!user) {
        setGroups([]);
        setAuthError(
          "Your session could not be verified. Please log in again."
        );
        return;
      }

      if (!user.institution_id) {
        setGroups([]);
        setAuthError(
          "Your account is not linked to an institution."
        );
        return;
      }

      // 2. Only fetch/show the institution this user belongs to.
      const institutionResult = await getInstitutions();
      const institutions = institutionResult.response ?? [];

      const ownInstitution = institutions.find(
        (institution) =>
          institution.institution_id === user.institution_id
      );

      if (!ownInstitution) {
        setGroups([]);
        setAuthError(
          "We couldn't find your institution's details."
        );
        return;
      }

      const [users, positions, rolesRes, groupsRes] = await Promise.all([
        getUsersByInstitution(ownInstitution.institution_id),
        getPositionsByInstitutionId(ownInstitution.institution_id),
        getRolesByInstitution(ownInstitution.institution_id).catch(() => ({ response: [] as Role[] })),
        getResolverGroups().catch(() => ({ response: [] as ResolverGroup[] })),
      ]);

      setGroups([
        toGroup(ownInstitution, users, positions.response ?? []),
      ]);

      setInstitutionRoles(rolesRes.response ?? []);
      setResolverGroups(groupsRes.response ?? []);
    } catch (err) {
      console.error(
        "Failed to load institution/user data:",
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  /*
   * Reset to page 1 whenever the filters change so the user
   * never lands on an empty page.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [searchQuery, roleFilter, itemsPerPage]);

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
    nextRoleId: number,
    nextRoleName: string
  ) {
    const group = groups.find(
      (group) => group.id === groupId
    );

    const staff = group?.staff.find(
      (staff) => staff.id === staffId
    );

    if (!staff || staff.roleName === nextRoleName) {
      return;
    }

    const previousRole = staff.roleName;

    /*
     * Optimistic update.
     */
    patchLocalStaff(
      groupId,
      staffId,
      {
        roleName: nextRoleName,
      }
    );

    setSavingRoleIds((previous) => {
      const next = new Set(previous);
      next.add(staffId);
      return next;
    });

    setRoleError(null);

    try {
      await changeUserRole(
        Number(staffId),
        { role_id: nextRoleId }
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
     DERIVED: FLATTEN / SEARCH / FILTER / PAGINATE
     ============================================================ */

  const totalStaff = useMemo(
    () =>
      groups.reduce(
        (total, group) => total + group.staff.length,
        0
      ),
    [groups]
  );

  const flatStaff = useMemo<FlatStaff[]>(
    () =>
      groups.flatMap((group) =>
        group.staff.map((staff) => ({
          ...staff,
          institutionId: group.id,
          institutionName: group.name,
        }))
      ),
    [groups]
  );

  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    flatStaff.forEach((staff) => {
      if (staff.roleName && staff.roleName !== "—") {
        roles.add(staff.roleName);
      }
    });
    return Array.from(roles).sort();
  }, [flatStaff]);

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return flatStaff.filter((staff) => {
      const matchesRole =
        roleFilter === "All Roles" ||
        staff.roleName === roleFilter;

      if (!matchesRole) return false;

      if (!query) return true;

      const haystack = [
        staff.staffId,
        staff.firstName,
        staff.lastName,
        staff.username,
        staff.email,
        staff.number,
        staff.institutionName,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [flatStaff, searchQuery, roleFilter]);

  const totalRecords = filteredStaff.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / itemsPerPage)
  );
  const safePage = Math.min(page, totalPages);

  const pageStart = (safePage - 1) * itemsPerPage;
  const pageEnd = Math.min(
    pageStart + itemsPerPage,
    totalRecords
  );

  const pageStaff = filteredStaff.slice(
    pageStart,
    pageStart + itemsPerPage
  );

  /*
   * Re-group the current page's staff by institution so the
   * table keeps its collapsible institution sections.
   * (In practice this is always the logged-in user's single
   * institution, but keeping the grouping logic generic means
   * nothing else in the render tree needs to change.)
   */
  const pageGroups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<
      string,
      { id: string; name: string; staff: FlatStaff[] }
    >();

    pageStaff.forEach((staff) => {
      if (!map.has(staff.institutionId)) {
        map.set(staff.institutionId, {
          id: staff.institutionId,
          name: staff.institutionName,
          staff: [],
        });
        order.push(staff.institutionId);
      }
      map.get(staff.institutionId)!.staff.push(staff);
    });

    return order.map((id) => map.get(id)!);
  }, [pageStaff]);

  function goToPage(next: number) {
    setPage(Math.min(Math.max(next, 1), totalPages));
  }

  /*
   * Users belonging to the role currently selected in the
   * Roles tab. Drives the "User" rows in the Permission panel
   * on the right — one row per user, sharing that role's
   * permission columns (permissions live on the role, not
   * per-user).
   */
  const selectedRoleObj = useMemo(
    () =>
      selectedRoleId !== null
        ? institutionRoles.find((r) => r.role_id === selectedRoleId) ?? null
        : null,
    [institutionRoles, selectedRoleId]
  );

  /*
   * The users shown in the Permission panel. If a role is
   * selected in the list on the left, narrow to that role's
   * users; otherwise show every user across every role right
   * away, so the panel isn't empty until something is clicked.
   */
  const permissionPanelUsers = useMemo(() => {
    if (!selectedRoleObj) return flatStaff;
    const target = selectedRoleObj.role_name.trim().toLowerCase();
    return flatStaff.filter(
      (staff) => staff.roleName.trim().toLowerCase() === target
    );
  }, [flatStaff, selectedRoleObj]);

  /*
   * Pagination for the Permission panel's user list.
   */
  const [roleItemsPerPage, setRoleItemsPerPage] = useState(
    ITEMS_PER_PAGE_OPTIONS[0]
  );
  const [rolePage, setRolePage] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRolePage(1);
  }, [selectedRoleId, roleItemsPerPage]);

  const roleUsersTotal = permissionPanelUsers.length;
  const roleUsersTotalPages = Math.max(
    1,
    Math.ceil(roleUsersTotal / roleItemsPerPage)
  );
  const roleSafePage = Math.min(rolePage, roleUsersTotalPages);
  const roleUsersPageStart = (roleSafePage - 1) * roleItemsPerPage;
  const roleUsersPageEnd = Math.min(
    roleUsersPageStart + roleItemsPerPage,
    roleUsersTotal
  );
  const rolePageUsers = permissionPanelUsers.slice(
    roleUsersPageStart,
    roleUsersPageStart + roleItemsPerPage
  );

  function goToRolePage(next: number) {
    setRolePage(Math.min(Math.max(next, 1), roleUsersTotalPages));
  }

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <>
      <div className="min-h-screen">
        <div className="mx-auto max-w-[1400px]">

          {/* ======================================================
              TOP BAR — TABS + SEARCH + ROLE FILTER
          ====================================================== */}

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-1.5">
              <TabButton
                label="Users"
                active={activeTab === "users"}
                onClick={() => setActiveTab("users")}
              />
              <TabButton
                label="Roles"
                active={activeTab === "roles"}
                onClick={() => setActiveTab("roles")}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AA0A8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search ..."
                  className="h-10 w-56 rounded-full border border-[#D9DCE1] bg-white pl-9 pr-4 text-[13px] text-[#3C4046] outline-none transition placeholder:text-[#9AA0A8] focus:border-[#1F3D33]"
                />
              </div>

              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value)
                  }
                  className="h-10 cursor-pointer appearance-none rounded-full border border-[#D9DCE1] bg-white py-2 pl-4 pr-9 text-[13px] font-medium text-[#3C4046] outline-none transition focus:border-[#1F3D33]"
                >
                  <option value="All Roles">All Roles</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#8A9099]" />
              </div>

              {activeTab === "users" && (
                <button
                  type="button"
                  onClick={loadData}
                  title="Refresh"
                  aria-label="Refresh user data"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D9DCE1] bg-white text-[#8A9099] transition-all hover:border-[#C5C9D0] hover:text-[#3C4046]"
                >
                  <RefreshIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ======================================================
              ERROR BANNERS
          ====================================================== */}

          {authError && (
            <div className="mb-4 rounded-lg border border-[#F3C6C6] bg-[#FDF2F2] px-4 py-2.5 text-[13px] font-medium text-[#B3261E]">
              {authError}
            </div>
          )}

          {roleError && (
            <div className="mb-4 rounded-lg border border-[#F3C6C6] bg-[#FDF2F2] px-4 py-2.5 text-[13px] font-medium text-[#B3261E]">
              {roleError}
            </div>
          )}

          {statusError && (
            <div className="mb-4 rounded-lg border border-[#F3C6C6] bg-[#FDF2F2] px-4 py-2.5 text-[13px] font-medium text-[#B3261E]">
              {statusError}
            </div>
          )}

          {positionError && (
            <div className="mb-4 rounded-lg border border-[#F3C6C6] bg-[#FDF2F2] px-4 py-2.5 text-[13px] font-medium text-[#B3261E]">
              {positionError}
            </div>
          )}

          {/* ======================================================
              USERS TAB
          ====================================================== */}

          {activeTab === "users" && (
            <>
            <div className="overflow-hidden rounded-2xl border border-[#E7E9ED] bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-[#EDEFF2] px-6 py-4">
                <div>
                  <h1 className="text-[15px] font-bold text-[#1F3D33]">
                    List of Users
                    {!loading && groups.length > 0 && (
                      <span className="ml-2 text-[13px] font-medium text-[#9AA0A8]">
                        — {groups[0].name}
                      </span>
                    )}
                  </h1>

                  {!loading && groups.length > 0 && (
                    <p className="mt-0.5 text-[12px] text-[#9AA0A8]">
                      {totalStaff}{" "}
                      {totalStaff === 1
                        ? "staff member"
                        : "staff members"}
                    </p>
                  )}
                </div>

                {!loading && groups.length > 0 && (
                  <button
                    type="button"
                    onClick={openAddUserModal}
                    className="flex h-9 items-center gap-1.5 rounded-full bg-[#6FCF97] px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#5FBF88] active:scale-[0.98]"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Add User
                  </button>
                )}
              </div>

              {loading && (
                <div className="px-6 py-8">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="animate-pulse border-b border-[#F1F2F4] py-5"
                    >
                      <div className="mb-4 h-4 w-56 rounded bg-[#EDEFF2]" />
                      <div className="grid grid-cols-7 gap-4">
                        {[0, 1, 2, 3, 4, 5, 6].map((column) => (
                          <div
                            key={column}
                            className="h-4 rounded bg-[#F3F4F6]"
                          />
                        ))}
                      </div>
                      <div className="mt-4 h-4 w-full rounded bg-[#F8F9FA]" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && (error || authError || groups.length === 0) && (
                <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F2F4] text-[#9AA0A8]">
                    <BuildingIcon />
                  </div>

                  <p className="text-[14px] font-medium text-[#5B616B]">
                    {error || authError
                      ? "Unable to load data"
                      : "No users found"}
                  </p>

                  <p className="max-w-sm text-[13px] leading-5 text-[#9AA0A8]">
                    {error
                      ? "We couldn't reach the server just now. Please try again."
                      : authError
                      ? authError
                      : "Once users are added to your institution, they will appear here automatically."}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadData}
                      className="rounded-full border border-[#D8DBE0] px-4 py-1.5 text-[13px] font-semibold text-[#3C4046] transition hover:border-[#B8BCC4] hover:bg-[#F7F8FA]"
                    >
                      Refresh
                    </button>

                    {!error && !authError && (
                      <button
                        type="button"
                        onClick={openAddUserModal}
                        className="flex items-center gap-1.5 rounded-full bg-[#1F3D33] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#2B5245]"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Register User
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!loading && !error && !authError && groups.length > 0 && (
                <>
                  {totalRecords === 0 ? (
                    <div className="px-6 py-16 text-center text-[13px] text-[#9AA0A8]">
                      No users match your search or filter.
                    </div>
                  ) : (
                    <div className="px-6">
                      {pageGroups.map((group) => {
                        const sourceGroup = groups.find(
                          (g) => g.id === group.id
                        );

                        return (
                          <div key={group.id} className="mb-8 last:mb-0">
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[1150px] border-collapse text-left">
                                <thead>
                                  <tr className="border-b border-[#E7E9ED] text-[11px] uppercase tracking-[0.08em] text-[#9AA0A8]">
                                    <th className="w-[145px] py-3 pr-4 font-semibold">
                                      Staff ID
                                    </th>
                                    <th className="w-[190px] py-3 pr-4 font-semibold">
                                      Employee Name
                                    </th>
                                    <th className="min-w-[230px] py-3 pr-4 font-semibold">
                                      Email
                                    </th>
                                    <th className="w-[145px] py-3 pr-4 font-semibold">
                                      Phone Number
                                    </th>
                                    <th className="w-[170px] py-3 pr-4 font-semibold">
                                      Position
                                    </th>
                                    <th className="w-[150px] py-3 pr-4 font-semibold">
                                      Role
                                    </th>
                                    <th className="w-[115px] py-3 font-semibold">
                                      Status
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {group.staff.map((staff) => {
                                    const isSaving = savingIds.has(
                                      staff.id
                                    );
                                    const isRoleSaving =
                                      savingRoleIds.has(staff.id);
                                    const isPositionSaving =
                                      savingPositionIds.has(
                                        staff.id
                                      );

                                    return (
                                      <tr
                                        key={staff.id}
                                        className="group border-b border-[#F0F1F3] transition-colors hover:bg-[#FAFBFC]"
                                      >
                                        <td className="py-3.5 pl-3 pr-4 text-[13px] font-semibold text-[#111318]">
                                          {staff.staffId || "—"}
                                        </td>

                                        <td className="py-3.5 pr-4">
                                          <span className="text-[13px] font-semibold text-[#111318]">
                                            {staff.firstName}{" "}
                                            {staff.lastName}
                                          </span>
                                        </td>

                                        <td className="py-3.5 pr-4">
                                          {staff.email ? (
                                            <a
                                              href={`mailto:${staff.email}`}
                                              className="text-[13px] font-medium text-[#3C4046] underline decoration-[#C5C8CD] underline-offset-2 transition hover:decoration-[#3C4046]"
                                            >
                                              {staff.email}
                                            </a>
                                          ) : (
                                            <span className="text-[13px] text-[#A3A7AE]">
                                              —
                                            </span>
                                          )}
                                        </td>

                                        <td className="py-3.5 pr-4 text-[13px] font-medium text-[#5B616B]">
                                          {staff.number || "—"}
                                        </td>

                                        <td className="py-3.5 pr-4">
                                          <div className="relative inline-flex items-center">
                                            <select
                                              value={
                                                staff.positionId ?? ""
                                              }
                                              disabled={
                                                isPositionSaving ||
                                                (sourceGroup?.positions
                                                  .length ?? 0) === 0
                                              }
                                              onChange={(event) =>
                                                updateStaffPosition(
                                                  group.id,
                                                  staff.id,
                                                  Number(
                                                    event.target.value
                                                  )
                                                )
                                              }
                                              className="max-w-[170px] cursor-pointer appearance-none truncate rounded-md bg-[#F5F6F8] py-1 pl-2.5 pr-7 text-[12px] font-semibold text-[#5B616B] outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                              {staff.positionId ===
                                                null && (
                                                <option value="">
                                                  {staff.positionName}
                                                </option>
                                              )}
                                              {sourceGroup?.positions.map(
                                                (position) => (
                                                  <option
                                                    key={
                                                      position.position_id
                                                    }
                                                    value={
                                                      position.position_id
                                                    }
                                                  >
                                                    {
                                                      position.position_name
                                                    }
                                                  </option>
                                                )
                                              )}
                                            </select>
                                            <ChevronIcon className="pointer-events-none absolute right-2 h-3 w-3" />
                                          </div>
                                        </td>

                                        <td className="py-3.5 pr-4">
                                          <div className="relative inline-flex items-center">
                                            <select
                                              value={
                                                institutionRoles.find(
                                                  (r) => r.role_name === staff.roleName
                                                )?.role_id ?? ""
                                              }
                                              disabled={isRoleSaving}
                                              onChange={(event) => {
                                                const selectedRoleId = Number(event.target.value);
                                                const selectedRole = institutionRoles.find(
                                                  (r) => r.role_id === selectedRoleId
                                                );
                                                if (selectedRole) {
                                                  updateStaffRole(
                                                    group.id,
                                                    staff.id,
                                                    selectedRole.role_id,
                                                    selectedRole.role_name
                                                  );
                                                }
                                              }}
                                              className={`cursor-pointer appearance-none rounded-md py-1 pl-2.5 pr-7 text-[12px] font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                staff.roleName.toLowerCase() ===
                                                "insti-admin"
                                                  ? "bg-[#EAF8F1] text-[#1F3D33]"
                                                  : "bg-[#F5F6F8] text-[#5B616B]"
                                              }`}
                                            >
                                              {institutionRoles.map((role) => (
                                                <option
                                                  key={role.role_id}
                                                  value={role.role_id}
                                                >
                                                  {role.role_name}
                                                </option>
                                              ))}
                                            </select>
                                            <ChevronIcon className="pointer-events-none absolute right-2 h-3 w-3" />
                                          </div>
                                        </td>

                                        <td className="py-3.5">
                                          <div className="relative inline-flex items-center">
                                            <select
                                              value={staff.status}
                                              disabled={isSaving}
                                              onChange={(event) =>
                                                updateStaffStatus(
                                                  group.id,
                                                  staff.id,
                                                  event.target
                                                    .value as Status
                                                )
                                              }
                                              className={`cursor-pointer appearance-none rounded-full py-1 pl-2.5 pr-7 text-[12px] font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                staff.status === "active"
                                                  ? "bg-[#6FCF97] text-white"
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
                                            <ChevronIcon
                                              className={`pointer-events-none absolute right-2 h-3 w-3 ${
                                                staff.status === "active"
                                                  ? "text-white"
                                                  : ""
                                              }`}
                                            />
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ==================================================
                      PAGINATION
                  ================================================== */}

                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div className="flex items-center gap-2 text-[13px] text-[#9AA0A8]">
                      <span>Items:</span>
                      <div className="relative inline-flex items-center">
                        <select
                          value={itemsPerPage}
                          onChange={(event) =>
                            setItemsPerPage(Number(event.target.value))
                          }
                          className="cursor-pointer appearance-none rounded-md border border-[#E1E3E7] bg-white py-1 pl-2.5 pr-6 text-[13px] font-medium text-[#5B616B] outline-none"
                        >
                          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <ChevronIcon className="pointer-events-none absolute right-2 h-3 w-3" />
                      </div>

                      <span>
                        Showing{" "}
                        {totalRecords === 0 ? 0 : pageStart + 1} -{" "}
                        {pageEnd} of {totalRecords} records
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[13px] text-[#9AA0A8]">
                      <button
                        type="button"
                        onClick={() => goToPage(1)}
                        disabled={safePage === 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="First page"
                      >
                        «
                      </button>
                      <button
                        type="button"
                        onClick={() => goToPage(safePage - 1)}
                        disabled={safePage === 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous page"
                      >
                        ‹
                      </button>

                      <span className="min-w-[24px] text-center font-semibold text-[#3C4046]">
                        {safePage}
                      </span>

                      <button
                        type="button"
                        onClick={() => goToPage(safePage + 1)}
                        disabled={safePage === totalPages}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next page"
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        onClick={() => goToPage(totalPages)}
                        disabled={safePage === totalPages}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Last page"
                      >
                        »
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ======================================================
                RESOLVER GROUPS SECTION (inside Users tab)
            ====================================================== */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#E7E9ED] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#EDEFF2] px-6 py-4">
                <div>
                  <h1 className="text-[15px] font-bold text-[#1F3D33]">
                    Resolver Groups
                  </h1>
                  <p className="mt-0.5 text-[12px] text-[#9AA0A8]">
                    {resolverGroups.length}{' '}
                    {resolverGroups.length === 1 ? 'group' : 'groups'}
                  </p>
                </div>
                {!loading && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateGroupModal(true);
                      setSelectedMemberIds([]);
                      setNewGroupName("");
                    }}
                    className="flex h-9 items-center gap-1.5 rounded-full bg-[#6FCF97] px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#5FBF88] active:scale-[0.98]"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Create Group
                  </button>
                )}
              </div>

              {resolverGroups.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-[13px] text-[#9AA0A8]">
                    No resolver groups yet. Create one to assign members for ticket resolution.
                  </p>
                </div>
              ) : (
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {resolverGroups.map((group) => {
                      const memberNames = group.member_ids
                        .map((id) => {
                          const staff = groups[0]?.staff.find(
                            (s) => Number(s.id) === id
                          );
                          return staff
                            ? `${staff.firstName} ${staff.lastName}`
                            : null;
                        })
                        .filter(Boolean);

                      return (
                        <div
                          key={group.resolver_group_id}
                          className="rounded-xl border border-[#E7E9ED] bg-[#FAFBFC] p-4 transition hover:border-[#D1D5DB]"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-[13px] font-bold text-[#1F3D33] truncate">
                              {group.group_name}
                            </h3>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={togglingGroupId === group.resolver_group_id}
                                onClick={async () => {
                                  setTogglingGroupId(group.resolver_group_id);
                                  try {
                                    const nextStatus = group.status === "active" ? "inactive" : "active";
                                    await updateResolverGroup(group.resolver_group_id, {
                                      group_name: group.group_name,
                                      member_ids: group.member_ids,
                                      status: nextStatus,
                                    });
                                    setResolverGroups((prev) =>
                                      prev.map((g) =>
                                        g.resolver_group_id === group.resolver_group_id
                                          ? { ...g, status: nextStatus }
                                          : g
                                      )
                                    );
                                  } catch {
                                    // ignore
                                  } finally {
                                    setTogglingGroupId(null);
                                  }
                                }}
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold transition disabled:opacity-50 ${
                                  group.status === "active"
                                    ? "bg-[#6FCF97] text-white"
                                    : "bg-[#F1F2F4] text-[#8A9099]"
                                }`}
                              >
                                {group.status === "active" ? "Active" : "Inactive"}
                              </button>
                              <button
                                type="button"
                                title="Edit group"
                                onClick={() => {
                                  setEditingGroup(group);
                                  setEditGroupName(group.group_name);
                                  const resolverIds = new Set(
                                    (groups[0]?.staff ?? [])
                                      .filter((s) => s.canResolve)
                                      .map((s) => Number(s.id))
                                  );
                                  setEditMemberIds(
                                    group.member_ids.filter((id) => resolverIds.has(id))
                                  );
                                  setEditGroupStatus(group.status);
                                }}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-[#8A9099] transition hover:bg-[#E7E9ED] hover:text-[#3C4046]"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                              </button>
                            </div>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {memberNames.length > 0 ? (
                              memberNames.map((name, idx) => (
                                <span
                                  key={`${group.resolver_group_id}-${idx}`}
                                  className="inline-block rounded-full bg-[#E7E9ED] px-2 py-0.5 text-[10px] font-medium text-[#5B616B]"
                                >
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-[#9AA0A8]">
                                {group.member_ids.length}{' '}
                                {group.member_ids.length === 1 ? 'member' : 'members'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            </>
          )}

          {/* ======================================================
              CREATE RESOLVER GROUP MODAL
          ====================================================== */}
          {showCreateGroupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="mb-4 text-sm font-bold text-[#1F3D33]">
                  Create Resolver Group
                </h3>
                <label className="mb-1 block text-[12px] font-semibold text-[#5B616B]">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Backend Team"
                  className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F3D33]"
                />
                <label className="mb-1 block text-[12px] font-semibold text-[#5B616B]">
                  Members
                </label>
                <p className="mb-1 text-[11px] text-[#9AA0A8]">
                  Only users with the resolver permission are listed.
                </p>
                <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-2">
                  {(() => {
                    const resolvers = (groups[0]?.staff ?? []).filter((s) => s.canResolve);
                    return resolvers.length > 0 ? (
                      resolvers.map((staff) => (
                        <label
                          key={staff.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-gray-700 transition hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(Number(staff.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMemberIds((prev) => [...prev, Number(staff.id)]);
                              } else {
                                setSelectedMemberIds((prev) => prev.filter((id) => id !== Number(staff.id)));
                              }
                            }}
                            className="h-4 w-4 rounded accent-[#1F3D33]"
                          />
                          <span className="font-medium text-[#111318]">
                            {staff.firstName} {staff.lastName}
                          </span>
                          <span className="text-[11px] text-[#9AA0A8]">
                            ({staff.roleName})
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="py-4 text-center text-[13px] text-[#9AA0A8]">
                        No users with resolver permission found. Ask an admin to enable the resolver permission on a role.
                      </p>
                    );
                  })()}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateGroupModal(false);
                      setNewGroupName("");
                      setSelectedMemberIds([]);
                    }}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newGroupName.trim() || selectedMemberIds.length === 0 || savingGroup}
                    onClick={async () => {
                      if (!newGroupName.trim() || selectedMemberIds.length === 0) return;
                      setSavingGroup(true);
                      try {
                        await createResolverGroup({
                          group_name: newGroupName.trim(),
                          member_ids: selectedMemberIds,
                        });
                        await loadData();
                        setShowCreateGroupModal(false);
                        setNewGroupName("");
                        setSelectedMemberIds([]);
                      } catch {
                        // ignore
                      } finally {
                        setSavingGroup(false);
                      }
                    }}
                    className="rounded-lg bg-[#1F3D33] px-4 py-2 text-xs font-bold text-white hover:bg-[#2B5245] disabled:opacity-40"
                  >
                    {savingGroup ? "Creating..." : "Create Group"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================
              EDIT RESOLVER GROUP MODAL
          ====================================================== */}
          {editingGroup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="mb-4 text-sm font-bold text-[#1F3D33]">
                  Edit Resolver Group
                </h3>
                <label className="mb-1 block text-[12px] font-semibold text-[#5B616B]">
                  Group Name
                </label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  placeholder="e.g. Backend Team"
                  className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F3D33]"
                />
                <label className="mb-1 block text-[12px] font-semibold text-[#5B616B]">
                  Status
                </label>
                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditGroupStatus("active")}
                    className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
                      editGroupStatus === "active"
                        ? "bg-[#6FCF97] text-white"
                        : "bg-[#F1F2F4] text-[#8A9099] hover:bg-[#E7E9ED]"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditGroupStatus("inactive")}
                    className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
                      editGroupStatus === "inactive"
                        ? "bg-[#F1F2F4] text-[#8A9099]"
                        : "bg-[#F1F2F4] text-[#8A9099] hover:bg-[#E7E9ED]"
                    }`}
                  >
                    Inactive
                  </button>
                </div>
                <label className="mb-1 block text-[12px] font-semibold text-[#5B616B]">
                  Members
                </label>
                <p className="mb-1 text-[11px] text-[#9AA0A8]">
                  Only users with the resolver permission are listed.
                </p>
                <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-2">
                  {(() => {
                    const resolvers = (groups[0]?.staff ?? []).filter((s) => s.canResolve);
                    return resolvers.length > 0 ? (
                      resolvers.map((staff) => (
                        <label
                          key={staff.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-gray-700 transition hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={editMemberIds.includes(Number(staff.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditMemberIds((prev) => [...prev, Number(staff.id)]);
                              } else {
                                setEditMemberIds((prev) => prev.filter((id) => id !== Number(staff.id)));
                              }
                            }}
                            className="h-4 w-4 rounded accent-[#1F3D33]"
                          />
                          <span className="font-medium text-[#111318]">
                            {staff.firstName} {staff.lastName}
                          </span>
                          <span className="text-[11px] text-[#9AA0A8]">
                            ({staff.roleName})
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="py-4 text-center text-[13px] text-[#9AA0A8]">
                        No users with resolver permission found.
                      </p>
                    );
                  })()}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingGroup(null)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!editGroupName.trim() || editMemberIds.length === 0 || savingGroup}
                    onClick={async () => {
                      if (!editGroupName.trim() || editMemberIds.length === 0) return;
                      setSavingGroup(true);
                      try {
                        await updateResolverGroup(editingGroup.resolver_group_id, {
                          group_name: editGroupName.trim(),
                          member_ids: editMemberIds,
                          status: editGroupStatus,
                        });
                        await loadData();
                        setEditingGroup(null);
                      } catch {
                        // ignore
                      } finally {
                        setSavingGroup(false);
                      }
                    }}
                    className="rounded-lg bg-[#1F3D33] px-4 py-2 text-xs font-bold text-white hover:bg-[#2B5245] disabled:opacity-40"
                  >
                    {savingGroup ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================
              ROLES TAB
              NOTE: there's no roles/permissions API wired up yet
              in this file — roles are derived from the users
              already loaded, and status is a display-only "Active".
              Hook these panels up to a real roles endpoint when
              one is available.
          ====================================================== */}

          {activeTab === "roles" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
              <div className="rounded-2xl border border-[#E7E9ED] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[14px] font-bold text-[#1F3D33]">
                    List of Roles
                  </h2>
                  <button
                    type="button"
                    title="Add role"
                    onClick={() => setShowAddRoleModal(true)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6FCF97] text-white transition hover:bg-[#5FBF88]"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-[1fr_80px_60px] gap-2 border-b border-[#F0F1F3] pb-2 text-[11px] uppercase tracking-[0.08em] text-[#9AA0A8]">
                  <span>Role Name</span>
                  <span>Status</span>
                  <span></span>
                </div>

                <div className="max-h-[560px] overflow-y-auto pr-1">
                  {institutionRoles.length === 0 ? (
                    <p className="py-6 text-center text-[13px] text-[#9AA0A8]">
                      No roles found yet.
                    </p>
                  ) : (
                    institutionRoles.map((role) => (
                      <div
                        key={role.role_id}
                        className={`grid grid-cols-[1fr_80px_60px] items-center gap-2 rounded-lg px-1 py-3 transition ${
                          selectedRoleId === role.role_id
                            ? "bg-[#F5F6F8]"
                            : "hover:bg-[#FAFBFC]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedRoleId(role.role_id)}
                          className="text-left text-[13px] font-bold text-[#1F3D33] truncate"
                        >
                          {role.role_name}
                        </button>
                        <button
                          type="button"
                          disabled={savingRoleStatusIds.has(role.role_id)}
                          onClick={async () => {
                            setSavingRoleStatusIds((prev) => new Set(prev).add(role.role_id));
                            try {
                              const res = await toggleRoleStatus(role.role_id);
                              setInstitutionRoles((prev) =>
                                prev.map((r) =>
                                  r.role_id === role.role_id
                                    ? { ...r, status: res.response?.status ?? (r.status === "active" ? "inactive" : "active") }
                                    : r
                                )
                              );
                            } catch {
                              // ignore
                            }
                            setSavingRoleStatusIds((prev) => {
                              const next = new Set(prev);
                              next.delete(role.role_id);
                              return next;
                            });
                          }}
                          className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                            role.status === "active"
                              ? "bg-[#6FCF97] text-white"
                              : "bg-[#F1F2F4] text-[#8A9099]"
                          }`}
                        >
                          {role.status === "active" ? "Active" : "Inactive"}
                        </button>
                        <button
                          type="button"
                          title="Edit role"
                          onClick={() => {
                            setEditingRole(role);
                            setEditRoleName(role.role_name);
                            setEditRolePermissions({
                              can_create: role.can_create,
                              can_endorse: role.can_endorse,
                              can_approve: role.can_approve,
                              can_resolve: role.can_resolve,
                              can_audit: role.can_audit,
                            });
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-[#8A9099] transition hover:bg-[#E7E9ED] hover:text-[#3C4046]"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E7E9ED] bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-[14px] font-bold text-[#1F3D33]">
                  Permission
                </h2>

                <PermissionTable
                  roles={institutionRoles}
                  users={rolePageUsers}
                  onUpdate={async (roleId, data) => {
                    await editRole(roleId, data);
                    setInstitutionRoles((prev) =>
                      prev.map((r) =>
                        r.role_id === roleId
                          ? { ...r, ...data }
                          : r
                      )
                    );
                  }}
                />

                {/* ==============================================
                    PERMISSION PANEL — PAGINATION
                ============================================== */}
                {roleUsersTotal > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div className="flex items-center gap-2 text-[13px] text-[#9AA0A8]">
                      <span>Items:</span>
                      <div className="relative inline-flex items-center">
                        <select
                          value={roleItemsPerPage}
                          onChange={(event) =>
                            setRoleItemsPerPage(Number(event.target.value))
                          }
                          className="cursor-pointer appearance-none rounded-md border border-[#E1E3E7] bg-white py-1 pl-2.5 pr-6 text-[13px] font-medium text-[#5B616B] outline-none"
                        >
                          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <ChevronIcon className="pointer-events-none absolute right-2 h-3 w-3" />
                      </div>

                      <span>
                        Showing {roleUsersTotal === 0 ? 0 : roleUsersPageStart + 1} -{" "}
                        {roleUsersPageEnd} of {roleUsersTotal} records
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[13px] text-[#9AA0A8]">
                      <button
                        type="button"
                        onClick={() => goToRolePage(1)}
                        disabled={roleSafePage === 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="First page"
                      >
                        «
                      </button>
                      <button
                        type="button"
                        onClick={() => goToRolePage(roleSafePage - 1)}
                        disabled={roleSafePage === 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous page"
                      >
                        ‹
                      </button>

                      <span className="min-w-[24px] text-center font-semibold text-[#3C4046]">
                        {roleSafePage}
                      </span>

                      <button
                        type="button"
                        onClick={() => goToRolePage(roleSafePage + 1)}
                        disabled={roleSafePage === roleUsersTotalPages}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next page"
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        onClick={() => goToRolePage(roleUsersTotalPages)}
                        disabled={roleSafePage === roleUsersTotalPages}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Last page"
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================
              ADD ROLE MODAL
          ====================================================== */}
          {showAddRoleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-sm font-bold text-[#1F3D33] mb-4">Add New Role</h3>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Role name"
                  className="w-full mb-4 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F3D33]"
                />
                <div className="space-y-2 mb-4">
                  {(["can_create", "can_endorse", "can_approve", "can_resolve", "can_audit"] as const).map((perm) => (
                    <label key={perm} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={newRolePermissions[perm]}
                        onChange={(e) => setNewRolePermissions((prev) => ({ ...prev, [perm]: e.target.checked }))}
                        className="h-4 w-4 rounded accent-[#1F3D33]"
                      />
                      {perm.replace("can_", "Can ").replace("_", " ")}
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddRoleModal(false); setNewRoleName(""); }}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newRoleName.trim()}
                    onClick={async () => {
                      if (!newRoleName.trim()) return;
                      try {
                        await addRole({
                          role_name: newRoleName.trim(),
                          ...newRolePermissions,
                        });
                        await loadData();
                        setShowAddRoleModal(false);
                        setNewRoleName("");
                        setNewRolePermissions({ can_create: false, can_endorse: false, can_approve: false, can_resolve: false, can_audit: false });
                      } catch {
                        // ignore
                      }
                    }}
                    className="rounded-lg bg-[#1F3D33] px-4 py-2 text-xs font-bold text-white hover:bg-[#2B5245] disabled:opacity-40"
                  >
                    Add Role
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================
              EDIT ROLE MODAL
          ====================================================== */}
          {editingRole && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-sm font-bold text-[#1F3D33] mb-4">Edit Role</h3>
                <input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  placeholder="Role name"
                  className="w-full mb-4 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F3D33]"
                />
                <div className="space-y-2 mb-4">
                  {(["can_create", "can_endorse", "can_approve", "can_resolve", "can_audit"] as const).map((perm) => (
                    <label key={perm} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={editRolePermissions[perm]}
                        onChange={(e) => setEditRolePermissions((prev) => ({ ...prev, [perm]: e.target.checked }))}
                        className="h-4 w-4 rounded accent-[#1F3D33]"
                      />
                      {perm.replace("can_", "Can ").replace("_", " ")}
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!editRoleName.trim()}
                    onClick={async () => {
                      if (!editRoleName.trim()) return;
                      try {
                        await editRole(editingRole.role_id, {
                          role_name: editRoleName.trim(),
                          ...editRolePermissions,
                        });
                        setInstitutionRoles((prev) =>
                          prev.map((r) =>
                            r.role_id === editingRole.role_id
                              ? { ...r, role_name: editRoleName.trim(), ...editRolePermissions }
                              : r
                          )
                        );
                        setEditingRole(null);
                      } catch {
                        // ignore
                      }
                    }}
                    className="rounded-lg bg-[#1F3D33] px-4 py-2 text-xs font-bold text-white hover:bg-[#2B5245] disabled:opacity-40"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
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
   PERMISSION TABLE
   Lists users and their permission checkboxes right away — no
   role selection required. Each row looks up its own role's
   permissions independently, so users with different roles can
   be shown together. Permissions live on the role record, not
   per-user, so toggling a checkbox updates that row's role
   (and therefore every other user sharing it).
   ============================================================ */

type PermissionKey =
  | "can_endorse"
  | "can_create"
  | "can_approve"
  | "can_resolve";

const PERMISSION_COLUMNS: { key: PermissionKey; label: string }[] = [
  { key: "can_endorse", label: "Can Endorsed" },
  { key: "can_create", label: "Can Create" },
  { key: "can_approve", label: "Can Approved" },
  { key: "can_resolve", label: "Can Resolved" },
];

function PermissionTable({
  roles,
  users,
  onUpdate,
}: {
  roles: Role[];
  users: FlatStaff[];
  onUpdate: (
    roleId: number,
    data: import("@/services/integration/role/post_role").AddRoleRequest
  ) => Promise<void>;
}) {
  const [localRoles, setLocalRoles] = useState(roles);
  const [savingRoleIds, setSavingRoleIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalRoles(roles);
  }, [roles]);

  function findRoleForUser(user: FlatStaff): Role | null {
    const target = user.roleName.trim().toLowerCase();
    return (
      localRoles.find(
        (r) => r.role_name.trim().toLowerCase() === target
      ) ?? null
    );
  }

  async function handleToggle(role: Role, perm: PermissionKey) {
    const updated = { ...role, [perm]: !role[perm] };

    setLocalRoles((prev) =>
      prev.map((r) => (r.role_id === role.role_id ? updated : r))
    );
    setSavingRoleIds((prev) => new Set(prev).add(role.role_id));

    try {
      await onUpdate(role.role_id, {
        role_name: updated.role_name,
        can_create: updated.can_create,
        can_endorse: updated.can_endorse,
        can_approve: updated.can_approve,
        can_resolve: updated.can_resolve,
        can_audit: updated.can_audit,
      });
    } catch {
      // Rollback on error
      setLocalRoles((prev) =>
        prev.map((r) => (r.role_id === role.role_id ? role : r))
      );
    }

    setSavingRoleIds((prev) => {
      const next = new Set(prev);
      next.delete(role.role_id);
      return next;
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#E7E9ED] text-[11px] uppercase tracking-[0.08em] text-[#9AA0A8]">
            <th className="py-3 pr-4 font-semibold">User</th>
            <th className="py-3 pr-4 font-semibold">Role</th>
            {PERMISSION_COLUMNS.map((col) => (
              <th key={col.key} className="py-3 pr-4 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td
                colSpan={2 + PERMISSION_COLUMNS.length}
                className="py-10 text-center text-[13px] text-[#9AA0A8]"
              >
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const role = findRoleForUser(user);
              const isSaving = role
                ? savingRoleIds.has(role.role_id)
                : false;

              return (
                <tr
                  key={user.id}
                  className="border-b border-[#F0F1F3] hover:bg-[#FAFBFC]"
                >
                  <td className="py-3.5 pr-4 text-[13px] font-bold text-[#1F3D33]">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="py-3.5 pr-4 text-[13px] font-bold text-[#1F3D33]">
                    {user.roleName}
                  </td>
                  {PERMISSION_COLUMNS.map((col) => (
                    <td key={col.key} className="py-3.5 pr-4">
                      <input
                        type="checkbox"
                        checked={role ? !!role[col.key] : false}
                        onChange={() => role && handleToggle(role, col.key)}
                        disabled={!role || isSaving}
                        className="h-4 w-4 rounded border-[#D9DCE1] accent-[#1F3D33] disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}


/* ============================================================
   TAB BUTTON
   ============================================================ */

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-[13px] font-semibold transition ${
        active
          ? "bg-[#1F3D33] text-white shadow-sm"
          : "text-[#8A9099] hover:bg-[#EEF0F2] hover:text-[#3C4046]"
      }`}
    >
      {label}
    </button>
  );
}

/* ============================================================
   SEARCH ICON
   ============================================================ */

function SearchIcon({ className = "" }: { className?: string }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
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