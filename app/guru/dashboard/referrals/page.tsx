"use client";

/**
 * Guru referral dashboard — conversion-first cards, share strip, pipeline columns.
 */

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

function referralDisplayName(referral: ReferralRow) {
  return (
    firstText(referral.referred_name, referral.referred_email) || "Referred Guru"
  );
}

function ReferralFeedCard({ referral }: { referral: ReferralRow }) {
  const column = getPipelineColumn(referral);
  const tone =
    column === "paid"
      ? "border-emerald-200 bg-emerald-50"
      : column === "verifying"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white";

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">
            {referralDisplayName(referral)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {getStatusLabel(referral.status)} ·{" "}
            {safeDateLabel(referral.updated_at || referral.created_at)}
          </p>
          {referral.referred_user_id ? (
            <p className="mt-1 truncate font-mono text-[10px] font-bold text-slate-400">
              uid {referral.referred_user_id}
            </p>
          ) : null}
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
  count,
  tone,
  items,
}: {
  title: string;
  count: number;
  tone: string;
  items: ReferralRow[];
}) {
  return (
    <section className={`rounded-[1.5rem] border bg-white p-4 shadow-sm ${tone}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">
          {title}
        </h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black tabular-nums text-slate-800">
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs font-bold text-slate-400">
            Empty
          </p>
        ) : (
          items.map((referral) => (
            <ReferralFeedCard key={referral.id} referral={referral} />
          ))
        )}
      </div>
    </section>
  );
}

export default function GuruDashboardReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [guruName, setGuruName] = useState("Guru");
  const [guruId, setGuruId] = useState<string | null>(null);
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
        setGuruId(guru?.id != null ? String(guru.id) : null);
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
    if (fromCampaign.includes("become-a-guru") || fromCampaign.includes("signup")) {
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

  const pendingApprovalCount = referrals.filter((referral) => {
    const column = getPipelineColumn(referral);
    return column === "verifying";
  }).length;

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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_45%,#ecfdf5_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/guru/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Guru Referrals
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {guruName} · Earn {currency(baseReward)} after {requiredBookings}{" "}
              completed bookings
            </p>
          </div>
          {guruId ? (
            <p className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono text-[10px] font-bold text-slate-500">
              guru_id {guruId}
            </p>
          ) : null}
        </header>

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
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-sm font-black text-slate-800">
              Loading referrals…
            </p>
          </section>
        ) : (
          <>
            <GuruLinkShareCard
              referralCode={activeCode}
              referralUrl={activeReferralUrl}
              guruName={guruName}
            />

            <section className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-amber-800">
                  <Clock3 className="h-4 w-4" />
                  <p className="text-[11px] font-black uppercase tracking-[0.14em]">
                    ⏳ Pending Approval
                  </p>
                </div>
                <p className="mt-3 text-3xl font-black tabular-nums text-slate-950">
                  {pendingApprovalCount}
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-900/80">
                  {currency(pendingRewardAmount)} awaiting payout review
                </p>
              </article>

              <article className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-[11px] font-black uppercase tracking-[0.14em]">
                    ✅ Approved Gurus
                  </p>
                </div>
                <p className="mt-3 text-3xl font-black tabular-nums text-slate-950">
                  {approvedGurusCount}
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-900/80">
                  Qualified / reward-ready referrals
                </p>
              </article>

              <article className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sky-800">
                  <Wallet className="h-4 w-4" />
                  <p className="text-[11px] font-black uppercase tracking-[0.14em]">
                    💰 Total Cash Payouts
                  </p>
                </div>
                <p className="mt-3 text-3xl font-black tabular-nums text-slate-950">
                  {currency(paidRewardAmount)}
                </p>
                <p className="mt-1 text-xs font-semibold text-sky-900/80">
                  Stripe-linked paid rewards
                </p>
              </article>
            </section>

            {/* Mobile: single-column vertical feed */}
            <section className="space-y-2 md:hidden">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-600">
                Tracking feed
              </h2>
              {referrals.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm font-bold text-slate-400">
                  Share your link to start tracking referrals.
                </p>
              ) : (
                referrals.map((referral) => (
                  <ReferralFeedCard key={referral.id} referral={referral} />
                ))
              )}
            </section>

            {/* Desktop / large tablet: 3-column workspace */}
            <section className="hidden gap-4 md:grid md:grid-cols-1 lg:grid-cols-3">
              <PipelineColumnPanel
                title="Invited"
                count={invited.length}
                tone="border-slate-200"
                items={invited}
              />
              <PipelineColumnPanel
                title="Verifying"
                count={verifying.length}
                tone="border-amber-100"
                items={verifying}
              />
              <PipelineColumnPanel
                title="Paid"
                count={paid.length}
                tone="border-emerald-100"
                items={paid}
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
