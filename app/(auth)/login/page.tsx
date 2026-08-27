"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { loginOTP } from "@/services/integration/auth/login";
import { verifyOTP } from "@/services/integration/auth/VerifyOtp";
import {
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
type Page = "login" | "verification";
type PendingOtp = {
  staffId: string;
  expiresAt: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const BRAND_GREEN = "#1B5E3B";
const CODE_LENGTH = 6;
const COUNTDOWN_SECONDS = 300; // 5:00
const PENDING_OTP_STORAGE_KEY = "pendingOtp";

function getPendingOtp(): PendingOtp | null {
  if (typeof window === "undefined") return null;

  try {
    const pendingOtp = JSON.parse(
      sessionStorage.getItem(PENDING_OTP_STORAGE_KEY) ?? "null"
    ) as PendingOtp | null;

    if (!pendingOtp || pendingOtp.expiresAt <= Date.now()) {
      sessionStorage.removeItem(PENDING_OTP_STORAGE_KEY);
      return null;
    }

    return pendingOtp;
  } catch {
    sessionStorage.removeItem(PENDING_OTP_STORAGE_KEY);
    return null;
  }
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 20 }}>
      {[1, 2].map((n) => {
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: active || done ? BRAND_GREEN : "#E5E7EB",
              color: active || done ? "#fff" : "#9CA3AF",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
              border: `2px solid ${active || done ? BRAND_GREEN : "#D1D5DB"}`,
              transition: "all 0.3s"
            }}>
              {done ? "✓" : n}
            </div>
            {n === 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, color: active ? BRAND_GREEN : "#6B7280", fontWeight: active ? 600 : 400 }}>
                  Staff ID
                </span>
                <div style={{ width: 24, height: 1, background: "#D1D5DB" }} />
              </div>
            )}
            {n === 2 && (
              <span style={{ fontSize: 10, color: active ? BRAND_GREEN : "#6B7280", fontWeight: active ? 600 : 400 }}>
                Verification
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Brand Panel (left side) ──────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: BRAND_GREEN,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <Image
        src="/images/idiyanale.png"
        alt="Idiyanale"
        width={180}
        height={180}
        loading="eager"
      />

      <p
        style={{
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: "0.2em",
          marginTop: 24,
          background:
            "linear-gradient(180deg, #E5CA7F 0%, #896C38 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        IDIYANALE
      </p>
    </div>
  );
}

// ─── Card Shell ───────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        maxWidth: 1000,
        minHeight: 500,
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
        }}
      >
        <BrandPanel />
      </div>

      <div
        style={{
          flex: 1,
          padding: "48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({
  onContinue,
  pendingOtp,
}: {
  onContinue: (staffId: string, isNewOtp: boolean) => void;
  pendingOtp: PendingOtp | null;
}) {
  const [staffId, setStaffId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
  if (!staffId.trim()) {
    setError("Please enter your Staff ID number.");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const normalizedStaffId = staffId.trim();
    const hasPendingOtp =
      pendingOtp?.staffId === normalizedStaffId &&
      pendingOtp.expiresAt > Date.now();

    // The server keeps an OTP challenge active until it expires. Re-open that
    // challenge after Back instead of creating a second login attempt.
    if (hasPendingOtp) {
      onContinue(normalizedStaffId, false);
      return;
    }

    await loginOTP(normalizedStaffId);
    onContinue(normalizedStaffId, true);
  } catch (err: unknown) {
    setError((err as Error).message || "Failed to send OTP");
  } finally {
    setLoading(false);
  }
};

  return (
    <Card>
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>
          Welcome
        </h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 24px" }}>
          Enter your Staff ID to receive a verification code.
        </p>

        <StepIndicator current={1} />

        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
          Staff ID Number
        </label>
        <div style={{ position: "relative" }}>
          <div
            style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9CA3AF",
                display: "flex",
                alignItems: "center",
            }}
            >
            <User size={16} />
            </div>
          <input
            type="text"
            placeholder="e.g. 202401-12345"
            value={staffId}
            onChange={(e) => {
                let value = e.target.value.replace(/\D/g, ""); // numbers only

                // Auto add "-" after 6 digits
                if (value.length > 6) {
                value = `${value.slice(0, 6)}-${value.slice(6, 11)}`;
                }

                setStaffId(value);
                setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            maxLength={12} // 6 digits + "-" + 5 digits
            style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                fontSize: 14,
                border: `1.5px solid ${error ? "#EF4444" : "#D1D5DB"}`,
                borderRadius: 8,
                outline: "none",
                boxSizing: "border-box",
                color: "#111827",
                transition: "border-color 0.2s",
                fontFamily: "inherit"
            }}
            onFocus={(e) => (e.target.style.borderColor = BRAND_GREEN)}
            onBlur={(e) =>
                (e.target.style.borderColor = error ? "#EF4444" : "#D1D5DB")
            }
            />
        </div>
        {error && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            marginTop: 24, width: "100%", padding: "12px",
            background: loading ? "#4B9B6F" : BRAND_GREEN,
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.2s", fontFamily: "inherit"
          }}
          onMouseEnter={(e) => !loading && ((e.target as HTMLButtonElement).style.background = "#154F32")}
          onMouseLeave={(e) => !loading && ((e.target as HTMLButtonElement).style.background = BRAND_GREEN)}
        >
          <>
            {loading ? (
                "Sending…"
            ) : (
                <>
                Continue <ArrowRight size={16} />
                </>
            )}
            </>
        </button>
      </div>
      <p style={{ marginTop: 24, fontSize: 11, color: "#9CA3AF", textAlign: "right" }}>
          © 2026 IDIYANALE · idiyanale.admin@gmail.com
        </p>
    </Card>
  );
}

// ─── Verification Page ────────────────────────────────────────────────────────
function VerificationPage({
  staffId,
  onBack,
  onVerified,
}: {
  staffId: string;
  onBack: () => void;
  onVerified: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (timeLeft <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  useEffect(() => {
  const fullCode = code.join("");

  if (fullCode.length === CODE_LENGTH && !loading) {
    handleConfirm();
  }
}, [code]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  const handleDigit = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    setError("");
    if (digit && idx < CODE_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (pasted.length) {
      const next = [...pasted.split(""), ...Array(CODE_LENGTH).fill("")].slice(0, CODE_LENGTH);
      setCode(next);
      inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
    }
  };

  const handleResend = () => {
    setTimeLeft(COUNTDOWN_SECONDS);
    setCanResend(false);
    setCode(Array(CODE_LENGTH).fill(""));
    setError("");
    inputRefs.current[0]?.focus();
  };

  const handleConfirm = async () => {
    const full = code.join("");

    if (full.length < CODE_LENGTH) {
      setError("Enter all 6 digits.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // verifyOTP now returns { token, message, retCode } directly —
      // it already throws internally if the token is missing, so if we
      // get here, res.token is guaranteed to exist.
      const res = await verifyOTP(staffId, full);
      const token = res.token;

      // Client-side storage for use in fetch/axios headers, etc.
      localStorage.setItem("access_token", token);

      // RootPage (app/page.tsx) and middleware.ts read a "token" cookie
      // via next/headers' cookies() / request.cookies — NOT localStorage —
      // so we must also set an actual cookie here.
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;

      onVerified();
      setSuccess(true);
      router.replace("/Dashboard");
    } catch (err: unknown) {
      setError((err as Error)?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };
  // if (success) {
  //   return (
  //     <Card>
  //       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 16, padding: "20px 0" }}>
  //         <div
  //           style={{
  //               width: 60,
  //               height: 60,
  //               borderRadius: "50%",
  //               background: "#D1FAE5",
  //               display: "flex",
  //               alignItems: "center",
  //               justifyContent: "center",
  //               color: BRAND_GREEN,
  //           }}
  //           >
  //           <CheckCircle2 size={32} />
  //           </div>
  //         <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Verified!</h2>
  //         <p style={{ color: "#6B7280", fontSize: 14, textAlign: "center", margin: 0 }}>
  //           Staff ID <strong style={{ color: BRAND_GREEN }}>{staffId}</strong> has been successfully verified.
  //         </p>
  //         <button onClick={onBack} style={{
  //           marginTop: 8, padding: "10px 28px", background: BRAND_GREEN,
  //           color: "#fff", border: "none", borderRadius: 8, fontSize: 14,
  //           fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
  //         }}>
  //           Back to Login
  //         </button>
  //       </div>
  //     </Card>
  //   );
  // }

  return (
    <Card>
      <div>
        <button
          onClick={onBack}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#6B7280", fontSize: 13, padding: 0, marginBottom: 12,
            display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit"
          }}
            >
          <>
              <ArrowLeft size={16} />
                Back
                </>
        </button>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>
          Verification Portal
        </h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 20px" }}>
          A 6-digit code was sent to your registered contact for Staff ID{" "}
          <span style={{ color: BRAND_GREEN, fontWeight: 600 }}>{staffId}</span>.
        </p>

        <StepIndicator current={2} />

        <p style={{ fontSize: 12, color: "#6B7280", textAlign: "center", margin: "0 0 12px" }}>
          Code expires in{" "}
          <span style={{ fontWeight: 700, color: timeLeft <= 30 ? "#EF4444" : BRAND_GREEN }}>
            {minutes}:{seconds}
          </span>
        </p>

        <div
          style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 8 }}
          onPaste={handlePaste}
        >
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: 44, height: 52, textAlign: "center",
                fontSize: 20, fontWeight: 700,
                border: `2px solid ${digit ? BRAND_GREEN : error ? "#EF4444" : "#D1D5DB"}`,
                borderRadius: 8, outline: "none",
                color: "#111827", background: digit ? "#F0FDF4" : "#fff",
                transition: "all 0.15s", fontFamily: "inherit"
              }}
              onFocus={(e) => e.target.style.borderColor = BRAND_GREEN}
              onBlur={(e) => e.target.style.borderColor = code[i] ? BRAND_GREEN : error ? "#EF4444" : "#D1D5DB"}
            />
          ))}
        </div>

        {error && <p style={{ color: "#EF4444", fontSize: 12, textAlign: "center", margin: "4px 0" }}>{error}</p>}

        <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", margin: "8px 0 20px" }}>
          {canResend ? (
            <button onClick={handleResend} style={{
              background: "none", border: "none", color: BRAND_GREEN,
              cursor: "pointer", fontWeight: 700, fontSize: 12, padding: 0, fontFamily: "inherit"
            }}>
              Click to Resend
            </button>
          ) : (
            <span style={{ color: "#D1D5DB" }}>Click to Resend</span>
          )}
        </p>

        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{
            width: "100%", padding: "12px",
            background: loading ? "#4B9B6F" : BRAND_GREEN,
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.2s", fontFamily: "inherit"
          }}
          onMouseEnter={(e) => !loading && ((e.target as HTMLButtonElement).style.background = "#154F32")}
          onMouseLeave={(e) => !loading && ((e.target as HTMLButtonElement).style.background = BRAND_GREEN)}
        >
          <>
  {loading ? (
    "Verifying…"
  ) : (
    <>
      Confirmation Code <ArrowRight size={16} />
    </>
  )}
</>
        </button>

        <p style={{ marginTop: 20, fontSize: 11, color: "#9CA3AF", textAlign: "right" }}>
          © 2026 IDIYANALE · idiyanale.admin@gmail.com
        </p>
      </div>
    </Card>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [page, setPage] = useState<Page>("login");
  const [staffId, setStaffId] = useState("");
  const [pendingOtp, setPendingOtp] = useState<PendingOtp | null>(getPendingOtp);

  const clearPendingOtp = () => {
    setPendingOtp(null);
    sessionStorage.removeItem(PENDING_OTP_STORAGE_KEY);
  };

  const continueToVerification = (id: string, isNewOtp: boolean) => {
    if (isNewOtp) {
      const nextPendingOtp = {
        staffId: id,
        expiresAt: Date.now() + COUNTDOWN_SECONDS * 1000,
      };
      setPendingOtp(nextPendingOtp);
      sessionStorage.setItem(
        PENDING_OTP_STORAGE_KEY,
        JSON.stringify(nextPendingOtp)
      );
    }

    setStaffId(id);
    setPage("verification");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F3F4F6", padding: "24px 16px", fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 900 }}>
        {page === "login" ? (
          <LoginPage
            onContinue={continueToVerification}
            pendingOtp={pendingOtp}
          />
        ) : (
          <VerificationPage
            staffId={staffId}
            onBack={() => setPage("login")}
            onVerified={clearPendingOtp}
          />
        )}
      </div>
    </div>
  );
}
