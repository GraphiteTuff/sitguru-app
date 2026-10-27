/** Ava-facing Manager Portal — not Intern Portal, not Admin HQ identity. */

export const MANAGER_PORTAL_BRAND = {
  kicker: "Social Media & Community Growth Manager",
  title: "Manager Portal",
  deskTitle: "Manager Desk",
  homePath: "/manager",
  deskPath: "/intern/manage",
  growthPath: "/manager/growth",
  campaignsPath: "/manager/campaigns",
  adminGrowthPath: "/admin/growth",
  helpPath: "/admin/help/manager",
  tagline: "People grow. Pets bring us together.",
  heroLine: "Same people. Happier pets. Bigger impact.",
} as const;

/** Desktop sidebar — Manager Desk + Growth Workspace mockups. */
export const MANAGER_PORTAL_SIDEBAR = [
  { href: "/manager", label: "Home", match: "none" as const },
  { href: "/manager/growth", label: "Growth Workspace", match: "growth" as const },
  { href: "/manager", label: "Manager Desk", match: "exact" as const },
  { href: "/manager/my-time", label: "My Time", match: "prefix" as const },
  { href: "/manager/payments", label: "My Payments", match: "prefix" as const },
  { href: "/intern/manage", label: "My Team", match: "prefix" as const },
  { href: "/manager/messages", label: "Messaging", match: "prefix" as const },
  { href: "/manager/analytics", label: "Reports", match: "prefix" as const },
  { href: "/admin/help/manager", label: "Help", match: "prefix" as const },
] as const;

/** Compact top/mobile nav. */
export const MANAGER_PORTAL_NAV = [
  { href: "/manager", label: "Desk" },
  { href: "/manager/growth", label: "Growth" },
  { href: "/manager/messages", label: "Messages" },
  { href: "/intern/manage", label: "Team" },
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
