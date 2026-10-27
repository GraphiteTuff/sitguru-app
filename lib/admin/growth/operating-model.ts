/**
 * SitGuru Growth operating model — Teams communicate, Planner manages work,
 * Growth Workspace measures outcomes. No Graph sync in this milestone.
 */

import { isSitGuruWorkEmail } from "@/lib/admin/growth/teams-access";

export type GrowthResourceLink = {
  id: string;
  label: string;
  detail: string;
  href: string;
  external?: boolean;
};

function envUrl(name: string) {
  const value = String(process.env[name] || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

/** Configurable deep links — never hardcode tenant-specific Microsoft URLs. */
export function getGrowthResourceLinks(input?: {
  intern?: boolean;
  /** Viewer email — Teams shortcuts only for @sitguru.com work mailboxes. */
  email?: string | null;
}): GrowthResourceLink[] {
  const intern = Boolean(input?.intern);
  const links: GrowthResourceLink[] = [];

  const teams = envUrl("NEXT_PUBLIC_SITGURU_TEAMS_GROWTH_URL");
  if (teams && isSitGuruWorkEmail(input?.email)) {
    links.push({
      id: "teams",
      label: "Open Teams workspace",
      detail: "SitGuru | Marketing & Community Growth — discuss, meet, share context",
      href: teams,
      external: true,
    });
  }

  const planner = envUrl("NEXT_PUBLIC_SITGURU_PLANNER_GROWTH_URL");
  if (planner) {
    links.push({
      id: "planner",
      label: "Open Planner",
      detail: "Assignments, due dates, Ava Review, and Results & Learning buckets",
      href: planner,
      external: true,
    });
  }

  const brandKit = envUrl("NEXT_PUBLIC_SITGURU_BRAND_KIT_URL");
  if (brandKit) {
    links.push({
      id: "brand-kit",
      label: "Open Brand Kit",
      detail: "Canva / brand assets — creative production stays outside SitGuru",
      href: brandKit,
      external: true,
    });
  }

  if (intern) {
    links.push({
      id: "intern-portal",
      label: "Intern Portal",
      detail: "Hours, university requirements, weekly check-ins, final project",
      href: "/intern",
    });
  } else {
    links.push({
      id: "manager-desk",
      label: "Intern Team Desk",
      detail: "Formal oversight of interns assigned to the Growth Manager",
      href: "/intern/manage",
    });
    links.push({
      id: "intern-portal",
      label: "Intern Portal",
      detail: "Academic system of record (not a second task board)",
      href: "/intern",
    });
  }

  return links;
}

export const GROWTH_RESPONSIBILITY_MAP = [
  {
    system: "Microsoft Teams",
    purpose: "Communication and collaboration",
    owns: [
      "Discussions and brainstorming",
      "Meetings and quick updates",
      "Strategy conversations",
      "Campaign / event coordination chat",
      "Analytics and Results channel discussion",
    ],
  },
  {
    system: "Microsoft Planner",
    purpose: "Operational work management",
    owns: [
      "Assignments, owners, due dates, priorities",
      "Workflow buckets including Ava Review and Jason Approval when required",
      "Content production and event preparation checklists",
      "Survey drafting and research assignments",
      "Growth Manager work and intern work",
    ],
  },
  {
    system: "SharePoint",
    purpose: "Official shared team files",
    owns: ["Final reports", "Reusable assets", "Campaign documents"],
  },
  {
    system: "OneDrive",
    purpose: "Individual drafts",
    owns: ["Personal working files"],
  },
  {
    system: "Canva",
    purpose: "Creative production",
    owns: ["Graphics, Reels covers, templates"],
  },
  {
    system: "SitGuru Growth Workspace",
    purpose: "Business outcomes and growth intelligence",
    owns: [
      "What happened / how much SitGuru grew",
      "Event acquisition results",
      "Campaign performance outcomes",
      "Ambassador growth metrics",
      "Surveys / polls / market learning",
      "Recommendations and Results & Learning bridge",
    ],
  },
  {
    system: "SitGuru Intern Portal",
    purpose: "Formal internship system of record",
    owns: ["Hours", "University requirements", "Milestones", "Weekly check-ins", "Final project"],
  },
  {
    system: "Ava Manager Desk",
    purpose: "Formal oversight of assigned interns",
    owns: ["Intern assignment review", "Hours approval", "Academic evidence"],
  },
  {
    system: "Admin Portal",
    purpose: "Access, roles, and administration",
    owns: [
      "Assign Social Media & Community Growth Manager role",
      "Staff role management",
      "Intern manager assignment",
    ],
  },
] as const;

export const GROWTH_OPERATING_LOOP = [
  "Founder sets company direction",
  "Growth Manager develops strategy",
  "Teams is used for discussion/collaboration",
  "Planner turns strategy into executable work",
  "Growth Manager and interns execute",
  "Growth Workspace records and measures results",
  "Growth Manager documents learning and recommendations",
  "Founder + Growth Manager review results",
  "New strategy / experiments — repeat",
] as const;

export const GROWTH_FOUNDER_APPROVAL_CASES = [
  "Substantial spending",
  "Paid advertising budget",
  "Contracts and major external partnerships",
  "Major public policy statements",
  "Legal issues, compensation, worker status",
  "Company-wide brand changes",
  "High-risk decisions",
] as const;
