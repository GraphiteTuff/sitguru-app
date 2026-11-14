import type { GrowthCenterSnapshot } from "./types";
import type { GrowthReportPeriod } from "./report-periods";

export const WEEKLY_PULSE_PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "nextdoor", label: "Nextdoor" },
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X" },
] as const;

export type WeeklyPulsePlatform = (typeof WEEKLY_PULSE_PLATFORMS)[number]["id"];
export type WeeklyPulsePlatformMetrics = {
  followers: string;
  netGrowth: string;
  reach: string;
  impressions: string;
  linkClicks: string;
  evidenceLink: string;
};
export type WeeklySocialPulse = {
  platforms: Record<WeeklyPulsePlatform, WeeklyPulsePlatformMetrics>;
  topAssetLink: string;
  topAssetMetrics: string;
  topAssetWhy: string;
  calendarStatus: string;
  upcomingCampaigns: string;
  resourceBlockers: string;
  communitySentiment: string;
  commonQuestions: string;
  escalations: string;
  weeklyDiscovery: string;
  changeNextWeek: string;
  coachingNotes: string;
};

export type ManagerReportReview = {
  worked: string;
  didntWork: string;
  learned: string;
  nextSteps: string;
  internProgress: string;
  additionalNotes: string;
  weeklyPulse: WeeklySocialPulse;
};

export type SavedGrowthReport = {
  schemaVersion: 1;
  period: GrowthReportPeriod;
  snapshot: GrowthCenterSnapshot;
  review: ManagerReportReview;
  status: "draft" | "submitted";
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  submittedBy: string | null;
  sharePointUrl: string;
};

function emptyPlatformMetrics(): WeeklyPulsePlatformMetrics {
  return { followers: "", netGrowth: "", reach: "", impressions: "", linkClicks: "", evidenceLink: "" };
}

export function emptyWeeklyPulse(): WeeklySocialPulse {
  return {
    platforms: Object.fromEntries(
      WEEKLY_PULSE_PLATFORMS.map(({ id }) => [id, emptyPlatformMetrics()]),
    ) as Record<WeeklyPulsePlatform, WeeklyPulsePlatformMetrics>,
    topAssetLink: "",
    topAssetMetrics: "",
    topAssetWhy: "",
    calendarStatus: "not_reviewed",
    upcomingCampaigns: "",
    resourceBlockers: "",
    communitySentiment: "not_measured",
    commonQuestions: "",
    escalations: "",
    weeklyDiscovery: "",
    changeNextWeek: "",
    coachingNotes: "",
  };
}

export const EMPTY_REPORT_REVIEW: ManagerReportReview = {
  worked: "",
  didntWork: "",
  learned: "",
  nextSteps: "",
  internProgress: "",
  additionalNotes: "",
  weeklyPulse: emptyWeeklyPulse(),
};

const textField = (value: unknown, limit = 6000) => String(value || "").trim().slice(0, limit);

function pulseCount(value: unknown, signed: boolean) {
  const clean = textField(value, 32).replaceAll(",", "");
  if (!clean || !(signed ? /^[+-]?\d+$/.test(clean) : /^\d+$/.test(clean))) return "";
  const number = Number(clean);
  return Number.isSafeInteger(number) && (signed || number >= 0) ? String(number) : "";
}

export function normalizedReportReview(review: Partial<ManagerReportReview> | null | undefined): ManagerReportReview {
  const input = review || {};
  const pulse = input.weeklyPulse || emptyWeeklyPulse();
  const platforms = Object.fromEntries(
    WEEKLY_PULSE_PLATFORMS.map(({ id }) => {
      const row = pulse.platforms?.[id];
      return [id, {
        followers: pulseCount(row?.followers, false),
        netGrowth: pulseCount(row?.netGrowth, true),
        reach: pulseCount(row?.reach, false),
        impressions: pulseCount(row?.impressions, false),
        linkClicks: pulseCount(row?.linkClicks, false),
        evidenceLink: textField(row?.evidenceLink, 700),
      }];
    }),
  ) as Record<WeeklyPulsePlatform, WeeklyPulsePlatformMetrics>;
  const validCalendar = ["fully_scheduled", "partially_scheduled", "awaiting_assets", "not_reviewed"];
  const validSentiment = ["positive", "neutral", "negative", "mixed", "not_measured"];
  return {
    worked: textField(input.worked),
    didntWork: textField(input.didntWork),
    learned: textField(input.learned),
    nextSteps: textField(input.nextSteps),
    internProgress: textField(input.internProgress),
    additionalNotes: textField(input.additionalNotes),
    weeklyPulse: {
      platforms,
      topAssetLink: textField(pulse.topAssetLink, 700),
      topAssetMetrics: textField(pulse.topAssetMetrics),
      topAssetWhy: textField(pulse.topAssetWhy),
      calendarStatus: validCalendar.includes(pulse.calendarStatus) ? pulse.calendarStatus : "not_reviewed",
      upcomingCampaigns: textField(pulse.upcomingCampaigns),
      resourceBlockers: textField(pulse.resourceBlockers),
      communitySentiment: validSentiment.includes(pulse.communitySentiment) ? pulse.communitySentiment : "not_measured",
      commonQuestions: textField(pulse.commonQuestions),
      escalations: textField(pulse.escalations),
      weeklyDiscovery: textField(pulse.weeklyDiscovery),
      changeNextWeek: textField(pulse.changeNextWeek),
      coachingNotes: textField(pulse.coachingNotes),
    },
  };
}

function availableTotal(rows: WeeklyPulsePlatformMetrics[], field: "followers" | "netGrowth" | "reach" | "impressions" | "linkClicks") {
  const values = rows.map((row) => row[field]).filter((value) => value !== "");
  return values.length ? String(values.reduce((sum, value) => sum + Number(value), 0)) : "Data unavailable";
}

export function weeklyPulseMarkdown(pulse: WeeklySocialPulse) {
  const lines = [
    "## Weekly Social Media Pulse — manager-confirmed activity",
    "",
    "**Reported by Ava or team; the values below are manual inputs unless separately verified against platform APIs.**",
    "Followers and counts are per platform; reach and impressions are not unique people across channels.",
    "",
    "| Platform | Followers | Net growth | Reach | Impressions | Link clicks to SitGuru |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
  ];
  const evidence: string[] = [];
  for (const item of WEEKLY_PULSE_PLATFORMS) {
    const p = pulse.platforms[item.id];
    const text = (key: "followers" | "netGrowth" | "reach" | "impressions" | "linkClicks") => p[key] === "" ? "Not supplied" : p[key];
    lines.push("| " + item.label + " | " + text("followers") + " | " + text("netGrowth") + " | " + text("reach") + " | " + text("impressions") + " | " + text("linkClicks") + " |");
    if (p.evidenceLink) evidence.push("- " + item.label + " evidence / dashboard: " + p.evidenceLink);
  }
  const rows = WEEKLY_PULSE_PLATFORMS.map(({ id }) => pulse.platforms[id]);
  lines.push("| **Sum of supplied platform counts (not unique reach)** | " +
    availableTotal(rows, "followers") + " | " + availableTotal(rows, "netGrowth") +
    " | " + availableTotal(rows, "reach") + " | " + availableTotal(rows, "impressions") +
    " | " + availableTotal(rows, "linkClicks") + " |");
  if (evidence.length) lines.push("", "### Platform source references", "", ...evidence);
  lines.push("", "### Top performing asset of the week",
    "- Post / asset link: " + (pulse.topAssetLink || "Not supplied"),
    "- Primary performance metrics: " + (pulse.topAssetMetrics || "Not supplied"),
    "- Why it resonated (Ava's interpretation): " + (pulse.topAssetWhy || "Awaiting review"),
    "",
    "### Operational health & next week's pipeline",
    "- Content calendar: " + pulse.calendarStatus.replaceAll("_", " "),
    "- Upcoming campaigns: " + (pulse.upcomingCampaigns || "Not supplied"),
    "- Resource / approval blockers: " + (pulse.resourceBlockers || "None reported"),
    "",
    "### Community sentiment, questions & escalation",
    "- Sentiment (qualitative, not a scientific score): " + pulse.communitySentiment.replaceAll("_", " "),
    "- Common questions and DMs: " + (pulse.commonQuestions || "Not supplied"),
    "- Escalations for CEO / HQ: " + (pulse.escalations || "None reported"),
    "",
    "### Weekly discovery / coaching hub",
    "- Discovery: " + (pulse.weeklyDiscovery || "Awaiting assessment"),
    "- Next-week adjustment: " + (pulse.changeNextWeek || "Awaiting assessment"),
    "- Coaching notes / suggestions for interns: " + (pulse.coachingNotes || "Not supplied"), "");
  return lines.join("\n");
}

function displayKpi(value: number | null, unit: string, availability: string) {
  if (availability === "unavailable" || value === null) return "Data unavailable";
  return unit === "percent" ? value.toFixed(1) + "%" : value.toLocaleString("en-US");
}

export function growthReportMarkdown(report: SavedGrowthReport) {
  const s = report.snapshot;
  const p = report.period;
  const review = report.review;
  const lines = [
    "# SitGuru | " + p.title,
    "",
    "**" + p.label + "**",
    "Reporting period: " + p.startDate + " through " + p.endDate + " (America/New_York)",
    "Report status: " + (report.status === "submitted" ? "Submitted to CEO" : "Draft — awaiting Ava's review"),
    "Metrics captured: " + s.capturedAt,
    "Last updated: " + report.updatedAt,
    report.submittedAt ? "Submitted: " + report.submittedAt + " by " + (report.submittedBy || "Growth Manager") : "",
    "",
    "## Business outcomes — measured, not inferred",
    "",
  ];
  for (const kpi of s.kpis) {
    lines.push("- **" + kpi.label + "**: " + displayKpi(kpi.value, kpi.unit, kpi.availability) +
      " | Previous: " + displayKpi(kpi.prior, kpi.unit, kpi.prior == null ? "unavailable" : "available") +
      " | Source: " + kpi.source + (kpi.note ? " | " + kpi.note : ""));
  }
  lines.push("", "## Marketing campaigns and attributed activity", "");
  if (s.campaigns.length === 0) lines.push("No campaigns recorded for this reporting period.");
  for (const campaign of s.campaigns.slice(0, 25)) {
    lines.push("- " + campaign.name + " (" + campaign.channel + "): " +
      campaign.visits + " tracked visits, " + campaign.signups + " attributed signups" +
      (campaign.conversionRate === null ? " (conversion unavailable)" : " (" + campaign.conversionRate.toFixed(1) + "% attributed conversion)"));
  }
  lines.push("", "## Social network data coverage", "");
  for (const platform of s.social) {
    lines.push("- " + platform.label + ": " + platform.status +
      (platform.followers == null ? "; follower data unavailable" : "; " + platform.followers + " tracked followers") +
      (platform.lastSyncedAt ? "; last updated " + platform.lastSyncedAt : ""));
  }
  lines.push("", "## Evidence-based observations and recommendations", "");
  for (const insight of s.insights) {
    lines.push("- **" + insight.title + "**: " + insight.observation + " Next: " + insight.nextAction +
      " (confidence: " + insight.confidence + "; sources: " + insight.sources.join(", ") + ")");
  }
  if (p.cadence === "weekly") {
    lines.push("", weeklyPulseMarkdown(normalizedReportReview(review).weeklyPulse));
  }
  lines.push("", "## Ava's management assessment", "",
    "### What worked?", review.worked || "_Awaiting manager input._", "",
    "### What did not work, and why?", review.didntWork || "_Awaiting manager input._", "",
    "### What did we learn?", review.learned || "_Awaiting manager input._", "",
    "### What should we do next?", review.nextSteps || "_Awaiting manager input._", "",
    "### Internship team accomplishments and blockers", review.internProgress || "_Awaiting manager input._", "",
    "### Additional notes and decisions needed", review.additionalNotes || "_None provided._", "",
    "## Data limitations and coverage", "");
  if (s.coverageNotes.length === 0) lines.push("No additional coverage notes returned.");
  for (const note of s.coverageNotes) lines.push("- " + note);
  lines.push("", "This report distinguishes measured SitGuru events from manual or unavailable social data. Activity is not proof of business conversion.", "");
  return lines.filter((line) => line !== undefined).join("\n");
}
