/**
 * Auth-aware companion CTAs and prompt directives.
 * Guests get signup invites; logged-in roles never get asked to join a role they already have.
 */

import {
  normalizeRogueUserType,
  type RogueUserTypeLabel,
} from "@/lib/chat/rogue-user-type";
import type { HomepageCtaId } from "@/lib/chat/homepage-cta";

export type CompanionViewerContext = {
  isAuthenticated: boolean;
  firstName?: string | null;
  /** Normalized SitGuru audience labels for this session. */
  roles: RogueUserTypeLabel[];
};

export function uniqueCompanionRoles(
  rawRoles: unknown[] | null | undefined,
): RogueUserTypeLabel[] {
  const labels = (rawRoles || [])
    .map((role) => normalizeRogueUserType(role))
    .filter(Boolean);
  const unique = Array.from(new Set(labels));
  // Drop Guest when any signed-in role is present (body intent often sends Guest).
  if (unique.some((role) => role !== "Guest Pet Parent")) {
    return unique.filter((role) => role !== "Guest Pet Parent");
  }
  return unique;
}

const ROLE_RANK: Record<RogueUserTypeLabel, number> = {
  "Guest Pet Parent": 1,
  "Pet Parent": 2,
  Ambassador: 3,
  Guru: 4,
  Admin: 5,
};

/**
 * Care-intent chips must never demote an authenticated Pet Parent/Guru to Guest.
 */
export function mergeCompanionIntentRole(
  current: RogueUserTypeLabel,
  inferred: RogueUserTypeLabel | null | undefined,
  viewer?: CompanionViewerContext | null,
): RogueUserTypeLabel {
  if (!inferred) return current;
  if (viewer?.isAuthenticated) {
    if (inferred === "Guest Pet Parent") return current;
    if ((ROLE_RANK[inferred] || 0) <= (ROLE_RANK[current] || 0)) {
      return current;
    }
  }
  return inferred;
}

export function primaryCompanionRole(
  roles: RogueUserTypeLabel[],
  fallback: RogueUserTypeLabel = "Guest Pet Parent",
): RogueUserTypeLabel {
  if (roles.includes("Admin")) return "Admin";
  if (roles.includes("Guru")) return "Guru";
  if (roles.includes("Ambassador")) return "Ambassador";
  if (roles.includes("Pet Parent")) return "Pet Parent";
  if (roles.includes("Guest Pet Parent")) return "Guest Pet Parent";
  return fallback;
}

export function allowsParentSignupCta(viewer?: CompanionViewerContext | null) {
  if (!viewer?.isAuthenticated) return true;
  return !(
    viewer.roles.includes("Pet Parent") ||
    viewer.roles.includes("Guru") ||
    viewer.roles.includes("Admin")
  );
}

export function allowsGuruSignupCta(viewer?: CompanionViewerContext | null) {
  if (!viewer?.isAuthenticated) return true;
  return !(viewer.roles.includes("Guru") || viewer.roles.includes("Admin"));
}

export function allowsAmbassadorSignupCta(
  viewer?: CompanionViewerContext | null,
) {
  if (!viewer?.isAuthenticated) return true;
  return !(
    viewer.roles.includes("Ambassador") || viewer.roles.includes("Admin")
  );
}

export function isCompanionCtaAllowed(
  ctaId: HomepageCtaId,
  viewer?: CompanionViewerContext | null,
): boolean {
  switch (ctaId) {
    case "parent":
    case "community_parent":
      return allowsParentSignupCta(viewer);
    case "guru":
    case "community_guru":
      return allowsGuruSignupCta(viewer);
    case "ambassador":
    case "ambassador_video":
    case "community_ambassador":
      return allowsAmbassadorSignupCta(viewer);
    default:
      return true;
  }
}

/** Strip signup markers the viewer should never see. */
export function stripDisallowedCompanionCtas(
  text: string,
  viewer?: CompanionViewerContext | null,
): string {
  let out = String(text || "");

  if (!allowsParentSignupCta(viewer)) {
    out = out
      .replace(/\[\[\s*cta:parent\s*\]\]/gi, " ")
      .replace(/\[\[\s*cta:community_parent\s*\]\]/gi, " ");
  }
  if (!allowsGuruSignupCta(viewer)) {
    out = out
      .replace(/\[\[\s*cta:guru\s*\]\]/gi, " ")
      .replace(/\[\[\s*cta:community_guru\s*\]\]/gi, " ");
  }
  if (!allowsAmbassadorSignupCta(viewer)) {
    out = out
      .replace(/\[\[\s*cta:ambassador\s*\]\]/gi, " ")
      .replace(/\[\[\s*cta:ambassador_video\s*\]\]/gi, " ")
      .replace(/\[\[\s*cta:community_ambassador\s*\]\]/gi, " ")
      .replace(/\[\[\s*ambassador_video_card\s*\]\]/gi, " ");
  }

  return out.replace(/[ \t]{2,}/g, " ").trim();
}

export function buildCompanionAuthPromptBlock(
  viewer?: CompanionViewerContext | null,
): string {
  if (!viewer?.isAuthenticated) {
    return `
AUTH SESSION: Visitor is NOT logged in.
- You may warmly invite free Pet Parent and/or Guru signup when it fits — use [[cta:parent]] / [[cta:guru]].
- If you do not know their name yet, ask once what to call them after a friendly beat.
- Never pretend they already have an account.`.trim();
  }

  const name = String(viewer.firstName || "").trim();
  const roles =
    viewer.roles.length > 0
      ? viewer.roles.join(", ")
      : "signed-in SitGuru member";

  const lines = [
    `AUTH SESSION: Visitor IS logged in.`,
    `Known SitGuru roles: ${roles}.`,
    name
      ? `Preferred name on file: ${name}. Use it. Do NOT ask "what's your name?" again.`
      : `Name not on file yet — ask once, warmly, what to call them.`,
    `- NEVER ask them to create / sign up for a role they already have.`,
  ];

  if (!allowsParentSignupCta(viewer)) {
    lines.push(
      `- They already have Pet Parent (or Guru/Admin) access — NEVER append [[cta:parent]] or say "Create Pet Parent Account". Help them find care, book, or open their dashboard instead.`,
    );
  }
  if (!allowsGuruSignupCta(viewer)) {
    lines.push(
      `- They are already a Guru/Admin — NEVER append [[cta:guru]] or push Become a Guru signup.`,
    );
  }
  if (!allowsAmbassadorSignupCta(viewer)) {
    lines.push(
      `- They are already an Ambassador/Admin — NEVER append [[cta:ambassador]] / video claim CTAs.`,
    );
  }

  return lines.join("\n");
}
