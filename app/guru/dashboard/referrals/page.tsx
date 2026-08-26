"use client";

/**
 * Guru referral dashboard — share toolkit, reward stats, and referral pipeline.
 */

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Gift,
  Loader2,
  Sparkles,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import GuruLinkShareCard from "@/components/guru/GuruLinkShareCard";
import { supabase } from "@/lib/supabase";

type GuruRow = {
  id?: string | number | null;
  user_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
};

type ReferralRow = {
  id: string;
  referrer_user_id: string;
  referred_user_id?: string | null;
  referred_guru_id?: string | null;
  referral_code?: string | null;
  referred_name?: string | null;
  referred_email?: string | null;
  status?: string | null;
  payout_status?: string | null;
  reward_amount?: number | null;
  bonus_amount?: number | null;
  total_reward_amount?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  signup_completed_at?: string | null;
  application_approved_at?: string | null;
  qualified_at?: string | null;
  reward_paid_at?: string | null;
};

type CampaignRow = {
  id: string;
  guru_user_id: string;
  campaign_name?: string | null;
  referral_code?: string | null;
  referral_url?: string | null;
  source_channel?: string | null;
  is_active?: boolean | null;
};

type RewardRow = {
  id: string;
  amount?: number | null;
  status?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

type ProgramSettingsRow = {
  base_reward_amount?: number | null;
  required_completed_bookings?: number | null;
};

type PipelineColumn = "invited" | "verifying" | "paid";

const BRAND = "#0D5C3A";

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function safeDateLabel(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function makeReferralCode(name: string, userId: string) {
  const cleanName = name
    .replace(/@.*/, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
  const base = cleanName.length >= 3 ? cleanName : "GURU";
  const suffix = userId.replace(/-/g, "").slice(0, 5).toUpperCase();
  return `${base}${suffix}`;
}

function buildGuruReferralUrl(code: string, origin: string) {
  const url = new URL("/become-a-guru", origin || "https://sitguru.com");
  url.searchParams.set("ref", code);
  url.searchParams.set("type", "guru");
  url.searchParams.set("utm_source", "guru_referral");
  url.searchParams.set("utm_medium", "share");
  url.searchParams.set("utm_campaign", "guru_referrals");
  return url.toString();
}

function normalizeStatus(status?: string | null) {
  return asText(status).toLowerCase();
}

function isQualifiedStatus(status?: string | null) {
  return ["qualified", "reward_pending", "reward_paid"].includes(
    normalizeStatus(status),
  );
}

function isPendingRewardStatus(status?: string | null) {
  return ["pending", "approved"].includes(normalizeStatus(status));
}

function isPaidRewardStatus(status?: string | null) {
  return normalizeStatus(status) === "paid";
}

function getPipelineColumn(referral: ReferralRow): PipelineColumn {
  const status = normalizeStatus(referral.status);
  const payout = normalizeStatus(referral.payout_status);

  if (
    status === "reward_paid" ||
    payout === "paid" ||
    Boolean(referral.reward_paid_at)
  ) {
    return "paid";
  }

  if (
    [
      "application_approved",
      "background_check_complete",
      "first_booking_completed",
      "qualified",
      "reward_pending",
    ].includes(status) ||
    Boolean(referral.application_approved_at) ||
    Boolean(referral.qualified_at)
  ) {
    return "verifying";
  }

  return "invited";
}

function getStatusLabel(status?: string | null) {
  const value = asText(status).replace(/_/g, " ");
  if (!value) return "Invited";
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Guru";
}

function referralDisplayName(referral: ReferralRow) {
  return (
    firstText(referral.referred_name, referral.referred_email) || "Referred Guru"
  );
}

function ReferralFeedCard({ referral }: { referral: ReferralRow }) {
  const column = getPipelineColumn(referral);
  const tone =
    column === "paid"
      ? "border-emerald-200 bg-emerald-50/80"
      : column === "verifying"
        ? "border-amber-200 bg-amber-50/80"
        : "border-slate-200 bg-white";
  const badge =
    column === "paid"
      ? "bg-emerald-600 text-white"
      : column === "verifying"
        ? "bg-amber-500 text-white"
        : "bg-slate-800 text-white";

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black text-slate-950">
              {referralDisplayName(referral)}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${badge}`}
            >
              {column === "paid"
                ? "Paid"
                : column === "verifying"
                  ? "In review"
                  : "Invited"}
            </span>
          </div>
          <p className="mt-1.5 text-xs font-semibold text-slate-500">
            {getStatusLabel(referral.status)} ·{" "}
            {safeDateLabel(referral.updated_at || referral.created_at)}
          </p>
        </div>
        <p className="shrink-0 text-sm font-black tabular-nums text-slate-900">
          {currency(
            asNumber(referral.total_reward_amount || referral.reward_amount),
          )}
        </p>
      </div>
    </article>
  );
}

function PipelineColumnPanel({
  title,
  helper,
  count,
  icon,
  tone,
  emptyTitle,
  emptyBody,
  items,
}: {
  title: string;
  helper: string;
  count: number;
  icon: ReactNode;
  tone: string;
  emptyTitle: string;
  emptyBody: string;
  items: ReferralRow[];
}) {
  return (
    <section
      className={`flex min-h-[280px] flex-col rounded-[1.75rem] border bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] ${tone}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
            {icon}
          </span>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">
              {title}
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black tabular-nums text-slate-800">
          {count}
        </span>
      </div>

      <div className="flex-1 space-y-2">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
            <p className="text-sm font-black text-slate-700">{emptyTitle}</p>
            <p className="mt-1 max-w-[220px] text-xs font-semibold leading-5 text-slate-500">
              {emptyBody}
            </p>
          </div>
        ) : (
          items.map((referral) => (
            <ReferralFeedCard key={referral.id} referral={referral} />
          ))
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <article
      className={`rounded-[1.75rem] border p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] ${tone}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">
          {label}
        </p>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/80 ring-1 ring-black/5">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-4xl font-black tracking-tight tabular-nums text-slate-950">
        {value}
      </p>
      <p className="mt-1.5 text-xs font-semibold text-slate-600">{helper}</p>
    </article>
  );
}

export default function GuruDashboardReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [guruName, setGuruName] = useState("Guru");
  const [referralCode, setReferralCode] = useState("");
  const [referralUrl, setReferralUrl] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [programSettings, setProgramSettings] =
    useState<ProgramSettingsRow | null>(null);
  const [pageNotice, setPageNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadReferralDashboard() {
      setLoading(true);
      setErrorMessage("");
      setPageNotice("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!mounted) return;
          setErrorMessage("Sign in to view your referral dashboard.");
          setLoading(false);
          return;
        }

        const guruResponse = await supabase
          .from("gurus")
          .select("id, user_id, display_name, full_name, name, email")
          .eq("user_id", user.id)
          .maybeSingle();

        const guru = (guruResponse.data || null) as GuruRow | null;
        const resolvedName =
          firstText(
            guru?.display_name,
            guru?.full_name,
            guru?.name,
            guru?.email,
            user.email,
          ) || "Guru";
        const generatedCode = makeReferralCode(resolvedName, user.id);
        const siteOrigin =
          typeof window !== "undefined"
            ? window.location.origin
            : "https://sitguru.com";
        const generatedReferralUrl = buildGuruReferralUrl(
          generatedCode,
          siteOrigin,
        );

        if (!mounted) return;

        setGuruName(resolvedName);
        setReferralCode(generatedCode);
        setReferralUrl(generatedReferralUrl);

        const campaignResponse = await supabase
          .from("guru_referral_campaigns")
          .select("*")
          .eq("guru_user_id", user.id)
          .order("created_at", { ascending: false });

        let campaignRows =
          ((campaignResponse.data || []) as CampaignRow[]) || [];

        if (!campaignResponse.error && campaignRows.length === 0) {
          const insertPayload: Record<string, unknown> = {
            guru_user_id: user.id,
            campaign_name: "Default Referral Link",
            referral_code: generatedCode,
            referral_url: generatedReferralUrl,
            source_channel: "default",
            is_active: true,
          };
          if (guru?.id != null) insertPayload.guru_id = guru.id;

          const createdCampaign = await supabase
            .from("guru_referral_campaigns")
            .insert(insertPayload)
            .select("*")
            .single();

          if (!createdCampaign.error && createdCampaign.data) {
            campaignRows = [createdCampaign.data as CampaignRow];
          }
        } else if (campaignRows[0] && !asText(campaignRows[0].referral_url)) {
          await supabase
            .from("guru_referral_campaigns")
            .update({ referral_url: generatedReferralUrl })
            .eq("id", campaignRows[0].id);
          campaignRows = [
            { ...campaignRows[0], referral_url: generatedReferralUrl },
          ];
        }

        const [referralsResponse, rewardsResponse, settingsResponse] =
          await Promise.all([
            supabase
              .from("guru_referrals")
              .select("*")
              .eq("referrer_user_id", user.id)
              .order("created_at", { ascending: false }),
            supabase
              .from("guru_referral_rewards")
              .select("*")
              .eq("guru_user_id", user.id)
              .order("created_at", { ascending: false }),
            supabase
              .from("guru_referral_program_settings")
              .select("*")
              .eq("is_active", true)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

        if (!mounted) return;

        if (referralsResponse.error) {
          setPageNotice(
            `Referral tracking not ready: ${referralsResponse.error.message}`,
          );
        }

        setCampaigns(campaignRows);
        setReferrals(((referralsResponse.data || []) as ReferralRow[]) || []);
        setRewards(((rewardsResponse.data || []) as RewardRow[]) || []);
        setProgramSettings(
          (settingsResponse.data as ProgramSettingsRow) || null,
        );
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(
          error instanceof Error
            ? `Could not load referral dashboard: ${error.message}`
            : "Could not load referral dashboard.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadReferralDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const baseReward = asNumber(programSettings?.base_reward_amount) || 50;
  const requiredBookings =
    asNumber(programSettings?.required_completed_bookings) || 3;

  const activeReferralUrl = useMemo(() => {
    const fromCampaign = firstText(campaigns[0]?.referral_url);
    if (
      fromCampaign.includes("become-a-guru") ||
      fromCampaign.includes("signup")
    ) {
      return fromCampaign;
    }
    if (referralCode) {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://sitguru.com";
      return buildGuruReferralUrl(referralCode, origin);
    }
    return referralUrl;
  }, [campaigns, referralCode, referralUrl]);

  const activeCode = firstText(campaigns[0]?.referral_code, referralCode);
  const firstName = getFirstName(guruName);
  const rewardLabel = `Earn ${currency(baseReward)} when a Guru you refer completes ${requiredBookings} bookings.`;

  const pendingApprovalCount = referrals.filter(
    (referral) => getPipelineColumn(referral) === "verifying",
  ).length;

  const approvedGurusCount = referrals.filter((referral) =>
    isQualifiedStatus(referral.status),
  ).length;

  const pendingRewardAmount =
    rewards
      .filter((reward) => isPendingRewardStatus(reward.status))
      .reduce((sum, reward) => sum + asNumber(reward.amount), 0) ||
    referrals
      .filter((referral) =>
        ["pending", "approved"].includes(
          normalizeStatus(referral.payout_status),
        ),
      )
      .reduce(
        (sum, referral) =>
          sum + asNumber(referral.total_reward_amount || referral.reward_amount),
        0,
      );

  const paidRewardAmount =
    rewards
      .filter((reward) => isPaidRewardStatus(reward.status))
      .reduce((sum, reward) => sum + asNumber(reward.amount), 0) ||
    referrals
      .filter((referral) => normalizeStatus(referral.payout_status) === "paid")
      .reduce(
        (sum, referral) =>
          sum + asNumber(referral.total_reward_amount || referral.reward_amount),
        0,
      );

  const invited = referrals.filter(
    (referral) => getPipelineColumn(referral) === "invited",
  );
  const verifying = referrals.filter(
    (referral) => getPipelineColumn(referral) === "verifying",
  );
  const paid = referrals.filter(
    (referral) => getPipelineColumn(referral) === "paid",
  );

  const howItWorks = [
    {
      step: "1",
      title: "Share your link",
      body: "Send your tracking link to friends who would make great SitGuru Gurus.",
    },
    {
      step: "2",
      title: "They join & get approved",
      body: "Track invite progress as they apply, get approved, and start caring for pets.",
    },
    {
      step: "3",
      title: "Earn your reward",
      body: `When they complete ${requiredBookings} bookings, you earn ${currency(baseReward)} via Stripe payouts.`,
    },
  ];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_40%,#ecfdf5_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.42)_0%,transparent_28%),linear-gradient(105deg,#03d39c_0%,#72dec5_45%,#b9e3ff_100%)] shadow-[0_24px_52px_rgba(15,23,42,0.12)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <Link
              href="/guru/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-sm font-bold text-emerald-900 shadow-sm transition hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>

            <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#07132f]/80">
                  Guru Growth Studio
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] !text-[#07132f] sm:text-5xl">
                  Referrals, {firstName}
                </h1>
                <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-slate-800/90 sm:text-lg">
                  Invite trusted pet caregivers to SitGuru. Share your link,
                  track progress, and earn {currency(baseReward)} after{" "}
                  {requiredBookings} completed bookings.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="#referral-share"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#07132f] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(7,19,47,0.18)] transition hover:bg-[#0b1436]"
                  >
                    Copy my link
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link
                    href="/guru/dashboard/earnings"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/85 px-5 text-sm font-black text-[#07132f] shadow-sm transition hover:bg-white"
                  >
                    View earnings
                  </Link>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 text-[#0D5C3A]">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-xs font-black uppercase tracking-[0.16em]">
                    Current reward
                  </p>
                </div>
                <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                  {currency(baseReward)}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  after {requiredBookings} completed bookings from your referral
                </p>
              </div>
            </div>
          </div>
        </section>

        {pageNotice ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900">
            {pageNotice}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-sm font-black text-slate-800">
              Loading your referral studio…
            </p>
          </section>
        ) : (
          <>
            <div id="referral-share">
              <GuruLinkShareCard
                referralCode={activeCode}
                referralUrl={activeReferralUrl}
                guruName={guruName}
                rewardLabel={rewardLabel}
              />
            </div>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Gift className="h-4 w-4" style={{ color: BRAND }} />
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                  How referrals work
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {howItWorks.map((item) => (
                  <article
                    key={item.step}
                    className="rounded-2xl border border-emerald-100 bg-[linear-gradient(180deg,#f7fffb_0%,#ffffff_100%)] p-4"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0D5C3A] text-sm font-black text-white">
                      {item.step}
                    </span>
                    <h3 className="mt-3 text-base font-black !text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm font-semibold leading-6 !text-slate-700">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Pending approval"
                value={String(pendingApprovalCount)}
                helper={`${currency(pendingRewardAmount)} awaiting payout review`}
                icon={<Clock3 className="h-4 w-4 text-amber-700" />}
                tone="border-amber-200 bg-amber-50"
              />
              <StatCard
                label="Approved Gurus"
                value={String(approvedGurusCount)}
                helper="Qualified / reward-ready referrals"
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />}
                tone="border-emerald-200 bg-emerald-50"
              />
              <StatCard
                label="Total cash payouts"
                value={currency(paidRewardAmount)}
                helper="Stripe-linked paid rewards"
                icon={<Wallet className="h-4 w-4 text-sky-700" />}
                tone="border-sky-200 bg-sky-50"
              />
            </section>

            <section className="space-y-3 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-600">
                  Tracking feed
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black tabular-nums text-slate-700">
                  {referrals.length}
                </span>
              </div>
              {referrals.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-white px-5 py-10 text-center shadow-sm">
                  <UsersRound className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="mt-3 text-base font-black text-slate-900">
                    No referrals yet
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-sm font-semibold text-slate-500">
                    Share your tracking link to start filling this feed.
                  </p>
                </div>
              ) : (
                referrals.map((referral) => (
                  <ReferralFeedCard key={referral.id} referral={referral} />
                ))
              )}
            </section>

            <section className="hidden gap-4 md:grid md:grid-cols-1 lg:grid-cols-3">
              <PipelineColumnPanel
                title="Invited"
                helper="Signed up with your link"
                count={invited.length}
                icon={<UsersRound className="h-4 w-4" />}
                tone="border-slate-200"
                emptyTitle="No invites yet"
                emptyBody="Share your link to start tracking new Guru signups."
                items={invited}
              />
              <PipelineColumnPanel
                title="In review"
                helper="Approved / qualifying"
                count={verifying.length}
                icon={<Clock3 className="h-4 w-4" />}
                tone="border-amber-100"
                emptyTitle="Nothing in review"
                emptyBody="Referrals appear here while they complete setup and bookings."
                items={verifying}
              />
              <PipelineColumnPanel
                title="Paid out"
                helper="Reward completed"
                count={paid.length}
                icon={<Wallet className="h-4 w-4" />}
                tone="border-emerald-100"
                emptyTitle="No payouts yet"
                emptyBody="Paid referral rewards will show here once Stripe payouts clear."
                items={paid}
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
