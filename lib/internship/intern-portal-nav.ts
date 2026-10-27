/** Intern Portal chrome — light sidebar, one-click flat destinations. */

import { INTERN_ROUTES } from "@/lib/internship/intern-routes";
import { INTERNSHIP_HELP_PATH, INTERNSHIP_GROWTH_PATH } from "@/lib/internship/intern-growth";

export const INTERN_PORTAL_BRAND = {
  title: "Intern Portal",
  tagline: "Happy Pets. Stronger Communities.",
  sidebarFooter: "Good work today makes a brighter tomorrow for pets.",
  heroLine: "Same people. Happier pets. Bigger impact.",
  impactLine: "Learn. Create. Make an impact. Happier pets. Brighter communities.",
  quickActionsLine: "Small steps create big change!",
} as const;

export const INTERN_PORTAL_SIDEBAR = [
  { id: "home", href: INTERN_ROUTES.home, label: "Home", match: "exact" as const },
  { id: "portal", href: INTERN_ROUTES.portal, label: "Intern Portal", match: "none" as const },
  { id: "work", href: INTERN_ROUTES.work, label: "My Work", match: "prefix" as const },
  {
    id: "assignments",
    href: INTERN_ROUTES.assignments,
    label: "My Assignments",
    match: "prefix" as const,
  },
  {
    id: "milestones",
    href: INTERN_ROUTES.milestones,
    label: "My Milestones",
    match: "prefix" as const,
  },
  { id: "hours", href: INTERN_ROUTES.hours, label: "My Hours", match: "hours" as const },
  {
    id: "checkins",
    href: INTERN_ROUTES.checkIns,
    label: "My Check-Ins",
    match: "prefix" as const,
  },
  {
    id: "messages",
    href: INTERN_ROUTES.messages,
    label: "Messages",
    match: "prefix" as const,
  },
  {
    id: "results",
    href: INTERN_ROUTES.results,
    label: "Live Results",
    match: "prefix" as const,
  },
  {
    id: "calendar",
    href: INTERN_ROUTES.calendar,
    label: "Calendar",
    match: "prefix" as const,
  },
  {
    id: "metrics",
    href: INTERN_ROUTES.metrics,
    label: "Metrics",
    match: "prefix" as const,
  },
  {
    id: "growth",
    href: INTERN_ROUTES.growth,
    label: "Business Growth Report",
    match: "growth" as const,
  },
  {
    id: "toolkit",
    href: INTERN_ROUTES.toolkit,
    label: "Intern Toolkit",
    match: "prefix" as const,
  },
  {
    id: "training",
    href: INTERN_ROUTES.training,
    label: "Training",
    match: "prefix" as const,
  },
  {
    id: "resources",
    href: INTERN_ROUTES.resources,
    label: "Resources",
    match: "prefix" as const,
  },
  { id: "help", href: INTERN_ROUTES.help, label: "Help", match: "help" as const },
] as const;

export const INTERN_PORTAL_MOBILE_PRIMARY = [
  { id: "home", href: INTERN_ROUTES.home, label: "Home" },
  { id: "work", href: INTERN_ROUTES.work, label: "Work" },
  { id: "hours", href: INTERN_ROUTES.hours, label: "Hours" },
  { id: "checkins", href: INTERN_ROUTES.checkIns, label: "Check-In" },
  { id: "more", href: "#more", label: "More" },
] as const;

export const INTERN_PORTAL_MOBILE_MORE = [
  { href: INTERN_ROUTES.assignments, label: "My Assignments" },
  { href: INTERN_ROUTES.milestones, label: "My Milestones" },
  { href: INTERN_ROUTES.messages, label: "Messages" },
  { href: INTERN_ROUTES.results, label: "Live Results" },
  { href: INTERN_ROUTES.calendar, label: "Calendar" },
  { href: INTERN_ROUTES.metrics, label: "Metrics" },
  { href: INTERN_ROUTES.growth, label: "Growth Report" },
  { href: INTERN_ROUTES.toolkit, label: "Toolkit" },
  { href: INTERN_ROUTES.training, label: "Training" },
  { href: INTERN_ROUTES.resources, label: "Resources" },
  { href: INTERN_ROUTES.help, label: "Help" },
  { href: INTERN_ROUTES.settings, label: "Settings" },
] as const;

export function isInternPortalChromePath(pathname: string) {
  if (pathname === "/intern/login" || pathname.startsWith("/intern/login/")) return false;
  if (pathname === "/intern/onboarding" || pathname.startsWith("/intern/onboarding/")) return false;
  if (pathname === "/intern/manage" || pathname.startsWith("/intern/manage/")) return false;
  if (pathname.endsWith("/print")) return false;
  return pathname === "/intern" || pathname.startsWith("/intern/");
}

export function internPortalNavActive(
  pathname: string,
  search: string,
  item: (typeof INTERN_PORTAL_SIDEBAR)[number],
) {
  void search;
  if (item.match === "none") return false;
  if (item.match === "exact") {
    return pathname === "/intern" || pathname === "/intern/";
  }
  if (item.match === "growth") {
    return pathname === INTERNSHIP_GROWTH_PATH || pathname.startsWith(`${INTERNSHIP_GROWTH_PATH}/`);
  }
  if (item.match === "hours") {
    return pathname === "/intern/time" || pathname.startsWith("/intern/time/");
  }
  if (item.match === "help") {
    return pathname === INTERNSHIP_HELP_PATH || pathname.startsWith(`${INTERNSHIP_HELP_PATH}/`);
  }
  if (item.match === "prefix") {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return false;
}
