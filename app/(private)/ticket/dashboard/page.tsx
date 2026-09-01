"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TicketDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/Dashboard");
  }, [router]);

  return null;
}
