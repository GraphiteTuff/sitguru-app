/**
 * Public + workspace AI companion routing.
 * Public routes never require useGuruAuth — companions mount as guests.
 */

import {
  matchesRoutePrefix,
  SCOUT_PUBLIC_GURU_ROUTE_PREFIXES,
  SCOUT_WORKSPACE_ROUTE_PREFIXES,
} from "@/lib/companions/scout-routes";

export type CompanionBotVariant = "scout" | "taco";

export type CompanionBotConfig = {
  shouldRender: boolean;
  variant: CompanionBotVariant | null;
  /** Scout: public-guru | workspace. Taco: onboarding | workspace. */
  surface: "public-guru" | "workspace" | "onboarding" | null;
};

const AMBASSADOR_PUBLIC_PREFIXES = ["/ambassadors", "/programs/ambassadors"] as const;
const AMBASSADOR_WORKSPACE_PREFIXES = [
  "/ambassador/dashboard",
  "/ambassador/training",
] as const;

export type CompanionLayoutMode =
  | "public-guru"
  | "guru-workspace"
  | "public-ambassador"
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
 * Resolve which companion bot to mount from layout mode + current route.
 * Mirrors homepage Rogue: public pages render without auth redirects.
 */
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
  if (mode === "public-ambassador" || mode === "onboarding") {
    // `onboarding` historically meant public conversion; prefer path when present.
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
    matchesRoutePrefix(currentPath, SCOUT_PUBLIC_GURU_ROUTE_PREFIXES)
  ) {
    return { shouldRender: true, variant: "scout", surface: "public-guru" };
  }
  if (
    currentPath === "/ambassadors" ||
    matchesRoutePrefix(currentPath, AMBASSADOR_PUBLIC_PREFIXES)
  ) {
    return { shouldRender: true, variant: "taco", surface: "onboarding" };
  }
  if (matchesRoutePrefix(currentPath, SCOUT_WORKSPACE_ROUTE_PREFIXES)) {
    return { shouldRender: true, variant: "scout", surface: "workspace" };
  }
  if (matchesRoutePrefix(currentPath, AMBASSADOR_WORKSPACE_PREFIXES)) {
    return { shouldRender: true, variant: "taco", surface: "workspace" };
  }

  return { shouldRender: false, variant: null, surface: null };
}

export function isPublicCompanionPath(pathname: string | null | undefined) {
  const config = getBotConfig({ mode: "auto", currentPath: pathname });
  return (
    config.shouldRender &&
    (config.surface === "public-guru" || config.surface === "onboarding")
  );
}
