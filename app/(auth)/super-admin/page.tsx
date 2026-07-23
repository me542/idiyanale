"use client";

import { useState } from "react";
import {
  User,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { loginSuperAdmin } from "@/services/integration/auth/login"; // adjust path to wherever you export this

type LoginResponse = {
  token?: string;
};



const BRAND_GREEN = "#1B5E3B";

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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        maxWidth: 1000,
        minHeight: 550,
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ flex: 1 }}>
        <BrandPanel />
      </div>

      <div
        style={{
          flex: 1,
          padding: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = (await loginSuperAdmin(username.trim(), password)) as LoginResponse;
      const token = res?.token;

      if (!token) {
        throw new Error("Login failed. No token received.");
      }

      // Client-side storage for use in fetch/axios headers, etc.
      localStorage.setItem("access_token", token);

      // Middleware / server components read the "token" cookie via
      // next/headers cookies() — not localStorage — so set it here too.
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;

      router.replace("/dashboard"); // adjust to your actual route
    } catch (err: unknown) {
      setError((err as Error)?.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#F3F4F6",
        padding: 24,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Card>
        <div style={{ width: "100%" }}>
          <button
            onClick={() => router.push("/login")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: BRAND_GREEN,
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 24,
              padding: 0,
            }}
          >
            <ArrowLeft size={18} />
            Back to User Login
          </button>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#111827",
              marginBottom: 6,
            }}
          >
            Administrator Access 
          </h1>

          <p
            style={{
              color: "#6B7280",
              fontSize: 14,
              marginBottom: 28,
            }}
          >
            Sign in using your administrator account.
          </p>

<label
  style={{
    display: "block",
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: 600,
    fontSize: 13,
  }}
>
  Username
</label>
<div style={{ position: "relative", marginBottom: 18 }}>
  <User
    size={16}
    style={{
      position: "absolute",
      left: 12,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#4B5563", // darker icon
    }}
  />
  <input
    value={username}
    onChange={(e) => {
      setUsername(e.target.value);
      setError("");
    }}
    placeholder="Enter username"
    style={{
      width: "100%",
      padding: "11px 12px 11px 38px",
      borderRadius: 8,
      border: "1.5px solid #D1D5DB",
      outline: "none",
      fontSize: 14,
      color: "#111827", // darker typed text
    }}
  />
</div>
<label
  style={{
    display: "block",
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: 600,
    fontSize: 13,
  }}
>
  Password
</label>

<div style={{ position: "relative" }}>
  <Lock
    size={16}
    style={{
      position: "absolute",
      left: 12,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#4B5563",
    }}
  />

  <input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => {
      setPassword(e.target.value);
      setError("");
    }}
    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
    placeholder="Enter password"
    style={{
      width: "100%",
      padding: "11px 42px 11px 38px",
      borderRadius: 8,
      border: "1.5px solid #D1D5DB",
      outline: "none",
      fontSize: 14,
      color: "#111827",
    }}
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#6B7280",
      padding: 0,
    }}
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>

          {error && (
            <p
              style={{
                color: "#EF4444",
                marginTop: 10,
                fontSize: 12,
              }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 28,
              padding: "12px",
              border: "none",
              borderRadius: 8,
              background: BRAND_GREEN,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            {loading ? (
              "Signing In..."
            ) : (
              <>
                Login
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <p
            style={{
              marginTop: 24,
              fontSize: 11,
              color: "#9CA3AF",
              textAlign: "right",
            }}
          >
            © 2026 IDIYANALE · Super Admin Portal
          </p>
        </div>
      </Card>
    </div>
  );
}