/** Shared Growth Center 2.0 contracts — web, admin, intern, mobile. */

export const GROWTH_CENTER_V2_FLAG = "growth_center_v2" as const;

export const GROWTH_BUSINESS_TIMEZONE = "America/New_York" as const;

export type GrowthAudience = "manager" | "intern" | "admin";

export type GrowthDatePreset =
  | "today"
  | "yesterday"
  | "last_7"
  | "last_28"
  | "last_90"
  | "this_month"
  | "last_month"
  | "custom";

export type GrowthPlatform =
  | "all"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "sitguru";

export type GrowthAudienceFilter =
  | "all"
  | "guru"
  | "pet_parent"
  | "ambassador"
  | "community";

export type MetricAvailability = "available" | "partial" | "unavailable";

export type MetricValue = {
  id: string;
  label: string;
  value: number | null;
  prior: number | null;
  unit: "count" | "percent" | "ratio";
  availability: MetricAvailability;
  definitionId: string;
  source: string;
  note?: string;
};

export type SocialConnectorStatus = {
  platform: Exclude<GrowthPlatform, "all" | "sitguru">;
  label: string;
  status: "connected" | "manual" | "not_configured" | "error";
  accountLabel: string | null;
  lastSyncedAt: string | null;
  followers: number | null;
  baselineFollowers: number | null;
  setupHint: string;
};

export type GrowthInsight = {
  id: string;
  severity: "opportunity" | "watch" | "positive" | "info";
  title: string;
  observation: string;
  reason: string;
  nextAction: string;
  actionHref: string;
  dateRangeLabel: string;
  sources: string[];
  confidence: "high" | "medium" | "low";
  limitations?: string;
};

export type GrowthGoalProgress = {
  id: string;
  label: string;
  metricId: string;
  target: number;
  actual: number | null;
  remaining: number | null;
  percentComplete: number | null;
  status: "on_track" | "at_risk" | "ahead" | "unavailable";
  ownerLabel: string;
  periodLabel: string;
  source: string;
};

export type GrowthFunnelStep = {
  id: string;
  label: string;
  count: number | null;
  availability: MetricAvailability;
  conversionFromPrior: number | null;
  source: string;
};

export type GrowthCampaignRow = {
  id: string;
  name: string;
  slug: string;
  channel: string;
  status: string;
  visits: number;
  signups: number;
  conversionRate: number | null;
  trackingUrl: string;
};

export type GrowthContentRow = {
  id: string;
  title: string;
  platform: string;
  audience: string;
  campaign: string;
  status: string;
  plannedDate: string | null;
  owner: string;
};

export type GrowthCenterFilters = {
  preset: GrowthDatePreset;
  startIso: string;
  endIso: string;
  priorStartIso: string;
  priorEndIso: string;
  platform: GrowthPlatform;
  audience: GrowthAudienceFilter;
  campaignId: string | null;
  timezone: string;
};

export type GrowthCenterSnapshot = {
  version: 2;
  flagEnabled: boolean;
  audience: GrowthAudience;
  capturedAt: string;
  freshnessLabel: string;
  filters: GrowthCenterFilters;
  kpis: MetricValue[];
  funnel: GrowthFunnelStep[];
  social: SocialConnectorStatus[];
  campaigns: GrowthCampaignRow[];
  content: GrowthContentRow[];
  goals: GrowthGoalProgress[];
  insights: GrowthInsight[];
  community: {
    submissions: number | null;
    events: number | null;
    packParticipants: number | null;
    availability: MetricAvailability;
    note: string;
  };
  campus: {
    profiles: number;
    visits: number;
    leads: number;
    availability: MetricAvailability;
    note: string;
  };
  coverageNotes: string[];
};
