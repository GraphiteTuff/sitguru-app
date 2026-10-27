/** Intern Portal chrome — matches student desk mockup across desktop + mobile. */

import { INTERNSHIP_HELP_PATH, INTERNSHIP_GROWTH_PATH } from "@/lib/internship/intern-growth";

export const INTERN_PORTAL_BRAND = {
  title: "Intern Portal",
  tagline: "Happy Pets. Stronger Communities.",
  sidebarFooter: "Good work today makes a brighter tomorrow for pets.",
  heroLine: "Same people. Happier pets. Bigger impact.",
  quickActionsLine: "Small steps create big change!",
} as const;

export const INTERN_PORTAL_SIDEBAR = [
  { id: "home", href: "/intern", label: "Home", match: "exact" as const },
  {
    id: "growth",
    href: INTERNSHIP_GROWTH_PATH,
    label: "Growth Workspace",
    match: "growth" as const,
  },
  { id: "work", href: "/intern?tab=work", label: "My Assignments", match: "work" as const },
  { id: "hours", href: "/intern/time", label: "My Hours", match: "hours" as const },
  {
    id: "checkins",
    href: "/intern?tab=work&focus=checkin",
    label: "My Check-ins",
    match: "checkin" as const,
  },
  { id: "milestones", href: "/intern?tab=project", label: "My Progress", match: "project" as const },
  {
    id: "messages",
    href: "/intern?tab=home&focus=messages",
    label: "Messages",
    match: "messages" as const,
  },
  { id: "help", href: INTERNSHIP_HELP_PATH, label: "Help", match: "help" as const },
] as const;

/** Primary mobile bottom bar — 5 slots max for thumb reach. */
export const INTERN_PORTAL_MOBILE_PRIMARY = [
  { id: "home", href: "/intern", label: "Home" },
  { id: "work", href: "/intern?tab=work", label: "Work" },
  { id: "hours", href: "/intern/time", label: "Hours" },
  { id: "checkins", href: "/intern?tab=work&focus=checkin", label: "Check-In" },
  { id: "more", href: "#more", label: "More" },
] as const;

export const INTERN_PORTAL_MOBILE_MORE = [
  { href: INTERNSHIP_GROWTH_PATH, label: "Growth Workspace" },
  { href: "/intern?tab=project", label: "My Progress" },
  { href: INTERNSHIP_HELP_PATH, label: "Help" },
  { href: "/intern?edit=page", label: "Your page" },
] as const;

export function isInternPortalChromePath(pathname: string) {
  if (pathname === "/intern/login" || pathname.startsWith("/intern/login/")) return false;
  if (pathname === "/intern/onboarding" || pathname.startsWith("/intern/onboarding/")) return false;
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
  const focus = params.get("focus") || "";

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
  if (item.match === "work") {
    return (pathname === "/intern" || pathname === "/intern/") && tab === "work" && focus !== "checkin";
  }
  if (item.match === "checkin") {
    return (pathname === "/intern" || pathname === "/intern/") && focus === "checkin";
  }
  if (item.match === "messages") {
    return focus === "messages";
  }
  if (item.match === "project") {
    return (pathname === "/intern" || pathname === "/intern/") && tab === "project";
  }
  return false;
}
