"use client";

import { useCallback, useEffect, useState } from "react";
import { getAllUsers, type UserDetailsResp } from "./api/get-user";

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
  status: Status;
};

type InstitutionGroup = {
  id: string;
  name: string;
  color: string;
  staff: Staff[];
};

const FALLBACK_COLOR = "#3C4046";

function groupByInstitution(users: UserDetailsResp[]): InstitutionGroup[] {
  const groups = new Map<string, InstitutionGroup>();

  for (const user of users) {
    const institutionId = String(user.institution_id ?? "unassigned");
    const institutionName = user.institution_name || "Unassigned";

    const staffRecord: Staff = {
      id: String(user.id),
      staffId: user.staff_id ?? "",
      firstName: user.first_name ?? "",
      lastName: user.last_name ?? "",
      username: user.username ?? "",
      number: user.phone_no ?? "",
      email: user.email ?? "",
      roleName: user.role?.role_name ?? "—",
      status:
  user.status?.toLowerCase() === "active"
    ? "active"
    : "inactive",
    };

    const existing = groups.get(institutionId);
    if (existing) {
      existing.staff.push(staffRecord);
    } else {
      groups.set(institutionId, {
        id: institutionId,
        name: institutionName,
        color: FALLBACK_COLOR,
        staff: [staffRecord],
      });
    }
  }

  return Array.from(groups.values());
}

export default function UserManagementPage() {
  const [groups, setGroups] = useState<InstitutionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    // ApiHelper automatically attaches the token
    const users = await getAllUsers();

    setGroups(groupByInstitution(users));
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load user data."
    );
    setGroups([]);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  function updateStaff(
    groupId: string,
    staffId: string,
    patch: Partial<Staff>
  ) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              staff: g.staff.map((s) =>
                s.id === staffId ? { ...s, ...patch } : s
              ),
            }
      )
    );
    // TODO: PATCH the change back to the API once an update endpoint exists, e.g.
    // await updateUserStatus(staffId, patch.status, token)
  }

  return (
    <div className="min-h-screen py-1 sm:px-2">
      <div className="mx-auto max-w-15xl rounded-2xl border border-[#E7E9ED] bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EDEFF2] px-6 py-4">
          <h1 className="text-[15px] font-semibold text-[#111318]">
            User Management
          </h1>
          {!loading && (
            <button
              onClick={loadData}
              className="text-[12px] font-semibold text-[#9AA0A8] transition hover:text-[#5B616B]"
            >
              Refresh
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col gap-3 px-6 py-10">
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="mb-3 h-4 w-52 rounded bg-[#EDEFF2]" />
                <div className="h-8 w-full rounded bg-[#F5F6F8]" />
                <div className="mt-2 h-10 w-full rounded bg-[#F9FAFB]" />
              </div>
            ))}
          </div>
        )}

        {/* No data state — covers both "API not reachable" and "API responded with nothing" */}
        {!loading && (error || groups.length === 0) && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F2F4] text-[#9AA0A8]">
              <BuildingIcon />
            </div>
            <p className="text-[14px] font-medium text-[#5B616B]">
              No data available
            </p>
            <p className="max-w-sm text-[13px] text-[#9AA0A8]">
              {error
                ? "We couldn't reach the server just now. Once the API is connected, institutions and staff will appear here automatically."
                : "Once institutions and staff are added, they'll appear here grouped by institution."}
            </p>
            <button
              onClick={loadData}
              className="mt-1 rounded-full border border-[#D8DBE0] px-4 py-1.5 text-[13px] font-semibold text-[#3C4046] transition hover:border-[#B8BCC4] hover:bg-[#F7F8FA]"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Groups: one title + column set per institution, entirely data-driven */}
        {!loading && !error && groups.length > 0 && (
          <div className="flex flex-col px-6 pb-10">
            {groups.map((group) => (
              <section key={group.id} className="pt-6">
                <h2
                  className="mb-3 text-[14px] font-bold"
                  style={{ color: group.color }}
                >
                  {group.name}
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] border-collapse text-left">
                    <thead>
                      <tr className="text-[12px] uppercase tracking-wide text-[#9AA0A8]">
                        <th className="w-36 py-2 font-medium">Staff ID</th>
                        <th className="w-32 py-2 font-medium">First Name</th>
                        <th className="w-32 py-2 font-medium">Last Name</th>
                        <th className="w-32 py-2 font-medium">Username</th>
                        <th className="w-28 py-2 font-medium">Number</th>
                        <th className="w-56 py-2 font-medium">Email</th>
                        <th className="w-36 py-2 font-medium">Role</th>
                        <th className="w-28 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.staff.length === 0 && (
                        <tr className="border-t border-[#F1F2F4]">
                          <td colSpan={8} className="py-8 text-center">
                            <p className="text-[13px] font-medium text-[#9AA0A8]">
                              No staff added yet for this institution.
                            </p>
                          </td>
                        </tr>
                      )}
                      {group.staff.map((s) => (
                        <tr key={s.id} className="border-t border-[#F1F2F4]">
                          <td className="py-3 text-[14px] font-semibold text-[#111318]">
                            {s.staffId}
                          </td>
                          <td className="py-3 text-[14px] font-semibold text-[#111318]">
                            {s.firstName}
                          </td>
                          <td className="py-3 text-[14px] font-semibold text-[#111318]">
                            {s.lastName}
                          </td>
                          <td className="py-3 text-[14px] font-semibold text-[#111318]">
                            {s.username}
                          </td>
                          <td className="py-3 text-[14px] font-semibold text-[#111318]">
                            {s.number}
                          </td>
                          <td className="py-3 text-[14px]">
                            <a
                              href={`mailto:${s.email}`}
                              className="font-semibold text-[#111318] underline decoration-[#111318]/40 underline-offset-2 hover:decoration-[#111318]"
                            >
                              {s.email}
                            </a>
                          </td>
                          <td className="py-3 text-[14px] font-semibold text-[#111318]">
                            {s.roleName}
                          </td>
                          <td className="py-3">
                            <div className="relative inline-block">
                              <select
                                value={s.status}
                                onChange={(e) =>
                                  updateStaff(group.id, s.id, {
                                    status: e.target.value as Status,
                                  })
                                }
                                className={`appearance-none rounded-md bg-transparent pr-5 text-[14px] font-semibold outline-none ${
                                  s.status === "active"
                                    ? "text-[#1AAE6F]"
                                    : "text-[#B0B4BA]"
                                }`}
                              >
                                <option value="active">active</option>
                                <option value="inactive">inactive</option>
                              </select>
                              <ChevronIcon className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-current" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-3.5 w-3.5 ${className}`}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

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
    >
      <path d="M4 21V6a1 1 0 011-1h6a1 1 0 011 1v15" />
      <path d="M14 21V10a1 1 0 011-1h4a1 1 0 011 1v11" />
      <path d="M2 21h20M7 8h1M7 12h1M7 16h1" />
    </svg>
  );
}