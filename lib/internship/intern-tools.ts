import { MARKET_GROWTH_PROJECT_NAME } from "@/lib/internship/playbook";

export const INTERN_HOME_TOOLS = [
  {
    id: "brand",
    label: "Brand kit",
    blurb: "Logo, green, @SitGuruOfficial",
  },
  {
    id: "tracking",
    label: "Tracking links",
    blurb: "UTM + referral codes",
  },
  {
    id: "snapshot",
    label: "Market snapshot",
    blurb: "Your market, aggregated",
  },
  {
    id: "events",
    label: "Events to promote",
    blurb: "Public pet events",
  },
  {
    id: "social",
    label: "Social media",
    blurb: "Official accounts + posts",
  },
] as const;

export type InternHomeToolId = (typeof INTERN_HOME_TOOLS)[number]["id"];

export const INTERN_SOCIAL_PLATFORMS = [
  "Instagram",
  "TikTok",
  "Facebook",
  "X",
  "YouTube",
  "Blog",
  "Community",
] as const;

export type InternPromoteEvent = {
  id: string;
  title: string;
  when: string;
  place: string;
  href: string;
};

type InternPromoteEventInput = {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
  start_at?: string | null;
  venue_name?: string | null;
  city?: string | null;
  state?: string | null;
  address_line_1?: string | null;
  contact_email?: string | null;
  partners?: { email?: string | null; business_name?: string | null } | null;
};

function formatEventWhen(startAt: string | null | undefined) {
  const raw = String(startAt || "").trim();
  if (!raw) return "Date TBA";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Date TBA";
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Public event card for interns — never includes emails, streets, or partner PII. */
export function toInternPromoteEvent(event: InternPromoteEventInput): InternPromoteEvent {
  const slug = String(event.slug || "").trim();
  const id = slug || String(event.id || "").trim() || "event";
  const place = [event.venue_name, event.city, event.state]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" · ");

  return {
    id,
    title: String(event.title || "").trim() || "Pet event",
    when: formatEventWhen(event.start_at),
    place: place || "Greater Philadelphia",
    href: slug ? `/events/${encodeURIComponent(slug)}` : "/events",
  };
}

export function internContentByPlatform(
  content: Array<{ platform?: string | null }>,
) {
  const counts = new Map<string, number>();
  for (const item of content) {
    const platform = String(item.platform || "").trim() || "Unspecified";
    counts.set(platform, (counts.get(platform) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count || a.platform.localeCompare(b.platform));
}

export function internMarketSnapshot(input: {
  university?: { region?: string | null } | null;
  campus?: { city?: string | null; state?: string | null } | null;
  metrics: Array<{
    isVerified: boolean;
    label: string;
    valueNumeric: number | null;
    sourceSystem: string;
  }>;
  campaigns: unknown[];
  content: Array<{ platform?: string | null }>;
  smartGoals: Array<{
    id: string;
    specific: string;
    targetValue: string;
    metricKey: string;
  }>;
}) {
  const verified = input.metrics.filter((metric) => metric.isVerified);
  const pending = input.metrics.filter((metric) => !metric.isVerified);
  const region = String(input.university?.region || "").trim();
  const campusLine = [input.campus?.city, input.campus?.state]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");

  return {
    marketLabel: region || campusLine || "Greater Philadelphia",
    projectName: MARKET_GROWTH_PROJECT_NAME,
    verifiedCount: verified.length,
    pendingCount: pending.length,
    verifiedMetrics: verified.slice(0, 8).map((metric) => ({
      label: metric.label,
      value: metric.valueNumeric,
      source: metric.sourceSystem,
    })),
    campaignCount: input.campaigns.length,
    contentCount: input.content.length,
    platforms: internContentByPlatform(input.content),
    goals: input.smartGoals.map((goal) => ({
      id: goal.id,
      title: goal.specific,
      target: goal.targetValue,
      metricKey: goal.metricKey,
    })),
    publicLinks: [
      { href: "/search", label: "Find Care" },
      { href: "/events", label: "Pet Events" },
      { href: "/ambassadors", label: "Ambassadors" },
    ],
  };
}
