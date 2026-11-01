import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getGrowthHomeStats,
  listGrowthContent,
  listUpcomingGrowthEvents,
} from "@/lib/admin/growth/data";
import { loadInternSafeKpiSnapshot } from "@/lib/internship/intern-kpi-snapshot";
import {
  internSocialPlatformFromText,
  isPublicSocialReferralClick,
  type InternSocialPlatform,
} from "@/lib/internship/intern-kpis";
import { isoDaysAgo, type KpiTrend } from "@/lib/sitguru/kpi-trend";

const SOCIAL_ORDER: InternSocialPlatform[] = [
  "facebook",
  "instagram",
  "tiktok",
  "x",
  "youtube",
];

const SOCIAL_LABELS: Record<InternSocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
};

export type LiveResultsData = {
  capturedAt: string;
  marketLabel: string;
  reviewCount: number;
  upcomingEvents: number;
  laterPosts: number;
  reach: number;
  reachThisWeek: number;
  posts: number;
  postsThisWeek: number;
  people: Array<{
    label: string;
    value: number;
    badge: string;
    tone: KpiTrend["tone"];
    baseline: string;
    impact: string;
    weekly: readonly [number, number];
    color: string;
  }>;
  social: Array<{
    label: string;
    value: number;
    badge: string;
    tone: KpiTrend["tone"];
    weekly: readonly [number, number];
    color: string;
  }>;
  content: Array<{ title: string; detail: string; mark: string }>;
  weeklyNew: {
    petParents: readonly [number, number];
    gurus: readonly [number, number];
    ambassadors: readonly [number, number];
  };
};

function emptySocialWeek() {
  return {
    facebook: [0, 0] as [number, number],
    instagram: [0, 0] as [number, number],
    tiktok: [0, 0] as [number, number],
    x: [0, 0] as [number, number],
    youtube: [0, 0] as [number, number],
  };
}

async function socialWeekCounts() {
  const counts = emptySocialWeek();
  const priorStart = isoDaysAgo(14);
  const thisStart = isoDaysAgo(7);
  const nowIso = new Date().toISOString();
  try {
    const { data, error } = await supabaseAdmin
      .from("referral_clicks")
      .select("utm_source,utm_medium,landing_page,referrer,created_at")
      .gte("created_at", priorStart);
    if (error || !data) return counts;
    for (const row of data) {
      const created = String(row.created_at || "");
      const landing = String(row.landing_page || "");
      if (
        !isPublicSocialReferralClick({
          referrer: String(row.referrer || ""),
          landingPage: landing,
        })
      ) {
        continue;
      }
      const platform = internSocialPlatformFromText(
        String(row.utm_source || landing || ""),
      );
      if (!platform) continue;
      if (created >= thisStart && created < nowIso) counts[platform][1] += 1;
      else if (created >= priorStart && created < thisStart) counts[platform][0] += 1;
    }
  } catch {
    return counts;
  }
  return counts;
}

function weekBadge(count: number) {
  return count > 0 ? `+${count.toLocaleString("en-US")} this week` : "0 this week";
}

function inWeek(iso: string | null, start: string, end: string) {
  return Boolean(iso && iso >= start && iso < end);
}

export async function loadLiveResults(): Promise<LiveResultsData> {
  const nowIso = new Date().toISOString();
  const thisStart = isoDaysAgo(7);
  const [snapshot, stats, content, upcoming, socialWeeks] = await Promise.all([
    loadInternSafeKpiSnapshot(),
    getGrowthHomeStats(),
    listGrowthContent(),
    listUpcomingGrowthEvents(40),
    socialWeekCounts(),
  ]);

  const postsThisWeek = content.filter((item) =>
    inWeek(item.createdAt, thisStart, nowIso),
  ).length;
  const laterPosts = content.filter(
    (item) => item.plannedDate && item.plannedDate >= nowIso.slice(0, 10),
  ).length;

  const reachThisWeek = SOCIAL_ORDER.reduce(
    (sum, platform) => sum + socialWeeks[platform][1],
    0,
  );

  const reach = SOCIAL_ORDER.reduce(
    (sum, platform) =>
      sum + snapshot.social[platform].visits + snapshot.social[platform].scans,
    0,
  );

  return {
    capturedAt: snapshot.capturedAt,
    marketLabel: snapshot.marketLabel,
    reviewCount: stats.pendingReview,
    upcomingEvents: upcoming.length,
    laterPosts,
    reach,
    reachThisWeek,
    posts: content.length,
    postsThisWeek,
    people: [
      {
        label: "Pet Parents",
        value: snapshot.people.petParents,
        badge: weekBadge(stats.petParents),
        tone: stats.petParents > 0 ? "up" : "flat",
        baseline: "All SitGuru accounts",
        impact: `${stats.petParents.toLocaleString("en-US")} new this week`,
        weekly: [stats.petParents - stats.trends.petParents.delta, stats.petParents],
        color: "#22C55E",
      },
      {
        label: "Gurus",
        value: snapshot.people.gurus,
        badge: weekBadge(stats.gurus),
        tone: stats.gurus > 0 ? "up" : "flat",
        baseline: `${snapshot.people.bookableGurus.toLocaleString("en-US")} can take bookings`,
        impact: `${stats.gurus.toLocaleString("en-US")} new this week`,
        weekly: [stats.gurus - stats.trends.gurus.delta, stats.gurus],
        color: "#3B82F6",
      },
      {
        label: "Ambassadors",
        value: snapshot.people.ambassadors,
        badge: weekBadge(stats.ambassadors),
        tone: stats.ambassadors > 0 ? "up" : "flat",
        baseline: "Active ambassadors",
        impact: `${stats.ambassadors.toLocaleString("en-US")} new this week`,
        weekly: [
          stats.ambassadors - stats.trends.ambassadors.delta,
          stats.ambassadors,
        ],
        color: "#A855F7",
      },
    ],
    social: SOCIAL_ORDER.map((platform) => ({
      label: SOCIAL_LABELS[platform],
      value:
        snapshot.social[platform].visits + snapshot.social[platform].scans,
      badge: weekBadge(socialWeeks[platform][1]),
      tone: socialWeeks[platform][1] > 0 ? "up" : "flat",
      weekly: socialWeeks[platform],
      color:
        platform === "facebook"
          ? "#2563EB"
          : platform === "instagram"
            ? "#EC4899"
            : platform === "youtube"
              ? "#DC2626"
              : "#0F2744",
    })),
    content: content.slice(0, 3).map((item) => ({
      title: item.title,
      detail: [item.platform, item.status, item.plannedDate]
        .filter(Boolean)
        .join(" · "),
      mark: item.platform.slice(0, 2).toUpperCase() || "SG",
    })),
    weeklyNew: {
      petParents: [
        stats.petParents - stats.trends.petParents.delta,
        stats.petParents,
      ],
      gurus: [stats.gurus - stats.trends.gurus.delta, stats.gurus],
      ambassadors: [
        stats.ambassadors - stats.trends.ambassadors.delta,
        stats.ambassadors,
      ],
    },
  };
}
