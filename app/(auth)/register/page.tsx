"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Card, BRAND_GREEN } from "../AuthLayout";
import { registerUser } from "@/services/integration/auth/register";
import { getInstitutions, InstitutionResp } from "../register/api/get-insti-public";

interface RegisterForm {
  staff_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_no: string;
  institution: string; // holds institution_id as string, cast to number on submit
  job_position: string;
}

const initialForm: RegisterForm = {
  staff_id: "",
  email: "",
  first_name: "",
  last_name: "",
  phone_no: "",
  institution: "",
  job_position: "",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  border: "1.5px solid #D1D5DB",
  borderRadius: 8,
  outline: "none",
  boxSizing: "border-box",
  color: "#111827",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  display: "block",
  marginBottom: 6,
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...fieldStyle,
          borderColor: error ? "#EF4444" : "#D1D5DB",
        }}
        onFocus={(e) => (e.target.style.borderColor = BRAND_GREEN)}
        onBlur={(e) =>
          (e.target.style.borderColor = error ? "#EF4444" : "#D1D5DB")
        }
      />
    </div>
  );
}

function InstitutionField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  const [institutions, setInstitutions] = useState<InstitutionResp[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setFetchError(false);
        const data = await getInstitutions();
        if (!cancelled) {
          // only show active institutions in the picker
          setInstitutions(
            data.filter((i: InstitutionResp) => i.status === "active")
          );
        }
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <label style={labelStyle}>Institution</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || fetchError}
        style={{
          ...fieldStyle,
          borderColor: error ? "#EF4444" : "#D1D5DB",
          background: "#fff",
          cursor: loading || fetchError ? "not-allowed" : "pointer",
        }}
        onFocus={(e) => (e.target.style.borderColor = BRAND_GREEN)}
        onBlur={(e) =>
          (e.target.style.borderColor = error ? "#EF4444" : "#D1D5DB")
        }
      >
        <option value="" disabled>
          {loading
            ? "Loading institutions…"
            : fetchError
            ? "Failed to load institutions"
            : "Select institution"}
        </option>
        {institutions.map((inst) => (
          <option key={inst.institution_id} value={String(inst.institution_id)}>
            {inst.institution_name}
          </option>
        ))}
      </select>
      {fetchError && (
        <p style={{ color: "#EF4444", fontSize: 11, marginTop: 4 }}>
          Could not load institutions. Please refresh and try again.
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, boolean>>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (key: keyof RegisterForm) => (v: string) => {
    let value = v;

    if (key === "staff_id") {
      // Keep only numbers
      const digits = value.replace(/\D/g, "");

      // Optional: limit total digits (6 + 6 = 12)
      const limited = digits.slice(0, 12);

      // Insert hyphen after the first 6 digits
      value =
        limited.length > 6
          ? `${limited.slice(0, 6)}-${limited.slice(6)}`
          : limited;
    }

    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: false }));
    setError("");
  };

  const validate = () => {
    const required: (keyof RegisterForm)[] = [
      "staff_id",
      "email",
      "first_name",
      "last_name",
      "phone_no",
      "institution",
      "job_position",
    ];
    const next: Partial<Record<keyof RegisterForm, boolean>> = {};
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
        status: "pending", // backend-controlled default; RoleID always defaults to "User"
      });

      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F3F4F6",
          padding: "24px 16px",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ width: "100%", maxWidth: 900 }}>
          <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                gap: 16,
                padding: "20px 0",
              }}
            >
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>
                Registration Submitted
              </h2>
              <p style={{ color: "#6B7280", fontSize: 14, textAlign: "center", margin: 0 }}>
                Your account for Staff ID{" "}
                <strong style={{ color: BRAND_GREEN }}>{form.staff_id}</strong> has been
                created and is pending approval.
              </p>
              <button
                onClick={() => router.replace("/login")}
                style={{
                  marginTop: 8,
                  padding: "10px 28px",
                  background: BRAND_GREEN,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Back to Login
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F3F4F6",
        padding: "24px 16px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1000 }}>
        <Card maxWidth={1000}>
          <div>
            <Link
              href="/login"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6B7280",
                fontSize: 13,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 4,
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>

            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>
              Register Account
            </h1>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 20px" }}>
              Fill in your details to register as staff.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <Field
                label="First Name"
                value={form.first_name}
                onChange={update("first_name")}
                placeholder="Juan"
                error={errors.first_name}
              />
              <Field
                label="Last Name"
                value={form.last_name}
                onChange={update("last_name")}
                placeholder="Dela Cruz"
                error={errors.last_name}
              />
              <Field
                label="Staff ID Number"
                value={form.staff_id}
                onChange={update("staff_id")}
                placeholder="123456-78901"
                error={errors.staff_id}
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="juan.delacruz@email.com"
                error={errors.email}
              />
              <Field
                label="Phone Number"
                value={form.phone_no}
                onChange={update("phone_no")}
                placeholder="09171234567"
                error={errors.phone_no}
              />
              <InstitutionField
                value={form.institution}
                onChange={update("institution")}
                error={errors.institution}
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <Field
                  label="Job Position"
                  value={form.job_position}
                  onChange={update("job_position")}
                  placeholder="e.g. Registrar Staff"
                  error={errors.job_position}
                />
              </div>
            </div>

            {error && (
              <p style={{ color: "#EF4444", fontSize: 12, marginTop: 12 }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                marginTop: 24,
                width: "100%",
                padding: "12px",
                background: loading ? "#4B9B6F" : BRAND_GREEN,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background 0.2s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) =>
                !loading && ((e.target as HTMLButtonElement).style.background = "#154F32")
              }
              onMouseLeave={(e) =>
                !loading && ((e.target as HTMLButtonElement).style.background = BRAND_GREEN)
              }
            >
              {loading ? "Registering…" : (
                <>
                  Register <ArrowRight size={16} />
                </>
              )}
            </button>

            <p style={{ marginTop: 24, fontSize: 11, color: "#9CA3AF", textAlign: "right" }}>
              © 2026 IDIYANALE · idiyanale.admin@gmail.com
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}