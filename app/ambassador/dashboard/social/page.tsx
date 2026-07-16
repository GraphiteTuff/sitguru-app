import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  Link2,
  Megaphone,
  QrCode,
  ScanLine,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SocialPlatformKey =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x"
  | "youtube";

type AmbassadorRecord = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  referral_code?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  status?: string | null;
};

type AmbassadorReferralRow = Record<string, unknown> & {
  id?: string | null;
  ambassador_id?: string | null;
  referral_type?: string | null;
  status?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  platform?: string | null;
  referral_source?: string | null;
  referral_medium?: string | null;
  referral_campaign?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  created_at?: string | null;
};

type RewardRow = Record<string, unknown> & {
  id?: string | null;
  ambassador_id?: string | null;
  reward_type?: string | null;
  reward_source?: string | null;
  source?: string | null;
  platform?: string | null;
  campaign?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  amount?: number | string | null;
  reward_amount?: number | string | null;
  payout_amount?: number | string | null;
  status?: string | null;
  financial_status?: string | null;
  payout_status?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

type ReferralCodeRow = Record<string, unknown> & {
  id?: string | null;
  ambassador_id?: string | null;
  code?: string | null;
  status?: string | null;
};

type ReferralClickRow = Record<string, unknown> & {
  id?: string | null;
  referral_code_id?: string | null;
  landing_page?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  created_at?: string | null;
};

type PlatformConfig = {
  key: SocialPlatformKey;
  label: string;
  handle: string;
  officialUrl: string;
  description: string;
};

type PlatformMetric = {
  linkVisits: number;
  qrScans: number;
  verifiedSignups: number;
  approvedRewards: number;
  paidRewards: number;
};

type PlatformMetrics = Record<SocialPlatformKey, PlatformMetric>;

type SocialRewardSummary = {
  id: string;
  amount: number;
  status: string;
  label: string;
  platform: SocialPlatformKey | null;
};

type PageDataResult = {
  referrals: AmbassadorReferralRow[];
  rewards: RewardRow[];
  clicks: ReferralClickRow[];
  warning: string;
};

const PLATFORMS: PlatformConfig[] = [
  {
    key: "facebook",
    label: "Facebook",
    handle: "@SitGuruOfficial",
    officialUrl: "https://www.facebook.com/SitGuruOfficial/",
    description: "Community posts, local events, pet-care stories, and referrals.",
  },
  {
    key: "instagram",
    label: "Instagram",
    handle: "@SitGuruOfficial",
    officialUrl: "https://www.instagram.com/sitguruofficial/",
    description: "Reels, stories, Guru spotlights, pet-care highlights, and events.",
  },
  {
    key: "tiktok",
    label: "TikTok",
    handle: "@SitGuruOfficial",
    officialUrl: "https://www.tiktok.com/@sitguruofficial",
    description: "Short videos, pet tips, event clips, and Ambassador content.",
  },
  {
    key: "x",
    label: "X",
    handle: "@SitGuruOfficial",
    officialUrl: "https://x.com/sitguruofficial",
    description: "SitGuru updates, quick community news, and referral opportunities.",
  },
  {
    key: "youtube",
    label: "YouTube",
    handle: "@SitGuruOfficial",
    officialUrl: "https://www.youtube.com/@SitGuruOfficial",
    description: "Tutorials, interviews, events, and trusted pet-care education.",
  },
];

const SOCIAL_MILESTONES = [
  {
    signups: 25,
    label: "25 verified social signups",
    reward: 25,
  },
  {
    signups: 50,
    label: "50 verified social signups",
    reward: 100,
  },
  {
    signups: 150,
    label: "150 verified social signups",
    reward: 200,
  },
];

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%\s,()]/g, ""));
    if (!Number.isFinite(parsed)) return 0;
    return value.includes("(") ? -parsed : parsed;
  }

  return 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);
}

function normalizeStatus(value?: string | null) {
  return asString(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    "https://www.sitguru.com";

  if (
    configuredUrl.startsWith("http://") ||
    configuredUrl.startsWith("https://")
  ) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `https://${configuredUrl.replace(/\/+$/, "")}`;
}

function getTrackedSocialPath({
  referralCode,
  platform,
  via,
}: {
  referralCode: string;
  platform: SocialPlatformKey;
  via?: "qr";
}) {
  const path = `/r/social/${encodeURIComponent(
    referralCode,
  )}/${platform}`;

  return via === "qr" ? `${path}?via=qr` : path;
}

function getAbsoluteUrl(path: string) {
  return `${getSiteUrl()}${path}`;
}

function getCompactDisplayUrl(path: string) {
  return `sitguru.com${path.replace("?via=qr", "")}`;
}

function getQrCodeUrl(value: string, size = 240) {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: value,
    margin: "12",
    format: "svg",
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

function getShareUrl({
  platform,
  trackedUrl,
}: {
  platform: SocialPlatformKey;
  trackedUrl: string;
}) {
  const text =
    "Join SitGuru for trusted local pet care using my Ambassador link.";

  if (platform === "facebook") {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      trackedUrl,
    )}`;
  }

  if (platform === "x") {
    return `https://x.com/intent/post?text=${encodeURIComponent(
      text,
    )}&url=${encodeURIComponent(trackedUrl)}`;
  }

  return `mailto:?subject=${encodeURIComponent(
    "Join SitGuru",
  )}&body=${encodeURIComponent(`${text}\n\n${trackedUrl}`)}`;
}

function normalizePlatform(value?: string | null): SocialPlatformKey | null {
  const normalized = asString(value).toLowerCase();

  if (
    normalized === "twitter" ||
    normalized === "twitter/x" ||
    normalized === "x.com"
  ) {
    return "x";
  }

  if (normalized.includes("facebook")) return "facebook";
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("tiktok")) return "tiktok";
  if (normalized.includes("youtube")) return "youtube";

  if (normalized === "x") return "x";

  return null;
}

function getReferralPlatform(row: AmbassadorReferralRow) {
  const candidates = [
    row.platform,
    row.utm_source,
    row.source,
    row.referral_source,
    row.campaign,
    row.referral_campaign,
    row.utm_campaign,
  ];

  for (const candidate of candidates) {
    const platform = normalizePlatform(asString(candidate));
    if (platform) return platform;
  }

  return null;
}

function isSocialReferral(row: AmbassadorReferralRow) {
  if (getReferralPlatform(row)) return true;

  const medium = normalizeStatus(
    asString(row.medium) ||
      asString(row.referral_medium) ||
      asString(row.utm_medium),
  );
  const source = normalizeStatus(
    asString(row.source) ||
      asString(row.referral_source) ||
      asString(row.utm_source),
  );

  return medium.includes("social") || source.includes("social");
}

function getClickPlatform(row: ReferralClickRow) {
  const directPlatform = normalizePlatform(row.utm_source);
  if (directPlatform) return directPlatform;

  const campaignPlatform = normalizePlatform(row.utm_campaign);
  if (campaignPlatform) return campaignPlatform;

  const landingPage = asString(row.landing_page).toLowerCase();

  for (const platform of PLATFORMS) {
    if (
      landingPage.includes(`/social/`) &&
      landingPage.includes(`/${platform.key}`)
    ) {
      return platform.key;
    }
  }

  return null;
}

function getClickMedium(row: ReferralClickRow) {
  const medium = normalizeStatus(row.utm_medium);
  const landingPage = asString(row.landing_page).toLowerCase();

  if (medium === "qr" || landingPage.includes("via=qr")) return "qr";
  return "link";
}

function getRewardPlatform(row: RewardRow) {
  const candidates = [
    row.platform,
    row.utm_source,
    row.source,
    row.reward_source,
    row.campaign,
    row.utm_campaign,
    row.reward_type,
  ];

  for (const candidate of candidates) {
    const platform = normalizePlatform(asString(candidate));
    if (platform) return platform;
  }

  return null;
}

function isSocialReward(row: RewardRow) {
  const values = [
    row.reward_type,
    row.reward_source,
    row.source,
    row.platform,
    row.campaign,
    row.utm_source,
    row.utm_campaign,
  ]
    .map((item) => normalizeStatus(asString(item)))
    .join(" ");

  return values.includes("social") || Boolean(getRewardPlatform(row));
}

function getRewardAmount(row: RewardRow) {
  return (
    asNumber(row.amount) ||
    asNumber(row.reward_amount) ||
    asNumber(row.payout_amount)
  );
}

function getRewardBucket(row: RewardRow) {
  const status = normalizeStatus(row.status);
  const financialStatus = normalizeStatus(row.financial_status);
  const payoutStatus = normalizeStatus(row.payout_status);

  const excluded = new Set([
    "rejected",
    "ineligible",
    "void",
    "voided",
    "cancelled",
    "canceled",
    "refunded",
    "chargeback",
    "reversed",
  ]);

  if (
    excluded.has(status) ||
    excluded.has(financialStatus) ||
    excluded.has(payoutStatus)
  ) {
    return "excluded";
  }

  const paid = new Set([
    "paid",
    "payout paid",
    "payout completed",
    "settled",
  ]);

  if (
    asString(row.paid_at) ||
    paid.has(status) ||
    paid.has(financialStatus) ||
    paid.has(payoutStatus)
  ) {
    return "paid";
  }

  const approved = new Set([
    "approved",
    "approved unpaid",
    "payable",
    "ready for payout",
    "queued for payout",
    "queued",
  ]);

  if (
    approved.has(status) ||
    approved.has(financialStatus) ||
    approved.has(payoutStatus)
  ) {
    return "approved";
  }

  return "pending";
}

function getSocialRewardSummaries(
  rewards: RewardRow[],
): SocialRewardSummary[] {
  return rewards
    .filter(isSocialReward)
    .map((row, index) => {
      const bucket = getRewardBucket(row);
      const savedStatus = normalizeStatus(
        asString(row.payout_status) ||
          asString(row.financial_status) ||
          asString(row.status),
      );

      return {
        id: asString(row.id) || `social-reward-${index}`,
        amount: getRewardAmount(row),
        status:
          savedStatus
            ? titleCase(savedStatus)
            : bucket === "paid"
              ? "Paid"
              : bucket === "approved"
                ? "Approved"
                : bucket === "excluded"
                  ? "Excluded"
                  : "Pending Review",
        label:
          titleCase(
            asString(
              row.reward_type ||
                row.reward_source ||
                row.source,
            ).replace(/[_-]+/g, " "),
          ) || "Social Milestone Reward",
        platform: getRewardPlatform(row),
      };
    });
}

function createEmptyPlatformMetrics(): PlatformMetrics {
  return {
    facebook: {
      linkVisits: 0,
      qrScans: 0,
      verifiedSignups: 0,
      approvedRewards: 0,
      paidRewards: 0,
    },
    instagram: {
      linkVisits: 0,
      qrScans: 0,
      verifiedSignups: 0,
      approvedRewards: 0,
      paidRewards: 0,
    },
    tiktok: {
      linkVisits: 0,
      qrScans: 0,
      verifiedSignups: 0,
      approvedRewards: 0,
      paidRewards: 0,
    },
    x: {
      linkVisits: 0,
      qrScans: 0,
      verifiedSignups: 0,
      approvedRewards: 0,
      paidRewards: 0,
    },
    youtube: {
      linkVisits: 0,
      qrScans: 0,
      verifiedSignups: 0,
      approvedRewards: 0,
      paidRewards: 0,
    },
  };
}

function getPlatformMetrics({
  referrals,
  rewards,
  clicks,
}: {
  referrals: AmbassadorReferralRow[];
  rewards: RewardRow[];
  clicks: ReferralClickRow[];
}) {
  const metrics = createEmptyPlatformMetrics();

  referrals.filter(isSocialReferral).forEach((row) => {
    const platform = getReferralPlatform(row);
    if (platform) metrics[platform].verifiedSignups += 1;
  });

  clicks.forEach((row) => {
    const platform = getClickPlatform(row);
    if (!platform) return;

    if (getClickMedium(row) === "qr") {
      metrics[platform].qrScans += 1;
    } else {
      metrics[platform].linkVisits += 1;
    }
  });

  rewards.filter(isSocialReward).forEach((row) => {
    const platform = getRewardPlatform(row);
    if (!platform) return;

    const bucket = getRewardBucket(row);
    const amount = getRewardAmount(row);

    if (bucket === "approved") {
      metrics[platform].approvedRewards += amount;
    }

    if (bucket === "paid") {
      metrics[platform].paidRewards += amount;
    }
  });

  return metrics;
}

async function getAmbassadorForUser(userId: string, email?: string | null) {
  const { data: byUserId, error: userIdError } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (userIdError) {
    console.error(
      "Ambassador social lookup by user ID failed:",
      userIdError.message,
    );
  }

  let ambassador = byUserId as AmbassadorRecord | null;
  const cleanEmail = asString(email).toLowerCase();

  if (!ambassador && cleanEmail) {
    const emailColumns = ["login_email", "contact_email", "email"] as const;

    for (const column of emailColumns) {
      const { data, error } = await supabaseAdmin
        .from("ambassadors")
        .select("*")
        .eq(column, cleanEmail)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          `Ambassador social lookup by ${column} failed:`,
          error.message,
        );
        continue;
      }

      if (data) {
        ambassador = data as AmbassadorRecord;
        break;
      }
    }
  }

  if (!ambassador) return null;

  const status = normalizeStatus(ambassador.status);
  const workspaceAllowed =
    ambassador.dashboard_enabled === true &&
    ambassador.login_enabled === true &&
    !["archived", "inactive", "not a fit"].includes(status);

  return workspaceAllowed ? ambassador : null;
}

async function getReferralCodeRow({
  ambassadorId,
  referralCode,
}: {
  ambassadorId: string;
  referralCode: string;
}) {
  const { data: byAmbassador, error: ambassadorError } = await supabaseAdmin
    .from("referral_codes")
    .select("*")
    .eq("ambassador_id", ambassadorId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (ambassadorError) {
    console.warn(
      "Social Center referral code lookup by Ambassador failed:",
      ambassadorError.message,
    );
  }

  if (byAmbassador) return byAmbassador as ReferralCodeRow;

  const { data: byCode, error: codeError } = await supabaseAdmin
    .from("referral_codes")
    .select("*")
    .ilike("code", referralCode)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (codeError) {
    console.warn(
      "Social Center referral code lookup by code failed:",
      codeError.message,
    );
  }

  return (byCode || null) as ReferralCodeRow | null;
}

async function getCanonicalSocialData({
  ambassadorId,
  referralCode,
}: {
  ambassadorId: string;
  referralCode: string;
}): Promise<PageDataResult> {
  const [referralResult, rewardResult, referralCodeRow] = await Promise.all([
    supabaseAdmin
      .from("ambassador_referrals")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabaseAdmin
      .from("ambassador_rewards")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .order("created_at", { ascending: false })
      .limit(5000),
    getReferralCodeRow({
      ambassadorId,
      referralCode,
    }),
  ]);

  const warnings: string[] = [];
  let clicks: ReferralClickRow[] = [];

  if (referralResult.error) {
    console.error(
      "Unable to load canonical social referrals:",
      referralResult.error.message,
    );
    warnings.push("Verified social signups could not be loaded.");
  }

  if (rewardResult.error) {
    console.error(
      "Unable to load canonical social rewards:",
      rewardResult.error.message,
    );
    warnings.push("Social reward records could not be loaded.");
  }

  const referralCodeId = asString(referralCodeRow?.id);

  if (referralCodeId) {
    const clickResult = await supabaseAdmin
      .from("referral_clicks")
      .select("*")
      .eq("referral_code_id", referralCodeId)
      .order("created_at", { ascending: false })
      .limit(10000);

    if (clickResult.error) {
      console.error(
        "Unable to load social link and QR visits:",
        clickResult.error.message,
      );
      warnings.push("Link and QR visit totals could not be loaded.");
    } else {
      clicks = (clickResult.data || []) as ReferralClickRow[];
    }
  }

  return {
    referrals: (referralResult.data || []) as AmbassadorReferralRow[],
    rewards: (rewardResult.data || []) as RewardRow[],
    clicks,
    warning: warnings.join(" "),
  };
}

function SocialBrandIcon({
  platform,
}: {
  platform: SocialPlatformKey;
}) {
  const wrapper =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100";

  if (platform === "facebook") {
    return (
      <span className={wrapper} aria-label="Facebook">
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
          <path
            fill="currentColor"
            d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V3.9c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V10H8.2v3h2.6v8h2.9Z"
          />
        </svg>
      </span>
    );
  }

  if (platform === "instagram") {
    return (
      <span className={wrapper} aria-label="Instagram">
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
          <rect
            x="3.5"
            y="3.5"
            width="17"
            height="17"
            rx="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="17.4" cy="6.7" r="1.2" fill="currentColor" />
        </svg>
      </span>
    );
  }

  if (platform === "tiktok") {
    return (
      <span className={wrapper} aria-label="TikTok">
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
          <path
            fill="currentColor"
            d="M14.3 3c.3 2 1.4 3.2 3.7 3.4v2.8c-1.4 0-2.6-.4-3.7-1.2v6.4a5.3 5.3 0 1 1-4.6-5.2v2.9a2.5 2.5 0 1 0 1.8 2.4V3h2.8Z"
          />
        </svg>
      </span>
    );
  }

  if (platform === "x") {
    return (
      <span className={wrapper} aria-label="X">
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 3h4.4l4.3 5.8L17.8 3H20l-6.3 7.3L20.5 21h-4.4l-4.7-6.4L5.8 21H3.5l6.9-8L4 3Zm3.2 1.7 9.8 14.6h1.3L8.5 4.7H7.2Z"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className={wrapper} aria-label="YouTube">
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.6 12 5.6 12 5.6s-5 0-6.9.5A3 3 0 0 0 3 8.2 31 31 0 0 0 2.6 12 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.9.5 6.9.5 6.9.5s5 0 6.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8ZM10.2 15.4V8.6l5.9 3.4-5.9 3.4Z"
        />
      </svg>
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-600">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {description}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function PlatformCard({
  platform,
  referralCode,
  metrics,
}: {
  platform: PlatformConfig;
  referralCode: string;
  metrics: PlatformMetric;
}) {
  const trackedPath = getTrackedSocialPath({
    referralCode,
    platform: platform.key,
  });
  const qrPath = getTrackedSocialPath({
    referralCode,
    platform: platform.key,
    via: "qr",
  });
  const trackedUrl = getAbsoluteUrl(trackedPath);
  const qrTrackedUrl = getAbsoluteUrl(qrPath);
  const qrCodeUrl = getQrCodeUrl(qrTrackedUrl);
  const fullScreenQrUrl = getQrCodeUrl(qrTrackedUrl, 900);
  const shareUrl = getShareUrl({
    platform: platform.key,
    trackedUrl,
  });

  return (
    <article className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <SocialBrandIcon platform={platform.key} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black text-slate-950">{platform.label}</p>
          <p className="text-xs font-bold text-emerald-700">{platform.handle}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {platform.description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniMetric label="Link visits" value={metrics.linkVisits} />
        <MiniMetric label="QR scans" value={metrics.qrScans} />
        <MiniMetric label="Signups" value={metrics.verifiedSignups} />
        <MiniMetric
          label="Rewards"
          value={money(metrics.approvedRewards + metrics.paidRewards)}
        />
      </div>

      <div className="mt-4 grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3">
        <a
          href={fullScreenQrUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-emerald-100 bg-emerald-50 p-2 transition hover:border-emerald-300"
          aria-label={`Open full-screen ${platform.label} QR code`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeUrl}
            alt={`${platform.label} tracked SitGuru QR code`}
            width={112}
            height={112}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="aspect-square w-full rounded-xl bg-white object-contain"
          />
        </a>

        <div className="min-w-0">
          <p className="break-words rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black leading-5 text-slate-800">
            {getCompactDisplayUrl(trackedPath)}
          </p>
          <p className="mt-2 text-[10px] font-bold leading-4 text-slate-500">
            The QR version uses <span className="font-black">via=qr</span> so
            scans remain separate from normal link visits.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={shareUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-800"
        >
          Share Link
          <Share2 className="h-3.5 w-3.5" />
        </a>
        <a
          href={trackedPath}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50"
        >
          Tracked Visit
          <Link2 className="h-3.5 w-3.5" />
        </a>
        <a
          href={fullScreenQrUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-100"
        >
          Full QR
          <QrCode className="h-3.5 w-3.5" />
        </a>
        <a
          href={platform.officialUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-100"
        >
          Official
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-emerald-700">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-emerald-950">{value}</p>
    </div>
  );
}

function MilestoneCard({
  milestone,
  verifiedSignups,
}: {
  milestone: (typeof SOCIAL_MILESTONES)[number];
  verifiedSignups: number;
}) {
  const completed = verifiedSignups >= milestone.signups;
  const remaining = Math.max(milestone.signups - verifiedSignups, 0);
  const progress = Math.min(
    100,
    Math.round((verifiedSignups / milestone.signups) * 100),
  );

  return (
    <article
      className={`rounded-[1.4rem] border p-4 shadow-sm ${
        completed
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{milestone.label}</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">
            ${milestone.reward}
          </p>
        </div>

        {completed ? (
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />
        ) : (
          <Clock3 className="h-6 w-6 shrink-0 text-amber-600" />
        )}
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-600"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-black">
        <span className="text-slate-600">
          {verifiedSignups} / {milestone.signups}
        </span>
        <span className={completed ? "text-emerald-700" : "text-amber-700"}>
          {completed ? "Reached" : `${remaining} remaining`}
        </span>
      </div>

      <p className="mt-3 text-[11px] font-bold leading-5 text-slate-600">
        The activity count does not automatically approve payment. SitGuru must
        verify eligibility and create or approve the canonical reward record.
      </p>
    </article>
  );
}

export default async function AmbassadorSocialPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginParams = new URLSearchParams({
      mode: "phone",
      role: "ambassador",
      next: "/ambassador/dashboard/social",
    });

    redirect(`/login?${loginParams.toString()}`);
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  const referralCode = asString(ambassador.referral_code);

  if (!referralCode) {
    redirect("/ambassador/dashboard?warning=referral_code_missing");
  }

  const data = await getCanonicalSocialData({
    ambassadorId: ambassador.id,
    referralCode,
  });
  const socialReferrals = data.referrals.filter(isSocialReferral);
  const socialRewards = getSocialRewardSummaries(data.rewards);
  const platformMetrics = getPlatformMetrics({
    referrals: data.referrals,
    rewards: data.rewards,
    clicks: data.clicks,
  });

  const totalLinkVisits = Object.values(platformMetrics).reduce(
    (sum, metrics) => sum + metrics.linkVisits,
    0,
  );
  const totalQrScans = Object.values(platformMetrics).reduce(
    (sum, metrics) => sum + metrics.qrScans,
    0,
  );

  const approvedSocialAmount = data.rewards
    .filter(isSocialReward)
    .filter((row) => getRewardBucket(row) === "approved")
    .reduce((sum, row) => sum + getRewardAmount(row), 0);

  const paidSocialAmount = data.rewards
    .filter(isSocialReward)
    .filter((row) => getRewardBucket(row) === "paid")
    .reduce((sum, row) => sum + getRewardAmount(row), 0);

  const topPlatform =
    PLATFORMS.map((platform) => ({
      platform,
      count: platformMetrics[platform.key].verifiedSignups,
    })).sort((a, b) => b.count - a.count)[0] || null;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-3 py-4 text-slate-950 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/ambassador/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>

          <Link
            href="/ambassador/dashboard/referrals"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
          >
            Referral Center
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <section className="overflow-hidden rounded-[1.8rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-6 py-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
                Ambassador Social Center
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
                Event-ready social sharing and tracking.
              </h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-800 sm:text-base">
                Use short tracked links and scannable QR codes for Facebook,
                Instagram, TikTok, X, and YouTube. Link visits, QR scans,
                verified signups, and canonical rewards stay separate.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-xl bg-white/95 px-4 py-2 text-xs font-black text-slate-900 shadow-sm">
                  Code: <span className="text-emerald-700">{referralCode}</span>
                </span>
                <span className="rounded-xl bg-white/95 px-4 py-2 text-xs font-black text-slate-900 shadow-sm">
                  @SitGuruOfficial
                </span>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/70 bg-white/95 p-5 shadow-xl">
              <ShieldCheck className="h-8 w-8 text-emerald-700" />
              <h2 className="mt-3 text-xl font-black text-slate-950">
                Verified activity is not automatically paid.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Visits and scans show outreach. Verified signups come from
                canonical Ambassador referrals. Approved and paid amounts come
                only from canonical reward records.
              </p>
            </div>
          </div>
        </section>

        {data.warning ? (
          <section className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p className="text-sm font-bold leading-6 text-amber-900">
                {data.warning}
              </p>
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Link Visits"
            value={String(totalLinkVisits)}
            description="Normal tracked social visits"
            icon={<Link2 className="h-5 w-5" />}
          />
          <StatCard
            title="QR Scans"
            value={String(totalQrScans)}
            description="Tracked event and flyer scans"
            icon={<ScanLine className="h-5 w-5" />}
          />
          <StatCard
            title="Verified Signups"
            value={String(socialReferrals.length)}
            description="Canonical social referrals"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Top Platform"
            value={
              topPlatform?.count
                ? topPlatform.platform.label
                : "No activity"
            }
            description={
              topPlatform?.count
                ? `${topPlatform.count} verified`
                : "Share a tracked channel"
            }
            icon={<Trophy className="h-5 w-5" />}
          />
          <StatCard
            title="Approved"
            value={money(approvedSocialAmount)}
            description="Approved, not paid"
            icon={<BadgeCheck className="h-5 w-5" />}
          />
          <StatCard
            title="Paid"
            value={money(paidSocialAmount)}
            description="Recorded as paid"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </section>

        <section>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Mobile & Tablet Event Mode
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Official channels, short links, QR codes, and live totals
              </h2>
            </div>
            <p className="max-w-2xl text-xs font-bold leading-5 text-slate-600">
              Tap a QR image to open a full-screen version for vendor tables,
              community events, campuses, and neighborhood outreach.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {PLATFORMS.map((platform) => (
              <PlatformCard
                key={platform.key}
                platform={platform}
                referralCode={referralCode}
                metrics={platformMetrics[platform.key]}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Attribution and counting
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Every card uses
                <span className="mx-1 font-black text-emerald-800">
                  /r/social/{referralCode}/platform
                </span>
                for normal visits and adds
                <span className="mx-1 font-black text-emerald-800">
                  ?via=qr
                </span>
                for QR scans. Both routes set Ambassador attribution before
                redirecting to the official social channel.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Verified Social Milestones
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Updated reward schedule
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {SOCIAL_MILESTONES.map((milestone) => (
              <MilestoneCard
                key={milestone.signups}
                milestone={milestone}
                verifiedSignups={socialReferrals.length}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-emerald-700" />
              <h2 className="text-xl font-black text-slate-950">
                Canonical Social Reward Records
              </h2>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Activity totals do not create earnings. This list contains only
              social rows already present in `ambassador_rewards`.
            </p>

            {socialRewards.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {socialRewards.slice(0, 10).map((reward) => (
                  <article
                    key={reward.id}
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black text-slate-950">
                          {reward.label}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-600">
                          {reward.platform
                            ? `${titleCase(reward.platform)} · `
                            : ""}
                          {reward.status}
                        </p>
                      </div>
                      <p className="text-2xl font-black text-emerald-700">
                        {money(reward.amount)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="font-black text-slate-950">
                  No social reward records yet
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Link visits, scans, and signups may appear before SitGuru
                  creates or approves a reward.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[1.8rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <Globe2 className="h-7 w-7 text-emerald-700" />
            <h2 className="mt-3 text-xl font-black text-emerald-950">
              Share responsibly
            </h2>
            <p className="mt-2 text-sm font-semibold leading-7 text-emerald-900">
              Use official SitGuru messaging and avoid spam, fake accounts,
              duplicate signups, self-created referrals, or misleading reward
              promises.
            </p>

            <div className="mt-5 grid gap-2">
              <Link
                href="/ambassador/dashboard/referrals"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                View All Referrals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/ambassador/dashboard/commissions"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
              >
                View Commissions & Rewards
              </Link>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}