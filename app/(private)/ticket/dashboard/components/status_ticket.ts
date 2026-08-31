// src/lib/ticket-status.ts

export type StatusBucket =
  | "forReview"
  | "inProgress"
  | "resolved"
  | "closed"
  | "cancel";

export type ReviewStage = "endorser" | "approver" | "assignment";

export function normalizeStatus(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

// raw normalized status -> dashboard bucket
export const STATUS_MAP: Record<string, StatusBucket> = {
  forreview: "forReview",
  forresolution: "forReview",
  forassignment: "forReview",
  forendorsement: "forReview",
  endorsed: "forReview",
  forapproval: "forReview",
  approved: "forReview",

  inprogress: "inProgress",

  resolved: "resolved",

  closed: "closed",

  cancel: "cancel",
  canceled: "cancel",
};

/**
 * Within the "For Review" bucket, which role's action is currently pending.
 * ADJUST THIS to match your actual workflow — this is my best guess based on
 * the raw status names in your STATUS_MAP:
 *  - endorser stage:   ForEndorsement, Endorsed
 *  - approver stage:   ForApproval, Approved
 *  - assignment stage: ForAssignment, ForResolution, ForReview (fallback)
 */
export const REVIEW_STAGE_MAP: Record<string, ReviewStage> = {
  forendorsement: "endorser",
  endorsed: "endorser",

  forapproval: "approver",
  approved: "approver",

  forassignment: "assignment",
  forresolution: "assignment",
  forreview: "assignment",
};

export function getStatusBucket(status: string): StatusBucket | null {
  return STATUS_MAP[normalizeStatus(status)] ?? null;
}

export function getReviewStage(status: string): ReviewStage | null {
  return REVIEW_STAGE_MAP[normalizeStatus(status)] ?? null;
}

export const BUCKET_LABELS: Record<StatusBucket, string> = {
  forReview: "For Review",
  inProgress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  cancel: "cancel",
};

export const STAGE_LABELS: Record<ReviewStage, string> = {
  endorser: "For Endorser",
  approver: "For Approver",
  assignment: "For Assignment",
};