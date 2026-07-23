"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.replace("/login");
      return;
    }

    switch (role) {
      case "super-admin":
        router.replace("/dashboard");
        break;

      case "staff":
        router.replace("/ticket/dashboard");
        break;

      default:
        // Unknown role or corrupted storage
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        router.replace("/login");
    }
  }, [router]);

  return null;
}