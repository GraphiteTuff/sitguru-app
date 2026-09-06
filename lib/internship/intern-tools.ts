import { formatCohortHeadline, formatInstitutionLine } from "@/lib/internship/labels";
import { INTERNSHIP_GROWTH_PATH } from "@/lib/internship/intern-growth";
import { MARKET_GROWTH_PROJECT_NAME } from "@/lib/internship/playbook";

export const INTERN_HOME_TOOLS = [
  {
    id: "brand",
    label: "Brand kit",
    blurb: "Logo, green, @SitGuruOfficial",
    tone: "emerald",
    bar: "bg-emerald-700",
    tile: "border-emerald-200 bg-emerald-50",
    ink: "text-emerald-800",
  },
  {
    id: "tracking",
    label: "Tracking links",
    blurb: "UTM + referral codes",
    tone: "sky",
    bar: "bg-sky-600",
    tile: "border-sky-200 bg-sky-50",
    ink: "text-sky-800",
  },
  {
    id: "snapshot",
    label: "Market snapshot",
    blurb: "Your market, aggregated",
    tone: "violet",
    bar: "bg-violet-600",
    tile: "border-violet-200 bg-violet-50",
    ink: "text-violet-800",
  },
  {
    id: "events",
    label: "Events to promote",
    blurb: "Public pet events",
    tone: "amber",
    bar: "bg-amber-500",
    tile: "border-amber-200 bg-amber-50",
    ink: "text-amber-800",
  },
  {
    id: "social",
    label: "Social media",
    blurb: "Official accounts + posts",
    tone: "rose",
    bar: "bg-rose-600",
    tile: "border-rose-200 bg-rose-50",
    ink: "text-rose-800",
  },
] as const;

export type InternHomeToolId = (typeof INTERN_HOME_TOOLS)[number]["id"];

/** Live SitGuru Market Growth workbench — intern chrome, not Admin HQ. */
export const INTERN_GROWTH_WORKPLACE = {
  href: INTERNSHIP_GROWTH_PATH,
  label: "Growth workplace",
  blurb: "Create posts, tracking links, and campaigns for the Market Growth Project.",
} as const;

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

export function internSchoolEmphasis(input: {
  university?: {
    displayName?: string | null;
    shortName?: string | null;
    name?: string | null;
    city?: string | null;
    state?: string | null;
    isUniversityPartner?: boolean;
    headerTitle?: string | null;
    headerProgram?: string | null;
    logoUrl?: string | null;
    logoPermissionGranted?: boolean;
  } | null;
  campus?: {
    displayName?: string | null;
    name?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
  intern: {
    academicProgram?: string | null;
    courseCode?: string | null;
    credits?: number | null;
    requiredHours?: number | null;
    semester?: string | null;
    academicLevel?: string | null;
  };
  cohort?: { name?: string | null; season?: string | null; year?: number | null } | null;
}) {
  const school =
    String(input.university?.headerTitle || "").trim() ||
    formatInstitutionLine({
      universityName: input.university?.name || "",
      campusName: input.campus?.displayName || input.campus?.name,
      displayName:
        input.university?.displayName || input.university?.shortName || "",
    });
  const campus =
    String(input.campus?.displayName || input.campus?.name || "").trim();
  const place = [
    input.campus?.city || input.university?.city,
    input.campus?.state || input.university?.state,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
  const term = formatCohortHeadline(input.cohort || {});
  const semester = String(input.intern.semester || "").trim() || term;
  const logoPermission = Boolean(input.university?.logoPermissionGranted);
  const logoUrl = logoPermission
    ? String(input.university?.logoUrl || "").trim()
    : "";

  return {
    school,
    campus:
      campus && !school.toLowerCase().includes(campus.toLowerCase()) ? campus : "",
    place,
    program:
      String(input.intern.academicProgram || "").trim() ||
      String(input.university?.headerProgram || "").trim(),
    courseCode: String(input.intern.courseCode || "").trim(),
    semester,
    credits: input.intern.credits,
    hours: input.intern.requiredHours,
    level: String(input.intern.academicLevel || "").trim(),
    partner: Boolean(input.university?.isUniversityPartner),
    logoUrl,
    logoPermission,
  };
}
