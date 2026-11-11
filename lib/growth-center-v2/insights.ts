import { formatRangeLabel } from "./date-range";
import type {
  GrowthAudience,
  GrowthCenterFilters,
  GrowthInsight,
  MetricValue,
  GrowthCampaignRow,
  GrowthFunnelStep,
} from "./types";

function hrefFor(audience: GrowthAudience, path: string) {
  const [pathname, query = ""] = path.split("?");
  const suffix = query ? `?${query}` : "";

  if (pathname === "/manager/reads" || pathname.startsWith("/manager/reads/")) {
    if (audience === "intern") return `/intern/content/reads${suffix}`;
    if (audience === "admin") return `/admin/growth/reads${suffix}`;
    return `${pathname}${suffix}`;
  }

  if (audience === "intern") {
    if (path.startsWith("/manager/")) return path.replace("/manager/", "/intern/");
    if (path.startsWith("/admin/growth")) return "/intern/growth";
  }
  if (audience === "admin" && path.startsWith("/manager/")) {
    return path.replace("/manager/", "/admin/growth/");
  }
  return path;
}

/**
 * Grounded recommendations only — every insight cites observed metrics.
 * Never claims causality for social platform changes without connected data.
 */
export type ReadsGrowthSignals = {
  pageViews: number;
  videoPlays: number;
  needsReview: number;
  partnerLeads: number;
};

export function buildGrowthInsights(input: {
  audience: GrowthAudience;
  filters: GrowthCenterFilters;
  kpis: MetricValue[];
  funnel: GrowthFunnelStep[];
  campaigns: GrowthCampaignRow[];
  contentPending: number;
  reads?: ReadsGrowthSignals | null;
}): GrowthInsight[] {
  const range = formatRangeLabel(input.filters);
  const byId = Object.fromEntries(input.kpis.map((kpi) => [kpi.id, kpi]));
  const insights: GrowthInsight[] = [];

  const parents = byId.pet_parent_registrations;
  const gurus = byId.guru_registrations;
  const visits = byId.campaign_visits;
  const signups = byId.campaign_signups;
  const conversion = byId.registration_conversion_rate;
  const bookings = byId.booking_requests;

  if (
    visits?.availability === "available" &&
    signups?.availability === "available" &&
    (visits.value || 0) >= 20 &&
    (signups.value || 0) === 0
  ) {
    insights.push({
      id: "visits-no-signups",
      severity: "watch",
      title: "Campaign visits without attributed signups",
      observation: `${visits.value} attributed visits and ${signups.value} attributed signups in this window.`,
      reason:
        "Traffic is reaching tracked SitGuru links, but no growth_campaign_events signup rows were recorded.",
      nextAction:
        "Review campaign landing pages and confirm signup attribution is firing on registration completion.",
      actionHref: hrefFor(input.audience, "/manager/campaigns"),
      dateRangeLabel: range,
      sources: [visits.source, signups.source],
      confidence: "high",
      limitations:
        "Unattributed registrations may still exist outside campaign tracking.",
    });
  }

  if (
    conversion?.availability === "available" &&
    conversion.value != null &&
    conversion.prior != null &&
    conversion.value + 2 < conversion.prior
  ) {
    insights.push({
      id: "conversion-down",
      severity: "watch",
      title: "Attributed conversion rate declined vs prior period",
      observation: `Conversion ${conversion.value.toFixed(1)}% vs prior ${conversion.prior.toFixed(1)}%.`,
      reason:
        "Same numerator/denominator definition across both periods (signups ÷ visits).",
      nextAction:
        "Compare top campaigns and Content Studio posts that drove visits this period.",
      actionHref: hrefFor(input.audience, "/manager/insights?view=campaigns"),
      dateRangeLabel: range,
      sources: [conversion.source],
      confidence: "medium",
    });
  }

  if (
    gurus?.availability === "available" &&
    parents?.availability === "available" &&
    (gurus.value || 0) > 0 &&
    (parents.value || 0) === 0
  ) {
    insights.push({
      id: "guru-heavy",
      severity: "opportunity",
      title: "Guru registrations outpaced Pet Parents",
      observation: `${gurus.value} new Gurus and ${parents.value} new Pet Parents.`,
      reason:
        "Supply-side growth without matching Pet Parent demand can stall first bookings.",
      nextAction:
        "Prioritize Pet Parent acquisition content and campus/community CTAs this week.",
      actionHref: hrefFor(input.audience, "/manager/campaigns-content"),
      dateRangeLabel: range,
      sources: [gurus.source, parents.source],
      confidence: "medium",
    });
  }

  if (
    parents?.availability === "available" &&
    parents.prior != null &&
    (parents.value || 0) > (parents.prior || 0) &&
    (parents.value || 0) >= 3
  ) {
    insights.push({
      id: "pet-parent-up",
      severity: "positive",
      title: "Pet Parent registrations are rising",
      observation: `${parents.value} this period vs ${parents.prior} prior.`,
      reason: "Live Pet Parent profile creations increased versus the comparison window.",
      nextAction:
        "Push incomplete profiles toward first booking and feature local Gurus in Content Studio.",
      actionHref: hrefFor(input.audience, "/manager/results"),
      dateRangeLabel: range,
      sources: [parents.source],
      confidence: "high",
    });
  }

  const strong = input.campaigns
    .filter((c) => c.visits >= 10 && c.conversionRate != null && c.conversionRate >= 5)
    .slice(0, 2);
  for (const campaign of strong) {
    insights.push({
      id: `campaign-strong-${campaign.id}`,
      severity: "positive",
      title: `Strong conversion: ${campaign.name}`,
      observation: `${campaign.signups} signups from ${campaign.visits} visits (${campaign.conversionRate?.toFixed(1)}%).`,
      reason: "Observed attributed campaign events only — not a causal claim.",
      nextAction: "Consider repeating this format or expanding the same tracking link.",
      actionHref: hrefFor(input.audience, `/manager/campaigns/${campaign.id}`),
      dateRangeLabel: range,
      sources: ["growth_campaign_events"],
      confidence: "medium",
    });
  }

  const weak = input.campaigns
    .filter((c) => c.visits >= 25 && (c.signups || 0) === 0)
    .slice(0, 2);
  for (const campaign of weak) {
    insights.push({
      id: `campaign-weak-${campaign.id}`,
      severity: "opportunity",
      title: `Review landing page: ${campaign.name}`,
      observation: `${campaign.visits} visits with 0 attributed signups.`,
      reason: "High tracked traffic with no attributed registration events.",
      nextAction: "Audit destination URL, CTA, and signup funnel for this campaign.",
      actionHref: hrefFor(input.audience, `/manager/campaigns/${campaign.id}`),
      dateRangeLabel: range,
      sources: ["growth_campaign_events"],
      confidence: "high",
    });
  }

  const visitStep = input.funnel.find((s) => s.id === "visit");
  const regStep = input.funnel.find((s) => s.id === "registration");
  const bookStep = input.funnel.find((s) => s.id === "booking");
  if (
    regStep?.count != null &&
    bookStep?.count != null &&
    regStep.count >= 5 &&
    bookStep.count === 0
  ) {
    insights.push({
      id: "funnel-booking-drop",
      severity: "watch",
      title: "Registrations without booking activity",
      observation: `${regStep.count} registrations and ${bookStep.count} bookings in range.`,
      reason: "First-booking conversion is the business outcome after signup.",
      nextAction:
        "Check profile completion queues and local Guru density for new Pet Parents.",
      actionHref: hrefFor(input.audience, "/manager/conversions"),
      dateRangeLabel: range,
      sources: [regStep.source, bookStep.source],
      confidence: "medium",
      limitations: "Booking count includes all statuses created in-window.",
    });
  }

  if (input.contentPending > 0) {
    insights.push({
      id: "content-pending",
      severity: "info",
      title: "Content waiting for review",
      observation: `${input.contentPending} Content Studio item(s) need review.`,
      reason: "Publishing delays can stall campaign-attributed traffic.",
      nextAction: "Clear the Content Studio review queue.",
      actionHref: hrefFor(input.audience, "/manager/campaigns-content"),
      dateRangeLabel: range,
      sources: ["admin_marketing_content_calendar"],
      confidence: "high",
    });
  }

  const reads = input.reads;
  if (reads && reads.needsReview > 0) {
    insights.push({
      id: "reads-needs-review",
      severity: "info",
      title: "Reads & Media items need review",
      observation: `${reads.needsReview} Reads draft(s)/submission(s) are waiting for manager review.`,
      reason: "Unpublished Reads content cannot drive public /reads engagement.",
      nextAction: "Open Reads & Media and clear the review queue.",
      actionHref: hrefFor(input.audience, "/manager/reads?tab=content"),
      dateRangeLabel: range,
      sources: ["reads_content"],
      confidence: "high",
    });
  }
  if (reads && reads.pageViews >= 25 && reads.videoPlays === 0) {
    insights.push({
      id: "reads-views-no-plays",
      severity: "opportunity",
      title: "Reads traffic without video plays",
      observation: `${reads.pageViews} Reads page views and ${reads.videoPlays} recorded video plays.`,
      reason:
        "Visitors are opening Reads pages, but click-to-play video engagement is flat.",
      nextAction:
        "Feature a stronger video or podcast on /reads and confirm YouTube embeds are published.",
      actionHref: hrefFor(input.audience, "/manager/reads?tab=videos"),
      dateRangeLabel: range,
      sources: ["reads_analytics_events"],
      confidence: "medium",
      limitations: "Only first-party Reads analytics events are counted.",
    });
  }
  if (reads && reads.partnerLeads > 0) {
    insights.push({
      id: "reads-partner-leads",
      severity: "opportunity",
      title: "New Reads partnership leads",
      observation: `${reads.partnerLeads} partner lead(s) in the Reads pipeline.`,
      reason: "Partner submissions can become Featured / Sponsored Reads placements.",
      nextAction: "Review partnership intake and assign next status.",
      actionHref: hrefFor(input.audience, "/manager/reads?tab=partnerships"),
      dateRangeLabel: range,
      sources: ["reads_partners"],
      confidence: "high",
    });
  }

  if (visitStep?.count === 0 && (parents?.value || 0) + (gurus?.value || 0) > 0) {
    insights.push({
      id: "unattributed-growth",
      severity: "info",
      title: "Growth without campaign attribution",
      observation: "Registrations occurred while attributed campaign visits were zero.",
      reason:
        "Organic, direct, or untracked channels may be driving signups — shown separately from attributed campaigns.",
      nextAction: "Ensure campus QR / UTM links are used on new outreach assets.",
      actionHref: hrefFor(input.audience, "/manager/campus-growth"),
      dateRangeLabel: range,
      sources: ["profiles", "gurus", "growth_campaign_events"],
      confidence: "medium",
    });
  }

  if (!insights.length) {
    insights.push({
      id: "baseline",
      severity: "info",
      title: "Monitoring first-party growth signals",
      observation: "No sharp anomalies detected for the selected filters.",
      reason: "Insights only fire when metric thresholds are met with available data.",
      nextAction: "Keep weekly goals current and review Live Results with the team.",
      actionHref: hrefFor(input.audience, "/manager/results"),
      dateRangeLabel: range,
      sources: ["growth_center_v2"],
      confidence: "low",
      limitations: bookings?.availability === "unavailable" ? "Booking metrics unavailable." : undefined,
    });
  }

  return insights.slice(0, 12);
}
