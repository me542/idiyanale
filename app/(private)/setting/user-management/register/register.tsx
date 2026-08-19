"use client";

import { useEffect, useState } from "react";
import { getInstitutions, InstitutionResp } from "./api/get-insti-public";
import { getPositionsByInstitutionId, Position } from "@/services/integration/super_admin/get_position_insti_id"; 
import { addPosition } from "@/services/integration/insti-admin/post_position";
import { registerUser, RegisterUserRequest } from "@/services/integration/user/post_resgister_user"; 
import { verifyJWT } from "@/lib/auth/verify-jwt";

interface CreateUserForm {
  staff_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_no: string;
  institution: string;
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
  onCreated?: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddUserModal({
  open,
  onClose,
  onCreated,
}: AddUserModalProps) {
  const [form, setForm] = useState<CreateUserForm>(initialForm);

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateUserForm, boolean>>
  >({});

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [institutions, setInstitutions] = useState<InstitutionResp[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(true);
  const [institutionsError, setInstitutionsError] = useState(false);

  const [positions, setPositions] = useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState(false);

  const [newPosition, setNewPosition] = useState("");
  const [addingPosition, setAddingPosition] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setErrors({});
      setError("");
      setPositions([]);
      setPositionsError(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchUserInstitution = async () => {
      try {
        setInstitutionsLoading(true);
        setInstitutionsError(false);

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const jwt = await verifyJWT(token);

        if (!jwt) {
          throw new Error("Unable to verify authentication token.");
        }

        const institutionId = jwt.institution_id;

        if (!institutionId) {
          throw new Error("Institution ID not found in JWT.");
        }

        const data = await getInstitutions();

        if (cancelled) return;

        const institutionList = data ?? [];

        const userInstitution = institutionList.filter(
          (institution) =>
            institution.institution_id === institutionId &&
            institution.status.toLowerCase() === "active"
        );

        setInstitutions(userInstitution);

        if (userInstitution.length > 0) {
          setForm((current) => ({
            ...current,
            institution: String(userInstitution[0].institution_id),
          }));
        }
      } catch (err) {
        console.error("Failed to load user institution:", err);

        if (!cancelled) {
          setInstitutions([]);
          setInstitutionsError(true);
          setError(
            err instanceof Error ? err.message : "Failed to load institution."
          );
        }
      } finally {
        if (!cancelled) {
          setInstitutionsLoading(false);
        }
      }
    };

    fetchUserInstitution();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !form.institution) {
      setPositions([]);
      return;
    }

    let cancelled = false;

    const fetchPositions = async () => {
      try {
        setPositionsLoading(true);
        setPositionsError(false);

        const res = await getPositionsByInstitutionId(form.institution);

        if (cancelled) return;

        const positionList = res?.response ?? [];
        setPositions(positionList);
      } catch (err) {
        console.error("Failed to load positions:", err);

        if (!cancelled) {
          setPositions([]);
          setPositionsError(true);
        }
      } finally {
        if (!cancelled) {
          setPositionsLoading(false);
        }
      }
    };

    fetchPositions();

    return () => {
      cancelled = true;
    };
  }, [open, form.institution]);

const handleAddPosition = async () => {
  const positionName = newPosition.trim();

  if (!positionName) return;

  try {
    setAddingPosition(true);

    const res = await addPosition({
      position_name: positionName,
    });

    // Backend returns ret_code: "200" on success
    if (res?.ret_code !== "200") {
      throw new Error(res?.message || "Failed to add position.");
    }

    // Reload positions
    const updated = await getPositionsByInstitutionId(form.institution);
    const positionList = updated?.response ?? [];

    setPositions(positionList);

    // Automatically select the newly created position
    const createdPosition = positionList.find(
      (position) =>
        position.position_name.toLowerCase() ===
        positionName.toLowerCase()
    );

    if (createdPosition) {
      setForm((current) => ({
        ...current,
        job_position: String(createdPosition.position_id),
      }));
    }

    setNewPosition("");
    setShowAddPosition(false);
  } catch (err) {
    console.error("Failed to add position:", err);
  } finally {
    setAddingPosition(false);
  }
};

  const update =
    (key: keyof CreateUserForm) => (value: string) => {
      let newValue = value;

      if (key === "staff_id") {
        const digits = value.replace(/\D/g, "");
        const limited = digits.slice(0, 11);

        newValue =
          limited.length > 6
            ? `${limited.slice(0, 6)}-${limited.slice(6)}`
            : limited;
      }

      if (key === "phone_no") {
        // Digits only, capped at 11 (e.g. 09123456789)
        newValue = value.replace(/\D/g, "").slice(0, 11);
      }

      setForm((current) => ({
        ...current,
        [key]: newValue,
        ...(key === "institution" ? { job_position: "" } : {}),
      }));

      setErrors((current) => ({
        ...current,
        [key]: false,
      }));

      setError("");
    };

  const validate = () => {
    const requiredFields: (keyof CreateUserForm)[] = [
      "staff_id",
      "email",
      "first_name",
      "last_name",
      "phone_no",
      "institution",
      "job_position",
    ];

    const nextErrors: Partial<Record<keyof CreateUserForm, boolean>> = {};

    let valid = true;

    for (const key of requiredFields) {
      if (!form[key].trim()) {
        nextErrors[key] = true;
        valid = false;
      }
    }

    if (!form.email.trim() || !EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = true;
      valid = false;
    }

    if (form.staff_id && !/^\d{6}-\d{5}$/.test(form.staff_id)) {
      nextErrors.staff_id = true;
      valid = false;
    }

    if (form.phone_no && form.phone_no.length !== 11) {
      nextErrors.phone_no = true;
      valid = false;
    }

    setErrors(nextErrors);

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setError("Please fill in all fields correctly.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: RegisterUserRequest = {
        staff_id: form.staff_id.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_no: form.phone_no.trim(),
        position_id: Number(form.job_position),
        institution_id: Number(form.institution),
      };

      const res = await registerUser(payload);

      if (res?.ret_code && res.ret_code !== "0") {
        throw new Error(res.message || "Failed to create user.");
      }

      // Reset the form back to a blank state so no stale data lingers
      // if the modal is reopened.
      setForm(initialForm);
      setErrors({});
      setError("");

      onCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user");
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
          <h2 className="text-lg font-semibold text-slate-800">Register User</h2>
        </div>

        <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto px-6 py-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              First Name
            </label>
            <input
              type="text"
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
              type="text"
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
              type="text"
              value={form.staff_id}
              onChange={(e) => update("staff_id")(e.target.value)}
              placeholder="123456-78901"
              maxLength={12}
              inputMode="numeric"
              className={inputClass(errors.staff_id)}
            />
            {errors.staff_id && (
              <p className="mt-1 text-xs text-red-500">
                Staff ID must follow the format 123456-78901.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email")(e.target.value)}
              required
              className={inputClass(errors.email)}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                Please enter a valid email address.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Phone Number
            </label>
            <input
              type="text"
              value={form.phone_no}
              onChange={(e) => update("phone_no")(e.target.value)}
              placeholder="09123456789"
              maxLength={11}
              inputMode="numeric"
              className={inputClass(errors.phone_no)}
            />
            {errors.phone_no && (
              <p className="mt-1 text-xs text-red-500">
                Phone number must be exactly 11 digits.
              </p>
            )}
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
                  ? "Loading institution..."
                  : institutionsError
                  ? "Failed to load institution"
                  : "Select institution"}
              </option>

              {institutions.map((institution) => (
                <option
                  key={institution.institution_id}
                  value={String(institution.institution_id)}
                >
                  {institution.institution_name}
                </option>
              ))}
            </select>
            {institutionsError && (
              <p className="mt-1 text-xs text-red-500">
                Could not load your institution. Please refresh and try again.
              </p>
            )}
          </div>

<div className="sm:col-span-2">
  <label className="mb-1 block text-xs font-semibold text-slate-500">
    Job Position
  </label>

  <select
    value={showAddPosition ? "__add_position__" : form.job_position}
    onChange={(e) => {
      const value = e.target.value;

      if (value === "__add_position__") {
        setShowAddPosition(true);
        setNewPosition("");
        return;
      }

      setShowAddPosition(false);
      update("job_position")(value);
    }}
    disabled={
      !form.institution ||
      positionsLoading ||
      positionsError
    }
    className={inputClass(errors.job_position)}
  >
    <option value="" disabled>
      {!form.institution
        ? "Select institution first"
        : positionsLoading
        ? "Loading job positions..."
        : positionsError
        ? "Failed to load job positions"
        : "Select job position"}
    </option>

    {positions.map((position) => (
      <option
        key={position.position_id}
        value={String(position.position_id)}
      >
        {position.position_name}
      </option>
    ))}

    <option value="__add_position__">
      + Add New Position
    </option>
  </select>

  {showAddPosition && (
    <div className="mt-2 flex gap-2">
      <input
        type="text"
        value={newPosition}
        onChange={(e) => setNewPosition(e.target.value)}
        placeholder="Enter position name"
        className={inputClass()}
        autoFocus
      />

      <button
        type="button"
        onClick={handleAddPosition}
        disabled={!newPosition.trim() || addingPosition}
        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {addingPosition ? "Adding..." : "Add"}
      </button>

      <button
        type="button"
        onClick={() => {
          setShowAddPosition(false);
          setNewPosition("");
        }}
        className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Cancel
      </button>
    </div>
  )}

  {errors.job_position && (
    <p className="mt-1 text-xs text-red-500">
      Please select a job position.
    </p>
  )}

  {positionsError && (
    <p className="mt-1 text-xs text-red-500">
      Could not load job positions. Please try again.
    </p>
  )}
</div>
        </div>

        {error && <p className="px-6 pb-2 text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}