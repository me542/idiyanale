"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
  usePathname,
} from "next/navigation";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  X,
  Download,
  Loader2,
} from "lucide-react";

import {
  getAllTicketsByInstitution,
  InstitutionTicket,
} from "@/services/integration/ticket/get_all_ticket_by_insti";

import { verifyJWT } from "@/lib/auth/verify-jwt";

import { processTicket } from "@/services/integration/ticket/post_ticket_process";

import TicketDetailPanel from "@/shared/layout/ticket_progress";

import { lightTheme } from "@/shared/theme/theme_provider";

import {
  StatusBucket,
  ReviewStage,
  BUCKET_LABELS,
  STAGE_LABELS,
  getStatusBucket,
  getReviewStage,
  normalizeStatus,
} from "../../Dashboard/components/status_ticket";

// ---------------------------------------------------------
// Row shape rendered by the table
// ---------------------------------------------------------

type TicketRow = {
  TicketID: string;
  ProjectID: number;
  Institution: string;
  InstitutionPool: number;
  TicketType: string;
  Category: string;
  SubCategory: string;

  Subject: string;
  Description: string;
  DueDate: string | null;

  Submitter: string;
  SubmitterId: number | null;
  Endorser: string;
  Approver: string;
  Resolver: string;

  Status: string;

  CreatedAt: string;
  UpdatedAt: string;

  EndorsedAt: string | null;
  ApprovedAt: string | null;

  StartedAt: string | null;
  ResolvedAt: string | null;
  ResolutionTime: string;

  OnHold: boolean;
  HoldAt: string | null;

  cancelBy: string;
  cancelAt: string | null;

  ClosedBy: string;
  ClosedAt: string | null;
};

type ColumnType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "status";

type ColumnDef = {
  key: keyof TicketRow;
  label: string;
  type: ColumnType;
};

// ---------------------------------------------------------
// Columns
// ---------------------------------------------------------

const columns: ColumnDef[] = [
  { key: "TicketID", label: "Ticket ID", type: "text" },
  { key: "Status", label: "Status", type: "status" },
  { key: "ProjectID", label: "Project", type: "number" },

  // { key: "Institution", label: "Institution", type: "text" },
  // { key: "InstitutionPool", label: "Institution Pool", type: "number" },

  { key: "TicketType", label: "Ticket Type", type: "text" },
  { key: "Category", label: "Category", type: "text" },
  { key: "SubCategory", label: "Subcategory", type: "text" },

  { key: "Subject", label: "Subject", type: "text" },
  { key: "Description", label: "Description", type: "text" },
  { key: "DueDate", label: "Date Needed", type: "date" },

  { key: "Submitter", label: "Submitter", type: "text" },
  { key: "Endorser", label: "Endorser", type: "text" },
  { key: "Approver", label: "Approver", type: "text" },
  { key: "Resolver", label: "Resolver", type: "text" },

  { key: "CreatedAt", label: "Created At", type: "date" },
  { key: "UpdatedAt", label: "Updated At", type: "date" },

  { key: "EndorsedAt", label: "Endorsed At", type: "date" },
  { key: "ApprovedAt", label: "Approved At", type: "date" },

  { key: "StartedAt", label: "Started At", type: "date" },
  { key: "ResolvedAt", label: "Resolved At", type: "date" },
  { key: "ResolutionTime", label: "Resolution Time", type: "text" },

  { key: "OnHold", label: "On Hold", type: "boolean" },
  { key: "HoldAt", label: "Hold At", type: "date" },

  { key: "cancelBy", label: "cancel By", type: "text" },
  { key: "cancelAt", label: "cancel At", type: "date" },

  { key: "ClosedBy", label: "Closed By", type: "text" },
  { key: "ClosedAt", label: "Closed At", type: "date" },
];

// ---------------------------------------------------------
// Sorting
// ---------------------------------------------------------

type SortDirection = "asc" | "desc" | null;

type SortState = {
  key: keyof TicketRow | null;
  direction: SortDirection;
};

// ---------------------------------------------------------
// Filters
// ---------------------------------------------------------

type TextFilter = {
  kind: "text";
  value: string;
};

type NumberFilter = {
  kind: "number";
  value: string;
};

type BooleanFilter = {
  kind: "boolean";
  value: "all" | "yes" | "no";
};

type StatusFilter = {
  kind: "status";
  value: string;
};

type DateFilter = {
  kind: "date";
  from: string;
  to: string;
};

type FilterValue =
  | TextFilter
  | NumberFilter
  | BooleanFilter
  | StatusFilter
  | DateFilter;

type FiltersState = Partial<
  Record<keyof TicketRow, FilterValue>
>;

// ---------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------

function emptyFilterFor(type: ColumnType): FilterValue {
  switch (type) {
    case "text":
      return {
        kind: "text",
        value: "",
      };

    case "number":
      return {
        kind: "number",
        value: "",
      };

    case "boolean":
      return {
        kind: "boolean",
        value: "all",
      };

    case "status":
      return {
        kind: "status",
        value: "",
      };

    case "date":
      return {
        kind: "date",
        from: "",
        to: "",
      };
  }
}

function isFilterActive(f: FilterValue) {
  if (
    f.kind === "text" ||
    f.kind === "number" ||
    f.kind === "status"
  ) {
    return f.value !== "";
  }

  if (f.kind === "boolean") {
    return f.value !== "all";
  }

  if (f.kind === "date") {
    return f.from !== "" || f.to !== "";
  }

  return false;
}

// ---------------------------------------------------------
// Formatting
// ---------------------------------------------------------

function formatValue(
  value: TicketRow[keyof TicketRow]
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function toDateOnly(value: string) {
  return value.length >= 10
    ? value.slice(0, 10)
    : value;
}

// ---------------------------------------------------------
// Status badge styling (matches Recent Ticket UI)
// ---------------------------------------------------------

function getStatusStyle(status?: string | null) {
  const value = (status ?? "").toLowerCase().trim();

  switch (value) {
    case "for review":
    case "for endorsement":
    case "endorsed":
    case "for approval":
    case "approved":
    case "for assignment":
    case "forresolution":
    case "forendorsement":
    case "forapproval":
    case "forassignment":
    case "forreview":
      return {
        backgroundColor: lightTheme.for_review,
        color: "#fff",
      };

    case "in progress":
    case "inProgress":
      return {
        backgroundColor: lightTheme.in_progress,
        color: "#fff",
      };

    case "resolved":
      return {
        backgroundColor: lightTheme.resolved,
        color: "#fff",
      };

    case "closed":
      return {
        backgroundColor: lightTheme.closed,
        color: "#fff",
      };

    case "cancel":
    case "canceled":
      return {
        backgroundColor: lightTheme.cancel,
        color: "#fff",
      };

    default:
      return {
        backgroundColor: lightTheme.secondary,
        color: "#fff",
      };
  }
}

// ---------------------------------------------------------
// Date presets
// ---------------------------------------------------------

function datePreset(
  preset: string
): {
  from: string;
  to: string;
} {
  const today = new Date();

  const fmt = (d: Date) =>
    d.toISOString().slice(0, 10);

  switch (preset) {
    case "today": {
      const d = fmt(today);

      return {
        from: d,
        to: d,
      };
    }

    case "last7": {
      const from = new Date(today);

      from.setDate(
        from.getDate() - 6
      );

      return {
        from: fmt(from),
        to: fmt(today),
      };
    }

    case "last30": {
      const from = new Date(today);

      from.setDate(
        from.getDate() - 29
      );

      return {
        from: fmt(from),
        to: fmt(today),
      };
    }

    case "thisMonth": {
      const from = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      return {
        from: fmt(from),
        to: fmt(today),
      };
    }

    case "lastMonth": {
      const from = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );

      const to = new Date(
        today.getFullYear(),
        today.getMonth(),
        0
      );

      return {
        from: fmt(from),
        to: fmt(to),
      };
    }

    default:
      return {
        from: "",
        to: "",
      };
  }
}

const DATE_PRESETS: {
  key: string;
  label: string;
}[] = [
  {
    key: "today",
    label: "Today",
  },
  {
    key: "last7",
    label: "Last 7 days",
  },
  {
    key: "last30",
    label: "Last 30 days",
  },
  {
    key: "thisMonth",
    label: "This month",
  },
  {
    key: "lastMonth",
    label: "Last month",
  },
];

// ---------------------------------------------------------
// API → table row
// ---------------------------------------------------------

function fullName(
  user:
    | InstitutionTicket["submitter"]
    | null
    | undefined
) {
  if (!user) return "";

  const name =
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

  return name || user.email || "";
}

function mapToRow(
  t: InstitutionTicket
): TicketRow {
  return {
    TicketID: t.ticket_id,
    ProjectID: t.project_id,

    Institution:
      t.institution?.institution_name ?? "",

    InstitutionPool: t.institution_pool,

    TicketType:
      t.ticket_type?.ticket_type_name ?? "",

    Category:
      t.category?.category_name ?? "",

    SubCategory:
      t.subcategory?.sub_category_name ?? "",

    Subject: t.subject,
    Description: t.description,
    DueDate: t.due_date,

    Submitter: fullName(t.submitter),
    SubmitterId: t.submitter?.id ?? null,

    Endorser: fullName(t.endorser),
    Approver: fullName(t.approver),
    Resolver: fullName(t.resolver),

    Status: t.status,

    CreatedAt: t.created_at,
    UpdatedAt: t.updated_at,

    EndorsedAt: t.endorsed_at,
    ApprovedAt: t.approved_at,

    StartedAt: t.started_at,
    ResolvedAt: t.resolved_at,
    ResolutionTime: t.resolution_time,

    OnHold: t.onhold,
    HoldAt: t.hold_at,

    cancelBy: fullName(t.canceller),
    cancelAt: t.cancelled_at,

    ClosedBy: fullName(t.closer),
    ClosedAt: t.closed_at,
  };
}

// ---------------------------------------------------------
// Group filter
// ---------------------------------------------------------

type GroupFilter = {
  bucket: StatusBucket | null;
  stage: ReviewStage | null;
};

const BUCKET_KEYS =
  Object.keys(BUCKET_LABELS) as StatusBucket[];

const STAGE_KEYS =
  Object.keys(STAGE_LABELS) as ReviewStage[];

// ---------------------------------------------------------
// Main table
// ---------------------------------------------------------

function TicketsTableInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tickets, setTickets] =
    useState<TicketRow[]>([]);

  const [rawTickets, setRawTickets] =
    useState<InstitutionTicket[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [institutionId, setInstitutionId] =
    useState<number | null>(null);

  const [currentUserId, setCurrentUserId] =
    useState<number | null>(null);

  // Detail panel
  const [selectedTicket, setSelectedTicket] =
    useState<InstitutionTicket | null>(null);

  const [isPanelOpen, setIsPanelOpen] =
    useState(false);

  // Sorting
  const [sort, setSort] =
    useState<SortState>({
      key: null,
      direction: null,
    });

  // Filters
  const [filters, setFilters] =
    useState<FiltersState>({});

  const [openFilter, setOpenFilter] =
    useState<keyof TicketRow | null>(null);

  const [filterAnchorRect, setFilterAnchorRect] =
    useState<DOMRect | null>(null);

  // Download
  const [confirmDownloadOpen, setConfirmDownloadOpen] =
    useState(false);

  const [isDownloading, setIsDownloading] =
    useState(false);

  // Dashboard group filter
  const [groupFilter, setGroupFilter] =
    useState<GroupFilter>({
      bucket: null,
      stage: null,
    });

  // My Ticket
  const [mineOnly, setMineOnly] =
    useState(false);

  // -------------------------------------------------------
  // URL filters
  // -------------------------------------------------------

  useEffect(() => {
    const statusParam =
      searchParams.get("status") as
        | StatusBucket
        | null;

    const stageParam =
      searchParams.get("stage") as
        | ReviewStage
        | null;

    const bucket =
      statusParam &&
      BUCKET_KEYS.includes(statusParam)
        ? statusParam
        : null;

    const stage =
      bucket === "forReview" &&
      stageParam &&
      STAGE_KEYS.includes(stageParam)
        ? stageParam
        : null;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroupFilter({
      bucket,
      stage,
    });

    setMineOnly(
      searchParams.get("mine") === "true"
    );
  }, [searchParams]);

  function clearGroupFilter() {
    setGroupFilter({
      bucket: null,
      stage: null,
    });

    router.replace(pathname);
  }

  function clearMineFilter() {
    setMineOnly(false);

    router.replace(pathname);
  }

  // -------------------------------------------------------
  // Resolve current user from JWT
  // -------------------------------------------------------

  useEffect(() => {
    let cancel = false;

    async function resolveInstitution() {
      const token =
        localStorage.getItem("token");

      if (!token) {
        if (!cancel) {
          setError(
            "You're not logged in. Please log in again."
          );

          setLoading(false);
        }

        return;
      }

      const payload =
        await verifyJWT(token);

      if (cancel) return;

      if (
        !payload ||
        payload.institution_id === undefined
      ) {
        setError(
          "Could not determine your institution from your session."
        );

        setLoading(false);

        return;
      }

      setInstitutionId(
        payload.institution_id
      );

      setCurrentUserId(
        payload.id ?? null
      );
    }

    resolveInstitution();

    return () => {
      cancel = true;
    };
  }, []);

  // -------------------------------------------------------
  // Fetch tickets
  // -------------------------------------------------------

  useEffect(() => {
    if (!institutionId) return;

    let cancel = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data =
          await getAllTicketsByInstitution(
            institutionId as string | number
          );

        if (!cancel) {
          setRawTickets(data);
          setTickets(
            data.map(mapToRow)
          );
        }
      } catch (err) {
        console.error(
          "Failed to load tickets:",
          err
        );

        if (!cancel) {
          setError(
            "Failed to load tickets. Please try again."
          );
        }
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancel = true;
    };
  }, [institutionId]);

  // -------------------------------------------------------
  // Close filter on scroll / resize
  // -------------------------------------------------------

  useEffect(() => {
    if (!openFilter) return;

    const close = () => {
      setOpenFilter(null);
      setFilterAnchorRect(null);
    };

    window.addEventListener(
      "scroll",
      close,
      true
    );

    window.addEventListener(
      "resize",
      close
    );

    return () => {
      window.removeEventListener(
        "scroll",
        close,
        true
      );

      window.removeEventListener(
        "resize",
        close
      );
    };
  }, [openFilter]);

  // -------------------------------------------------------
  // Status options
  // -------------------------------------------------------

  const statusOptions = useMemo(() => {
    const set = new Set<string>();

    tickets.forEach((ticket) => {
      if (ticket.Status) {
        set.add(ticket.Status);
      }
    });

    return Array.from(set).sort();
  }, [tickets]);

  // -------------------------------------------------------
  // Filter helpers
  // -------------------------------------------------------

  function getFilter(
    key: keyof TicketRow,
    type: ColumnType
  ): FilterValue {
    return (
      filters[key] ??
      emptyFilterFor(type)
    );
  }

  function updateFilter(
    key: keyof TicketRow,
    value: FilterValue
  ) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function clearFilter(
    key: keyof TicketRow,
    type: ColumnType
  ) {
    setFilters((prev) => ({
      ...prev,
      [key]: emptyFilterFor(type),
    }));
  }

  function clearAllFilters() {
    setFilters({});
  }

  // -------------------------------------------------------
  // Reload tickets
  // -------------------------------------------------------

  const reloadTickets =
    useCallback(async () => {
      if (!institutionId) return;

      try {
        const data =
          await getAllTicketsByInstitution(
            institutionId
          );

        setRawTickets(data);
        setTickets(
          data.map(mapToRow)
        );

        setSelectedTicket((prev) =>
          prev
            ? data.find(
                (t) =>
                  t.ticket_id ===
                  prev.ticket_id
              ) ?? prev
            : null
        );
      } catch {
        // User can manually refresh.
      }
    }, [institutionId]);

  // -------------------------------------------------------
  // Action feedback
  // -------------------------------------------------------

  const [actionFeedback, setActionFeedback] =
    useState<{
      ok: boolean;
      message: string;
    } | null>(null);

  function showFeedback(
    ok: boolean,
    message: string
  ) {
    setActionFeedback({
      ok,
      message,
    });

    setTimeout(
      () => setActionFeedback(null),
      3500
    );
  }

  // -------------------------------------------------------
  // Panel action
  // -------------------------------------------------------

  const handlePanelAction =
    useCallback(
      async (
        stepId: string,
        action:
          | "endorse"
          | "approve"
          | "grab"
          | "ungrab"
          | "resolve"
          | "cancel"
      ) => {
        if (!selectedTicket) return;

        try {
          const res =
            await processTicket(
              selectedTicket.ticket_id,
              { action }
            );

          await reloadTickets();

          showFeedback(
            true,
            res.message ??
              "Action completed successfully."
          );
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : "Something went wrong.";

          showFeedback(
            false,
            msg
          );

          console.error(
            "Failed to process ticket:",
            err
          );
        }
      },
      [
        selectedTicket,
        reloadTickets,
      ]
    );

  // -------------------------------------------------------
  // Resolver phase
  // -------------------------------------------------------

  function resolverPhaseOf(
    ticket: InstitutionTicket | null
  ): string {
    if (!ticket) {
      return "for_review";
    }

    const status =
      normalizeStatus(ticket.status);

    if (
      status === "onhold" ||
      status === "hold"
    ) {
      return "on_hold";
    }

    if (
      status === "resolved" ||
      status === "closed"
    ) {
      return "resolved";
    }

    if (
      status === "inProgress"
    ) {
      return "in_progress";
    }

    return "for_review";
  }

  // -------------------------------------------------------
  // Accept
  // -------------------------------------------------------

  const handleAcceptStep =
    useCallback(
      (stepId: string) => {
        if (stepId === "endorsed") {
          return handlePanelAction(
            stepId,
            "endorse"
          );
        }

        if (stepId === "approved") {
          return handlePanelAction(
            stepId,
            "approve"
          );
        }

        if (stepId === "resolved") {
          const phase =
            resolverPhaseOf(
              selectedTicket
            );

          if (
            phase === "for_review"
          ) {
            return handlePanelAction(
              stepId,
              "grab"
            );
          }

          if (
            phase === "in_progress"
          ) {
            return handlePanelAction(
              stepId,
              "resolve"
            );
          }
        }
      },
      [
        handlePanelAction,
        selectedTicket,
      ]
    );

  // -------------------------------------------------------
  // Reject
  // -------------------------------------------------------

  const handleRejectStep =
    useCallback(
      (stepId: string) => {
        if (
          stepId === "endorsed" ||
          stepId === "approved"
        ) {
          return handlePanelAction(
            stepId,
            "cancel"
          );
        }

        if (
          stepId === "resolved"
        ) {
          return handlePanelAction(
            stepId,
            "ungrab"
          );
        }
      },
      [handlePanelAction]
    );

  // -------------------------------------------------------
  // Hold
  // -------------------------------------------------------

  const handleHoldStep =
    useCallback(
      (stepId: string) => {
        if (
          stepId === "resolved"
        ) {
          return handlePanelAction(
            stepId,
            "ungrab"
          );
        }
      },
      [handlePanelAction]
    );

  // -------------------------------------------------------
  // Resume
  // -------------------------------------------------------

  const handleResumeStep =
    useCallback(
      (stepId: string) => {
        if (
          stepId === "resolved"
        ) {
          return handlePanelAction(
            stepId,
            "grab"
          );
        }
      },
      [handlePanelAction]
    );

  // -------------------------------------------------------
  // Sorting
  // -------------------------------------------------------

  function toggleSort(
    key: keyof TicketRow
  ) {
    setSort((prev) => {
      if (prev.key !== key) {
        return {
          key,
          direction: "asc",
        };
      }

      if (
        prev.direction === "asc"
      ) {
        return {
          key,
          direction: "desc",
        };
      }

      if (
        prev.direction === "desc"
      ) {
        return {
          key: null,
          direction: null,
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  }

  // -------------------------------------------------------
  // Active filters
  // -------------------------------------------------------

  const activeFilterCount =
    useMemo(() => {
      return Object.values(
        filters
      ).filter(
        (f) =>
          f &&
          isFilterActive(f)
      ).length;
    }, [filters]);

  // -------------------------------------------------------
  // Filter tickets
  // -------------------------------------------------------

  const filteredTickets =
    useMemo(() => {
      return tickets.filter(
        (ticket) => {
          // My Ticket
          if (mineOnly) {
            if (
              currentUserId === null ||
              ticket.SubmitterId !==
                currentUserId
            ) {
              return false;
            }
          }

          // Group filter
          if (
            groupFilter.bucket
          ) {
            if (
              getStatusBucket(
                ticket.Status
              ) !==
              groupFilter.bucket
            ) {
              return false;
            }

            if (
              groupFilter.stage &&
              getReviewStage(
                ticket.Status
              ) !==
                groupFilter.stage
            ) {
              return false;
            }
          }

          // Column filters
          for (
            const col of columns
          ) {
            const f =
              filters[col.key];

            if (!f) continue;

            const raw =
              ticket[col.key];

            if (
              f.kind === "text"
            ) {
              if (!f.value)
                continue;

              const cell =
                raw === null ||
                raw === undefined
                  ? ""
                  : String(raw);

              if (
                !cell
                  .toLowerCase()
                  .includes(
                    f.value.toLowerCase()
                  )
              ) {
                return false;
              }
            } else if (
              f.kind === "number"
            ) {
              if (!f.value)
                continue;

              const cell =
                raw === null ||
                raw === undefined
                  ? ""
                  : String(raw);

              if (
                !cell.includes(
                  f.value
                )
              ) {
                return false;
              }
            } else if (
              f.kind === "status"
            ) {
              if (!f.value)
                continue;

              if (
                String(
                  raw ?? ""
                ) !== f.value
              ) {
                return false;
              }
            } else if (
              f.kind === "boolean"
            ) {
              if (
                f.value === "all"
              ) {
                continue;
              }

              const wantYes =
                f.value === "yes";

              if (
                Boolean(raw) !==
                wantYes
              ) {
                return false;
              }
            } else if (
              f.kind === "date"
            ) {
              if (
                !f.from &&
                !f.to
              ) {
                continue;
              }

              if (!raw) {
                return false;
              }

              const cellDate =
                toDateOnly(
                  String(raw)
                );

              if (
                f.from &&
                cellDate < f.from
              ) {
                return false;
              }

              if (
                f.to &&
                cellDate > f.to
              ) {
                return false;
              }
            }
          }

          return true;
        }
      );
    }, [
      tickets,
      filters,
      groupFilter,
      mineOnly,
      currentUserId,
    ]);

  // -------------------------------------------------------
  // Sort tickets
  // -------------------------------------------------------

  const sortedTickets =
    useMemo(() => {
      if (
        !sort.key ||
        !sort.direction
      ) {
        return filteredTickets;
      }

      const key = sort.key;

      const dir =
        sort.direction === "asc"
          ? 1
          : -1;

      return [
        ...filteredTickets,
      ].sort((a, b) => {
        const av = a[key];
        const bv = b[key];

        if (
          av === null ||
          av === undefined ||
          av === ""
        ) {
          return 1;
        }

        if (
          bv === null ||
          bv === undefined ||
          bv === ""
        ) {
          return -1;
        }

        if (
          typeof av === "boolean" &&
          typeof bv === "boolean"
        ) {
          return (
            (Number(av) -
              Number(bv)) *
            dir
          );
        }

        if (
          typeof av === "number" &&
          typeof bv === "number"
        ) {
          return (
            (av - bv) *
            dir
          );
        }

        const aStr =
          String(av);

        const bStr =
          String(bv);

        return (
          aStr.localeCompare(
            bStr,
            undefined,
            {
              numeric: true,
            }
          ) * dir
        );
      });
    }, [
      filteredTickets,
      sort,
    ]);

  // -------------------------------------------------------
  // CSV helper
  // -------------------------------------------------------

  function escapeCsvValue(
    value: unknown
  ): string {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    let formatted: string;

    if (
      typeof value === "boolean"
    ) {
      formatted = value
        ? "Yes"
        : "No";
    } else {
      formatted = String(value);
    }

    // Escape double quotes for CSV.
    formatted =
      formatted.replace(
        /"/g,
        '""'
      );

    // Wrap every field in quotes.
    return `"${formatted}"`;
  }

  // -------------------------------------------------------
  // CSV export
  // -------------------------------------------------------

  function performDownload() {
    setIsDownloading(true);

    try {
      const headers =
        columns.map(
          (col) =>
            col.label
        );

      const rows =
        sortedTickets.map(
          (ticket) =>
            columns.map(
              (col) =>
                escapeCsvValue(
                  ticket[
                    col.key
                  ]
                )
            )
        );

      const csv = [
        headers.map(
          escapeCsvValue
        ),
        ...rows,
      ]
        .map(
          (row) =>
            row.join(",")
        )
        .join("\r\n");

      // UTF-8 BOM.
      // This helps Microsoft Excel correctly
      // recognize UTF-8 encoded CSV files.
      const blob =
        new Blob(
          [
            "\uFEFF" +
              csv,
          ],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      const dateStr =
        new Date()
          .toISOString()
          .slice(0, 10);

      const filenameSuffix =
        activeFilterCount > 0 ||
        !!groupFilter.bucket ||
        mineOnly
          ? "filtered"
          : "all";

      link.href = url;

      link.download =
        `tickets-${filenameSuffix}-${dateStr}.csv`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
      );

      setConfirmDownloadOpen(
        false
      );
    } catch (err) {
      console.error(
        "Failed to export tickets:",
        err
      );

      alert(
        "Something went wrong while generating the CSV file. Please try again."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  // -------------------------------------------------------
  // Group filter label
  // -------------------------------------------------------

  const groupFilterLabel =
    groupFilter.bucket
      ? `${BUCKET_LABELS[groupFilter.bucket]}${
          groupFilter.stage
            ? ` · ${STAGE_LABELS[groupFilter.stage]}`
            : ""
        }`
      : null;

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-6 py-4">
        {/* Left */}
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-gray-900">
            Tickets
          </h2>

          <span className="text-sm text-gray-400">
            {loading
              ? "Loading..."
              : `${sortedTickets.length} of ${tickets.length} total`}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* My Tickets */}
          {mineOnly && (
            <button
              onClick={
                clearMineFilter
              }
              className="flex items-center gap-1 rounded-md border border-orange-300 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100"
            >
              <X className="h-3 w-3" />

              My Tickets
            </button>
          )}

          {/* Group filter */}
          {groupFilterLabel && (
            <button
              onClick={
                clearGroupFilter
              }
              className="flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              <X className="h-3 w-3" />

              {groupFilterLabel}
            </button>
          )}

          {/* Column filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={
                clearAllFilters
              }
              className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />

              Clear{" "}
              {activeFilterCount}{" "}
              filter
              {activeFilterCount >
              1
                ? "s"
                : ""}
            </button>
          )}

          {/* Download */}
          <button
            onClick={() =>
              setConfirmDownloadOpen(
                true
              )
            }
            disabled={
              sortedTickets.length ===
              0
            }
            className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />

            Download
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1800px] border-collapse text-sm">
          <thead>
            <tr className="bg-white/900">
              {columns.map(
                (col) => {
                  const isSorted =
                    sort.key ===
                    col.key;

                  const filter =
                    getFilter(
                      col.key,
                      col.type
                    );

                  const isActive =
                    isFilterActive(
                      filter
                    );

                  const isOpen =
                    openFilter ===
                    col.key;

                  return (
                    <th
                      key={
                        col.key
                      }
                      className="relative whitespace-nowrap px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-1.5">
                        {/* Sort */}
                        <button
                          onClick={() =>
                            toggleSort(
                              col.key
                            )
                          }
                          className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-800"
                        >
                          {col.label}

                          {isSorted &&
                            sort.direction ===
                              "asc" && (
                              <ChevronUp className="h-3.5 w-3.5" />
                            )}

                          {isSorted &&
                            sort.direction ===
                              "desc" && (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}

                          {!isSorted && (
                            <ChevronsUpDown className="h-3.5 w-3.5 text-gray-300" />
                          )}
                        </button>

                        {/* Filter */}
                        <button
                          onClick={(
                            e
                          ) => {
                            if (
                              openFilter ===
                              col.key
                            ) {
                              setOpenFilter(
                                null
                              );

                              setFilterAnchorRect(
                                null
                              );
                            } else {
                              setFilterAnchorRect(
                                e.currentTarget.getBoundingClientRect()
                              );

                              setOpenFilter(
                                col.key
                              );
                            }
                          }}
                          className={`rounded p-0.5 hover:bg-gray-200 ${
                            isActive
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                          aria-label={`Filter ${col.label}`}
                        >
                          <Filter
                            className="h-3.5 w-3.5"
                            fill={
                              isActive
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </div>

                      {/* Filter popover */}
                      {isOpen &&
                        filterAnchorRect && (
                          <ColumnFilterPopover
                            col={
                              col
                            }
                            filter={
                              filter
                            }
                            anchorRect={
                              filterAnchorRect
                            }
                            onChange={(
                              value
                            ) =>
                              updateFilter(
                                col.key,
                                value
                              )
                            }
                            onClear={() =>
                              clearFilter(
                                col.key,
                                col.type
                              )
                            }
                            onClose={() => {
                              setOpenFilter(
                                null
                              );

                              setFilterAnchorRect(
                                null
                              );
                            }}
                            statusOptions={
                              statusOptions
                            }
                          />
                        )}
                    </th>
                  );
                }
              )}
            </tr>
          </thead>

          <tbody>
            {/* Loading */}
            {loading ? (
              <tr>
                <td
                  colSpan={
                    columns.length
                  }
                  className="px-6 py-16 text-center text-sm text-gray-400"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Loading tickets...
                  </div>
                </td>
              </tr>
            ) : sortedTickets.length ===
              0 ? (
              /* Empty */
              <tr>
                <td
                  colSpan={
                    columns.length
                  }
                  className="px-6 py-16 text-center text-sm text-gray-400"
                >
                  {tickets.length ===
                  0
                    ? "No tickets yet. New tickets will show up here."
                    : "No tickets match the current filters."}
                </td>
              </tr>
            ) : (
              /* Rows */
              sortedTickets.map(
                (ticket) => (
                  <tr
                    key={
                      ticket.TicketID
                    }
                    onClick={() => {
                      const raw =
                        rawTickets.find(
                          (t) =>
                            t.ticket_id ===
                            ticket.TicketID
                        ) ??
                        null;

                      setSelectedTicket(
                        raw
                      );

                      setIsPanelOpen(
                        true
                      );
                    }}
                    className="cursor-pointer border-t border-gray-200 hover:bg-gray-50"
                  >
                    {columns.map(
                      (col) => (
                        <td
                          key={col.key}
                          className="whitespace-nowrap px-4 py-3 text-gray-700"
                        >
                          {col.type === "status" ? (
                            <span
                              className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold capitalize min-w-[110px]"
                              style={getStatusStyle(ticket.Status)}
                            >
                              {formatValue(ticket.Status)}
                            </span>
                          ) : col.key === "TicketID" ? (
                            // Style the SR / Ticket number
                            <span className="text-blue-600 font-semibold">
                              {formatValue(ticket.TicketID)}
                            </span>
                          ) : (
                            formatValue(ticket[col.key])
                          )}
                        </td>
                      )
                    )}
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Download confirmation */}
      {confirmDownloadOpen && (
        <DownloadConfirmDialog
          rowCount={
            sortedTickets.length
          }
          totalCount={
            tickets.length
          }
          isFiltered={
            activeFilterCount >
              0 ||
            !!groupFilter.bucket ||
            mineOnly
          }
          isDownloading={
            isDownloading
          }
          onCancel={() =>
            setConfirmDownloadOpen(
              false
            )
          }
          onConfirm={
            performDownload
          }
        />
      )}

      {/* Action feedback */}
      {actionFeedback && (
        <div
          className={`fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all ${
            actionFeedback.ok
              ? "bg-emerald-500"
              : "bg-rose-500"
          }`}
        >
          {actionFeedback.ok
            ? "✓"
            : "✕"}{" "}
          {
            actionFeedback.message
          }
        </div>
      )}

      {/* Detail panel */}
      <TicketDetailPanel
        ticket={
          selectedTicket
        }
        isOpen={
          isPanelOpen
        }
        onOpen={() =>
          setIsPanelOpen(
            true
          )
        }
        onClose={() =>
          setIsPanelOpen(
            false
          )
        }
        onAcceptStep={
          handleAcceptStep
        }
        onRejectStep={
          handleRejectStep
        }
        onHoldStep={
          handleHoldStep
        }
        onResumeStep={
          handleResumeStep
        }
      />
    </div>
  );
}

// ---------------------------------------------------------
// Suspense wrapper
// ---------------------------------------------------------

export default function TicketsTable() {
  return (
    <Suspense
      fallback={
        <TicketsTableFallback />
      }
    >
      <TicketsTableInner />
    </Suspense>
  );
}

// ---------------------------------------------------------
// Loading fallback
// ---------------------------------------------------------

function TicketsTableFallback() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-16 text-center text-sm text-gray-400 shadow-md">
      <div className="flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />

        Loading tickets...
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Download confirmation dialog
// ---------------------------------------------------------

function DownloadConfirmDialog({
  rowCount,
  totalCount,
  isFiltered,
  isDownloading,
  onCancel,
  onConfirm,
}: {
  rowCount: number;
  totalCount: number;
  isFiltered: boolean;
  isDownloading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-gray-900">
          Download tickets?
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          {isFiltered ? (
            <>
              You have active
              filters. This will
              download{" "}
              <span className="font-medium text-gray-900">
                {rowCount}
              </span>{" "}
              filtered row
              {rowCount !==
              1
                ? "s"
                : ""}{" "}
              (out of{" "}
              {totalCount}{" "}
              total) as a{" "}
              <span className="font-medium text-gray-900">
                .csv
              </span>{" "}
              file.
            </>
          ) : (
            <>
              This will download
              all{" "}
              <span className="font-medium text-gray-900">
                {rowCount}
              </span>{" "}
              ticket
              {rowCount !==
              1
                ? "s"
                : ""}{" "}
              as a{" "}
              <span className="font-medium text-gray-900">
                .csv
              </span>{" "}
              file.
            </>
          )}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={
              onCancel
            }
            disabled={
              isDownloading
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={
              onConfirm
            }
            disabled={
              isDownloading
            }
            className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isDownloading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}

            {isDownloading
              ? "Preparing..."
              : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Column filter popover
// ---------------------------------------------------------

function ColumnFilterPopover({
  col,
  filter,
  anchorRect,
  onChange,
  onClear,
  onClose,
  statusOptions,
}: {
  col: ColumnDef;
  filter: FilterValue;
  anchorRect: DOMRect;
  onChange: (
    v: FilterValue
  ) => void;
  onClear: () => void;
  onClose: () => void;
  statusOptions: string[];
}) {
  const inputBase =
    "w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-gray-400 focus:outline-none";

  return (
    <div
      className="fixed z-20 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg normal-case"
      style={{
        top: `${
          anchorRect.bottom +
          4
        }px`,
        left: `${anchorRect.left}px`,
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">
          Filter{" "}
          {col.label}
        </span>

        <button
          onClick={
            onClose
          }
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Text */}
      {filter.kind ===
        "text" && (
        <input
          autoFocus
          type="text"
          value={
            filter.value
          }
          onChange={(e) =>
            onChange({
              kind: "text",
              value:
                e.target
                  .value,
            })
          }
          placeholder="Contains..."
          className={
            inputBase
          }
        />
      )}

      {/* Number */}
      {filter.kind ===
        "number" && (
        <input
          autoFocus
          type="text"
          inputMode="numeric"
          value={
            filter.value
          }
          onChange={(e) =>
            onChange({
              kind: "number",
              value:
                e.target
                  .value,
            })
          }
          placeholder="Contains..."
          className={
            inputBase
          }
        />
      )}

      {/* Boolean */}
      {filter.kind ===
        "boolean" && (
        <select
          value={
            filter.value
          }
          onChange={(e) =>
            onChange({
              kind: "boolean",
              value:
                e.target
                  .value as
                  | "all"
                  | "yes"
                  | "no",
            })
          }
          className={
            inputBase
          }
        >
          <option value="all">
            All
          </option>

          <option value="yes">
            Yes
          </option>

          <option value="no">
            No
          </option>
        </select>
      )}

      {/* Status */}
      {filter.kind ===
        "status" && (
        <select
          value={
            filter.value
          }
          onChange={(e) =>
            onChange({
              kind: "status",
              value:
                e.target
                  .value,
            })
          }
          className={
            inputBase
          }
        >
          <option value="">
            All statuses
          </option>

          {statusOptions.map(
            (status) => (
              <option
                key={
                  status
                }
                value={
                  status
                }
              >
                {status}
              </option>
            )
          )}
        </select>
      )}

      {/* Date */}
      {filter.kind ===
        "date" && (
        <>
          <div className="mb-2 flex flex-wrap gap-1">
            {DATE_PRESETS.map(
              (preset) => (
                <button
                  key={
                    preset.key
                  }
                  onClick={() =>
                    onChange({
                      kind: "date",
                      ...datePreset(
                        preset.key
                      ),
                    })
                  }
                  className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 hover:border-gray-400 hover:text-gray-900"
                >
                  {
                    preset.label
                  }
                </button>
              )
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-gray-500">
              From:

              <input
                type="date"
                value={
                  filter.from
                }
                onChange={(e) =>
                  onChange({
                    kind: "date",
                    from:
                      e.target
                        .value,
                    to: filter.to,
                  })
                }
                className="mt-0.5 w-50 rounded-md border border-gray-300 px-1 py-1 text-xs"
              />
            </label>

            <label className="block text-[11px] font-medium text-gray-500">
              To:

              <input
                type="date"
                value={
                  filter.to
                }
                onChange={(e) =>
                  onChange({
                    kind: "date",
                    from:
                      filter.from,
                    to:
                      e.target
                        .value,
                  })
                }
                className="mt-0.5 w-54 rounded-md border border-gray-300 px-1 py-1 text-xs"
              />
            </label>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-3 flex justify-between border-t border-gray-100 pt-2">
        <button
          onClick={
            onClear
          }
          className="text-[11px] font-medium text-gray-500 hover:text-gray-800"
        >
          Clear
        </button>

        <button
          onClick={
            onClose
          }
          className="rounded-md bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-gray-800"
        >
          Done
        </button>
      </div>
    </div>
  );
}