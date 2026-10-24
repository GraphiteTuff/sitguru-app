export const REVIEW_STAGES = [
  "draft",
  "submitted_to_ava",
  "changes_requested",
  "ava_approved",
  "ceo_review_required",
  "submitted_to_jason",
  "ceo_approved",
  "approved_complete",
] as const;

export type ReviewStage = (typeof REVIEW_STAGES)[number];

export type ReviewAction =
  | "submit"
  | "resubmit"
  | "request_changes"
  | "approve"
  | "escalate"
  | "ceo_approve"
  | "ceo_request_changes";

const LABELS: Record<string, string> = {
  draft: "Draft",
  submitted_to_ava: "Needs Ava Review",
  changes_requested: "Changes Requested",
  ava_approved: "Ava Approved",
  ceo_review_required: "Ava Approved — CEO Review Required",
  submitted_to_jason: "Needs CEO Review",
  ceo_approved: "CEO Approved",
  approved_complete: "Approved / Complete",
  todo: "Draft",
  in_progress: "Draft",
  submitted: "Needs Ava Review",
  revision_requested: "Changes Requested",
  approved: "Ava Approved",
  not_accepted: "Not accepted",
  blocked: "Blocked",
};

export function reviewStageLabel(stage: string) {
  return LABELS[stage] || stage.replaceAll("_", " ");
}

export function legacyStatusToStage(status: string, reviewStage?: string | null): ReviewStage | string {
  if (reviewStage && LABELS[reviewStage]) return reviewStage;
  if (status === "submitted") return "submitted_to_ava";
  if (status === "revision_requested") return "changes_requested";
  if (status === "approved") return "ava_approved";
  if (status === "todo" || status === "in_progress" || status === "draft") return "draft";
  return status || "draft";
}

export function displayWorkStatus(status: string, reviewStage?: string | null) {
  const stage = legacyStatusToStage(status, reviewStage);
  return {
    stage,
    label: reviewStageLabel(stage),
  };
}

export function statusForStage(stage: string) {
  if (stage === "submitted_to_ava" || stage === "submitted_to_jason" || stage === "ceo_review_required") {
    return "submitted";
  }
  if (stage === "changes_requested") return "revision_requested";
  if (stage === "ava_approved" || stage === "ceo_approved" || stage === "approved_complete") {
    return "approved";
  }
  if (stage === "draft") return "in_progress";
  return "submitted";
}

export function nextReviewStage(input: {
  stage: string;
  action: ReviewAction;
  actor: "intern" | "manager" | "supervisor";
}): { ok: true; stage: ReviewStage } | { ok: false; error: string } {
  const stage = legacyStatusToStage(input.stage);
  const { action, actor } = input;

  if (action === "submit" || action === "resubmit") {
    if (actor !== "intern" && actor !== "manager") {
      return { ok: false, error: "Only the intern can submit this." };
    }
    if (stage !== "draft" && stage !== "changes_requested") {
      return { ok: false, error: "This is already with Ava." };
    }
    return { ok: true, stage: "submitted_to_ava" };
  }

  if (action === "request_changes") {
    if (actor === "intern") return { ok: false, error: "Ava reviews this, not the intern." };
    if (stage !== "submitted_to_ava" && stage !== "submitted_to_jason" && stage !== "ava_approved") {
      return { ok: false, error: "Nothing is waiting for changes." };
    }
    if (stage === "submitted_to_jason" && actor !== "supervisor") {
      return { ok: false, error: "Jason reviews escalated work." };
    }
    return { ok: true, stage: "changes_requested" };
  }

  if (action === "approve") {
    if (actor === "intern") return { ok: false, error: "You can’t approve your own work." };
    if (actor === "manager" && stage !== "submitted_to_ava") {
      return { ok: false, error: "Routine approval is for work submitted to Ava." };
    }
    if (stage === "submitted_to_jason" || stage === "ceo_review_required") {
      return { ok: false, error: "Escalated work needs CEO review." };
    }
    if (stage !== "submitted_to_ava" && actor !== "supervisor") {
      return { ok: false, error: "This work is not waiting on Ava." };
    }
    return { ok: true, stage: "ava_approved" };
  }

  if (action === "escalate") {
    if (actor === "intern") return { ok: false, error: "Ask Ava to escalate this." };
    if (stage !== "submitted_to_ava" && stage !== "ava_approved") {
      return { ok: false, error: "This can’t be escalated from its current step." };
    }
    return { ok: true, stage: "submitted_to_jason" };
  }

  if (action === "ceo_approve") {
    if (actor !== "supervisor") return { ok: false, error: "Only Jason can give CEO approval." };
    if (stage !== "submitted_to_jason" && stage !== "ceo_review_required") {
      return { ok: false, error: "This is not waiting on CEO review." };
    }
    return { ok: true, stage: "ceo_approved" };
  }

  if (actor !== "supervisor") return { ok: false, error: "Only Jason can send this back." };
  if (stage !== "submitted_to_jason" && stage !== "ceo_review_required") {
    return { ok: false, error: "This is not waiting on CEO review." };
  }
  return { ok: true, stage: "changes_requested" };
}

export function isOfficialReviewStage(stage: string) {
  return stage === "ava_approved" || stage === "ceo_approved" || stage === "approved_complete";
}

export function needsAvaReview(status: string, reviewStage?: string | null) {
  const stage = legacyStatusToStage(status, reviewStage);
  return stage === "submitted_to_ava";
}

export function needsCeoReview(status: string, reviewStage?: string | null) {
  const stage = legacyStatusToStage(status, reviewStage);
  return stage === "submitted_to_jason" || stage === "ceo_review_required";
}
