/** Flat Intern Portal destinations — one sidebar click = one information page. */

import { INTERNSHIP_GROWTH_PATH, INTERNSHIP_HELP_PATH } from "@/lib/internship/intern-growth";

export const INTERN_ROUTES = {
  home: "/intern",
  portal: "/intern",
  work: "/intern/work",
  assignments: "/intern/assignments",
  milestones: "/intern/milestones",
  hours: "/intern/time",
  checkIns: "/intern/check-ins",
  messages: "/intern/messages",
  results: "/intern/results",
  calendar: "/intern/calendar",
  metrics: "/intern/metrics",
  growth: INTERNSHIP_GROWTH_PATH,
  toolkit: "/intern/toolkit",
  training: "/intern/training",
  resources: "/intern/resources",
  help: INTERNSHIP_HELP_PATH,
  settings: "/intern/settings",
} as const;

export type InternRouteKey = keyof typeof INTERN_ROUTES;

/** Legacy tab/tool query → flat route (one click, no buried tabs). */
export function internLegacySectionRedirect(input: {
  tab?: string;
  focus?: string;
  tool?: string;
  work?: string;
  edit?: string;
}): string | null {
  const tab = String(input.tab || "").toLowerCase();
  const focus = String(input.focus || "").toLowerCase();
  const tool = String(input.tool || "").toLowerCase();
  const work = String(input.work || "").toLowerCase();
  const edit = String(input.edit || "").toLowerCase();

  if (edit === "page") return INTERN_ROUTES.settings;
  if (focus === "checkin" || focus === "check-in") return INTERN_ROUTES.checkIns;
  if (focus === "messages" || focus === "message") return INTERN_ROUTES.messages;
  if (tool === "brand" || tool === "toolkit") return INTERN_ROUTES.toolkit;
  if (tool === "calendar") return INTERN_ROUTES.calendar;
  if (tool === "metrics") return INTERN_ROUTES.metrics;
  if (tab === "work" || work === "tasks" || work === "assignments") {
    return INTERN_ROUTES.assignments;
  }
  if (tab === "project" || tab === "milestones") return INTERN_ROUTES.milestones;
  if (tab === "hours" || tab === "time") return INTERN_ROUTES.hours;
  if (tab === "messages") return INTERN_ROUTES.messages;
  if (tab === "growth") return INTERN_ROUTES.growth;
  if (tab === "help") return INTERN_ROUTES.help;
  return null;
}

export const INTERN_MENU_WIRED = [
  { key: "home", label: "Home", href: INTERN_ROUTES.home },
  { key: "portal", label: "Intern Portal", href: INTERN_ROUTES.portal },
  { key: "work", label: "My Work", href: INTERN_ROUTES.work },
  { key: "assignments", label: "My Assignments", href: INTERN_ROUTES.assignments },
  { key: "milestones", label: "My Milestones", href: INTERN_ROUTES.milestones },
  { key: "hours", label: "My Hours", href: INTERN_ROUTES.hours },
  { key: "checkIns", label: "My Check-Ins", href: INTERN_ROUTES.checkIns },
  { key: "messages", label: "Messages", href: INTERN_ROUTES.messages },
  { key: "results", label: "Live Results", href: INTERN_ROUTES.results },
  { key: "calendar", label: "Calendar", href: INTERN_ROUTES.calendar },
  { key: "metrics", label: "Metrics", href: INTERN_ROUTES.metrics },
  { key: "growth", label: "Business Growth Report", href: INTERN_ROUTES.growth },
  { key: "toolkit", label: "Intern Toolkit", href: INTERN_ROUTES.toolkit },
  { key: "training", label: "Training", href: INTERN_ROUTES.training },
  { key: "resources", label: "Resources", href: INTERN_ROUTES.resources },
  { key: "help", label: "Help", href: INTERN_ROUTES.help },
  { key: "settings", label: "Settings", href: INTERN_ROUTES.settings },
] as const;
