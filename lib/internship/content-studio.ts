import { isOfficialReviewStage, legacyStatusToStage, needsAvaReview, nextReviewStage, reviewStageLabel, type ReviewAction } from "@/lib/internship/review-flow";

export const CONTENT_TYPES = [
  { id: "social_post", label: "Social post" },
  { id: "story", label: "Story" },
  { id: "reel", label: "Reel / short video" },
  { id: "graphic", label: "Promotional graphic" },
  { id: "campaign", label: "Campaign content" },
  { id: "outreach", label: "Community outreach material" },
  { id: "other", label: "Other" },
] as const;

export const CONTENT_PLATFORMS = ["Facebook", "Instagram", "TikTok", "X", "YouTube", "Multiple"] as const;

export function contentCreativeKey(input: {
  caption: string;
  draftUrl: string;
  platform: string;
  assetIds: string[];
  creativePath?: string;
}) {
  const base = [
    input.caption.trim(),
    input.draftUrl.trim(),
    input.platform.trim(),
    [...input.assetIds].sort().join(","),
  ].join("|");
  return input.creativePath ? `${base}|file:${input.creativePath}` : base;
}

export function contentEditResetsApproval(input: {
  reviewStage: string;
  approvedSnapshot: string;
  nextKey: string;
}) {
  if (!input.approvedSnapshot) return false;
  if (!isOfficialReviewStage(legacyStatusToStage(input.reviewStage, input.reviewStage))) return false;
  return input.approvedSnapshot !== input.nextKey;
}

export function canReviewAssignedContent(input: {
  actorUserId: string;
  isSuperUser: boolean;
  managerUserId: string | null;
}) {
  if (input.isSuperUser) return true;
  return Boolean(input.managerUserId) && input.managerUserId === input.actorUserId;
}

export function studioDecision(input: {
  action: ReviewAction;
  stage: string;
  actor: "intern" | "manager" | "supervisor";
  comment: string;
  publishedUrl?: string;
}) {
  if ((input.action === "request_changes" || input.action === "escalate") && !input.comment.trim()) {
    return { ok: false as const, error: "Add a note so the next person knows what to do." };
  }
  if (input.action === "approve" && input.actor === "intern") {
    return { ok: false as const, error: "You can’t approve your own content." };
  }
  const next = nextReviewStage({ stage: input.stage, action: input.action, actor: input.actor });
  if (!next.ok) return next;
  return { ok: true as const, stage: next.stage };
}

export function canRecordPublication(input: { reviewStage: string; publishedUrl: string }) {
  const stage = legacyStatusToStage(input.reviewStage, input.reviewStage);
  if (!isOfficialReviewStage(stage) && stage !== "ceo_approved") {
    return "Approve the content before recording a published link.";
  }
  const url = input.publishedUrl.trim();
  if (!url.startsWith("https://")) return "Add the https link of the live post.";
  return "";
}

export type StudioItem = {
  reviewStage: string;
  status: string;
  plannedAt: string;
  publishedUrl: string;
};

export function studioSummary(items: StudioItem[]) {
  const stageOf = (item: StudioItem) => legacyStatusToStage(item.status, item.reviewStage);
  return {
    drafts: items.filter((item) => stageOf(item) === "draft").length,
    pending: items.filter((item) => needsAvaReview(item.status, item.reviewStage)).length,
    changes: items.filter((item) => stageOf(item) === "changes_requested").length,
    approved: items.filter((item) => isOfficialReviewStage(stageOf(item)) && !item.publishedUrl).length,
    scheduled: items.filter((item) => isOfficialReviewStage(stageOf(item)) && Boolean(item.plannedAt) && !item.publishedUrl).length,
    published: items.filter((item) => Boolean(item.publishedUrl)).length,
    escalated: items.filter((item) => stageOf(item) === "submitted_to_jason" || stageOf(item) === "ceo_review_required").length,
  };
}

export function studioStatusLabel(status: string, reviewStage?: string | null, publishedUrl?: string) {
  if (publishedUrl) return "Published";
  return reviewStageLabel(legacyStatusToStage(status, reviewStage));
}

export function studioNextAction(status: string, reviewStage?: string | null, publishedUrl?: string) {
  if (publishedUrl) return "Recorded";
  const stage = legacyStatusToStage(status, reviewStage);
  if (stage === "submitted_to_ava") return "Review";
  if (stage === "changes_requested") return "Revise";
  if (stage === "draft") return "Submit";
  if (isOfficialReviewStage(stage)) return "Publish";
  if (stage === "submitted_to_jason") return "CEO review";
  return "Open";
}

export function deliverableMailbox(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const email = String(candidate || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    if (email.endsWith("@users.sitguru.internal")) continue;
    return email;
  }
  return "";
}

export function contentReviewNotice(input: {
  kind: "submitted" | "changes" | "approved" | "escalated";
  title: string;
  href: string;
}) {
  const title = input.title.trim() || "SitGuru content";
  if (input.kind === "submitted") {
    return {
      subject: `Content ready for your review: ${title}`,
      title: "Content needs your review",
      body: `${title} was submitted and is waiting for your review.`,
      text: `${title} was submitted and is waiting for your review.\n\nOpen the review: ${input.href}`,
    };
  }
  if (input.kind === "changes") {
    return {
      subject: `Changes requested: ${title}`,
      title: "Changes requested",
      body: `Your manager asked for changes on ${title}.`,
      text: `Your manager asked for changes on ${title}.\n\nOpen the draft: ${input.href}`,
    };
  }
  if (input.kind === "approved") {
    return {
      subject: `Content approved: ${title}`,
      title: "Content approved",
      body: `${title} was approved. It is not published yet.`,
      text: `${title} was approved. It is not published yet.\n\nOpen the draft: ${input.href}`,
    };
  }
  return {
    subject: `Content escalated: ${title}`,
    title: "Content escalated",
    body: `${title} was escalated for Admin review.`,
    text: `${title} was escalated for Admin review.\n\nOpen the overview: ${input.href}`,
  };
}

export function studioRowLabel(row: {
  status: string;
  reviewStage?: string | null;
  publishedUrl?: string;
}) {
  return {
    status: studioStatusLabel(row.status, row.reviewStage, row.publishedUrl),
    action: studioNextAction(row.status, row.reviewStage, row.publishedUrl),
  };
}
