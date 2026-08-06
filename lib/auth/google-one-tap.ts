/**
 * Shared Google One-Tap / role redirect helpers.
 */

export type OneTapRole = "pet_parent" | "guru" | "ambassador";

export function normalizeOneTapRole(value: unknown): OneTapRole {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    ["guru", "future_guru", "provider", "sitter", "pet_guru"].includes(
      normalized,
    )
  ) {
    return "guru";
  }

  if (
    ["ambassador", "partner", "community_ambassador", "student_ambassador"].includes(
      normalized,
    )
  ) {
    return "ambassador";
  }

  return "pet_parent";
}

/** Operational dashboards only — never profile/settings traps. */
export function redirectUrlForRole(role: OneTapRole): string {
  if (role === "guru") return "/guru/dashboard";
  if (role === "ambassador") return "/ambassador/dashboard";
  return "/customer/dashboard";
}

export function intentFromOneTapRole(
  role: OneTapRole,
): "pet_parent" | "guru" | "ambassador" {
  return role;
}

export function getGoogleClientId() {
  return (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  ).trim();
}

export function getPublicGoogleClientId() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    ""
  ).trim();
}

/** Public marketing / onboarding surfaces where One-Tap may appear. */
export function isOneTapEligiblePath(pathname: string) {
  const path = String(pathname || "/");
  if (
    path.startsWith("/customer") ||
    path.startsWith("/guru") ||
    path.startsWith("/ambassador/dashboard") ||
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/auth")
  ) {
    return false;
  }

  return (
    path === "/" ||
    path.startsWith("/signup") ||
    path.startsWith("/register") ||
    path.startsWith("/login") ||
    path.startsWith("/pet-parents") ||
    path.startsWith("/pet-gurus") ||
    path.startsWith("/become-a-guru") ||
    path.startsWith("/become-a-sitter") ||
    path.startsWith("/ambassadors") ||
    path.startsWith("/programs") ||
    path.startsWith("/partners")
  );
}

export function inferRoleFromPath(pathname: string): OneTapRole {
  const path = String(pathname || "/");
  if (
    path.startsWith("/become-a-guru") ||
    path.startsWith("/become-a-sitter") ||
    path.startsWith("/pet-gurus") ||
    path.startsWith("/guru")
  ) {
    return "guru";
  }
  if (
    path.startsWith("/ambassadors") ||
    path.startsWith("/programs/ambassadors") ||
    path.startsWith("/partners/ambassadors") ||
    path.startsWith("/ambassador")
  ) {
    return "ambassador";
  }
  return "pet_parent";
}
