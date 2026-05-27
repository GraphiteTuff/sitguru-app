import Link from "next/link";
import {
  Archive,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  HandCoins,
  HeartHandshake,
  MapPin,
  Megaphone,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DbRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type ReferralGroup = {
  title: string;
  description: string;
  count: number;
  statLabel: string;
  href: string;
  icon: typeof Users;
  badgeClassName: string;
};

type GrowthChannel = {
  name: string;
  type: string;
  leads: number;
  signups: number;
  bookings: number;
  revenue: number;
  cost: number;
  rewardCost: number;
  clicks: number;
  trendScore: number;
  recommendation: string;
};

type StrategyInsight = {
  title: string;
  value: string;
  detail: string;
  icon: typeof Users;
  tone: "green" | "amber" | "sky" | "rose";
};

type ProgramScorecard = {
  title: string;
  description: string;
  leads: number;
  signups: number;
  bookings: number;
  revenue: number;
  cost: number;
  rewardCost: number;
  roi: number | null;
  status: "Working" | "Watch" | "Build" | "Needs Data";
  recommendation: string;
};

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<{ rows: T[]; warning: string | null }> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin referrals query skipped for ${label}:`, result.error);

      return {
        rows: [],
        warning: `${label}: table or columns not available yet`,
      };
    }

    return {
      rows: Array.isArray(result.data) ? (result.data as T[]) : [],
      warning: null,
    };
  } catch (error) {
    console.warn(`Admin referrals query skipped for ${label}:`, error);

    return {
      rows: [],
      warning: `${label}: unable to load`,
    };
  }
}

function asString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstString(row: DbRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);

    if (value) return value;
  }

  return fallback;
}

function firstNumber(row: DbRow, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key]);

    if (value) return value;
  }

  return 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function percentValue(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function percent(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function roiPercent(revenue: number, cost: number, rewardCost = 0) {
  const totalCost = cost + rewardCost;

  if (!totalCost) return null;

  return ((revenue - totalCost) / totalCost) * 100;
}

function formatRoi(value: number | null) {
  if (value === null) return "Need cost data";

  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}% ROI`;
}

function isTruthyReferralValue(value: unknown) {
  const normalized = asString(value).toLowerCase();

  if (!normalized) return false;

  return !["none", "null", "undefined", "n/a", "na", "no", "false"].includes(
    normalized,
  );
}

function hasReferralSignal(row: DbRow) {
  const referralKeys = [
    "referral_code",
    "referral",
    "referred_by",
    "referred_by_user_id",
    "referred_by_customer_id",
    "referrer_id",
    "referrer_user_id",
    "invite_code",
    "source_code",
    "partner_code",
    "ambassador_code",
    "affiliate_code",
    "signup_referral_code",
  ];

  return referralKeys.some((key) => isTruthyReferralValue(row[key]));
}

function isCustomerProfile(row: DbRow) {
  const role = firstString(row, ["role", "account_type", "user_type"]).toLowerCase();

  return (
    role.includes("customer") ||
    role.includes("pet_parent") ||
    role.includes("pet parent") ||
    Boolean(row["is_customer"])
  );
}

function isGuruProfile(row: DbRow) {
  const role = firstString(row, ["role", "account_type", "user_type"]).toLowerCase();
  const signupSelection = firstString(row, ["signup_selection"]).toLowerCase();

  return (
    role.includes("guru") ||
    signupSelection.includes("guru") ||
    Boolean(row["is_guru"])
  );
}

function getStatus(row: DbRow) {
  return firstString(
    row,
    [
      "status",
      "reward_status",
      "payout_status",
      "booking_status",
      "application_status",
      "approval_status",
      "payment_status",
    ],
    "pending",
  ).toLowerCase();
}

function isArchivedStatus(row: DbRow) {
  const status = getStatus(row);

  return (
    status === "archived" ||
    status === "archive" ||
    status.includes("archived") ||
    status.includes("not_a_fit") ||
    status.includes("not_moving_forward") ||
    Boolean(asString(row["archived_at"]))
  );
}

function isActiveStatus(row: DbRow) {
  return !isArchivedStatus(row);
}

function isCompleted(row: DbRow) {
  const status = getStatus(row);
  const paymentStatus = firstString(row, [
    "payment_status",
    "stripe_payment_status",
    "pay_status",
  ]).toLowerCase();

  return (
    status.includes("complete") ||
    status.includes("completed") ||
    status.includes("finished") ||
    status.includes("closed") ||
    status.includes("paid") ||
    status.includes("credited") ||
    status.includes("issued") ||
    paymentStatus.includes("paid") ||
    paymentStatus.includes("captured") ||
    paymentStatus.includes("succeeded")
  );
}

function isPending(row: DbRow) {
  const status = getStatus(row);

  return (
    status.includes("pending") ||
    status.includes("review") ||
    status.includes("submitted") ||
    status.includes("qualified") ||
    status.includes("approved")
  );
}

function getAmount(row: DbRow) {
  return firstNumber(row, [
    "amount",
    "reward_amount",
    "credit_amount",
    "payout_amount",
    "commission_amount",
    "total",
    "cost",
    "spend",
    "ad_spend",
    "marketing_spend",
  ]);
}

function getRewardAmount(row: DbRow) {
  return firstNumber(row, [
    "amount",
    "reward_amount",
    "credit_amount",
    "payout_amount",
    "commission_amount",
  ]);
}

function getRevenueAmount(row: DbRow) {
  return firstNumber(row, [
    "subtotal_amount",
    "total_customer_paid",
    "total_amount",
    "booking_total",
    "amount_paid",
    "amount",
    "price",
  ]);
}

function getDate(row: DbRow) {
  return firstString(row, [
    "created_at",
    "updated_at",
    "booking_date",
    "start_time",
    "submitted_at",
    "paid_at",
    "date",
  ]);
}

function isWithinLastDays(value: unknown, days: number) {
  const raw = asString(value);

  if (!raw) return false;

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return date >= cutoff;
}

function getProgram(row: DbRow) {
  return firstString(row, [
    "program",
    "program_type",
    "application_type",
    "type",
    "source",
  ]);
}

function normalizeSourceName(value: string) {
  const source = value.toLowerCase();

  if (source.includes("pawperks") || source.includes("petperks")) return "PawPerks";
  if (source.includes("pet parent")) return "PawPerks";
  if (source.includes("guru")) return "Guru Referrals";
  if (source.includes("ambassador")) return "Ambassador Program";
  if (source.includes("student")) return "Student Hire";
  if (source.includes("veteran") || source.includes("military") || source.includes("skillbridge")) {
    return "Veterans Hire";
  }
  if (source.includes("partner") || source.includes("vet") || source.includes("groomer") || source.includes("trainer")) {
    return "Partner Network";
  }
  if (source.includes("affiliate")) return "Affiliate Program";
  if (source.includes("google")) return "Google Ads";
  if (source.includes("facebook") || source.includes("meta")) return "Facebook Ads";
  if (source.includes("instagram")) return "Instagram";
  if (source.includes("tiktok")) return "TikTok";
  if (source.includes("flyer")) return "Flyers / Door Hangers";
  if (source.includes("yard")) return "Yard Signs";
  if (source.includes("qr")) return "QR Codes";
  if (source.includes("organic")) return "Organic Search";
  if (source.includes("direct")) return "Direct";

  return value ? titleCase(value) : "Direct";
}

function getSource(row: DbRow) {
  const raw = firstString(row, [
    "source",
    "referral_source",
    "partner_source",
    "utm_source",
    "utm_campaign",
    "campaign",
    "campaign_name",
    "program",
    "program_type",
    "type",
    "referral_code",
    "signup_referral_code",
    "partner_code",
    "ambassador_code",
    "affiliate_code",
  ]);

  return normalizeSourceName(raw || "Direct");
}

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 2 && word === word.toUpperCase()) return word;
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function getCampaignCost(row: DbRow) {
  return firstNumber(row, [
    "cost",
    "spend",
    "ad_spend",
    "marketing_spend",
    "budget_spent",
    "amount_spent",
    "total_spend",
  ]);
}

function getClickCount(row: DbRow) {
  return firstNumber(row, ["clicks", "scan_count", "views", "visits", "count"]);
}

function getSignupCount(row: DbRow) {
  return firstNumber(row, ["signups", "signup_count", "conversions", "leads"]);
}

function getBookingCount(row: DbRow) {
  return firstNumber(row, ["bookings", "booking_count", "completed_bookings"]);
}

function getDisplayName(row: DbRow, fallback = "Unknown") {
  const firstName = firstString(row, ["first_name", "firstName"]);
  const lastName = firstString(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return firstString(
    row,
    [
      "full_name",
      "display_name",
      "name",
      "customer_name",
      "pet_parent_name",
      "guru_name",
      "ambassador_name",
      "partner_name",
      "business_name",
      "email",
    ],
    fallback,
  );
}

function addChannel(
  channels: Map<string, GrowthChannel>,
  name: string,
  updates: Partial<GrowthChannel>,
) {
  const normalized = normalizeSourceName(name);
  const current =
    channels.get(normalized) ||
    {
      name: normalized,
      type: inferChannelType(normalized),
      leads: 0,
      signups: 0,
      bookings: 0,
      revenue: 0,
      cost: 0,
      rewardCost: 0,
      clicks: 0,
      trendScore: 0,
      recommendation: "",
    };

  channels.set(normalized, {
    ...current,
    leads: current.leads + (updates.leads || 0),
    signups: current.signups + (updates.signups || 0),
    bookings: current.bookings + (updates.bookings || 0),
    revenue: current.revenue + (updates.revenue || 0),
    cost: current.cost + (updates.cost || 0),
    rewardCost: current.rewardCost + (updates.rewardCost || 0),
    clicks: current.clicks + (updates.clicks || 0),
    trendScore: current.trendScore + (updates.trendScore || 0),
    recommendation: current.recommendation,
  });
}

function inferChannelType(name: string) {
  const lower = name.toLowerCase();

  if (lower.includes("ads") || lower.includes("google") || lower.includes("facebook")) {
    return "Paid Marketing";
  }

  if (
    lower.includes("flyer") ||
    lower.includes("yard") ||
    lower.includes("qr") ||
    lower.includes("door")
  ) {
    return "Offline Marketing";
  }

  if (
    lower.includes("pawperks") ||
    lower.includes("referral") ||
    lower.includes("ambassador") ||
    lower.includes("partner") ||
    lower.includes("affiliate")
  ) {
    return "Referral / Network";
  }

  if (lower.includes("student") || lower.includes("veteran")) return "Hiring Program";

  return "Organic / Direct";
}

function buildRecommendation(channel: GrowthChannel) {
  const roi = roiPercent(channel.revenue, channel.cost, channel.rewardCost);
  const bookingConversion = channel.signups ? (channel.bookings / channel.signups) * 100 : 0;
  const signupConversion = channel.clicks ? (channel.signups / channel.clicks) * 100 : 0;

  if (channel.bookings > 0 && (roi === null || roi >= 100)) {
    return "Scale this channel. It is producing booking activity with strong or low-cost return.";
  }

  if (channel.signups > 0 && channel.bookings === 0) {
    return "Improve activation. This channel creates signups, but needs first-booking nudges and follow-up.";
  }

  if (channel.clicks > 0 && signupConversion < 3) {
    return "Review landing page and targeting. Clicks are not turning into enough signups.";
  }

  if (channel.signups > 0 && bookingConversion < 10) {
    return "Refine onboarding. Signups are coming in, but first paid booking conversion is low.";
  }

  if (channel.cost > 0 && channel.revenue === 0) {
    return "Pause or tighten spend until attribution shows bookings or revenue.";
  }

  return "Keep tracking. More data is needed before making a strong growth decision.";
}

function getChannelStatus(channel: GrowthChannel): ProgramScorecard["status"] {
  const roi = roiPercent(channel.revenue, channel.cost, channel.rewardCost);

  if (!channel.leads && !channel.signups && !channel.bookings) return "Needs Data";
  if (channel.bookings > 0 && (roi === null || roi >= 0)) return "Working";
  if (channel.signups > 0 || channel.leads > 0) return "Watch";
  return "Build";
}

function buildGrowthChannels({
  profiles,
  bookings,
  programApplications,
  partnerPayouts,
  referralRewards,
  referralEvents,
  referralCodes,
  growthCampaigns,
  growthCampaignEvents,
  growthCampaignCosts,
  networkClickEvents,
  referralClickEvents,
  referralConversions,
}: {
  profiles: DbRow[];
  bookings: DbRow[];
  programApplications: DbRow[];
  partnerPayouts: DbRow[];
  referralRewards: DbRow[];
  referralEvents: DbRow[];
  referralCodes: DbRow[];
  growthCampaigns: DbRow[];
  growthCampaignEvents: DbRow[];
  growthCampaignCosts: DbRow[];
  networkClickEvents: DbRow[];
  referralClickEvents: DbRow[];
  referralConversions: DbRow[];
}) {
  const channels = new Map<string, GrowthChannel>();

  for (const profile of profiles) {
    addChannel(channels, getSource(profile), {
      signups: 1,
      leads: hasReferralSignal(profile) ? 1 : 0,
      trendScore: isWithinLastDays(getDate(profile), 30) ? 2 : 1,
    });
  }

  for (const booking of bookings) {
    addChannel(channels, getSource(booking), {
      bookings: 1,
      revenue: getRevenueAmount(booking),
      trendScore: isWithinLastDays(getDate(booking), 30) ? 4 : 2,
    });
  }

  for (const application of programApplications) {
    addChannel(channels, getSource(application), {
      leads: 1,
      trendScore: isWithinLastDays(getDate(application), 30) ? 2 : 1,
    });
  }

  for (const payout of partnerPayouts) {
    addChannel(channels, getSource(payout), {
      rewardCost: getRewardAmount(payout),
      trendScore: isCompleted(payout) ? 1 : 0,
    });
  }

  for (const reward of referralRewards) {
    addChannel(channels, getSource(reward), {
      rewardCost: getRewardAmount(reward),
      trendScore: isCompleted(reward) ? 1 : 0,
    });
  }

  for (const event of referralEvents) {
    addChannel(channels, getSource(event), {
      leads: 1,
      bookings: isCompleted(event) ? 1 : 0,
      trendScore: isWithinLastDays(getDate(event), 30) ? 2 : 1,
    });
  }

  for (const code of referralCodes) {
    addChannel(channels, getSource(code), {
      leads: 1,
      trendScore: isWithinLastDays(getDate(code), 30) ? 1 : 0,
    });
  }

  for (const campaign of growthCampaigns) {
    const name = firstString(campaign, ["campaign_name", "name", "utm_campaign", "source"], "Campaign");

    addChannel(channels, name, {
      cost: getCampaignCost(campaign),
      clicks: getClickCount(campaign),
      signups: getSignupCount(campaign),
      bookings: getBookingCount(campaign),
      revenue: firstNumber(campaign, ["revenue", "attributed_revenue", "booking_revenue"]),
      leads: firstNumber(campaign, ["leads", "lead_count"]),
    });
  }

  for (const event of growthCampaignEvents) {
    const eventType = firstString(event, ["event_type", "type", "name"]).toLowerCase();

    addChannel(channels, getSource(event), {
      clicks: eventType.includes("click") || eventType.includes("scan") || eventType.includes("visit") ? 1 : 0,
      signups: eventType.includes("signup") ? 1 : 0,
      bookings: eventType.includes("booking") || eventType.includes("purchase") ? 1 : 0,
      revenue: firstNumber(event, ["revenue", "amount", "booking_amount"]),
      leads: eventType.includes("lead") ? 1 : 0,
      trendScore: isWithinLastDays(getDate(event), 30) ? 2 : 1,
    });
  }

  for (const cost of growthCampaignCosts) {
    addChannel(channels, getSource(cost), {
      cost: getCampaignCost(cost),
    });
  }

  for (const click of [...networkClickEvents, ...referralClickEvents]) {
    addChannel(channels, getSource(click), {
      clicks: getClickCount(click) || 1,
      trendScore: isWithinLastDays(getDate(click), 30) ? 1 : 0,
    });
  }

  for (const conversion of referralConversions) {
    addChannel(channels, getSource(conversion), {
      signups: 1,
      bookings: isCompleted(conversion) ? 1 : 0,
      revenue: firstNumber(conversion, ["revenue", "amount", "booking_amount"]),
      trendScore: isWithinLastDays(getDate(conversion), 30) ? 3 : 1,
    });
  }

  return Array.from(channels.values())
    .map((channel) => ({
      ...channel,
      recommendation: buildRecommendation(channel),
    }))
    .sort((a, b) => {
      const aScore = a.revenue + a.bookings * 250 + a.signups * 50 + a.leads * 20 - a.cost - a.rewardCost;
      const bScore = b.revenue + b.bookings * 250 + b.signups * 50 + b.leads * 20 - b.cost - b.rewardCost;

      return bScore - aScore;
    });
}

function buildProgramScorecards(channels: GrowthChannel[]): ProgramScorecard[] {
  const programNames = [
    "PawPerks",
    "Guru Referrals",
    "Ambassador Program",
    "Partner Network",
    "Affiliate Program",
    "Student Hire",
    "Veterans Hire",
    "Google Ads",
    "Facebook Ads",
    "Instagram",
    "Flyers / Door Hangers",
    "Yard Signs",
    "QR Codes",
    "Organic Search",
    "Direct",
  ];

  return programNames.map((name) => {
    const matching = channels.filter((channel) => channel.name === name || channel.name.toLowerCase().includes(name.toLowerCase()));

    const merged = matching.reduce(
      (acc, channel) => ({
        leads: acc.leads + channel.leads,
        signups: acc.signups + channel.signups,
        bookings: acc.bookings + channel.bookings,
        revenue: acc.revenue + channel.revenue,
        cost: acc.cost + channel.cost,
        rewardCost: acc.rewardCost + channel.rewardCost,
      }),
      { leads: 0, signups: 0, bookings: 0, revenue: 0, cost: 0, rewardCost: 0 },
    );

    const syntheticChannel: GrowthChannel = {
      name,
      type: inferChannelType(name),
      clicks: 0,
      trendScore: 0,
      recommendation: "",
      ...merged,
    };

    return {
      title: name,
      description: inferChannelType(name),
      ...merged,
      roi: roiPercent(merged.revenue, merged.cost, merged.rewardCost),
      status: getChannelStatus(syntheticChannel),
      recommendation: buildRecommendation(syntheticChannel),
    };
  });
}

function buildInsights(channels: GrowthChannel[], bookings: DbRow[], gurus: DbRow[]): StrategyInsight[] {
  const topByBookings = channels.find((channel) => channel.bookings > 0);
  const topByRevenue = [...channels].sort((a, b) => b.revenue - a.revenue)[0];
  const paidWithSpend = channels.filter((channel) => channel.cost > 0);
  const bestRoi = paidWithSpend
    .map((channel) => ({
      channel,
      roi: roiPercent(channel.revenue, channel.cost, channel.rewardCost),
    }))
    .filter((item): item is { channel: GrowthChannel; roi: number } => item.roi !== null)
    .sort((a, b) => b.roi - a.roi)[0];

  const weakPaid = paidWithSpend
    .map((channel) => ({
      channel,
      roi: roiPercent(channel.revenue, channel.cost, channel.rewardCost),
    }))
    .filter((item): item is { channel: GrowthChannel; roi: number } => item.roi !== null)
    .sort((a, b) => a.roi - b.roi)[0];

  const recentBookings = bookings.filter((booking) => isWithinLastDays(getDate(booking), 30)).length;
  const recentGuruSupply = gurus.filter((guru) => isWithinLastDays(getDate(guru), 30)).length;

  return [
    {
      title: "Best growth channel",
      value: topByBookings?.name || topByRevenue?.name || "Need more data",
      detail: topByBookings
        ? `${topByBookings.bookings} booking signal(s), ${topByBookings.signups} signup(s), ${money(topByBookings.revenue)} attributed revenue.`
        : "No booking-producing channel is clear yet. Keep tracking source codes on signup and booking flows.",
      icon: TrendingUp,
      tone: "green",
    },
    {
      title: "Highest ROI source",
      value: bestRoi ? bestRoi.channel.name : "Need spend data",
      detail: bestRoi
        ? `${formatRoi(bestRoi.roi)} from ${money(bestRoi.channel.revenue)} revenue against ${money(bestRoi.channel.cost + bestRoi.channel.rewardCost)} cost.`
        : "Marketing ROI needs campaign spend and attributed booking revenue to be fully reliable.",
      icon: BadgeDollarSign,
      tone: "sky",
    },
    {
      title: "Needs attention",
      value: weakPaid ? weakPaid.channel.name : "Activation quality",
      detail: weakPaid
        ? `${formatRoi(weakPaid.roi)}. Review creative, targeting, or landing page before scaling spend.`
        : "Focus on turning referral signups into first eligible paid bookings.",
      icon: TrendingDown,
      tone: "amber",
    },
    {
      title: "Supply vs demand signal",
      value: recentBookings > recentGuruSupply ? "Recruit Gurus" : "Build demand",
      detail:
        recentBookings > recentGuruSupply
          ? `${recentBookings} recent booking signal(s) vs ${recentGuruSupply} recent Guru supply signal(s). Add local Gurus where demand is rising.`
          : `${recentGuruSupply} recent Guru supply signal(s) vs ${recentBookings} recent booking signal(s). Push local Pet Parent acquisition and PawPerks.`,
      icon: MapPin,
      tone: "rose",
    },
  ];
}

function InsightCard({ insight }: { insight: StrategyInsight }) {
  const Icon = insight.icon;

  const toneClass =
    insight.tone === "green"
      ? "border-green-100 bg-green-50 text-green-800"
      : insight.tone === "sky"
        ? "border-sky-100 bg-sky-50 text-sky-800"
        : insight.tone === "amber"
          ? "border-amber-100 bg-amber-50 text-amber-800"
          : "border-rose-100 bg-rose-50 text-rose-800";

  return (
    <div className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {insight.title}
          </p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            {insight.value}
          </p>
        </div>

        <span className={`grid h-12 w-12 place-items-center rounded-2xl border ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
        {insight.detail}
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 text-green-800 ring-1 ring-green-100">
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function ScoreStatusPill({ status }: { status: ProgramScorecard["status"] }) {
  const className =
    status === "Working"
      ? "border-green-200 bg-green-50 text-green-800"
      : status === "Watch"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : status === "Build"
          ? "border-sky-200 bg-sky-50 text-sky-800"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {status}
    </span>
  );
}

function ProgramScorecardRow({ scorecard }: { scorecard: ProgramScorecard }) {
  const conversion = scorecard.signups ? (scorecard.bookings / scorecard.signups) * 100 : 0;

  return (
    <div className="rounded-3xl border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              {scorecard.title}
            </h3>
            <ScoreStatusPill status={scorecard.status} />
          </div>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {scorecard.description}
          </p>
        </div>

        <p className="rounded-2xl bg-[#fbfcf9] px-4 py-2 text-sm font-black text-green-800 ring-1 ring-[#edf3ee]">
          {formatRoi(scorecard.roi)}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <MiniMetric label="Leads" value={formatNumber(scorecard.leads)} />
        <MiniMetric label="Signups" value={formatNumber(scorecard.signups)} />
        <MiniMetric label="Bookings" value={formatNumber(scorecard.bookings)} />
        <MiniMetric label="Revenue" value={money(scorecard.revenue)} />
        <MiniMetric label="Cost" value={money(scorecard.cost + scorecard.rewardCost)} />
        <MiniMetric label="Booking Conv." value={percentValue(conversion)} />
      </div>

      <div className="mt-4 rounded-2xl border border-green-100 bg-green-50/70 p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-green-800">
          Recommended refinement
        </p>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
          {scorecard.recommendation}
        </p>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function MarketingRoiTable({ channels }: { channels: GrowthChannel[] }) {
  const marketingChannels = channels
    .filter((channel) =>
      ["Paid Marketing", "Offline Marketing", "Organic / Direct"].includes(channel.type),
    )
    .slice(0, 8);

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#e3ece5] bg-white shadow-sm">
      <div className="border-b border-[#edf3ee] bg-[#fbfcf9] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
              Marketing & Advertising ROI
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Which campaigns deserve more spend?
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Uses available campaign, click, referral, booking, and cost data.
              For offline ads, use unique QR/source links so flyers, yard signs,
              business cards, and partner materials can be tracked.
            </p>
          </div>

          <Link
            href="/admin/referrals/payouts"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
          >
            View reward costs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#edf3ee] bg-white">
              {[
                "Channel",
                "Type",
                "Clicks",
                "Signups",
                "Bookings",
                "Revenue",
                "Cost",
                "ROI",
                "Admin action",
              ].map((label) => (
                <th
                  key={label}
                  className="px-5 py-4 text-xs font-black uppercase tracking-[0.1em] text-slate-500"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {marketingChannels.length ? (
              marketingChannels.map((channel) => {
                const roi = roiPercent(channel.revenue, channel.cost, channel.rewardCost);

                return (
                  <tr
                    key={channel.name}
                    className="border-b border-[#f1f5f2] last:border-0"
                  >
                    <td className="px-5 py-4 font-black text-slate-950">
                      {channel.name}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {channel.type}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {formatNumber(channel.clicks)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {formatNumber(channel.signups)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {formatNumber(channel.bookings)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {money(channel.revenue)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {money(channel.cost + channel.rewardCost)}
                    </td>
                    <td className="px-5 py-4 font-black text-green-800">
                      {formatRoi(roi)}
                    </td>
                    <td className="max-w-[300px] px-5 py-4 text-xs font-bold leading-5 text-slate-600">
                      {channel.recommendation}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-12 text-center text-sm font-bold text-slate-500"
                >
                  No marketing ROI rows found yet. Add campaign/source tracking
                  such as Google Ads, Facebook Ads, QR codes, flyers, door
                  hangers, yard signs, or partner links.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReferralGroupCard({ group }: { group: ReferralGroup }) {
  const Icon = group.icon;

  return (
    <Link
      href={group.href}
      className="group rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg"
    >
      <div className={group.badgeClassName}>Open drill-down</div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            {group.title}
          </h2>

          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            {group.description}
          </p>
        </div>

        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-50 text-green-800 ring-1 ring-green-100">
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
        <div>
          <p className="text-3xl font-black tracking-tight text-slate-950">
            {formatNumber(group.count)}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {group.statLabel}
          </p>
        </div>

        <ArrowRight className="h-5 w-5 text-green-800 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function WarningBox({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;

  return (
    <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
      <p className="text-sm font-black text-amber-950">
        Some optional growth and ROI tables are not available yet.
      </p>
      <div className="mt-2 grid gap-1 text-sm font-semibold leading-6 text-amber-900 md:grid-cols-2">
        {warnings.map((warning) => (
          <p key={warning}>• {warning}</p>
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-amber-800">
        The page still uses available Supabase rows and will automatically pull
        richer ROI once campaign/cost tables exist.
      </p>
    </section>
  );
}

export default async function AdminReferralsPage() {
  const [
    profilesResult,
    bookingsResult,
    gurusResult,
    programApplicationsResult,
    ambassadorLeadsResult,
    ambassadorsResult,
    ambassadorReferralsResult,
    ambassadorRewardsResult,
    partnerPayoutsResult,
    referralRewardsResult,
    referralEventsResult,
    referralCodesResult,
    growthCampaignsResult,
    growthCampaignEventsResult,
    growthCampaignCostsResult,
    networkClickEventsResult,
    referralClickEventsResult,
    referralConversionsResult,
  ] = await Promise.all([
    safeRows<DbRow>(supabaseAdmin.from("profiles").select("*").limit(5000), "profiles"),
    safeRows<DbRow>(supabaseAdmin.from("bookings").select("*").limit(5000), "bookings"),
    safeRows<DbRow>(supabaseAdmin.from("gurus").select("*").limit(5000), "gurus"),
    safeRows<DbRow>(
      supabaseAdmin.from("program_applications").select("*").limit(5000),
      "program_applications",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("ambassador_leads").select("*").limit(5000),
      "ambassador_leads",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("ambassadors").select("*").limit(5000),
      "ambassadors",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("ambassador_referrals").select("*").limit(5000),
      "ambassador_referrals",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("ambassador_rewards").select("*").limit(5000),
      "ambassador_rewards",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("partner_payouts").select("*").limit(5000),
      "partner_payouts",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("referral_rewards").select("*").limit(5000),
      "referral_rewards",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("referral_events").select("*").limit(5000),
      "referral_events",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("referral_codes").select("*").limit(5000),
      "referral_codes",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("growth_campaigns").select("*").limit(5000),
      "growth_campaigns",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("growth_campaign_events").select("*").limit(5000),
      "growth_campaign_events",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("growth_campaign_costs").select("*").limit(5000),
      "growth_campaign_costs",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("network_click_events").select("*").limit(5000),
      "network_click_events",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("referral_clicks").select("*").limit(5000),
      "referral_clicks",
    ),
    safeRows<DbRow>(
      supabaseAdmin.from("referral_conversions").select("*").limit(5000),
      "referral_conversions",
    ),
  ]);

  const profiles = profilesResult.rows;
  const bookings = bookingsResult.rows;
  const gurus = gurusResult.rows;
  const programApplications = programApplicationsResult.rows;
  const ambassadorLeads = ambassadorLeadsResult.rows;
  const ambassadors = ambassadorsResult.rows;
  const ambassadorReferrals = ambassadorReferralsResult.rows;
  const ambassadorRewards = ambassadorRewardsResult.rows;
  const partnerPayouts = partnerPayoutsResult.rows;
  const referralRewards = referralRewardsResult.rows;
  const referralEvents = referralEventsResult.rows;
  const referralCodes = referralCodesResult.rows;
  const growthCampaigns = growthCampaignsResult.rows;
  const growthCampaignEvents = growthCampaignEventsResult.rows;
  const growthCampaignCosts = growthCampaignCostsResult.rows;
  const networkClickEvents = networkClickEventsResult.rows;
  const referralClickEvents = referralClickEventsResult.rows;
  const referralConversions = referralConversionsResult.rows;

  const warnings = [
    profilesResult.warning,
    bookingsResult.warning,
    gurusResult.warning,
    programApplicationsResult.warning,
    ambassadorLeadsResult.warning,
    ambassadorsResult.warning,
    ambassadorReferralsResult.warning,
    ambassadorRewardsResult.warning,
    partnerPayoutsResult.warning,
    referralRewardsResult.warning,
    referralEventsResult.warning,
    referralCodesResult.warning,
    growthCampaignsResult.warning,
    growthCampaignEventsResult.warning,
    growthCampaignCostsResult.warning,
    networkClickEventsResult.warning,
    referralClickEventsResult.warning,
    referralConversionsResult.warning,
  ].filter(Boolean) as string[];

  const profilesWithReferralSignal = profiles.filter(hasReferralSignal);
  const customerReferralProfiles = profilesWithReferralSignal.filter(isCustomerProfile);
  const guruReferralProfiles = profilesWithReferralSignal.filter(isGuruProfile);

  const activeAmbassadorLeads = ambassadorLeads.filter(isActiveStatus);
  const archivedAmbassadorLeads = ambassadorLeads.filter(isArchivedStatus);
  const activeAmbassadors = ambassadors.filter(isActiveStatus);
  const archivedAmbassadors = ambassadors.filter(isArchivedStatus);
  const activeAmbassadorReferrals = ambassadorReferrals.filter(isActiveStatus);
  const activeAmbassadorRewards = ambassadorRewards.filter(isActiveStatus);
  const ambassadorPipelineTotal =
    activeAmbassadorLeads.length +
    activeAmbassadors.length +
    activeAmbassadorReferrals.length;
  const archivedAmbassadorTotal = archivedAmbassadorLeads.length + archivedAmbassadors.length;
  const ambassadorRewardLiability = activeAmbassadorRewards
    .filter(isPending)
    .reduce((sum, row) => sum + getRewardAmount(row), 0);
  const ambassadorPaidRewards = activeAmbassadorRewards
    .filter(isCompleted)
    .reduce((sum, row) => sum + getRewardAmount(row), 0);

  const bookingReferralSignals = bookings.filter(hasReferralSignal);
  const completedReferralBookings =
    referralEvents.length > 0 || referralRewards.length > 0
      ? referralEvents.filter(isCompleted).length + referralRewards.filter(isCompleted).length
      : bookingReferralSignals.filter(isCompleted).length;

  const pendingRewardRows = referralRewards.filter(isPending);
  const paidRewardRows = referralRewards.filter(isCompleted);

  const pendingRewardLiability = pendingRewardRows.reduce(
    (sum, row) => sum + getRewardAmount(row),
    0,
  );

  const paidRewardValue = paidRewardRows.reduce(
    (sum, row) => sum + getRewardAmount(row),
    0,
  );

  const ambassadorApplications = programApplications.filter((application) =>
    getProgram(application).toLowerCase().includes("ambassador"),
  );
  const activeAmbassadorApplications = ambassadorApplications.filter(isActiveStatus);

  const studentApplications = programApplications.filter((application) =>
    getProgram(application).toLowerCase().includes("student"),
  );

  const veteranApplications = programApplications.filter((application) => {
    const program = getProgram(application).toLowerCase();
    return (
      program.includes("veteran") ||
      program.includes("military") ||
      program.includes("skillbridge")
    );
  });

  const partnerReferralRows = [
    ...partnerPayouts,
    ...bookings.filter((booking) =>
      Boolean(
        firstString(booking, [
          "partner_id",
          "partner_code",
          "affiliate_id",
          "affiliate_code",
          "ambassador_id",
          "ambassador_code",
        ]),
      ),
    ),
  ];

  const growthChannels = buildGrowthChannels({
    profiles,
    bookings,
    programApplications,
    partnerPayouts,
    referralRewards,
    referralEvents,
    referralCodes,
    growthCampaigns,
    growthCampaignEvents,
    growthCampaignCosts,
    networkClickEvents,
    referralClickEvents,
    referralConversions,
  });

  const insights = buildInsights(growthChannels, bookings, gurus);
  const programScorecards = buildProgramScorecards(growthChannels);
  const topGrowthChannel = growthChannels[0];
  const totalMarketingCost = growthChannels.reduce(
    (sum, channel) => sum + channel.cost + channel.rewardCost,
    0,
  );
  const totalAttributedRevenue = growthChannels.reduce(
    (sum, channel) => sum + channel.revenue,
    0,
  );
  const overallRoi = roiPercent(totalAttributedRevenue, totalMarketingCost, 0);

  const referralGroups: ReferralGroup[] = [
    {
      title: "Pet Parent Referrals",
      description:
        "Track PawPerks invites, referral-coded Pet Parent signups, first eligible paid bookings, pending rewards, and earned customer credits.",
      count:
        customerReferralProfiles.length ||
        referralEvents.length ||
        referralCodes.length ||
        bookingReferralSignals.length,
      statLabel: "Pet Parent referral signals",
      href: "/admin/referrals/pet-parents",
      icon: Users,
      badgeClassName:
        "mb-4 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-green-800 ring-1 ring-green-100",
    },
    {
      title: "Guru Referrals",
      description:
        "Track referred Gurus, approval progress, first completed bookings, and Guru referral reward eligibility.",
      count: guruReferralProfiles.length || gurus.filter(hasReferralSignal).length,
      statLabel: "Guru referral signals",
      href: "/admin/referrals/gurus",
      icon: ShieldCheck,
      badgeClassName:
        "mb-4 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-sky-800 ring-1 ring-sky-100",
    },
    {
      title: "Ambassador Referrals",
      description:
        "Track Ambassador-driven Pet Parent and Guru growth, active Ambassador records, archived records, referral activity, rewards, and program performance.",
      count:
        ambassadorPipelineTotal ||
        activeAmbassadorApplications.length ||
        activeAmbassadorRewards.length,
      statLabel: `${formatNumber(activeAmbassadorLeads.length)} active leads • ${formatNumber(archivedAmbassadorTotal)} archived`,
      href: "/admin/ambassadors",
      icon: Megaphone,
      badgeClassName:
        "mb-4 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-800 ring-1 ring-violet-100",
    },
    {
      title: "Partner Referrals",
      description:
        "Track partner-sourced leads, applications, bookings, conversion activity, and payout qualification.",
      count: partnerReferralRows.length,
      statLabel: "Partner / affiliate signals",
      href: "/admin/referrals/partners",
      icon: HeartHandshake,
      badgeClassName:
        "mb-4 inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-orange-800 ring-1 ring-orange-100",
    },
    {
      title: "Referral & Program Payouts",
      description:
        "Review reward liabilities, earned payouts, pending approvals, and completed referral/program payments.",
      count: pendingRewardRows.length + paidRewardRows.length + partnerPayouts.length,
      statLabel: "Reward / payout rows",
      href: "/admin/referrals/payouts",
      icon: HandCoins,
      badgeClassName:
        "mb-4 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-800 ring-1 ring-amber-100",
    },
    {
      title: "Program Applications",
      description:
        "Monitor Ambassador, Student Hire, Veterans Hire, SkillBridge, and partner program application activity.",
      count: programApplications.length,
      statLabel: "Program applications",
      href: "/admin/referrals/applications",
      icon: ClipboardList,
      badgeClassName:
        "mb-4 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-rose-800 ring-1 ring-rose-100",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-5">
      <section className="overflow-hidden rounded-[32px] border border-green-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-green-800">
              Admin / Growth Intelligence & Referrals
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Growth Intelligence Command Center
            </h1>

            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
              Real-time growth strategy dashboard for referral performance,
              program effectiveness, marketing ROI, booking conversion, reward
              liability, and where SitGuru should refine acquisition next.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
            <div className="rounded-3xl border border-green-100 bg-[#fbfcf9] px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                Top channel
              </p>
              <p className="mt-2 text-xl font-black text-slate-950">
                {topGrowthChannel?.name || "Need data"}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Based on bookings, revenue, and signals
              </p>
            </div>

            <div className="rounded-3xl border border-green-100 bg-[#fbfcf9] px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                Attributed revenue
              </p>
              <p className="mt-2 text-xl font-black text-slate-950">
                {money(totalAttributedRevenue)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                From tracked growth channels
              </p>
            </div>

            <div className="rounded-3xl border border-green-100 bg-[#fbfcf9] px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                Growth ROI
              </p>
              <p className="mt-2 text-xl font-black text-slate-950">
                {formatRoi(overallRoi)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Revenue vs ad/reward cost
              </p>
            </div>
          </div>
        </div>
      </section>

      <WarningBox warnings={warnings} />

      <section className="grid gap-3 rounded-[28px] border border-green-100 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/ambassador-leads"
          className="group rounded-2xl border border-green-100 bg-[#fbfcf9] p-4 transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-50 text-green-800 ring-1 ring-green-100">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">Ambassador Leads</p>
              <p className="text-xs font-bold text-slate-500">
                Contacted, Interested, Not Moving, Archive, Restore
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/ambassadors"
          className="group rounded-2xl border border-green-100 bg-[#fbfcf9] p-4 transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-50 text-green-800 ring-1 ring-green-100">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">Ambassador Dashboard</p>
              <p className="text-xs font-bold text-slate-500">
                Active, paused, archived, restored, rewards
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/hr"
          className="group rounded-2xl border border-green-100 bg-[#fbfcf9] p-4 transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-50 text-green-800 ring-1 ring-green-100">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">HR Command Center</p>
              <p className="text-xs font-bold text-slate-500">
                Active pipeline and archived applicant counts
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/referrals/payouts"
          className="group rounded-2xl border border-green-100 bg-[#fbfcf9] p-4 transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-50 text-green-800 ring-1 ring-green-100">
              <HandCoins className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">Referral Payouts</p>
              <p className="text-xs font-bold text-slate-500">
                Reward liability and payout readiness
              </p>
            </div>
          </div>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => (
          <InsightCard key={insight.title} insight={insight} />
        ))}
      </section>

      <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
              Real-time growth strategy
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              What SitGuru should do next
            </h2>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
              These recommendations use live referral, application, booking,
              reward, campaign, click, and conversion signals where available.
            </p>
          </div>

          <Link
            href="/admin/pet-analytics"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
          >
            View Pet Demand Analytics
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-[#edf3ee] bg-[#fbfcf9] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-50 text-green-800 ring-1 ring-green-100">
              <Target className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-xl font-black text-slate-950">
              Scale what produces bookings
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Prioritize channels with actual first paid booking signals over
              vanity metrics. Signups matter, but bookings and repeat care prove
              growth quality.
            </p>
          </div>

          <div className="rounded-3xl border border-[#edf3ee] bg-[#fbfcf9] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-50 text-green-800 ring-1 ring-green-100">
              <MousePointerClick className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-xl font-black text-slate-950">
              Track every marketing source
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Use unique source links and QR codes for ads, flyers, door
              hangers, yard signs, business cards, Ambassadors, partners, and
              local campaigns.
            </p>
          </div>

          <div className="rounded-3xl border border-[#edf3ee] bg-[#fbfcf9] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-50 text-green-800 ring-1 ring-green-100">
              <MapPin className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-xl font-black text-slate-950">
              Match demand with Guru supply
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Use Pet Analytics and referral demand together. If Pet Parent
              interest rises in a ZIP code, recruit Gurus, Ambassadors, and
              partners in that same local market.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Referral-coded profiles"
          value={formatNumber(profilesWithReferralSignal.length)}
          detail="Profiles with referral, invite, partner, ambassador, or affiliate signal fields."
          icon={Users}
        />

        <KpiCard
          label="Qualified activity"
          value={formatNumber(completedReferralBookings)}
          detail="Completed booking, referral event, or reward rows that appear eligible for qualification."
          icon={CheckCircle2}
        />

        <KpiCard
          label="Pending reward liability"
          value={money(pendingRewardLiability)}
          detail="Pending, approved, review, or qualified rewards from referral_rewards when available."
          icon={BadgeDollarSign}
        />

        <KpiCard
          label="Issued rewards"
          value={money(paidRewardValue)}
          detail="Paid, credited, issued, or completed rewards from referral_rewards when available."
          icon={HandCoins}
        />

        <KpiCard
          label="Customer referral share"
          value={percent(customerReferralProfiles.length, profiles.length)}
          detail="Share of loaded profiles that look like Pet Parent referral signups."
          icon={Users}
        />

        <KpiCard
          label="Guru referral share"
          value={percent(guruReferralProfiles.length, profiles.length)}
          detail="Share of loaded profiles that look like Guru referral signups."
          icon={ShieldCheck}
        />

        <KpiCard
          label="Student / Veteran apps"
          value={formatNumber(studentApplications.length + veteranApplications.length)}
          detail="Student Hire, Veterans Hire, Military, and SkillBridge application signals."
          icon={ClipboardList}
        />

        <KpiCard
          label="Active Ambassadors"
          value={formatNumber(activeAmbassadorLeads.length + activeAmbassadors.length)}
          detail="Active Ambassador leads and Ambassador records wired from the Ambassador dashboard."
          icon={Megaphone}
        />

        <KpiCard
          label="Archived Ambassadors"
          value={formatNumber(archivedAmbassadorTotal)}
          detail="Declined or closed Ambassador records retained on file without staying in the active pipeline."
          icon={Archive}
        />

        <KpiCard
          label="Ambassador reward liability"
          value={money(ambassadorRewardLiability)}
          detail="Pending Ambassador rewards from ambassador_rewards when available."
          icon={HandCoins}
        />

        <KpiCard
          label="Partner signals"
          value={formatNumber(partnerReferralRows.length)}
          detail="Partner payout rows plus bookings with partner, affiliate, or ambassador source signals."
          icon={HeartHandshake}
        />
      </section>

      <section className="space-y-4">
        <div className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
            Program effectiveness scorecard
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Which programs are working?
          </h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
            Each program is scored by leads, signups, bookings, revenue, reward
            or ad cost, ROI, and what SitGuru should do next.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {programScorecards.slice(0, 10).map((scorecard) => (
            <ProgramScorecardRow key={scorecard.title} scorecard={scorecard} />
          ))}
        </div>
      </section>

      <MarketingRoiTable channels={growthChannels} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {referralGroups.map((group) => (
          <ReferralGroupCard key={group.title} group={group} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
            Referral lifecycle
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            What Admin should monitor
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "Referral link shared",
              "Friend signs up",
              "First eligible paid booking completed",
              "Reward qualifies",
              "Credit or payout issued",
              "Canceled, refunded, disputed, duplicate, or self-referral rejected",
            ].map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-green-800">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm font-bold leading-5 text-slate-700">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-green-100 bg-gradient-to-br from-green-900 via-green-800 to-emerald-800 p-5 text-white shadow-xl shadow-emerald-900/15">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-emerald-200 ring-1 ring-white/15">
              <Sparkles className="h-5 w-5" />
            </span>

            <div>
              <p className="text-sm font-black text-white">
                Marketing ROI integration status
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-white/80">
                This page reads available marketing campaign, click, conversion,
                referral, reward, application, profile, and booking data. For
                best ROI reporting, create source-specific links and store
                campaign cost rows for every ad, QR code, flyer, yard sign,
                partner, Ambassador, and referral campaign.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/admin/referrals/payouts"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  Open Referral Payouts
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/admin/referrals/applications"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  Open Applications
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
