/**
 * OneNote shortcuts for SitGuru - Marketing & Community Growth Notebook.
 * Working knowledge stays in OneNote; SitGuru only deep-links for @sitguru.com
 * (Ava, Jason, Danette, and other Growth staff).
 */

import { isSitGuruWorkEmail } from "@/lib/admin/growth/teams-access";

export const SITGURU_ONENOTE_NOTEBOOK = {
  name: "SitGuru - Marketing & Community Growth Notebook",
  shortName: "Growth Team Notebook",
  siteHint: "sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth",
  /** Notebook / site deep link. */
  envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_GROWTH_URL",
} as const;

export type SitguruOneNoteSection = {
  id: string;
  name: string;
  purpose: string;
  sitguruPaths: readonly string[];
  envKey: string;
  /** Nested pages under a section (e.g. Team Playbook). */
  pages?: readonly {
    id: string;
    name: string;
    purpose: string;
    envKey: string;
  }[];
};

/** Team operating loop from OneNote Team Playbook → How We Work. */
export const SITGURU_GROWTH_TEAM_WORKFLOW = [
  "Direction",
  "Assignment",
  "Work",
  "Manager Review",
  "Approval",
  "Publish/Complete",
  "Measure",
  "Learn",
] as const;

export const SITGURU_GROWTH_TOOL_ROLES = [
  { id: "teams", label: "Teams", role: "Communication, discussion, questions, collaboration" },
  { id: "planner", label: "Planner", role: "Assignments, owners, due dates, project status" },
  { id: "sharepoint", label: "SharePoint", role: "Official team files and approved shared resources" },
  { id: "onedrive", label: "OneDrive", role: "Individual drafts and personal working files" },
  { id: "onenote", label: "OneNote", role: "Team knowledge, meeting notes, ideas, lessons learned" },
  {
    id: "intern-portal",
    label: "SitGuru Intern Portal",
    role: "Official internship hours, reviews, and academic milestones",
  },
] as const;

export const SITGURU_GROWTH_TEAM_ROLES = [
  {
    id: "jason",
    label: "Jason",
    role: "Sets company direction and formal supervisor requirements",
  },
  {
    id: "ava",
    label: "Ava",
    role: "Manages day-to-day growth work and intern execution",
  },
  {
    id: "interns",
    label: "Interns",
    role: "Complete assigned work, document evidence, and communicate blockers early",
  },
] as const;

/**
 * Live OneNote sections (left rail of the Growth Team notebook).
 */
export const SITGURU_ONENOTE_SECTIONS: readonly SitguruOneNoteSection[] = [
  {
    id: "start-here",
    name: "00 Start Here",
    purpose:
      "Growth Team notebook guide — how Teams, Planner, SharePoint, OneDrive, and SitGuru fit together.",
    sitguruPaths: ["/manager", "/admin/help/manager"],
    envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_START_HERE_URL",
  },
  {
    id: "team-playbook",
    name: "01 Team Playbook",
    purpose:
      "How we work, roles, communication standards, approvals, and the file & tool guide.",
    sitguruPaths: ["/manager", "/manager/campaigns"],
    envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_PLAYBOOK_URL",
    pages: [
      {
        id: "how-we-work",
        name: "01 How We Work",
        purpose: "Tool roles, team workflow, and management model",
        envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_PLAYBOOK_HOW_WE_WORK_URL",
      },
      {
        id: "roles",
        name: "02 Roles & Responsibilities",
        purpose: "Jason, Ava, Danette, and intern responsibilities",
        envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_PLAYBOOK_ROLES_URL",
      },
      {
        id: "communication",
        name: "03 Communication Standards",
        purpose: "Use Teams channels so information stays visible to the team",
        envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_PLAYBOOK_COMMS_URL",
      },
      {
        id: "approvals",
        name: "04 Approval & Escalation",
        purpose: "What Ava can decide vs what needs Jason",
        envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_PLAYBOOK_APPROVALS_URL",
      },
      {
        id: "file-tool-guide",
        name: "05 File & Tool Guide",
        purpose: "Where files and tools belong across M365 + SitGuru",
        envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_PLAYBOOK_FILES_URL",
      },
    ],
  },
  {
    id: "meeting-notes",
    name: "02 Meeting Notes",
    purpose: "Meeting notes, agendas, and follow-ups for Marketing & Community Growth.",
    sitguruPaths: ["/manager"],
    envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_MEETINGS_URL",
  },
  {
    id: "growth-ideas",
    name: "03 Growth Ideas",
    purpose:
      "Ideas, observations, and early concepts before they become Planner work or SitGuru initiatives.",
    sitguruPaths: ["/manager/campaigns", "/manager/create"],
    envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_IDEAS_URL",
  },
  {
    id: "campaign-learnings",
    name: "04 Campaign Learnings",
    purpose:
      "What we learned from campaigns and experiments — pair with Analytics results in SitGuru.",
    sitguruPaths: ["/manager/campaigns", "/manager/analytics", "/manager/intelligence"],
    envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_LEARNINGS_URL",
  },
  {
    id: "partnerships-community",
    name: "05 Partnerships and Community",
    purpose:
      "Partnership and community working notes. Official partner files stay in SharePoint.",
    sitguruPaths: ["/manager/partners", "/manager/events"],
    envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_PARTNERSHIPS_URL",
  },
  {
    id: "intern-collaboration",
    name: "06 Intern Collaboration",
    purpose:
      "Intern collaboration notes. Official hours, reviews, and academics stay in Intern Portal.",
    sitguruPaths: ["/intern/manage", "/intern"],
    envKey: "NEXT_PUBLIC_SITGURU_ONENOTE_INTERNS_URL",
  },
] as const;

function safeHttpsUrl(raw: string) {
  const value = String(raw || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function sitguruOneNoteNotebookHref() {
  return safeHttpsUrl(process.env[SITGURU_ONENOTE_NOTEBOOK.envKey] || "");
}

export function sitguruOneNoteSectionHref(section: SitguruOneNoteSection) {
  const configured = safeHttpsUrl(process.env[section.envKey] || "");
  if (configured) return configured;
  return sitguruOneNoteNotebookHref();
}

export type SitguruOneNoteShortcut = {
  id: string;
  name: string;
  purpose: string;
  href: string;
  sitguruPaths: readonly string[];
  configured: boolean;
};

/** OneNote section shortcuts for Ava, Jason, and Danette (@sitguru.com). */
export function sitguruOneNoteShortcuts(input?: {
  email?: string | null;
  /** Include Team Playbook nested pages as extra shortcuts. */
  includePlaybookPages?: boolean;
}): SitguruOneNoteShortcut[] {
  if (!isSitGuruWorkEmail(input?.email)) return [];

  const rows: SitguruOneNoteShortcut[] = [];
  for (const section of SITGURU_ONENOTE_SECTIONS) {
    const href = sitguruOneNoteSectionHref(section);
    rows.push({
      id: section.id,
      name: section.name,
      purpose: section.purpose,
      href,
      sitguruPaths: section.sitguruPaths,
      configured: Boolean(href),
    });
    if (input?.includePlaybookPages && section.pages?.length) {
      for (const page of section.pages) {
        const pageHref =
          safeHttpsUrl(process.env[page.envKey] || "") || href;
        rows.push({
          id: `${section.id}:${page.id}`,
          name: `${section.name} · ${page.name}`,
          purpose: page.purpose,
          href: pageHref,
          sitguruPaths: section.sitguruPaths,
          configured: Boolean(pageHref),
        });
      }
    }
  }
  return rows;
}
