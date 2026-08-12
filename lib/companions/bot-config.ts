/**
 * Public + workspace AI companion routing.
 * Public routes never require useGuruAuth — companions mount as guests.
 */

import {
  isGuruWorkspacePath,
  isPublicGuruOnboardingPath,
  matchesRoutePrefix,
  SCOUT_PUBLIC_GURU_ROUTE_PREFIXES,
  SCOUT_WORKSPACE_ROUTE_PREFIXES,
} from "@/lib/companions/scout-routes";

export type CompanionBotVariant = "scout" | "taco" | "rogue";

export type CompanionBotConfig = {
  shouldRender: boolean;
  variant: CompanionBotVariant | null;
  /** Scout / Taco / Rogue surface keys. */
  surface: "public-guru" | "public-parent" | "workspace" | "onboarding" | null;
};

const AMBASSADOR_PUBLIC_PREFIXES = [
  "/ambassadors",
  "/programs/ambassadors",
  "/ambassador/join",
] as const;

const AMBASSADOR_WORKSPACE_PREFIXES = [
  "/ambassador/dashboard",
  "/ambassador/training",
  "/ambassador/documents",
  "/ambassador/onboarding-video",
] as const;

const AMBASSADOR_AUTH_PREFIXES = ["/ambassador/login"] as const;

export type CompanionLayoutMode =
  | "public-guru"
  | "public-ambassador"
  | "public-parent"
  | "public-investor"
  | "guru-workspace"
  | "ambassador-workspace"
  | "onboarding"
  | "workspace"
  | "auto";

function normalizePath(pathname: string | null | undefined) {
  if (!pathname) return "";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/**
 * Explicit public form-route entry map (contact + onboarding shells).
 * Prefer this helper from forms; getBotConfig remains the shared resolver.
 */
export function resolvePublicFormVariant(
  mode: CompanionLayoutMode | undefined,
): CompanionBotVariant | null {
  if (mode === "public-guru") return "scout";
  if (mode === "public-ambassador") return "taco";
  if (mode === "public-parent" || mode === "public-investor") return "rogue";
  return null;
}

export function getBotConfig(options: {
  mode?: CompanionLayoutMode | null;
  currentPath?: string | null;
}): CompanionBotConfig {
  const mode = options.mode ?? "auto";
  const currentPath = normalizePath(options.currentPath);

  // Explicit layout modes (public never implies Guru auth).
  if (mode === "public-guru") {
    return { shouldRender: true, variant: "scout", surface: "public-guru" };
  }
  if (mode === "public-ambassador") {
    return { shouldRender: true, variant: "taco", surface: "onboarding" };
  }
  if (mode === "public-parent" || mode === "public-investor") {
    return { shouldRender: true, variant: "rogue", surface: "public-parent" };
  }
  if (mode === "guru-workspace" || mode === "workspace") {
    // Path can still override to public Scout when under Become a Guru.
    if (
      currentPath === "/become-a-guru" ||
      matchesRoutePrefix(currentPath, SCOUT_PUBLIC_GURU_ROUTE_PREFIXES)
    ) {
      return { shouldRender: true, variant: "scout", surface: "public-guru" };
    }
    return { shouldRender: true, variant: "scout", surface: "workspace" };
  }
  if (mode === "onboarding") {
    // Legacy onboarding: prefer Guru path, else Taco conversion.
    if (
      currentPath === "/become-a-guru" ||
      matchesRoutePrefix(currentPath, SCOUT_PUBLIC_GURU_ROUTE_PREFIXES)
    ) {
      return { shouldRender: true, variant: "scout", surface: "public-guru" };
    }
    return { shouldRender: true, variant: "taco", surface: "onboarding" };
  }
  if (mode === "ambassador-workspace") {
    return { shouldRender: true, variant: "taco", surface: "workspace" };
  }

  // Path-first auto detection (public routes — no auth).
  if (
    currentPath === "/become-a-guru" ||
    currentPath.startsWith("/become-a-guru/") ||
    isPublicGuruOnboardingPath(currentPath)
  ) {
    return { shouldRender: true, variant: "scout", surface: "public-guru" };
  }

  if (isGuruWorkspacePath(currentPath)) {
    return { shouldRender: true, variant: "scout", surface: "workspace" };
  }

  // Catch-all remaining private Guru tools under /guru/* that aren't public profiles.
  if (
    currentPath.startsWith("/guru/") &&
    currentPath !== "/guru/login" &&
    !matchesRoutePrefix(currentPath, SCOUT_PUBLIC_GURU_ROUTE_PREFIXES) &&
    matchesRoutePrefix(currentPath, SCOUT_WORKSPACE_ROUTE_PREFIXES)
  ) {
    return { shouldRender: true, variant: "scout", surface: "workspace" };
  }

  if (matchesRoutePrefix(currentPath, AMBASSADOR_AUTH_PREFIXES)) {
    return { shouldRender: false, variant: null, surface: null };
  }

  if (
    currentPath === "/ambassadors" ||
    matchesRoutePrefix(currentPath, AMBASSADOR_PUBLIC_PREFIXES)
  ) {
    return { shouldRender: true, variant: "taco", surface: "onboarding" };
  }

  if (matchesRoutePrefix(currentPath, AMBASSADOR_WORKSPACE_PREFIXES)) {
    return { shouldRender: true, variant: "taco", surface: "workspace" };
  }

  // Any other /ambassador/* internal page (except login) gets Taco.
  if (
    currentPath === "/ambassador" ||
    currentPath.startsWith("/ambassador/")
  ) {
    return { shouldRender: true, variant: "taco", surface: "workspace" };
  }

  if (currentPath === "/contact" || currentPath.startsWith("/contact/")) {
    return { shouldRender: true, variant: "rogue", surface: "public-parent" };
  }
  if (
    (currentPath === "/partners" ||
      currentPath === "/partners/local" ||
      currentPath === "/partners/national" ||
      currentPath === "/partners/affiliates" ||
      currentPath === "/partners/ambassadors" ||
      currentPath === "/partners/apply") &&
    !currentPath.startsWith("/partners/dashboard")
  ) {
    // Public partners hub — Rogue by default; form pages override via mode prop.
    return { shouldRender: true, variant: "rogue", surface: "public-parent" };
  }

  // Logged-in Pet Parent surfaces — Rogue is the Pet Parent AI Companion.
  if (
    currentPath === "/customer" ||
    currentPath.startsWith("/customer/") ||
    currentPath === "/messages" ||
    currentPath.startsWith("/messages/") ||
    currentPath === "/pets" ||
    currentPath.startsWith("/pets/") ||
    currentPath === "/bookings" ||
    currentPath.startsWith("/bookings/") ||
    currentPath === "/parent" ||
    currentPath.startsWith("/parent/")
  ) {
    // Keep login/signup free of the floating chat bubble.
    if (
      currentPath === "/customer/login" ||
      currentPath === "/customer/signup" ||
      currentPath.startsWith("/customer/login/") ||
      currentPath.startsWith("/customer/signup/")
    ) {
      return { shouldRender: false, variant: null, surface: null };
    }

    return { shouldRender: true, variant: "rogue", surface: "public-parent" };
  }

  return { shouldRender: false, variant: null, surface: null };
}

/** Map contact partnership path → companion layout mode. */
export function companionModeFromPartnerType(
  partnerType: "parent" | "guru" | "ambassador" | "partner" | "investor",
): CompanionLayoutMode {
  if (partnerType === "guru") return "public-guru";
  if (partnerType === "ambassador") return "public-ambassador";
  if (partnerType === "investor" || partnerType === "partner") {
    return "public-investor";
  }
  return "public-parent";
}

export function isPublicCompanionPath(pathname: string | null | undefined) {
  const config = getBotConfig({ mode: "auto", currentPath: pathname });
  return (
    config.shouldRender &&
    (config.surface === "public-guru" ||
      config.surface === "onboarding" ||
      config.surface === "public-parent")
  );
}
