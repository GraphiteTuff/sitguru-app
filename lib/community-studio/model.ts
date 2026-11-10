export const COMMUNITY_KINDS = [
  { id: "pack", label: "The SitGuru Pack" },
  { id: "pet_of_week", label: "Pet of the Week" },
  { id: "gallery", label: "Community Gallery" },
  { id: "guru_spotlight", label: "Guru Spotlights" },
] as const;

export type CommunityKind = (typeof COMMUNITY_KINDS)[number]["id"];
export const COMMUNITY_STATUSES = ["draft", "pending", "changes_requested", "rejected", "approved", "scheduled", "published", "archived"] as const;
export type CommunityStatus = (typeof COMMUNITY_STATUSES)[number];
export type CommunityActionState = { ok: boolean; error: string; message: string };
export type CommunityItem = {
  id: string; kind: CommunityKind; title: string; petName: string; story: string;
  location: string; status: CommunityStatus; feedback: string; imageUrl: string;
  submitterName: string; createdAt: string; updatedAt: string; publishAt: string;
  weekOf: string; contentId: string; taskId: string; canEdit: boolean; canReview: boolean;
  mediaUrl?: string; mediaMime?: string; publicConsent?: boolean; socialConsent?: boolean;
  featuresClientPet?: boolean; bookingId?: string; parentPermissionStatus?: string;
};
export type CommunityWorkspace = {
  items: CommunityItem[];
  summary: { total: number; draft: number; pending: number; approved: number; scheduled: number; published: number };
  ready: boolean; error: string; canModerate: boolean;
  tasks: { id: string; title: string }[]; content: { id: string; title: string }[];
  bookings?: { id: string; label: string }[];
};

export function communitySummary(items: Pick<CommunityItem, "status">[]) {
  const count = (status: CommunityStatus) => items.filter((item) => item.status === status).length;
  return { total: items.length, draft: count("draft"), pending: count("pending"), approved: count("approved"), scheduled: count("scheduled"), published: count("published") };
}

export function isCommunityKind(value: string): value is CommunityKind {
  return COMMUNITY_KINDS.some((kind) => kind.id === value);
}

export function communityVisible(input: {
  status: string; consent: boolean; approvedAt?: string | null; publishAt?: string | null;
}, now = new Date()) {
  if (!input.consent || !input.approvedAt || !["published", "scheduled"].includes(input.status)) return false;
  const at = Date.parse(input.publishAt || "");
  return Number.isFinite(at) && at <= now.getTime();
}

export function communityEditable(status: string) {
  return ["draft", "changes_requested", "rejected"].includes(status);
}

export function communityWeek(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getUTCDay() === 1;
}

/** datetime-local values are deliberately interpreted as UTC by the scheduler UI. */
export function communityPublishTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z)?$/.test(value)) return "";
  const clean = value.endsWith("Z") ? value : `${value}Z`;
  const date = new Date(clean);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value.slice(0, 10) ? date.toISOString() : "";
}

export function communityReviewDecision(input: {
  status: CommunityStatus; action: string; feedback: string; kind: CommunityKind;
  publishAt?: string; weekOf?: string;
}, now = new Date()): { ok: true; status: CommunityStatus; publishAt: string | null } | { ok: false; error: string } {
  if (input.action === "archive") {
    return input.status === "archived" ? { ok: false, error: "This submission is already archived." } : { ok: true, status: "archived", publishAt: null };
  }
  if (["approve", "request_changes", "reject"].includes(input.action)) {
    if (input.status !== "pending") return { ok: false, error: "Only a submission waiting for review can receive this decision." };
    if (input.action !== "approve" && !input.feedback.trim()) return { ok: false, error: "Add feedback for the submitter." };
    return { ok: true, status: input.action === "approve" ? "approved" : input.action === "reject" ? "rejected" : "changes_requested", publishAt: null };
  }
  if (input.action === "schedule" || input.action === "publish") {
    if (!["approved", "scheduled"].includes(input.status)) return { ok: false, error: "Manager approval is required before publishing." };
    if (input.kind === "pet_of_week" && !communityWeek(input.weekOf || "")) return { ok: false, error: "Choose a Monday for the Pet of the Week edition." };
    const publishAt = input.action === "publish" ? now.toISOString() : communityPublishTime(input.publishAt || "");
    if (!publishAt || (input.action === "schedule" && Date.parse(publishAt) <= now.getTime())) return { ok: false, error: "Choose a future publishing time in UTC." };
    return { ok: true, status: input.action === "publish" ? "published" : "scheduled", publishAt };
  }
  return { ok: false, error: "That review action is not available." };
}

export function communityOwnedPath(userId: string, path: string) {
  return Boolean(userId && path && !path.includes("..") && !path.includes("\\") && new RegExp(`^${userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/[a-f0-9-]+\\.(?:png|jpg|jpeg|webp)$`, "i").test(path));
}
