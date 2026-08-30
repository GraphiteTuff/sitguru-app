"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Gift,
  Info,
  Link2,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import {
  buildPawPerksDashboardState,
  bumpSharedLinkCounter,
  readStoredPetPerksRef,
} from "@/lib/rewards/perks-broker";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";

type CustomerProfile = {
  full_name: string | null;
  first_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type ReferralStats = {
  referral_code: string;
  referral_link: string;
  invited_count: number;
  completed_referrals: number;
  pending_rewards: number;
  available_credit: number;
  lifetime_credit: number;
};

type RawProfileRow = {
  full_name?: string | null;
  first_name?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
};

type RawReferralRow = {
  referral_code?: string | null;
  invited_count?: number | null;
  completed_referrals?: number | null;
  pending_rewards?: number | null;
  available_credit?: number | null;
  lifetime_credit?: number | null;
};

const routes = {
  login: "/login",
};

const pawPerksRulesPath = "/customer/dashboard/pawperks/rules";

function getPublicSiteUrl() {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL;

  if (configuredSiteUrl) {
    const normalizedUrl = configuredSiteUrl.startsWith("http")
      ? configuredSiteUrl
      : `https://${configuredSiteUrl}`;

    return normalizedUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const currentOrigin = window.location.origin;

    if (!currentOrigin.includes("localhost")) {
      return currentOrigin.replace(/\/$/, "");
    }
  }

  return "https://sitguru.com";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function makeReferralCode(userId: string, profile: CustomerProfile | null) {
  const nameBase =
    profile?.first_name ||
    profile?.full_name?.split(" ")[0] ||
    profile?.email?.split("@")[0] ||
    "SITGURU";

  const cleanName = nameBase.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const cleanId = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();

  return `${cleanName || "SITGURU"}${cleanId}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

async function fetchCustomerProfile(userId: string, email: string | null) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, first_name, avatar_url, profile_photo_url, photo_url")
    .eq("id", userId)
    .maybeSingle();

  const row = (data as RawProfileRow | null) ?? null;

  return {
    full_name: readString(row?.full_name),
    first_name: readString(row?.first_name),
    email,
    avatar_url: resolvePetParentAvatarUrl(row) || null,
  };
}

async function fetchReferralStats(
  userId: string,
  profile: CustomerProfile | null,
) {
  const fallbackCode = makeReferralCode(userId, profile);
  const origin = getPublicSiteUrl();

  const fallbackStats: ReferralStats = {
    referral_code: fallbackCode,
    referral_link: `${origin}/signup?ref=${fallbackCode}`,
    invited_count: 0,
    completed_referrals: 0,
    pending_rewards: 0,
    available_credit: 0,
    lifetime_credit: 0,
  };

  const { data, error } = await supabase
    .from("referral_profiles")
    .select(
      "referral_code, invited_count, completed_referrals, pending_rewards, available_credit, lifetime_credit",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return fallbackStats;
  }

  const row = data as RawReferralRow;
  const referralCode = readString(row.referral_code) || fallbackCode;

  return {
    referral_code: referralCode,
    referral_link: `${origin}/signup?ref=${referralCode}`,
    invited_count: readNumber(row.invited_count),
    completed_referrals: readNumber(row.completed_referrals),
    pending_rewards: readNumber(row.pending_rewards),
    available_credit: readNumber(row.available_credit),
    lifetime_credit: readNumber(row.lifetime_credit),
  };
}

const rewardTiers = [
  {
    referrals: "2 referrals",
    credit: "$10",
    text: "Unlock your first future booking credit once two referrals qualify.",
  },
  {
    referrals: "5 referrals",
    credit: "$25",
    text: "Build momentum and earn a larger credit toward eligible SitGuru care.",
  },
  {
    referrals: "10 referrals",
    credit: "$60",
    text: "Reach the top tier and earn your strongest PawPerks reward.",
  },
] as const;

const howSteps = [
  {
    step: "1",
    title: "Share your link",
    text: "Send your unique PawPerks link to friends and family.",
  },
  {
    step: "2",
    title: "They join & book",
    text: "They sign up and complete their first eligible paid booking.",
  },
  {
    step: "3",
    title: "Earn rewards",
    text: "When that booking qualifies, you earn future SitGuru care credits.",
  },
] as const;

export default function CustomerPawPerksPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [message, setMessage] = useState("");
  const [copyError, setCopyError] = useState("");

  const displayName = useMemo(() => {
    return (
      profile?.full_name ||
      profile?.first_name ||
      profile?.email?.split("@")[0] ||
      "Pet Parent"
    );
  }, [profile]);

  const firstName = useMemo(() => {
    return profile?.first_name || displayName.split(" ")[0] || "there";
  }, [displayName, profile]);

  const progressPercent = useMemo(() => {
    const completed = stats?.completed_referrals || 0;
    return Math.min(100, Math.max(0, (completed / 2) * 100));
  }, [stats?.completed_referrals]);

  const remainingToFirstReward = useMemo(() => {
    const completed = stats?.completed_referrals || 0;
    return Math.max(0, 2 - completed);
  }, [stats?.completed_referrals]);

  const pawPerksState = useMemo(
    () => buildPawPerksDashboardState(stats, readStoredPetPerksRef()),
    [stats],
  );

  const loadPawPerks = useCallback(async () => {
    setLoading(true);
    setMessage("");
    setCopyError("");

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      router.replace(routes.login);
      return;
    }

    const profileData = await fetchCustomerProfile(user.id, user.email ?? null);
    const referralStats = await fetchReferralStats(user.id, profileData);

    setProfile(profileData);
    setStats(referralStats);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadPawPerks();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace(routes.login);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadPawPerks, router]);

  async function copyReferralLink() {
    if (!stats?.referral_link) return;

    setMessage("");
    setCopyError("");

    try {
      await navigator.clipboard.writeText(stats.referral_link);
      bumpSharedLinkCounter(stats.referral_code);
      setMessage("Referral link copied.");
    } catch {
      setCopyError(
        "Could not copy automatically. Highlight the link and copy it.",
      );
    }
  }

  async function shareReferralLink() {
    if (!stats?.referral_link) return;

    setMessage("");
    setCopyError("");

    const shareData = {
      title: "Join SitGuru",
      text: `${firstName} invited friends and family to try SitGuru for trusted Pet Care.`,
      url: stats.referral_link,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        bumpSharedLinkCounter(stats.referral_code);
        setMessage("Referral link shared.");
        return;
      } catch {
        return;
      }
    }

    await copyReferralLink();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faf7]">
        <Header />
        <div className="mx-auto flex max-w-lg items-center justify-center px-4 py-16">
          <div className="w-full rounded-[28px] border border-emerald-100 bg-white px-6 py-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
              <Gift size={22} />
            </div>
            <p className="text-base font-bold text-slate-700">
              Loading your PawPerks Rewards...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7faf7] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-slate-950 sm:pb-10">
      <Header />

      {/* Mobile sticky share bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-3 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg gap-2">
          <button
            type="button"
            onClick={copyReferralLink}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#0D5C3A] px-3 text-sm font-black !text-white shadow-lg shadow-emerald-900/20 active:bg-[#09462C]"
          >
            <Copy size={16} />
            Copy link
          </button>
          <button
            type="button"
            onClick={shareReferralLink}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-3 text-sm font-black text-emerald-950 active:bg-emerald-50"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-6 sm:py-8 lg:px-8">
        {/* Compact hero */}
        <section className="overflow-hidden rounded-[28px] bg-[#0D5C3A] p-4 text-white shadow-sm sm:rounded-[32px] sm:p-6">
          <div data-brand-green className="public-dark-section">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] !text-white">
                <Sparkles size={12} />
                PawPerks Rewards
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] !text-emerald-50">
                Hi, {firstName}
              </span>
            </div>

            <h1 className="mt-4 text-[1.75rem] font-black leading-[1.05] tracking-[-0.04em] !text-white sm:text-4xl">
              Share SitGuru. Earn future care credits.
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 !text-emerald-50 sm:text-base sm:leading-7">
              Invite friends and family. When they book and complete eligible
              Pet Care, you can earn credits for your next SitGuru booking.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ["Code", pawPerksState.referralCode],
                ["Credits", formatCurrency(pawPerksState.redeemedCashCredits)],
                ["Pending", formatCurrency(pawPerksState.pendingReferrals)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/15 bg-white/10 px-2 py-3 text-center backdrop-blur"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] !text-emerald-100">
                    {label}
                  </p>
                  <p className="mt-1 truncate text-sm font-black !text-white sm:text-base">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {pawPerksState.attributedFromPetPerks ? (
              <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 px-3 py-3 text-xs font-bold leading-5 !text-emerald-50 sm:text-sm">
                PetPerks invite{" "}
                <span className="font-black !text-white">
                  {pawPerksState.attributedRefCode}
                </span>{" "}
                is linked
                {pawPerksState.welcomeCreditHintUsd > 0
                  ? ` — welcome credit up to $${pawPerksState.welcomeCreditHintUsd} after your first eligible booking.`
                  : "."}
              </div>
            ) : null}
          </div>
        </section>

        {message || copyError ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-black ${
              copyError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {copyError || message}
          </div>
        ) : null}

        {/* Progress + share */}
        <section className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Next reward
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-emerald-950 sm:text-2xl">
                {remainingToFirstReward === 0
                  ? "First $10 credit unlocked path"
                  : `${remainingToFirstReward} more qualified referral${
                      remainingToFirstReward === 1 ? "" : "s"
                    }`}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {remainingToFirstReward === 0
                  ? "Keep sharing to climb reward tiers."
                  : "to unlock your first $10 future credit."}
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
              <Trophy size={22} />
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-50">
            <div
              className="h-full rounded-full bg-[#0D5C3A] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {stats?.completed_referrals || 0} of 2 qualified referrals
          </p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              Your invite link
            </p>
            <p className="mt-1 break-all text-xs font-bold leading-5 text-slate-700 sm:text-sm">
              {stats?.referral_link}
            </p>
          </div>

          <div className="mt-3 hidden gap-2 sm:grid sm:grid-cols-3">
            <button
              type="button"
              onClick={copyReferralLink}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white transition hover:bg-[#09462C]"
            >
              <Copy size={16} />
              Copy link
            </button>
            <button
              type="button"
              onClick={shareReferralLink}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
            >
              <Share2 size={16} />
              Share
            </button>
            <Link
              href={pawPerksRulesPath}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
            >
              <Info size={16} />
              Rules
            </Link>
          </div>

          <Link
            href={pawPerksRulesPath}
            className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-[#f7faf4] text-sm font-black text-emerald-900 sm:hidden"
          >
            <Info size={16} />
            View reward details
          </Link>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            {
              icon: <Users size={18} />,
              value: `${stats?.invited_count || 0}`,
              label: "Invited",
              helper: "Friends & family",
            },
            {
              icon: <Link2 size={18} />,
              value: formatCurrency(pawPerksState.pendingReferrals),
              label: "Pending",
              helper: "Awaiting first booking",
            },
            {
              icon: <Gift size={18} />,
              value: formatCurrency(pawPerksState.redeemedCashCredits),
              label: "Credits",
              helper: "Ready at checkout",
            },
            {
              icon: <CheckCircle2 size={18} />,
              value: `${pawPerksState.completedReferrals}`,
              label: "Qualified",
              helper: "Completed care",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[22px] border border-emerald-100 bg-white p-3.5 shadow-sm sm:p-4"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                {stat.icon}
              </span>
              <p className="mt-3 text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs font-black text-emerald-800 sm:text-sm">
                {stat.label}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500 sm:text-xs">
                {stat.helper}
              </p>
            </div>
          ))}
        </section>

        {/* Tiers */}
        <section className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Reward tiers
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-emerald-950 sm:text-2xl">
                Share more. Earn more.
              </h2>
            </div>
            <Link
              href={pawPerksRulesPath}
              className="hidden text-sm font-black text-emerald-800 underline sm:inline"
            >
              Full details
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {rewardTiers.map((tier) => (
              <div
                key={tier.referrals}
                className="rounded-[22px] border border-emerald-100 bg-[#f7faf4] p-4"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  {tier.referrals}
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-emerald-950">
                  {tier.credit}
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  {tier.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6">
          <h2 className="text-xl font-black tracking-tight text-emerald-950 sm:text-2xl">
            How PawPerks works
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {howSteps.map((item) => (
              <div
                key={item.step}
                className="flex gap-3 rounded-[20px] border border-emerald-100 bg-[#f7faf4] p-4 sm:flex-col sm:text-center"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0D5C3A] text-sm font-black !text-white sm:mx-auto">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-black text-emerald-950 sm:mt-2">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust + rules */}
        <section className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-4 sm:rounded-[32px] sm:p-5">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-sm">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h2 className="text-base font-black text-emerald-950 sm:text-lg">
                Safe. Simple. Rewarding.
              </h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 sm:text-sm sm:leading-6">
                Referrals are verified for quality care. Credits apply on
                eligible SitGuru bookings once rewards qualify — not for
                Venmo, cash, or off-platform payments.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Official rules
              </p>
              <h2 className="mt-1 text-lg font-black text-emerald-950 sm:text-xl">
                Review full PawPerks program details
              </h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
                Qualification, issuance, checkout use, and ineligible activity.
              </p>
            </div>
            <Link
              href={pawPerksRulesPath}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black !text-white transition hover:bg-[#09462C]"
            >
              <Info size={16} />
              View rules
            </Link>
          </div>
        </section>

        <p className="px-1 pb-2 text-center text-xs font-semibold text-slate-500">
          Public share-and-earn overview:{" "}
          <Link href="/petperks" className="font-black text-emerald-800 underline">
            PetPerks
          </Link>
        </p>
      </div>
    </main>
  );
}
