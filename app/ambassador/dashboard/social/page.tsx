import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
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
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

type AmbassadorReferralRow = {
  id: string;
  ambassador_id: string;
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

type RewardRow = {
  id: string;
  ambassador_id?: string | null;
  reward_type?: string | null;
  reward_source?: string | null;
  source?: string | null;
  amount?: number | string | null;
  reward_amount?: number | string | null;
  payout_amount?: number | string | null;
  status?: string | null;
  payout_status?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

type PlatformConfig = {
  key: "facebook" | "instagram" | "tiktok" | "x" | "youtube";
  label: string;
  handle: string;
  officialUrl: string;
  description: string;
};

type PlatformStats = Record<PlatformConfig["key"], number>;

type SocialRewardSummary = {
  id: string;
  amount: number;
  status: string;
  label: string;
};

type PageDataResult = {
  referrals: AmbassadorReferralRow[];
  rewards: RewardRow[];
  warning: string;
};

const PLATFORMS: PlatformConfig[] = [
  {
    key: "facebook",
    label: "Facebook",
    handle: "@SitGuruOfficial",
    officialUrl: "https://www.facebook.com/SitGuruOfficial",
    description:
      "Share local pet-care stories, community posts, events, and referral opportunities.",
  },
  {
    key: "instagram",
    label: "Instagram",
    handle: "@SitGuruOfficial",
    officialUrl: "https://www.instagram.com/SitGuruOfficial",
    description:
      "Share reels, stories, pet-care highlights, Guru spotlights, and community wins.",
  },
  {
    key: "tiktok",
    label: "TikTok",
    handle: "@SitGuruOfficial",
    officialUrl: "https://www.tiktok.com/@SitGuruOfficial",
    description:
      "Share short videos, pet-care tips, event clips, and Ambassador content.",
  },
  {
    key: "x",
    label: "X",
    handle: "@SitGuruOfficial",
    officialUrl: "https://x.com/SitGuruOfficial",
    description:
      "Share SitGuru updates, referral links, local opportunities, and quick community news.",
  },
  {
    key: "youtube",
    label: "YouTube",
    handle: "@SitGuruOfficial",
    officialUrl: "https://www.youtube.com/@SitGuruOfficial",
    description:
      "Share longer videos, tutorials, interviews, events, and trusted pet-care education.",
  },
];

const SOCIAL_MILESTONES = [
  {
    signups: 25,
    label: "25 verified social signups",
    rewardExample: "$10",
  },
  {
    signups: 50,
    label: "50 verified social signups",
    rewardExample: "$25",
  },
  {
    signups: 100,
    label: "100 verified social signups",
    rewardExample: "$50",
  },
];

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
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

function getTrackedSignupUrl({
  referralCode,
  platform,
}: {
  referralCode: string;
  platform: PlatformConfig["key"];
}) {
  const campaign = `sitguru_ambassador_social_${platform}`;
  const url = new URL("/signup", getSiteUrl());

  url.searchParams.set("role", "pet_parent");
  url.searchParams.set("ambassador_code", referralCode);
  url.searchParams.set("ref", referralCode);
  url.searchParams.set("referral_type", "pet_parent");
  url.searchParams.set("source", "ambassador_social");
  url.searchParams.set("medium", "social");
  url.searchParams.set("campaign", campaign);
  url.searchParams.set("platform", platform);
  url.searchParams.set("utm_source", platform);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", "ambassador_referral");
  url.searchParams.set("next", "/customer/dashboard");

  return url.toString();
}

function getQrCodeUrl(value: string) {
  const params = new URLSearchParams({
    size: "220x220",
    data: value,
    margin: "12",
    format: "svg",
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
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
    status !== "archived" &&
    status !== "inactive" &&
    status !== "not a fit";

  return workspaceAllowed ? ambassador : null;
}

async function getCanonicalSocialData(
  ambassadorId: string,
): Promise<PageDataResult> {
  const [referralResult, rewardResult] = await Promise.all([
    supabaseAdmin
      .from("ambassador_referrals")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabaseAdmin
      .from("ambassador_rewards")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const warnings: string[] = [];

  if (referralResult.error) {
    console.error(
      "Unable to load canonical social referrals:",
      referralResult.error.message,
    );
    warnings.push(
      "Social referral activity could not be loaded from SitGuru right now.",
    );
  }

  if (rewardResult.error) {
    console.error(
      "Unable to load canonical social rewards:",
      rewardResult.error.message,
    );
    warnings.push(
      "Social reward records could not be loaded from SitGuru right now.",
    );
  }

  return {
    referrals:
      (referralResult.data || []) as AmbassadorReferralRow[],
    rewards: (rewardResult.data || []) as RewardRow[],
    warning: warnings.join(" "),
  };
}

function normalizePlatform(value?: string | null) {
  const normalized = asString(value).toLowerCase();

  if (
    normalized === "twitter" ||
    normalized === "twitter/x" ||
    normalized === "x.com"
  ) {
    return "x";
  }

  if (normalized === "facebook.com") return "facebook";
  if (normalized === "instagram.com") return "instagram";
  if (normalized === "tiktok.com") return "tiktok";
  if (normalized === "youtube.com") return "youtube";

  return normalized;
}

function getReferralPlatform(row: AmbassadorReferralRow) {
  const candidate =
    asString(row.platform) ||
    asString(row.utm_source) ||
    asString(row.source) ||
    asString(row.referral_source);

  return normalizePlatform(candidate);
}

function isSocialReferral(row: AmbassadorReferralRow) {
  const platform = getReferralPlatform(row);

  if (
    platform === "facebook" ||
    platform === "instagram" ||
    platform === "tiktok" ||
    platform === "x" ||
    platform === "youtube"
  ) {
    return true;
  }

  const medium = normalizePlatform(
    asString(row.medium) ||
      asString(row.referral_medium) ||
      asString(row.utm_medium),
  );

  const source = normalizePlatform(
    asString(row.source) ||
      asString(row.referral_source) ||
      asString(row.utm_source),
  );

  return (
    medium.includes("social") ||
    source.includes("social") ||
    source.includes("ambassador social")
  );
}

function getPlatformStats(
  referrals: AmbassadorReferralRow[],
): PlatformStats {
  const stats: PlatformStats = {
    facebook: 0,
    instagram: 0,
    tiktok: 0,
    x: 0,
    youtube: 0,
  };

  referrals.filter(isSocialReferral).forEach((row) => {
    const platform = getReferralPlatform(row);

    if (platform in stats) {
      stats[platform as PlatformConfig["key"]] += 1;
    }
  });

  return stats;
}

function isSocialReward(row: RewardRow) {
  const value = [
    row.reward_type,
    row.reward_source,
    row.source,
  ]
    .map((item) => normalizeStatus(item))
    .join(" ");

  return value.includes("social");
}

function getRewardAmount(row: RewardRow) {
  return (
    asNumber(row.amount) ||
    asNumber(row.reward_amount) ||
    asNumber(row.payout_amount)
  );
}

function getSocialRewardSummaries(
  rewards: RewardRow[],
): SocialRewardSummary[] {
  return rewards
    .filter(isSocialReward)
    .map((row) => {
      const status = normalizeStatus(
        row.payout_status || row.status,
      );

      return {
        id: asString(row.id),
        amount: getRewardAmount(row),
        status: status ? titleCase(status) : "Pending Review",
        label:
          titleCase(
            asString(
              row.reward_type ||
                row.reward_source ||
                row.source,
            )
              .replace(/[_-]+/g, " "),
          ) || "Social Milestone Reward",
      };
    })
    .filter((reward) => Boolean(reward.id));
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
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black !text-slate-800">{title}</p>
          <p className="mt-3 text-2xl font-black tracking-tight !text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 !text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function PlatformCard({
  platform,
  referralCode,
  trackedCount,
}: {
  platform: PlatformConfig;
  referralCode: string;
  trackedCount: number;
}) {
  const trackedUrl = getTrackedSignupUrl({
    referralCode,
    platform: platform.key,
  });
  const qrCodeUrl = getQrCodeUrl(trackedUrl);

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            {platform.label}
          </p>
          <h2 className="mt-2 text-2xl font-black !text-slate-950">
            {platform.handle}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
            {platform.description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {platform.key === "youtube" || platform.key === "tiktok" ? (
            <Video className="h-6 w-6" />
          ) : (
            <Share2 className="h-6 w-6" />
          )}
        </div>
      </div>

      <div className="mt-5 rounded-[1.35rem] border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
          Tracked signups
        </p>
        <p className="mt-1 text-3xl font-black text-emerald-950">
          {trackedCount}
        </p>
      </div>

      <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
          Platform-specific referral link
        </p>
        <p className="mt-2 break-all text-xs font-black leading-5 text-slate-800">
          {trackedUrl}
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center">
        <div className="grid gap-2">
          <a
            href={platform.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
          >
            Open Official Channel
            <ExternalLink className="h-4 w-4" />
          </a>

          <a
            href={trackedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            Open Tracked Signup
            <Link2 className="h-4 w-4" />
          </a>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeUrl}
            alt={`QR code for ${platform.label} Ambassador signup link`}
            width={150}
            height={150}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="mx-auto aspect-square w-full max-w-[150px] rounded-xl bg-white object-contain"
          />
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Scan to Sign Up
          </p>
        </div>
      </div>
    </article>
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
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-black text-slate-950">
            {milestone.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            Example reward level: {milestone.rewardExample}
          </p>
        </div>

        {completed ? (
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />
        ) : (
          <Clock3 className="h-6 w-6 shrink-0 text-amber-600" />
        )}
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
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
          {completed
            ? "Milestone activity reached"
            : `${remaining} verified signups remaining`}
        </span>
      </div>

      <p className="mt-3 text-xs font-bold leading-5 text-slate-600">
        Reaching the activity count does not automatically approve or pay a
        reward. SitGuru must create and review the matching canonical reward
        record.
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
    redirect(
      "/ambassador/dashboard?warning=referral_code_missing",
    );
  }

  const data = await getCanonicalSocialData(ambassador.id);
  const socialReferrals = data.referrals.filter(isSocialReferral);
  const platformStats = getPlatformStats(data.referrals);
  const socialRewards = getSocialRewardSummaries(data.rewards);

  const approvedSocialRewards = socialRewards.filter((reward) => {
    const status = normalizeStatus(reward.status);

    return (
      status.includes("approved") ||
      status.includes("paid")
    );
  });

  const paidSocialRewards = socialRewards.filter((reward) =>
    normalizeStatus(reward.status).includes("paid"),
  );

  const approvedSocialAmount = approvedSocialRewards.reduce(
    (sum, reward) => sum + reward.amount,
    0,
  );
  const paidSocialAmount = paidSocialRewards.reduce(
    (sum, reward) => sum + reward.amount,
    0,
  );

  const topPlatform =
    PLATFORMS.map((platform) => ({
      platform,
      count: platformStats[platform.key],
    })).sort((a, b) => b.count - a.count)[0] || null;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px] space-y-6">
        <Link
          href="/ambassador/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-8 py-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center xl:px-10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.26em] text-emerald-800">
                Ambassador Social Center
              </p>

              <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-0.055em] text-slate-950 md:text-6xl xl:text-7xl">
                Share SitGuru. Track every platform.
              </h1>

              <p className="mt-5 max-w-4xl text-base font-semibold leading-8 text-slate-800 md:text-lg">
                Use platform-specific tracked links for Facebook, Instagram,
                TikTok, X, and YouTube. SitGuru stores referral attribution in
                canonical Ambassador records so social activity can be reviewed
                without duplicate dashboard events.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-2xl bg-white/95 px-5 py-3 text-sm font-black text-slate-900 shadow-sm ring-1 ring-white/80">
                  Referral code:{" "}
                  <span className="text-emerald-700">
                    {referralCode}
                  </span>
                </span>

                <span className="rounded-2xl bg-white/95 px-5 py-3 text-sm font-black text-slate-900 shadow-sm ring-1 ring-white/80">
                  Official handle:{" "}
                  <span className="text-emerald-700">
                    @SitGuruOfficial
                  </span>
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-xl backdrop-blur">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                  <ShieldCheck className="h-8 w-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                    Tracking and rewards stay separate.
                  </h2>

                  <p className="mt-4 text-sm font-semibold leading-7 text-slate-800">
                    Social signup counts come from canonical
                    ambassador_referrals. Approved or paid social rewards come
                    only from canonical ambassador_rewards. Reaching a milestone
                    does not automatically create or approve money.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {data.warning ? (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
            {data.warning}
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Social Signups"
            value={String(socialReferrals.length)}
            description="Canonical social referral records"
            icon={<Users className="h-6 w-6" />}
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
                ? `${topPlatform.count} tracked signups`
                : "Share a tracked social link"
            }
            icon={<Trophy className="h-6 w-6" />}
          />
          <StatCard
            title="Social Reward Records"
            value={String(socialRewards.length)}
            description="Canonical social reward rows"
            icon={<BadgeCheck className="h-6 w-6" />}
          />
          <StatCard
            title="Approved Social"
            value={money(approvedSocialAmount)}
            description="Approved plus paid social rewards"
            icon={<Sparkles className="h-6 w-6" />}
          />
          <StatCard
            title="Paid Social"
            value={money(paidSocialAmount)}
            description="Only rewards recorded as paid"
            icon={<CheckCircle2 className="h-6 w-6" />}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <PlatformCard
              key={platform.key}
              platform={platform}
              referralCode={referralCode}
              trackedCount={platformStats[platform.key]}
            />
          ))}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <QrCode className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-950">
                How platform attribution works
              </h2>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                Each platform card uses your same Ambassador code with a unique
                source, medium, campaign, platform, and UTM combination. That
                lets SitGuru distinguish Facebook activity from Instagram,
                TikTok, X, or YouTube while keeping one canonical Ambassador
                identity.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.key}
                className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                  {platform.label}
                </p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  platform={platform.key}
                </p>
                <p className="mt-1 break-words text-[11px] font-bold leading-5 text-slate-600">
                  campaign=sitguru_ambassador_social_{platform.key}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
              Social Milestones
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Track progress without counting it as approved earnings.
            </h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {SOCIAL_MILESTONES.map((milestone) => (
              <MilestoneCard
                key={milestone.signups}
                milestone={milestone}
                verifiedSignups={socialReferrals.length}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-emerald-700" />
              <h2 className="text-2xl font-black text-slate-950">
                Social Reward Records
              </h2>
            </div>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              This section shows only canonical reward rows that SitGuru
              identifies as social activity.
            </p>

            {socialRewards.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {socialRewards.map((reward) => (
                  <article
                    key={reward.id}
                    className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-black text-slate-950">
                          {reward.label}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-600">
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
              <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-lg font-black text-slate-950">
                  No social reward records yet
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Social activity can be tracked before SitGuru creates or
                  approves a reward.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                <Globe2 className="h-7 w-7" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-emerald-950">
                  Share responsibly
                </h2>
                <p className="mt-2 text-sm font-semibold leading-7 text-emerald-900">
                  Use the official SitGuru handle, share accurate information,
                  and avoid spam or self-created referrals. SitGuru reviews
                  duplicate, fake, canceled, refunded, and unverifiable activity
                  before any reward can be approved.
                </p>

                <div className="mt-5 grid gap-2">
                  <Link
                    href="/ambassador/dashboard/referrals"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
                  >
                    View All Referrals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>

                  <Link
                    href="/ambassador/dashboard/earnings"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
                  >
                    View Approved Earnings
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}