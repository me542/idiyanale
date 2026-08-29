"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";
import { verifyJWT } from "@/lib/auth/verify-jwt";
import { StatusCounts } from "./types";
import {
  StatusBucket,
  ReviewStage,
  STAGE_LABELS,
  getStatusBucket,
} from "./status_ticket";

const DEFAULT: StatusCounts = {
  total: 0,
  myTicket: 0,
  forReview: 0,
  inProgress: 0,
  resolved: 0,
  closed: 0,
  cancel: 0,
};

function getStatusCounts(
  tickets: InstitutionTicket[],
  currentUserId: number | null
): StatusCounts {
  const counts: StatusCounts = { ...DEFAULT, total: tickets.length };

  for (const ticket of tickets) {
    const bucket = getStatusBucket(ticket.status);
    if (bucket) counts[bucket] += 1;

    if (currentUserId !== null && ticket.submitter?.id === currentUserId) {
      counts.myTicket += 1;
    }
  }

  return counts;
}

const TICKETS_PAGE_PATH = "/ticket/all-tickets";

const REVIEW_STAGES: ReviewStage[] = ["endorser", "approver", "assignment"];

export default function StatusTickets() {
  const router = useRouter();
  const [data, setData] = useState<StatusCounts>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [stageMenuOpen, setStageMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancel = false;

    async function loadTickets() {
      try {
        const storedInstitutionId = localStorage.getItem("institution_id");
        if (!storedInstitutionId) throw new Error("Institution ID not found.");

        const institutionId = Number(storedInstitutionId);
        if (!Number.isInteger(institutionId) || institutionId <= 0) {
          throw new Error("Invalid institution ID.");
        }

        // Resolve the current user's id from their JWT so we can compute
        // the "My Ticket" count (tickets they submitted).
        const token =
          localStorage.getItem("token");
        const payload = token ? await verifyJWT(token) : null;
        const currentUserId = payload?.id ?? null;

        const tickets = await getAllTicketsByInstitution(institutionId);
        if (cancel) return;

        setData(getStatusCounts(tickets, currentUserId));
      } catch (err) {
        if (!cancel) {
          console.error("Failed to load institution tickets:", err);
          setData(DEFAULT);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    loadTickets();
    return () => {
      cancel = true;
    };
  }, []);

  // Close the "For Review" stage menu on outside click.
  useEffect(() => {
    if (!stageMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setStageMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [stageMenuOpen]);

  function goToBucket(bucket: StatusBucket) {
    router.push(`${TICKETS_PAGE_PATH}?status=${bucket}`);
  }

  function goToStage(stage: ReviewStage) {
    setStageMenuOpen(false);
    router.push(`${TICKETS_PAGE_PATH}?status=forReview&stage=${stage}`);
  }

  function goToMine() {
    router.push(`${TICKETS_PAGE_PATH}?mine=true`);
  }

  const items: {
    label: string;
    value: number;
    color: string;
    bucket: StatusBucket | null; // null = "Total", no filter
    mine?: boolean; // true = "My Ticket", filters by current user's submitted tickets
  }[] = [
    { label: "Total Ticket", value: data.total, color: "#4E86F0", bucket: null },
    { label: "My Ticket", value: data.myTicket, color: "#F97316", bucket: null, mine: true },
    { label: "For Review", value: data.forReview, color: "#F0B429", bucket: "forReview" },
    { label: "In Progress", value: data.inProgress, color: "#8B6BF0", bucket: "inProgress" },
    { label: "Resolved", value: data.resolved, color: "#2FBF87", bucket: "resolved" },
    { label: "Closed", value: data.closed, color: "#8C97A0", bucket: "closed" },
    { label: "cancel", value: data.cancel, color: "#E85C5C", bucket: "cancel" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-7 gap-4 mb-6">
      {items.map((item) => {
        const isForReview = item.bucket === "forReview";

        return (
          <div key={item.label} className="relative">
            <button
              type="button"
              onClick={() => {
                if (item.mine) {
                  goToMine();
                } else if (item.bucket === null) {
                  router.push(TICKETS_PAGE_PATH);
                } else if (isForReview) {
                  setStageMenuOpen((open) => !open);
                } else {
                  goToBucket(item.bucket);
                }
              }}
              className="w-full text-left bg-white rounded-xl shadow-md border border-slate-200 px-5 pt-[14px] pb-[22px] hover:shadow-lg hover:border-slate-300 transition-shadow cursor-pointer"
              style={{ borderTop: `4px solid ${item.color}` }}
            >
              <div className="text-[12px] font-bold uppercase tracking-wide text-slate-700">
                {item.label}
              </div>
              <div className="mt-2 text-[34px] font-extrabold text-slate-900">
                {loading ? "…" : item.value}
              </div>
            </button>

            {isForReview && stageMenuOpen && (
              <div
                ref={menuRef}
                className="absolute z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg"
              >
                {REVIEW_STAGES.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => goToStage(stage)}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {STAGE_LABELS[stage]}
                  </button>
                ))}
                <button
                  onClick={() => goToBucket("forReview")}
                  className="mt-0.5 block w-full rounded-md border-t border-gray-100 px-2.5 py-1.5 text-left text-xs font-medium text-gray-500 hover:bg-gray-100"
                >
                  All For Review
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}