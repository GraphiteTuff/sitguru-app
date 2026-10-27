/**
 * SharePoint Documents shortcuts for SitGuru | Marketing & Community Growth.
 * Files stay in SharePoint; SitGuru only deep-links for @sitguru.com work accounts
 * (Ava, Jason, Danette, and other Growth staff).
 */

import { isSitGuruWorkEmail } from "@/lib/admin/growth/teams-access";

export const SITGURU_SHAREPOINT_LIBRARY = {
  team: "SitGuru | Marketing & Community Growth",
  rootLabel: "Documents",
  /** Optional site/library deep link. */
  envKey: "NEXT_PUBLIC_SITGURU_SHAREPOINT_GROWTH_URL",
} as const;

export type SitguruSharePointFolder = {
  id: string;
  /** Channel / library section name in Documents. */
  section: string;
  /** Numbered folder name as it appears in SharePoint. */
  name: string;
  purpose: string;
  /** SitGuru routes that pair with this working folder. */
  sitguruPaths: readonly string[];
  /** Private leadership library (Jason, Danette, Ava). */
  leadershipOnly?: boolean;
  envKey: string;
};

/**
 * Live Documents folder tree (purpose column from SharePoint).
 * Env vars supply real folder URLs when configured.
 */
export const SITGURU_SHAREPOINT_FOLDERS: readonly SitguruSharePointFolder[] = [
  // General
  {
    id: "general-team-guides",
    section: "General",
    name: "01 Team Guides",
    purpose:
      "Guides, onboarding instructions, team how-to documents, communication standards, and reference materials.",
    sitguruPaths: ["/manager", "/admin/help/manager"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_GENERAL_TEAM_GUIDES_URL",
  },
  {
    id: "general-brand-kit",
    section: "General",
    name: "02 Brand Kit",
    purpose:
      "Approved SitGuru logos, brand colors, fonts, visual standards, and messaging guidance.",
    sitguruPaths: ["/manager/content", "/manager/media"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_GENERAL_BRAND_KIT_URL",
  },
  {
    id: "general-templates-sops",
    section: "General",
    name: "03 Templates & SOPs",
    purpose:
      "Reusable templates, SOPs, checklists, workflows, and approved processes for recurring marketing work.",
    sitguruPaths: ["/manager", "/manager/campaigns"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_GENERAL_TEMPLATES_URL",
  },
  {
    id: "general-meeting-resources",
    section: "General",
    name: "04 Meeting Resources",
    purpose:
      "Team meeting agendas, presentation materials, working notes, and non-sensitive follow-ups.",
    sitguruPaths: ["/manager"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_GENERAL_MEETINGS_URL",
  },
  {
    id: "general-approved-company",
    section: "General",
    name: "05 Approved Company Resources",
    purpose:
      "Final approved company materials for authorized marketing, community, partnership, and internship use.",
    sitguruPaths: ["/manager", "/manager/partners"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_GENERAL_APPROVED_URL",
  },

  // Analytics and Results
  {
    id: "analytics-weekly-reports",
    section: "Analytics and Results",
    name: "01 Weekly Reports",
    purpose:
      "Weekly performance summaries, manager updates, recurring KPI snapshots, and next-step notes.",
    sitguruPaths: ["/manager/analytics", "/manager"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_ANALYTICS_WEEKLY_URL",
  },
  {
    id: "analytics-campaign-results",
    section: "Analytics and Results",
    name: "02 Campaign Results",
    purpose:
      "Final campaign performance data, attribution evidence, lessons, and recommendations.",
    sitguruPaths: ["/manager/campaigns", "/manager/analytics"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_ANALYTICS_CAMPAIGNS_URL",
  },
  {
    id: "analytics-pet-parent-growth",
    section: "Analytics and Results",
    name: "03 Pet Parent Growth",
    purpose:
      "Pet Parent registrations, engagement, conversion, referrals, bookings, and market growth analysis.",
    sitguruPaths: ["/manager/analytics", "/manager/intelligence"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_ANALYTICS_PET_PARENT_URL",
  },
  {
    id: "analytics-social",
    section: "Analytics and Results",
    name: "04 Social Analytics",
    purpose:
      "Reach, views, engagement, clicks, follower trends, content performance, and platform analytics.",
    sitguruPaths: ["/manager/analytics", "/manager/content"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_ANALYTICS_SOCIAL_URL",
  },
  {
    id: "analytics-registration",
    section: "Analytics and Results",
    name: "05 Registration Data",
    purpose:
      "Approved exports, summaries, and conversion charts. Do not store unnecessary customer PII here.",
    sitguruPaths: ["/manager/analytics"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_ANALYTICS_REGISTRATION_URL",
  },
  {
    id: "analytics-archived",
    section: "Analytics and Results",
    name: "06 Archived Reports",
    purpose:
      "Older reports, superseded analyses, and historical performance retained for reference.",
    sitguruPaths: ["/manager/analytics"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_ANALYTICS_ARCHIVE_URL",
  },

  // Content and Social
  {
    id: "content-calendar",
    section: "Content and Social",
    name: "01 Content Calendar",
    purpose:
      "Planned posts, publishing schedules, campaign timing, themes, and channel-specific plans.",
    sitguruPaths: ["/manager/content", "/manager/campaigns"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_CONTENT_CALENDAR_URL",
  },
  {
    id: "content-drafts",
    section: "Content and Social",
    name: "02 Drafts",
    purpose:
      "In-progress captions, scripts, graphics, Reels, videos, and social concepts not yet approved.",
    sitguruPaths: ["/manager/content", "/manager/media"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_CONTENT_DRAFTS_URL",
  },
  {
    id: "content-ava-review",
    section: "Content and Social",
    name: "03 Ava Review",
    purpose:
      "Content submitted for Ava’s review, feedback, revisions, and routine manager approval.",
    sitguruPaths: ["/manager/content", "/intern/manage"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_CONTENT_AVA_REVIEW_URL",
  },
  {
    id: "content-approved",
    section: "Content and Social",
    name: "04 Approved",
    purpose:
      "Final content reviewed and approved for use or scheduling but not necessarily published yet.",
    sitguruPaths: ["/manager/content"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_CONTENT_APPROVED_URL",
  },
  {
    id: "content-published",
    section: "Content and Social",
    name: "05 Published",
    purpose:
      "Copies, links, screenshots, or records of content already published on approved channels.",
    sitguruPaths: ["/manager/content", "/manager/campaigns"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_CONTENT_PUBLISHED_URL",
  },
  {
    id: "content-creative-assets",
    section: "Content and Social",
    name: "06 Creative Assets",
    purpose:
      "Reusable photos, graphics, clips, Canva/CapCut resources, thumbnails, and creative files.",
    sitguruPaths: ["/manager/media", "/manager/content"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_CONTENT_ASSETS_URL",
  },

  // Growth and Strategy
  {
    id: "strategy-market-research",
    section: "Growth and Strategy",
    name: "01 Market Research",
    purpose:
      "Audience research, competitor observations, community insights, and market trends.",
    sitguruPaths: ["/manager/intelligence", "/manager/campaigns"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_STRATEGY_RESEARCH_URL",
  },
  {
    id: "strategy-pet-parent-growth",
    section: "Growth and Strategy",
    name: "02 Pet Parent Growth",
    purpose:
      "Strategies and initiatives focused on Pet Parent awareness, registrations, engagement, and bookings.",
    sitguruPaths: ["/manager/campaigns", "/manager/analytics"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_STRATEGY_PET_PARENT_URL",
  },
  {
    id: "strategy-campaign",
    section: "Growth and Strategy",
    name: "03 Campaign Strategy",
    purpose:
      "Campaign briefs, objectives, audiences, messaging, channel strategy, timelines, and measurement plans.",
    sitguruPaths: ["/manager/campaigns", "/manager/create"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_STRATEGY_CAMPAIGN_URL",
  },
  {
    id: "strategy-referral",
    section: "Growth and Strategy",
    name: "04 Referral Strategy",
    purpose:
      "Referral program ideas, Ambassador growth concepts, incentives, and attributable growth plans.",
    sitguruPaths: ["/manager/campaigns", "/manager/partners"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_STRATEGY_REFERRAL_URL",
  },
  {
    id: "strategy-market-expansion",
    section: "Growth and Strategy",
    name: "05 Market Expansion",
    purpose:
      "Research and planning for new geographic markets and local expansion priorities.",
    sitguruPaths: ["/manager/intelligence", "/manager/campaigns"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_STRATEGY_EXPANSION_URL",
  },
  {
    id: "strategy-experiments",
    section: "Growth and Strategy",
    name: "06 Experiments",
    purpose:
      "Growth tests, hypotheses, pilots, A/B concepts, results, and repeat/improve/stop recommendations.",
    sitguruPaths: ["/manager/intelligence", "/manager/campaigns"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_STRATEGY_EXPERIMENTS_URL",
  },

  // Intern Projects
  {
    id: "interns-shared",
    section: "Intern Projects",
    name: "01 Shared Internship Resources",
    purpose:
      "Common internship guides, onboarding materials, templates, and shared tools for all interns.",
    sitguruPaths: ["/intern", "/intern/manage"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_INTERNS_SHARED_URL",
  },
  {
    id: "interns-ryan",
    section: "Intern Projects",
    name: "02 Ryan Manibo",
    purpose:
      "Ryan’s working files and project materials. Official hours, reviews, and academics stay in Intern Portal.",
    sitguruPaths: ["/intern/manage", "/intern"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_INTERNS_RYAN_URL",
  },
  {
    id: "interns-lola",
    section: "Intern Projects",
    name: "03 Lola Uhl",
    purpose:
      "Lola’s working files and project materials. Official hours, reviews, and academics stay in Intern Portal.",
    sitguruPaths: ["/intern/manage", "/intern"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_INTERNS_LOLA_URL",
  },
  {
    id: "interns-spring-2027",
    section: "Intern Projects",
    name: "04 Spring 2027",
    purpose:
      "Shared materials for the Spring 2027 cohort: planning, milestones, collaborative projects, schedules.",
    sitguruPaths: ["/intern/manage"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_INTERNS_SPRING_2027_URL",
  },
  {
    id: "interns-final-projects",
    section: "Intern Projects",
    name: "05 Final Projects",
    purpose:
      "Final approved internship deliverables, growth reports, playbooks, and employer-approved outputs.",
    sitguruPaths: ["/intern/manage", "/intern"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_INTERNS_FINALS_URL",
  },

  // Partnerships and Community
  {
    id: "partners-research",
    section: "Partnerships and Community",
    name: "01 Partner Research",
    purpose:
      "Research on rescues, shelters, groomers, trainers, vets, pet businesses, and community groups.",
    sitguruPaths: ["/manager/partners"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_PARTNERS_RESEARCH_URL",
  },
  {
    id: "partners-outreach",
    section: "Partnerships and Community",
    name: "02 Outreach Materials",
    purpose:
      "Draft and approved outreach messages, templates, talking points, and one-pagers.",
    sitguruPaths: ["/manager/partners"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_PARTNERS_OUTREACH_URL",
  },
  {
    id: "partners-approved",
    section: "Partnerships and Community",
    name: "03 Approved Partners",
    purpose:
      "Final approved partner information, collaboration materials, logos, and active partnership records.",
    sitguruPaths: ["/manager/partners"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_PARTNERS_APPROVED_URL",
  },
  {
    id: "partners-events",
    section: "Partnerships and Community",
    name: "04 Events",
    purpose:
      "Event research, promotional materials, planning docs, calendars, and booth/outreach files.",
    sitguruPaths: ["/manager/events", "/manager/partners"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_PARTNERS_EVENTS_URL",
  },
  {
    id: "partners-assets",
    section: "Partnerships and Community",
    name: "05 Partnership Assets",
    purpose:
      "Reusable partner logos, co-branded graphics, flyers, and partnership creative assets.",
    sitguruPaths: ["/manager/partners", "/manager/media"],
    envKey: "NEXT_PUBLIC_SITGURU_SP_PARTNERS_ASSETS_URL",
  },

  // Leadership - Jason, Danette, and Ava (private)
  {
    id: "leadership-meetings",
    section: "Leadership - Jason, Danette, and Ava",
    name: "01 Leadership Meetings",
    purpose:
      "Agendas, notes, decisions, and follow-ups from Jason, Danette, and Ava leadership meetings.",
    sitguruPaths: ["/manager"],
    leadershipOnly: true,
    envKey: "NEXT_PUBLIC_SITGURU_SP_LEADERSHIP_MEETINGS_URL",
  },
  {
    id: "leadership-team-interns",
    section: "Leadership - Jason, Danette, and Ava",
    name: "02 Team & Intern Management",
    purpose:
      "Leadership-only notes on staffing, intern progress, workload, coaching, and future planning. No payroll, tax, banking, medical, or formal HR records.",
    sitguruPaths: ["/intern/manage", "/manager"],
    leadershipOnly: true,
    envKey: "NEXT_PUBLIC_SITGURU_SP_LEADERSHIP_TEAM_URL",
  },
  {
    id: "leadership-growth-decisions",
    section: "Leadership - Jason, Danette, and Ava",
    name: "03 Growth Decisions & Approvals",
    purpose:
      "Approved growth strategies, campaigns, major messaging decisions, partnerships, and CEO/manager approvals.",
    sitguruPaths: ["/manager/campaigns", "/manager"],
    leadershipOnly: true,
    envKey: "NEXT_PUBLIC_SITGURU_SP_LEADERSHIP_DECISIONS_URL",
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

export function sitguruSharePointLibraryHref() {
  return (
    safeHttpsUrl(process.env[SITGURU_SHAREPOINT_LIBRARY.envKey] || "") ||
    safeHttpsUrl(process.env.NEXT_PUBLIC_SITGURU_TEAMS_GROWTH_URL || "") ||
    ""
  );
}

export function sitguruSharePointFolderHref(folder: SitguruSharePointFolder) {
  const configured = safeHttpsUrl(process.env[folder.envKey] || "");
  if (configured) return configured;
  return sitguruSharePointLibraryHref();
}

export type SitguruSharePointShortcut = {
  id: string;
  section: string;
  name: string;
  purpose: string;
  href: string;
  sitguruPaths: readonly string[];
  leadershipOnly?: boolean;
  configured: boolean;
};

/**
 * SharePoint shortcuts for Ava / Jason / Danette (and other @sitguru.com Growth staff).
 * Leadership folders only when `includeLeadership` is true.
 */
export function sitguruSharePointShortcuts(input?: {
  email?: string | null;
  includeLeadership?: boolean;
  section?: string;
}): SitguruSharePointShortcut[] {
  if (!isSitGuruWorkEmail(input?.email)) return [];
  const includeLeadership = Boolean(input?.includeLeadership);
  const sectionFilter = input?.section || "";

  return SITGURU_SHAREPOINT_FOLDERS.filter((folder) => {
    if (folder.leadershipOnly && !includeLeadership) return false;
    if (sectionFilter && folder.section !== sectionFilter) return false;
    return true;
  }).map((folder) => {
    const href = sitguruSharePointFolderHref(folder);
    return {
      id: folder.id,
      section: folder.section,
      name: folder.name,
      purpose: folder.purpose,
      href,
      sitguruPaths: folder.sitguruPaths,
      leadershipOnly: folder.leadershipOnly,
      configured: Boolean(href),
    };
  });
}

export function sharePointSectionsForShortcuts(
  shortcuts: SitguruSharePointShortcut[],
) {
  const sections: string[] = [];
  for (const item of shortcuts) {
    if (!sections.includes(item.section)) sections.push(item.section);
  }
  return sections;
}
