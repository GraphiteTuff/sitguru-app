/** Shared, staff-only community prospect workflow. Not an approved Guru/Partner registry. */

export const OUTREACH_STAGES = [
  "Identified",
  "Assigned",
  "Contacted",
  "Conversation",
  "Interested",
  "Follow-up scheduled",
  "Needs leadership approval",
  "Approved activity",
  "Partner enrolled",
  "Guru enrolled",
  "Spotlight published",
  "Not interested",
  "Closed",
] as const;

export const OUTREACH_PRIORITIES = ["Normal", "High", "Low"] as const;
export const OUTREACH_SOURCES = [
  "In-person encounter",
  "Referral",
  "Community event",
  "Social media",
  "Website",
  "Other",
] as const;
export const OUTREACH_INTERESTS = [
  "SitGuru Partner",
  "Become a Guru",
  "Community spotlight",
  "Cross-promotion",
  "Local events",
] as const;

export function isOutreachStage(value: string) {
  return (OUTREACH_STAGES as readonly string[]).includes(value);
}

export function outreachIsClosed(status: string) {
  return ["Closed", "Not interested"].includes(status);
}

export function normalizeOutreachState(state: string) {
  return state.trim().toUpperCase().slice(0, 2);
}

export function validOutreachInterests(value: string[]) {
  return [...new Set(value.filter((interest) =>
    (OUTREACH_INTERESTS as readonly string[]).includes(interest)
  ))];
}
