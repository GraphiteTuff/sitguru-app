/** Growth work for the manager: strategy, partnerships, and evidence. */

export const GROWTH_JOURNEY = ["Awareness", "Visit", "Explore", "Register", "Engage", "Book"] as const;

export const INITIATIVE_STATUSES = [
  "Idea",
  "Discussion",
  "Decision",
  "Assignment",
  "Execution",
  "Measurement",
  "Learning",
  "Paused",
] as const;

export const INITIATIVE_CATEGORIES = [
  "Pet Parent Acquisition",
  "Guru Engagement",
  "Existing Customer Engagement",
  "Community Partnerships",
  "Social Media Growth",
  "Booking Conversion",
  "Polls & Surveys",
  "Creative Experiments",
  "Other",
] as const;

export const NOVEMBER_GOAL_DEFAULTS = {
  conversations: "10–15 meaningful community conversations",
  prospects: "5 qualified Pet Parent prospects",
  content: "2–3 social content pieces",
  poll: "1 poll or survey",
  experiment: "1 growth experiment",
} as const;

export function surveyCode(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36);
  return slug || "sitguru-poll";
}

export const PARTNER_KINDS = [
  "Animal rescue or shelter",
  "Groomer",
  "Trainer",
  "Veterinary organization",
  "Pet business",
  "Community event",
  "Local business",
  "Cross-promotion",
  "Referral relationship",
  "Educational organization",
  "Pet-care professional",
  "Strategic partner",
] as const;

export const PARTNER_STATUSES = [
  "Identified",
  "Contacted",
  "Conversation",
  "Approved activity",
  "Needs leadership approval",
  "Closed",
] as const;

export const FORMAL_COMMITMENTS = [
  "Contract",
  "Sponsorship",
  "Financial arrangement",
  "Legal agreement",
  "Major company partnership",
] as const;

const CONFIRMED = new Set(["confirmed", "completed", "complete", "paid"]);
const CANCELED = new Set(["canceled", "cancelled", "declined", "refunded", "void", "failed"]);

export function weekStartKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const weekday = parts.find((part) => part.type === "weekday")?.value || "Mon";
  const index: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() - ((index[weekday] ?? 1) + 6) % 7);
  return utc.toISOString().slice(0, 10);
}

export function bookingCountBucket(status: string) {
  const value = status.toLowerCase().replace(/\s+/g, "_");
  if (!value || CANCELED.has(value)) return "ignored" as const;
  if (CONFIRMED.has(value)) return "confirmed" as const;
  return "requested" as const;
}

export function conversionRate(numerator: number, denominator: number | null) {
  if (denominator == null || denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function formalCommitmentNeedsApproval(kind: string) {
  return FORMAL_COMMITMENTS.some((item) => item.toLowerCase() === kind.toLowerCase());
}

export function partnershipCanProceed(input: { commitment: string; leadershipApproved: boolean }) {
  if (!formalCommitmentNeedsApproval(input.commitment)) return true;
  return input.leadershipApproved;
}

export function surveyIsOpen(input: { status: string; startOn?: string; endOn?: string; today: string }) {
  if (input.status !== "Open") return false;
  if (input.startOn && input.today < input.startOn) return false;
  if (input.endOn && input.today > input.endOn) return false;
  return true;
}

export function trackingLink(origin: string, slug: string, source: string) {
  const url = new URL(`/go/${encodeURIComponent(slug)}`, origin.endsWith("/") ? origin : `${origin}/`);
  url.searchParams.set("utm_source", source || "social");
  url.searchParams.set("utm_medium", "organic");
  url.searchParams.set("utm_campaign", slug);
  return url.toString();
}
