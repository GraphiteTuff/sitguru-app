import type { InternshipCampaign, InternshipMetric } from "@/lib/internship/types";

export const INTERN_KPI_BASELINE_NOTE = "baseline";

export const INTERN_PEOPLE_KPIS = [
  {
    key: "people.pet_parents",
    label: "Pet Parents",
    tone: "emerald",
    group: "people",
  },
  {
    key: "people.gurus",
    label: "Gurus",
    tone: "sky",
    group: "people",
  },
  {
    key: "people.ambassadors",
    label: "Ambassadors",
    tone: "violet",
    group: "people",
  },
] as const;

export const INTERN_SOCIAL_KPIS = [
  {
    key: "social.facebook",
    label: "Facebook",
    tone: "sky",
    group: "social",
  },
  {
    key: "social.instagram",
    label: "Instagram",
    tone: "rose",
    group: "social",
  },
  {
    key: "social.tiktok",
    label: "TikTok",
    tone: "slate",
    group: "social",
  },
  {
    key: "social.x",
    label: "X",
    tone: "slate",
    group: "social",
  },
  {
    key: "social.youtube",
    label: "YouTube",
    tone: "rose",
    group: "social",
  },
] as const;

export const INTERN_GROWTH_KPIS = [...INTERN_PEOPLE_KPIS, ...INTERN_SOCIAL_KPIS] as const;

export type InternGrowthKpiKey = (typeof INTERN_GROWTH_KPIS)[number]["key"];
export type InternSocialPlatform = "facebook" | "instagram" | "tiktok" | "x" | "youtube";

export type InternSocialCount = {
  visits: number;
  scans: number;
  attributed: number;
};

export type InternSafeKpiSnapshot = {
  marketLabel: string;
  people: {
    petParents: number;
    gurus: number;
    bookableGurus: number;
    ambassadors: number;
  };
  marketPeople: {
    petParents: number;
    gurus: number;
    ambassadors: number;
  };
  social: Record<InternSocialPlatform, InternSocialCount>;
  capturedAt: string;
};

export type InternKpiCard = {
  key: InternGrowthKpiKey;
  group: "people" | "social";
  label: string;
  tone: (typeof INTERN_GROWTH_KPIS)[number]["tone"];
  baseline: number | null;
  current: number;
  impact: number | null;
  helper: string;
  attributed: number;
};

export function internSocialPlatformFromText(value: string | null | undefined) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "twitter" || normalized === "twitter/x" || normalized === "x.com") {
    return "x" as const;
  }
  if (normalized.includes("facebook")) return "facebook" as const;
  if (normalized.includes("instagram")) return "instagram" as const;
  if (normalized.includes("tiktok")) return "tiktok" as const;
  if (normalized.includes("youtube")) return "youtube" as const;
  if (normalized === "x") return "x" as const;
  return null;
}

export function internKpiImpact(current: number, baseline: number | null) {
  if (baseline == null || !Number.isFinite(baseline)) return null;
  return current - baseline;
}

export function internBaselineValue(
  metrics: InternshipMetric[],
  key: InternGrowthKpiKey,
) {
  const rows = metrics.filter(
    (metric) =>
      metric.metricKey === key &&
      metric.isVerified &&
      metric.sourceNote.trim().toLowerCase() === INTERN_KPI_BASELINE_NOTE &&
      metric.valueNumeric != null,
  );
  return rows[0]?.valueNumeric ?? null;
}

export function internCurrentForKey(
  snapshot: InternSafeKpiSnapshot,
  key: InternGrowthKpiKey,
) {
  if (key === "people.pet_parents") return snapshot.people.petParents;
  if (key === "people.gurus") return snapshot.people.gurus;
  if (key === "people.ambassadors") return snapshot.people.ambassadors;
  const platform = key.replace("social.", "") as InternSocialPlatform;
  const social = snapshot.social[platform];
  return (social?.visits || 0) + (social?.scans || 0);
}

export function internAttributedForKey(
  snapshot: InternSafeKpiSnapshot,
  key: InternGrowthKpiKey,
) {
  if (!key.startsWith("social.")) return 0;
  const platform = key.replace("social.", "") as InternSocialPlatform;
  return snapshot.social[platform]?.attributed || 0;
}

export function internCampaignMatchesClick(
  campaigns: Array<Pick<InternshipCampaign, "utmSource" | "utmCampaign">>,
  click: { utmSource?: string | null; utmCampaign?: string | null },
) {
  const source = String(click.utmSource || "").trim().toLowerCase();
  const campaign = String(click.utmCampaign || "").trim().toLowerCase();
  if (!campaign) return false;
  return campaigns.some((row) => {
    const rowCampaign = String(row.utmCampaign || "").trim().toLowerCase();
    if (!rowCampaign || rowCampaign !== campaign) return false;
    const rowSource = String(row.utmSource || "").trim().toLowerCase();
    if (rowSource && source && rowSource !== source) return false;
    return true;
  });
}

export function emptyInternSocialCounts(): Record<InternSocialPlatform, InternSocialCount> {
  return {
    facebook: { visits: 0, scans: 0, attributed: 0 },
    instagram: { visits: 0, scans: 0, attributed: 0 },
    tiktok: { visits: 0, scans: 0, attributed: 0 },
    x: { visits: 0, scans: 0, attributed: 0 },
    youtube: { visits: 0, scans: 0, attributed: 0 },
  };
}

export function buildInternKpiBoard(input: {
  metrics: InternshipMetric[];
  snapshot: InternSafeKpiSnapshot;
}): InternKpiCard[] {
  return INTERN_GROWTH_KPIS.map((kpi) => {
    const baseline = internBaselineValue(input.metrics, kpi.key);
    const current = internCurrentForKey(input.snapshot, kpi.key);
    const impact = internKpiImpact(current, baseline);
    const attributed = internAttributedForKey(input.snapshot, kpi.key);
    const helper =
      kpi.key === "people.gurus"
        ? `${input.snapshot.people.bookableGurus.toLocaleString()} bookable`
        : kpi.group === "social"
          ? attributed
            ? `${attributed.toLocaleString()} from your tracking links`
            : "SitGuru tracked visits + QR scans"
          : input.snapshot.marketLabel;

    return {
      key: kpi.key,
      group: kpi.group,
      label: kpi.label,
      tone: kpi.tone,
      baseline,
      current,
      impact,
      helper,
      attributed,
    };
  });
}
