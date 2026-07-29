"use client";

import { useState } from "react";
import AddUserModal from "./register/register";

// ---------- Types ----------

type Status = "active" | "inactive";

interface UserRow {
  staffId: string;
  firstName: string;
  lastName: string;
  institution: string;
  email: string;
  role: string;
  policy: string;
  status: Status;
  createdAt: string;
}

const STATUS_STYLES: Record<Status, string> = {
  active: "text-emerald-500",
  inactive: "text-slate-400",
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

// ---------- Page ----------

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold tracking-wide text-slate-400">
                <th className="px-6 py-3">STAFF ID</th>
                <th className="px-4 py-3">FIRST NAME</th>
                <th className="px-4 py-3">LAST NAME</th>
                <th className="px-4 py-3">INSTITUTION</th>
                <th className="px-4 py-3">EMAIL</th>
                <th className="px-4 py-3">ROLE</th>
                <th className="px-4 py-3">POLICY</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">CREATED AT</th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr
                    key={row.staffId}
                    className="border-b border-slate-100 text-sm text-slate-700"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {row.staffId}
                    </td>

                    <td className="px-4 py-4">{row.firstName}</td>

                    <td className="px-4 py-4">{row.lastName}</td>

                    <td className="px-4 py-4">{row.institution}</td>

                    <td className="px-4 py-4">
                      <a
                        href={`mailto:${row.email}`}
                        className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
                      >
                        {row.email}
                      </a>
                    </td>

                    <td className="px-4 py-4">{row.role}</td>

                    <td className="px-4 py-4">{row.policy}</td>

                    <td
                      className={`px-4 py-4 font-semibold capitalize ${STATUS_STYLES[row.status]}`}
                    >
                      {row.status}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {row.createdAt}
                    </td>
                  </tr>
                ))
              ) : (
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

      <AddUserModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={() => {
          // TODO: Fetch users again after successful creation.
        }}
      />
    </main>
  );
}