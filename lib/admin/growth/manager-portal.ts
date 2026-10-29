/** Ava-facing Manager Portal — not Intern Portal, not Admin HQ identity. */

import { MANAGER_ROUTES } from "@/lib/admin/growth/manager-routes";

export const MANAGER_PORTAL_BRAND = {
  kicker: "Social Media & Community Growth Manager",
  title: "Manager Portal",
  deskTitle: "Manager's Desk",
  growthTitle: "Growth Home",
  homePath: MANAGER_ROUTES.home,
  deskPath: MANAGER_ROUTES.desk,
  growthPath: MANAGER_ROUTES.growth,
  campaignsPath: MANAGER_ROUTES.campaigns,
  teamPath: MANAGER_ROUTES.team,
  assignmentsPath: MANAGER_ROUTES.assignments,
  checkInsPath: MANAGER_ROUTES.checkIns,
  milestonesPath: MANAGER_ROUTES.milestones,
  messagesPath: MANAGER_ROUTES.messages,
  resultsPath: MANAGER_ROUTES.results,
  calendarPath: MANAGER_ROUTES.calendar,
  metricsPath: MANAGER_ROUTES.metrics,
  reportsPath: MANAGER_ROUTES.reports,
  toolkitPath: MANAGER_ROUTES.toolkit,
  trainingPath: MANAGER_ROUTES.training,
  resourcesPath: MANAGER_ROUTES.resources,
  helpPath: MANAGER_ROUTES.help,
  settingsPath: MANAGER_ROUTES.settings,
  adminGrowthPath: "/admin/growth",
  tagline: "People grow. Pets bring us together.",
  heroLine: "Same people. Happier pets. Bigger impact.",
} as const;

/**
 * Desktop sidebar — light chrome + SitGuru green active.
 * Peers intern menu where Ava needs the same one-click surfaces.
 */
export const MANAGER_PORTAL_SIDEBAR = [
  { href: MANAGER_ROUTES.home, label: "Home", match: "none" as const },
  { href: MANAGER_ROUTES.growth, label: "Growth Home", match: "growth-home" as const },
  { href: MANAGER_ROUTES.campusGrowth, label: "Campus Growth", match: "prefix" as const },
  { href: MANAGER_ROUTES.desk, label: "Manager's Desk", match: "exact" as const },
  { href: MANAGER_ROUTES.myTime, label: "My Time", match: "prefix" as const },
  { href: MANAGER_ROUTES.payments, label: "My Payments", match: "prefix" as const },
  { href: MANAGER_ROUTES.team, label: "My Team", match: "prefix" as const },
  { href: MANAGER_ROUTES.assignments, label: "Assignments", match: "prefix" as const },
  { href: MANAGER_ROUTES.checkIns, label: "Check-Ins", match: "prefix" as const },
  { href: MANAGER_ROUTES.milestones, label: "Milestones", match: "prefix" as const },
  { href: MANAGER_ROUTES.messages, label: "Messaging", match: "prefix" as const },
  { href: MANAGER_ROUTES.results, label: "Live Results", match: "prefix" as const },
  { href: MANAGER_ROUTES.calendar, label: "Calendar", match: "prefix" as const },
  { href: MANAGER_ROUTES.metrics, label: "Metrics", match: "prefix" as const },
  { href: MANAGER_ROUTES.reports, label: "Business Growth Report", match: "prefix" as const },
  { href: MANAGER_ROUTES.toolkit, label: "Manager Toolkit", match: "prefix" as const },
  { href: MANAGER_ROUTES.training, label: "Training", match: "prefix" as const },
  { href: MANAGER_ROUTES.resources, label: "Resources", match: "prefix" as const },
  { href: MANAGER_ROUTES.help, label: "Help", match: "prefix" as const },
] as const;

/** Compact top/mobile nav. */
export const MANAGER_PORTAL_NAV = [
  { href: MANAGER_ROUTES.desk, label: "Desk" },
  { href: MANAGER_ROUTES.growth, label: "Growth" },
  { href: MANAGER_ROUTES.messages, label: "Messages" },
  { href: MANAGER_ROUTES.team, label: "Team" },
  { href: MANAGER_ROUTES.results, label: "Results" },
  { href: MANAGER_ROUTES.myTime, label: "My Time" },
] as const;

export const MANAGER_GROWTH_PREFIXES = [
  "/manager/growth",
  "/manager/campaigns",
  "/manager/events",
  "/manager/analytics",
  "/manager/intelligence",
  "/manager/content",
  "/manager/media",
  "/manager/create",
  "/manager/gurus",
  "/manager/partners",
  "/manager/results",
  "/manager/metrics",
] as const;

export function isManagerGrowthPath(pathname: string) {
  return MANAGER_GROWTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isManagerGrowthHomePath(pathname: string) {
  return pathname === "/manager/growth" || pathname.startsWith("/manager/growth/");
}
