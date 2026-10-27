/**
 * Microsoft Teams — SitGuru work mailboxes only (@sitguru.com).
 * Team: SitGuru | Marketing & Community Growth on teams.cloud.microsoft
 *
 * SitGuru does not duplicate channel welcome copy. Channels are the place to
 * discuss; SitGuru records outcomes, reports, and formal internship/admin work.
 */

import { normalizeAdminEmail } from "@/lib/admin/super-users";

export const SITGURU_WORK_EMAIL_DOMAIN = "sitguru.com";

/** Current Microsoft Teams web host for SitGuru. */
export const SITGURU_TEAMS_CLOUD_HOME = "https://teams.cloud.microsoft";

export const SITGURU_GROWTH_TEAMS_TEAM = {
  id: "marketing-community-growth",
  name: "SitGuru | Marketing & Community Growth",
  shortName: "Marketing & Community Growth",
  initials: "SM",
} as const;

export type SitguruGrowthTeamsChannel = {
  id: string;
  label: string;
  /** Private / restricted channel (padlock in Teams). */
  private?: boolean;
  /** Short process note — discuss in Teams, record in SitGuru. */
  process: string;
  /** SitGuru routes that hold the matching data / reports. */
  sitguruPaths: readonly string[];
  /** Env key for an optional deep link into this channel. */
  envKey: string;
};

/**
 * Live Teams channels under Marketing & Community Growth, mapped to SitGuru
 * systems of record (not a handbook mirror of channel welcome posts).
 */
export const SITGURU_GROWTH_TEAMS_CHANNELS: readonly SitguruGrowthTeamsChannel[] = [
  {
    id: "general",
    label: "General",
    process: "Team-wide coordination. Formal outcomes stay in SitGuru Growth / Manager Desk.",
    sitguruPaths: ["/manager", "/manager/campaigns"],
    envKey: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_GENERAL_URL",
  },
  {
    id: "analytics-results",
    label: "Analytics and Results",
    process:
      "Discuss performance in Teams. Record KPIs, campaign results, and learnings in Growth Analytics / Intelligence.",
    sitguruPaths: [
      "/manager/analytics",
      "/manager/intelligence",
      "/admin/growth",
    ],
    envKey: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_ANALYTICS_URL",
  },
  {
    id: "content-social",
    label: "Content and Social",
    process:
      "Draft and review content in Teams + Canva. Track published outcomes and campaigns in SitGuru Growth.",
    sitguruPaths: ["/manager/content", "/manager/media", "/manager/campaigns"],
    envKey: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_CONTENT_URL",
  },
  {
    id: "growth-strategy",
    label: "Growth and Strategy",
    process:
      "Strategy discussion in Teams. Initiatives, experiments, and priorities live as Growth records in SitGuru.",
    sitguruPaths: ["/manager/campaigns", "/manager/create", "/admin/growth"],
    envKey: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_STRATEGY_URL",
  },
  {
    id: "intern-projects",
    label: "Intern Projects",
    process:
      "Day-to-day intern coordination in Teams. Hours, check-ins, milestones, and evidence stay in Intern Portal / Team Desk.",
    sitguruPaths: ["/intern", "/intern/manage", "/intern/time"],
    envKey: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_INTERNS_URL",
  },
  {
    id: "leadership",
    label: "Leadership - Jason, Danette, and Ava",
    private: true,
    process:
      "Private leadership chat only. HR/payroll/tax records stay in restricted SitGuru Admin systems — never in Teams.",
    sitguruPaths: ["/admin", "/manager"],
    envKey: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_LEADERSHIP_URL",
  },
  {
    id: "partnerships-community",
    label: "Partnerships and Community",
    process:
      "Partner outreach discussion in Teams. Events, partner outcomes, and community results record in SitGuru Growth.",
    sitguruPaths: ["/manager/partners", "/manager/events", "/manager/campaigns"],
    envKey: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_PARTNERSHIPS_URL",
  },
] as const;

export function isSitGuruWorkEmail(email: string | null | undefined) {
  const normalized = normalizeAdminEmail(email);
  return normalized.endsWith(`@${SITGURU_WORK_EMAIL_DOMAIN}`);
}

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

/**
 * Prefer configured Growth Teams deep link; fall back to teams.cloud.microsoft.
 */
export function sitguruTeamsHref() {
  const configured = safeHttpsUrl(
    process.env.NEXT_PUBLIC_SITGURU_TEAMS_GROWTH_URL || "",
  );
  return configured || SITGURU_TEAMS_CLOUD_HOME;
}

/** Resolve a channel deep link, falling back to the team / Teams home. */
export function sitguruTeamsChannelHref(channelId: string) {
  const channel = SITGURU_GROWTH_TEAMS_CHANNELS.find((item) => item.id === channelId);
  if (channel) {
    const configured = safeHttpsUrl(process.env[channel.envKey] || "");
    if (configured) return configured;
  }
  return sitguruTeamsHref();
}

export type SitguruTeamsChannelLink = {
  id: string;
  label: string;
  detail: string;
  href: string;
  private?: boolean;
  sitguruPaths: readonly string[];
};

/** Channel shortcuts for SitGuru work accounts (Teams cloud). */
export function sitguruGrowthTeamsChannelLinks(): SitguruTeamsChannelLink[] {
  const teamHref = sitguruTeamsHref();
  return SITGURU_GROWTH_TEAMS_CHANNELS.map((channel) => {
    const configured = safeHttpsUrl(process.env[channel.envKey] || "");
    return {
      id: channel.id,
      label: channel.label,
      detail: channel.private ? `${channel.process} · private` : channel.process,
      href: configured || teamHref,
      private: channel.private,
      sitguruPaths: channel.sitguruPaths,
    };
  });
}

/** Find which Teams channel a SitGuru path should discuss against. */
export function teamsChannelForSitguruPath(pathname: string) {
  const path = pathname || "";
  let best: (typeof SITGURU_GROWTH_TEAMS_CHANNELS)[number] | null = null;
  let bestLen = -1;
  for (const channel of SITGURU_GROWTH_TEAMS_CHANNELS) {
    for (const item of channel.sitguruPaths) {
      const matches = path === item || path.startsWith(`${item}/`);
      if (!matches) continue;
      if (item.length > bestLen) {
        best = channel;
        bestLen = item.length;
      }
    }
  }
  return best;
}
