import type { ReadsTeamMember, ReadsTeamPick } from "./types";

export type TeamPickRosterItem = {
  member: ReadsTeamMember;
  pick: ReadsTeamPick | null;
};

/**
 * One card per teammate. Prefer each member's highest-priority active pick;
 * leave a placeholder when they have not published a pick yet.
 */
export function buildTeamPickRoster(
  members: ReadsTeamMember[],
  picks: ReadsTeamPick[],
): TeamPickRosterItem[] {
  const activeMembers = [...members]
    .filter((member) => member.is_active !== false)
    .sort(
      (a, b) =>
        (a.display_order ?? 100) - (b.display_order ?? 100) ||
        a.full_name.localeCompare(b.full_name),
    );

  const byMember = new Map<string, ReadsTeamPick[]>();
  for (const pick of picks) {
    const key =
      pick.team_member_id ||
      pick.team_member?.id ||
      pick.team_member?.slug ||
      "";
    if (!key) continue;
    const list = byMember.get(key) || [];
    list.push(pick);
    byMember.set(key, list);
    if (pick.team_member?.slug && pick.team_member.slug !== key) {
      const slugList = byMember.get(pick.team_member.slug) || [];
      slugList.push(pick);
      byMember.set(pick.team_member.slug, slugList);
    }
  }

  return activeMembers.map((member) => {
    const candidates = [
      ...(byMember.get(member.id) || []),
      ...(byMember.get(member.slug) || []),
    ];
    const unique = new Map<string, ReadsTeamPick>();
    for (const pick of candidates) unique.set(pick.id, pick);
    const sorted = [...unique.values()].sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        (a.display_order ?? 100) - (b.display_order ?? 100),
    );
    const pick = sorted[0] || null;
    return {
      member,
      pick: pick
        ? {
            ...pick,
            team_member: pick.team_member || member,
          }
        : null,
    };
  });
}
