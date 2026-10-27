/** Intern Portal chrome — light sidebar + SitGuru green active; mockups drive page content. */

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
  { id: "home", href: "/intern", label: "Home", match: "exact" as const },
  { id: "portal", href: "/intern", label: "Intern Portal", match: "none" as const },
  { id: "work", href: "/intern/work", label: "My Work", match: "prefix" as const },
  {
    id: "assignments",
    href: "/intern/assignments",
    label: "My Assignments",
    match: "prefix" as const,
  },
  {
    id: "milestones",
    href: "/intern/milestones",
    label: "My Milestones",
    match: "prefix" as const,
  },
  { id: "hours", href: "/intern/time", label: "My Hours", match: "hours" as const },
  {
    id: "checkins",
    href: "/intern/check-ins",
    label: "My Check-Ins",
    match: "prefix" as const,
  },
  {
    id: "messages",
    href: "/intern/messages",
    label: "Messages",
    match: "prefix" as const,
  },
  {
    id: "results",
    href: "/intern/results",
    label: "Live Results",
    match: "prefix" as const,
  },
  {
    id: "calendar",
    href: "/intern/calendar",
    label: "Calendar",
    match: "prefix" as const,
  },
  {
    id: "metrics",
    href: "/intern/metrics",
    label: "Metrics",
    match: "prefix" as const,
  },
  {
    id: "growth",
    href: INTERNSHIP_GROWTH_PATH,
    label: "Business Growth Report",
    match: "growth" as const,
  },
  {
    id: "toolkit",
    href: "/intern/toolkit",
    label: "Intern Toolkit",
    match: "prefix" as const,
  },
  {
    id: "training",
    href: "/intern/training",
    label: "Training",
    match: "prefix" as const,
  },
  {
    id: "resources",
    href: "/intern/resources",
    label: "Resources",
    match: "prefix" as const,
  },
  { id: "help", href: INTERNSHIP_HELP_PATH, label: "Help", match: "help" as const },
] as const;

/** Primary mobile bottom bar — 5 slots max for thumb reach. */
export const INTERN_PORTAL_MOBILE_PRIMARY = [
  { id: "home", href: "/intern", label: "Home" },
  { id: "work", href: "/intern/work", label: "Work" },
  { id: "hours", href: "/intern/time", label: "Hours" },
  { id: "checkins", href: "/intern/check-ins", label: "Check-In" },
  { id: "more", href: "#more", label: "More" },
] as const;

export const INTERN_PORTAL_MOBILE_MORE = [
  { href: "/intern/assignments", label: "My Assignments" },
  { href: "/intern/milestones", label: "My Milestones" },
  { href: "/intern/messages", label: "Messages" },
  { href: "/intern/results", label: "Live Results" },
  { href: INTERNSHIP_GROWTH_PATH, label: "Growth Report" },
  { href: "/intern/toolkit", label: "Toolkit" },
  { href: INTERNSHIP_HELP_PATH, label: "Help" },
  { href: "/intern?edit=page", label: "Your page" },
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
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const tab = params.get("tab") || "";

  if (item.match === "none") return false;
  if (item.match === "exact") {
    return (pathname === "/intern" || pathname === "/intern/") && !tab;
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
