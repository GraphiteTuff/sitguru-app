/**
 * Display copy + opt-in helpers for the Veterans & Military Families Program.
 * Keep DB/API keys stable: veterans-hire, skillbridge-interest, military_hire, etc.
 */

/** Auth user_metadata / preference key for voluntary program membership. */
export const VETERANS_MILITARY_FAMILIES_OPT_IN_KEY =
  "joined_veterans_military_families" as const;

export const VETERANS_MILITARY_FAMILIES_PROGRAM = {
  key: "veterans-hire" as const,
  displayName: "Veterans & Military Families Program",
  shortName: "Veterans & Military Families",
  navLabel: "Veterans & Military Families",
  eyebrow: "Veterans & Military Families",
  /** Legacy admin/ops label aliases — prefer displayName in new UI. */
  legacyAliases: [
    "Military Hire",
    "Military Hire Program",
    "Veterans Hire",
    "Veterans Hire Program",
    "Military-Connected Pathway",
  ] as const,
  description:
    "A flexible pathway for veterans, military spouses, Guard, Reserve, qualified dependents age 18+, and transitioning service members.",
  optInLabel: "Join our Veterans & Military Families Program",
  optInHelper:
    "Optional. When you opt in, we can share pathway details and verification options. Core SitGuru stays the same for everyone.",
  applyCta: "Apply through the Veterans & Military Families Program",
  applyHref: "/programs/apply?program=veterans-hire",
  programsAnchorHref: "/programs#veterans-hire",
  footerHref: "/programs#veterans-hire",
  metadataKey: VETERANS_MILITARY_FAMILIES_OPT_IN_KEY,
  skillbridge: {
    key: "skillbridge-interest" as const,
    displayName: "SkillBridge Interest / Veterans Pathway",
    shortName: "SkillBridge Interest",
  },
} as const;

export function readVeteransMilitaryFamiliesOptIn(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  const value = metadata?.[VETERANS_MILITARY_FAMILIES_OPT_IN_KEY];
  return value === true || value === "true" || value === 1 || value === "1";
}

export type VeteransMilitaryFamiliesProgramKey =
  (typeof VETERANS_MILITARY_FAMILIES_PROGRAM)["key"];

/** True when a program key or free-text label refers to the veterans pathway. */
export function isVeteransMilitaryFamiliesProgram(
  value: string | null | undefined,
): boolean {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, " ");

  if (!normalized) return false;

  if (
    normalized === "veterans-hire" ||
    normalized === "military-hire" ||
    normalized === "military hire" ||
    normalized === "veterans hire" ||
    normalized.includes("veterans & military families") ||
    normalized.includes("military hire") ||
    normalized.includes("veterans hire") ||
    normalized.includes("military-connected")
  ) {
    return true;
  }

  return false;
}

/** Map stored program labels to the shared display name when appropriate. */
export function veteransMilitaryFamiliesDisplayName(
  value?: string | null,
): string {
  if (!value) return VETERANS_MILITARY_FAMILIES_PROGRAM.displayName;
  if (isVeteransMilitaryFamiliesProgram(value)) {
    return VETERANS_MILITARY_FAMILIES_PROGRAM.displayName;
  }
  return value;
}
