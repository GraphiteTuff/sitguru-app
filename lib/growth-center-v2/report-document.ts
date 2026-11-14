import type { GrowthCenterSnapshot } from "./types";
import type { GrowthReportPeriod } from "./report-periods";

export type ManagerReportReview = {
  worked: string;
  didntWork: string;
  learned: string;
  nextSteps: string;
  internProgress: string;
  additionalNotes: string;
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

export const EMPTY_REPORT_REVIEW: ManagerReportReview = {
  worked: "",
  didntWork: "",
  learned: "",
  nextSteps: "",
  internProgress: "",
  additionalNotes: "",
};

export function normalizedReportReview(review: Partial<ManagerReportReview> | null | undefined): ManagerReportReview {
  const input = review || {};
  return {
    worked: String(input.worked || "").trim().slice(0, 6000),
    didntWork: String(input.didntWork || "").trim().slice(0, 6000),
    learned: String(input.learned || "").trim().slice(0, 6000),
    nextSteps: String(input.nextSteps || "").trim().slice(0, 6000),
    internProgress: String(input.internProgress || "").trim().slice(0, 6000),
    additionalNotes: String(input.additionalNotes || "").trim().slice(0, 6000),
  };
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
