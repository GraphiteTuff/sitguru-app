/** Ava-facing Manager Portal — not Intern Portal, not Admin HQ identity. */

export const MANAGER_PORTAL_BRAND = {
  kicker: "Social Media & Community Growth Manager",
  title: "Manager Portal",
  deskTitle: "Manager Desk",
  growthTitle: "Growth Home",
  homePath: "/manager",
  deskPath: "/manager",
  growthPath: "/manager/growth",
  campaignsPath: "/manager/campaigns",
  teamPath: "/manager/team",
  assignmentsPath: "/manager/assignments",
  checkInsPath: "/manager/check-ins",
  milestonesPath: "/manager/milestones",
  messagesPath: "/manager/messages",
  reportsPath: "/manager/analytics",
  helpPath: "/admin/help/manager",
  settingsPath: "/manager/onboarding",
  adminGrowthPath: "/admin/growth",
  tagline: "People grow. Pets bring us together.",
  heroLine: "Same people. Happier pets. Bigger impact.",
} as const;

/**
 * Desktop sidebar — light chrome + SitGuru green active.
 * Content layouts follow the full Manager Portal mockup set.
 */
export const MANAGER_PORTAL_SIDEBAR = [
  { href: "/manager", label: "Home", match: "none" as const },
  { href: "/manager/growth", label: "Growth Home", match: "growth-home" as const },
  { href: "/manager", label: "Manager Desk", match: "exact" as const },
  { href: "/manager/my-time", label: "My Time", match: "prefix" as const },
  { href: "/manager/payments", label: "My Payments", match: "prefix" as const },
  { href: "/manager/team", label: "My Team", match: "prefix" as const },
  { href: "/manager/assignments", label: "Assignments", match: "prefix" as const },
  { href: "/manager/check-ins", label: "Check-Ins", match: "prefix" as const },
  { href: "/manager/milestones", label: "Milestones", match: "prefix" as const },
  { href: "/manager/messages", label: "Messaging", match: "prefix" as const },
  { href: "/manager/analytics", label: "Reports", match: "prefix" as const },
  { href: "/admin/help/manager", label: "Help", match: "prefix" as const },
] as const;

/** Compact top/mobile nav. */
export const MANAGER_PORTAL_NAV = [
  { href: "/manager", label: "Desk" },
  { href: "/manager/growth", label: "Growth" },
  { href: "/manager/messages", label: "Messages" },
  { href: "/manager/team", label: "Team" },
  { href: "/manager/my-time", label: "My Time" },
  { href: "/manager/payments", label: "Pay" },
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
] as const;

export function isManagerGrowthPath(pathname: string) {
  return MANAGER_GROWTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isManagerGrowthHomePath(pathname: string) {
  return pathname === "/manager/growth" || pathname.startsWith("/manager/growth/");
}
