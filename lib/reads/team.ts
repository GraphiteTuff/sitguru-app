/** Canonical SitGuru Reads team identities, avatars, and facing-page name rules. */

export const READS_TEAM_AVATARS: Record<string, string> = {
  "jason-graff": "/images/staff/jason-graff.jpg",
  "danette-graff": "/images/staff/danette-graff.jpg",
  "ava-venezia": "/images/staff/ava-venezia.jpg",
  "ryan-manibo": "/images/staff/ryan-manibo.jpg",
  "lola-uhl": "/images/staff/lola-uhl.jpg",
};

export function readsTeamAvatar(input: {
  slug?: string | null;
  avatar_url?: string | null;
  full_name?: string | null;
}) {
  const slug = String(input.slug || "").trim().toLowerCase();
  if (slug && READS_TEAM_AVATARS[slug]) return READS_TEAM_AVATARS[slug];
  const existing = String(input.avatar_url || "").trim();
  if (existing) return existing;
  const name = String(input.full_name || "").trim().toLowerCase();
  if (name.startsWith("jason")) return READS_TEAM_AVATARS["jason-graff"];
  if (name.startsWith("danette") || name.startsWith("nette")) {
    return READS_TEAM_AVATARS["danette-graff"];
  }
  if (name.startsWith("ava")) return READS_TEAM_AVATARS["ava-venezia"];
  if (name.startsWith("ryan")) return READS_TEAM_AVATARS["ryan-manibo"];
  if (name.startsWith("lola")) return READS_TEAM_AVATARS["lola-uhl"];
  return null;
}

/** Public facing pages show first names only (Jason, Ava, …). */
export function readsTeamFirstName(fullName?: string | null) {
  const trimmed = String(fullName || "").trim();
  if (!trimmed) return "Team";
  return trimmed.split(/\s+/)[0] || trimmed;
}

export function readsTeamPickLabel(fullName?: string | null) {
  return `${readsTeamFirstName(fullName)}'s Pick`;
}
