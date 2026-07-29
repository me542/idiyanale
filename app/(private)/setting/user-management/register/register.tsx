"use client";

import { useEffect, useState } from "react";
import { registerUser } from "@/services/integration/auth/register";
import { getInstitutions, InstitutionResp } from "./api/get-insti-public";

// Same fields as the register form (staff_id, email, first_name, last_name,
// phone_no, institution, job_position), wired to the same API calls, just
// rendered as a modal component instead of a page.

interface CreateUserForm {
  staff_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_no: string;
  institution: string; // institution_id as string, cast to number on submit
  job_position: string;
}

const initialForm: CreateUserForm = {
  staff_id: "",
  email: "",
  first_name: "",
  last_name: "",
  phone_no: "",
  institution: "",
  job_position: "",
};

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void; // called after a successful create, e.g. to refresh the table
}

export default function AddUserModal({ open, onClose, onCreated }: AddUserModalProps) {
  const [form, setForm] = useState<CreateUserForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserForm, boolean>>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [institutions, setInstitutions] = useState<InstitutionResp[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(true);
  const [institutionsError, setInstitutionsError] = useState(false);

  // Reset form each time the modal is opened
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(initialForm);
      setErrors({});
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        setInstitutionsLoading(true);
        setInstitutionsError(false);
        const data = await getInstitutions();
        if (!cancelled) {
          setInstitutions(data.filter((i: InstitutionResp) => i.status === "active"));
        }
      } catch {
        if (!cancelled) setInstitutionsError(true);
      } finally {
        if (!cancelled) setInstitutionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const update = (key: keyof CreateUserForm) => (v: string) => {
    let value = v;

    if (key === "staff_id") {
      const digits = value.replace(/\D/g, "");
      const limited = digits.slice(0, 12);
      value = limited.length > 6 ? `${limited.slice(0, 6)}-${limited.slice(6)}` : limited;
    }

    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: false }));
    setError("");
  };

  const validate = () => {
    const required: (keyof CreateUserForm)[] = [
      "staff_id",
      "email",
      "first_name",
      "last_name",
      "phone_no",
      "institution",
      "job_position",
    ];
    const next: Partial<Record<keyof CreateUserForm, boolean>> = {};
    let ok = true;
    for (const key of required) {
      if (!form[key].trim()) {
        next[key] = true;
        ok = false;
      }
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = true;
      ok = false;
    }
    setErrors(next);
    return ok;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setError("Please fill in all fields correctly.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await registerUser({
        staff_id: form.staff_id.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_no: form.phone_no.trim(),
        institution_id: Number(form.institution.trim()),
        job_position: form.job_position.trim(),
        status: "pending",
      });

      onCreated?.();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-md border px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
      hasError ? "border-red-400" : "border-slate-200"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-800">Add User</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>

        <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto px-6 py-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              First Name
            </label>
            <input
              value={form.first_name}
              onChange={(e) => update("first_name")(e.target.value)}
              className={inputClass(errors.first_name)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Last Name
            </label>
            <input
              value={form.last_name}
              onChange={(e) => update("last_name")(e.target.value)}
              className={inputClass(errors.last_name)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Staff ID Number
            </label>
            <input
              value={form.staff_id}
              onChange={(e) => update("staff_id")(e.target.value)}
              placeholder="123456-78901"
              className={inputClass(errors.staff_id)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email")(e.target.value)}
              className={inputClass(errors.email)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Phone Number
            </label>
            <input
              value={form.phone_no}
              onChange={(e) => update("phone_no")(e.target.value)}
              className={inputClass(errors.phone_no)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Institution
            </label>
            <select
              value={form.institution}
              onChange={(e) => update("institution")(e.target.value)}
              disabled={institutionsLoading || institutionsError}
              className={inputClass(errors.institution)}
            >
              <option value="" disabled>
                {institutionsLoading
                  ? "Loading institutions…"
                  : institutionsError
                  ? "Failed to load institutions"
                  : "Select institution"}
              </option>
              {institutions.map((inst) => (
                <option key={inst.institution_id} value={String(inst.institution_id)}>
                  {inst.institution_name}
                </option>
              ))}
            </select>
            {institutionsError && (
              <p className="mt-1 text-xs text-red-500">
                Could not load institutions. Please refresh and try again.
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Job Position
            </label>
            <input
              value={form.job_position}
              onChange={(e) => update("job_position")(e.target.value)}
              placeholder="e.g. Registrar Staff"
              className={inputClass(errors.job_position)}
            />
          </div>
        </div>

        {error && <p className="px-6 pb-2 text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}