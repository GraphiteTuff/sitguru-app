export const REQUESTABLE_TEAM_ROLES = [
  { key: "social_community_manager", label: "Social Media & Community Growth Manager" },
  { key: "social_media_community_growth_intern", label: "Social Media & Community Growth Intern" },
] as const;

export type RequestableTeamRole = (typeof REQUESTABLE_TEAM_ROLES)[number]["key"];

export function requestableTeamRole(value: string) {
  return REQUESTABLE_TEAM_ROLES.find((role) => role.key === value) || null;
}

export function staffRequestOnCooldown(lastRequestedAt: string | null, now = Date.now()) {
  if (!lastRequestedAt) return false;
  const then = new Date(lastRequestedAt).getTime();
  if (!Number.isFinite(then)) return false;
  return now - then < 24 * 60 * 60 * 1000;
}

export function pendingRequestGrantsAccess() {
  return false;
}
