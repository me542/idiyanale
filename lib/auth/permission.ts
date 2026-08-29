"use client";
import { useEffect, useState } from "react";
import { verifyJWT, JwtPayload } from "./verify-jwt"; // adjust to actual path

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

interface UseAuthResult {
  user: JwtPayload | null;
  institutionId: number | null;
  loading: boolean;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;

    (async () => {
      const token = getTokenFromCookie();
      if (!token) {
        if (!cancel) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const payload = await verifyJWT(token);
      if (!cancel) {
        setUser(payload);
        setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);

  return {
    user,
    institutionId: user?.institution_id ?? null,
    loading,
  };
}