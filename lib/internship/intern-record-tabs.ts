/**
 * Local navigation for the admin intern record.
 * Preserve hashes used by existing internship links and action menus.
 */
export const INTERN_RECORD_TABS = [
  {
    id: "overview",
    label: "Overview",
    title: "At a glance",
    description: "Approval decisions, priorities and a concise view of this intern's progress.",
    hash: "profile",
  },
  {
    id: "work",
    label: "Work & Reviews",
    title: "Assignments & growth work",
    description: "Manage the existing tasks, campaigns, weekly reviews and final project.",
    hash: "work",
  },
  {
    id: "results",
    label: "Results",
    title: "Growth results & KPIs",
    description: "Live marketplace metrics, SMART targets and employer KPI assessments.",
    hash: "results",
  },
  {
    id: "academic",
    label: "Academic",
    title: "University & academic plan",
    description: "University-specific course information, hour requirements and paperwork.",
    hash: "academic",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    title: "Onboarding & documents",
    description: "Signatures, confidentiality agreements and secure document evidence.",
    hash: "onboarding",
  },
] as const;

export type InternRecordTab = (typeof INTERN_RECORD_TABS)[number]["id"];

export function internRecordTabFromHash(hash: string): InternRecordTab {
  const clean = String(hash || "").replace(/^#/, "").trim().toLowerCase();
  if (clean === "approvals" || clean === "profile" || clean === "overview" || !clean) return "overview";
  const match = INTERN_RECORD_TABS.find((tab) => tab.hash === clean || tab.id === clean);
  return match?.id || "overview";
}
