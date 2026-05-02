// app/customer/dashboard/pawperks/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
  available_credit?: number | null;
  lifetime_credit?: number | null;
};

const routes = {
  login: "/login",
};

const heroPetImages = [
  "/images/pawperks-hero-pets.png",
  "/images/booking-hero-pets.png",
];

const pawPerksRulesPath = "/customer/dashboard/pawperks/rules";

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
    avatar_url:
      readString(row?.avatar_url) ||
      readString(row?.profile_photo_url) ||
      readString(row?.photo_url) ||
      null,
  };
}

async function fetchReferralStats(
  userId: string,
  profile: CustomerProfile | null,
) {
  const fallbackCode = makeReferralCode(userId, profile);
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://sitguru.com";

  const fallbackStats: ReferralStats = {
    referral_code: fallbackCode,
    referral_link: `${origin}/signup?ref=${fallbackCode}`,
    invited_count: 0,
    completed_referrals: 0,
    available_credit: 0,
    lifetime_credit: 0,
  };

  const { data, error } = await supabase
    .from("referral_profiles")
    .select(
      "referral_code, invited_count, completed_referrals, available_credit, lifetime_credit",
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
    available_credit: readNumber(row.available_credit),
    lifetime_credit: readNumber(row.lifetime_credit),
  };
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M10.5 13.5 13.5 10.5m-7 6.5-1.2 1.2a4 4 0 0 1-5.7-5.7l3.5-3.5a4 4 0 0 1 5.7 0m6.4 6.4a4 4 0 0 0 5.7 0l3.5-3.5a4 4 0 0 0-5.7-5.7L17.5 7.5m-6.9.1a4 4 0 0 1 5.7 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M8 8V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3M6 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.1l6.8 3.8M15.4 7.1 8.6 10.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 17v-6m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M20 12v8H4v-8m17-5H3v5h18V7ZM12 20V7m0 0H8.5A2.5 2.5 0 1 1 11 4.5L12 7Zm0 0h3.5A2.5 2.5 0 1 0 13 4.5L12 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeroMiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/86 px-4 py-3 shadow-sm backdrop-blur-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function HeroPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-100 bg-white/86 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-sm">
      {children}
    </span>
  );
}

function RewardTierCard({
  icon,
  referrals,
  credit,
  text,
}: {
  icon: string;
  referrals: string;
  credit: string;
  text: string;
}) {
  return (
    <div className="group rounded-[1.4rem] border border-emerald-100 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_22px_60px_rgba(16,185,129,0.12)]">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl ring-1 ring-emerald-100 transition group-hover:bg-emerald-100">
          {icon}
        </span>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
            {referrals}
          </p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {credit}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white p-5">
      <div className="absolute right-5 top-5 text-xs text-emerald-400">✦</div>

      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-3xl ring-1 ring-emerald-100">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm font-black text-emerald-700">{label}</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

function BenefitRow({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xl ring-1 ring-emerald-100">
        {icon}
      </span>
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function HowItWorksStep({
  step,
  icon,
  title,
  text,
}: {
  step: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="relative text-center">
      <span className="absolute left-3 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white shadow-sm shadow-emerald-900/20">
        {step}
      </span>

      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-5xl ring-1 ring-emerald-100">
        {icon}
      </div>

      <h3 className="mt-4 text-base font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-[190px] text-sm font-semibold leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}

export default function CustomerPawPerksPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [message, setMessage] = useState("");
  const [copyError, setCopyError] = useState("");
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  const currentHeroImage = heroPetImages[heroImageIndex];

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

  function handleHeroImageError() {
    const nextIndex = heroImageIndex + 1;

    if (nextIndex < heroPetImages.length) {
      setHeroImageIndex(nextIndex);
      return;
    }

    setHeroImageFailed(true);
  }

  async function copyReferralLink() {
    if (!stats?.referral_link) return;

    setMessage("");
    setCopyError("");

    try {
      await navigator.clipboard.writeText(stats.referral_link);
      setMessage("Referral link copied.");
    } catch {
      setCopyError("Could not copy automatically. Highlight the link and copy it.");
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
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#ecfdf5_100%)]">
        <Header />

        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-16">
          <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl ring-1 ring-emerald-100">
              🎁
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] text-slate-950">
      <Header />

      <section className="mx-auto max-w-[1500px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6">
          <div className="relative overflow-hidden rounded-[2.6rem] border border-emerald-100 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.86),transparent_18%),radial-gradient(circle_at_68%_44%,rgba(167,243,208,0.55),transparent_28%),linear-gradient(120deg,#f3fdf7_0%,#ddfaea_45%,#a7f3d0_100%)] px-6 py-8 shadow-[0_28px_95px_rgba(6,95,70,0.14)] sm:px-8 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[48%] top-10 text-xl text-yellow-500/70">
                ✦
              </div>
              <div className="absolute left-[61%] top-20 text-sm text-emerald-500/60">
                ◆
              </div>
              <div className="absolute right-[12%] top-10 text-xl text-yellow-500/70">
                ✧
              </div>
              <div className="absolute right-[6%] top-24 text-sm text-pink-400/60">
                ■
              </div>
              <div className="absolute bottom-16 left-[56%] text-sm text-cyan-500/70">
                ◆
              </div>
              <div className="absolute bottom-14 right-[8%] text-base text-yellow-500/70">
                ✦
              </div>
              <div className="absolute left-[8%] top-[24%] h-24 w-24 rounded-full bg-white/70 blur-2xl" />
              <div className="absolute right-[18%] bottom-[16%] h-28 w-28 rounded-full bg-emerald-300/25 blur-2xl" />
            </div>

            <div className="relative grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/82 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-800 shadow-sm backdrop-blur-sm">
                    🐾 SitGuru PawPerks
                  </span>

                  <span className="inline-flex items-center rounded-full bg-yellow-300 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-950 shadow-sm">
                    Friends & Family Rewards
                  </span>
                </div>

                <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 md:text-6xl xl:text-7xl">
                  Share SitGuru with
                  <br />
                  friends & family.
                  <span className="mt-2 block bg-[linear-gradient(90deg,#059669_0%,#10b981_42%,#65a30d_100%)] bg-clip-text text-transparent">
                    Earn PawPerks Rewards.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-slate-700 md:text-lg">
                  Invite friends and family to SitGuru. When they book and
                  complete Pet Care, you can earn future credits for more tail
                  wags, smoother bookings, and happy stays ahead.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <HeroPill>🔗 Share your invite link</HeroPill>
                  <HeroPill>🐶 Friends & family book care</HeroPill>
                  <HeroPill>🎁 Earn PawPerks Rewards</HeroPill>
                </div>

                <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                  <HeroMiniStat
                    label="Your Code"
                    value={stats?.referral_code || "SITGURU"}
                  />
                  <HeroMiniStat
                    label="Available Rewards"
                    value={formatCurrency(stats?.available_credit || 0)}
                  />
                  <HeroMiniStat
                    label="Qualified Referrals"
                    value={`${stats?.completed_referrals || 0}`}
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-100 bg-white/84 px-4 py-4 shadow-sm backdrop-blur-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                        Next PawPerks Reward
                      </p>
                      <p className="mt-1 text-lg font-black text-slate-950">
                        {remainingToFirstReward} more qualified referral
                        {remainingToFirstReward === 1 ? "" : "s"} to unlock
                        your first{" "}
                        <span className="text-emerald-700">
                          $10 future credit
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={copyReferralLink}
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
                    >
                      <CopyIcon />
                      Copy Invite Link
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[500px]">
                <div className="absolute inset-0 rounded-[2.3rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.58)_0%,rgba(255,255,255,0.2)_100%)] shadow-[0_22px_70px_rgba(6,95,70,0.12)] ring-1 ring-white/60 backdrop-blur-md" />

                <div className="absolute -left-2 top-5 z-20 rounded-[1.35rem] border border-white/80 bg-white/88 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Welcome back
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {displayName}
                  </p>
                </div>

                <div className="absolute right-4 top-5 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-300 text-3xl shadow-lg shadow-yellow-950/15 ring-4 ring-white/45">
                  🐾
                </div>

                <div className="absolute bottom-4 left-4 right-4 top-24 overflow-hidden rounded-[2rem] border border-white/75 bg-white/62 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  {!heroImageFailed ? (
                    <div className="relative h-full w-full p-4">
                      <div className="grid h-full gap-4 md:grid-cols-[0.78fr_1.22fr]">
                        <div className="relative flex min-h-0 flex-col overflow-hidden rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(247,255,251,0.96)_100%)] p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-black uppercase leading-4 tracking-[0.18em] text-emerald-700">
                                PawPerks
                                <br />
                                Preview
                              </p>

                              <h3 className="mt-2 text-[1.65rem] font-black leading-[1.02] tracking-[-0.04em] text-slate-950">
                                Share.
                                <br />
                                Book.
                                <br />
                                Earn.
                              </h3>
                            </div>

                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xl ring-1 ring-emerald-100">
                              🏅
                            </span>
                          </div>

                          <p className="mt-3 text-sm font-semibold leading-5 text-slate-600">
                            Friends and family book through your link. You earn
                            credits when they qualify.
                          </p>

                          <div className="mt-3 grid gap-2">
                            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/90 px-3 py-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                                1
                              </span>
                              <p className="text-sm font-black text-slate-800">
                                Share link
                              </p>
                            </div>

                            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                                2
                              </span>
                              <p className="text-sm font-black text-slate-800">
                                They book care
                              </p>
                            </div>

                            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                                3
                              </span>
                              <p className="text-sm font-black text-slate-800">
                                Earn rewards
                              </p>
                            </div>
                          </div>

                          <div className="mt-auto pt-3">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/90 px-3 py-3">
                              <div className="flex items-end justify-between gap-3">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                    Progress
                                  </p>
                                  <p className="mt-1 text-xl font-black text-slate-950">
                                    {stats?.completed_referrals || 0} / 2
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                    Next
                                  </p>
                                  <p className="mt-1 text-sm font-black text-slate-950">
                                    {remainingToFirstReward} more
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                                <div
                                  className="h-full rounded-full bg-emerald-600 transition-all"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="relative overflow-hidden rounded-[1.7rem] border border-white/70 bg-emerald-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={currentHeroImage}
                            alt="Happy dog and cat representing SitGuru PawPerks Rewards"
                            onError={handleHeroImageError}
                            className="h-full w-full object-cover object-center"
                          />

                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_52%,rgba(15,23,42,0.14)_100%)]" />

                          <div className="absolute left-[16%] top-[19%] flex h-20 w-20 items-center justify-center rounded-full bg-white/85 text-5xl shadow-[0_18px_40px_rgba(15,23,42,0.16)] ring-4 ring-white/70 backdrop-blur-sm md:h-24 md:w-24 md:text-6xl">
                            ❤️
                          </div>

                          <div className="absolute bottom-4 left-4 right-4 rounded-[1.25rem] border border-white/75 bg-white/90 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                                  Friends & Family
                                </p>
                                <p className="mt-1 text-base font-black leading-5 text-slate-950">
                                  Rewards for sharing trusted Pet Care.
                                </p>
                              </div>

                              <span className="hidden shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 sm:inline-flex">
                                $10 first reward
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[300px] w-full items-center justify-center bg-amber-50 px-6 text-center">
                      <div>
                        <p className="text-lg font-black text-amber-800">
                          Hero image not found
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6 text-amber-700">
                          Add the image at{" "}
                          <span className="font-black">
                            public/images/pawperks-hero-pets.png
                          </span>
                          , then refresh this page.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-[linear-gradient(120deg,#ffffff_0%,#f0fdf4_58%,#ecfeff_100%)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                  PawPerks Reward Tiers
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  The more friends & family you share with, the more you earn.
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Keep inviting trusted friends and family and unlock larger
                  future booking credits as referrals qualify.
                </p>
              </div>

              <a
                href={pawPerksRulesPath}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                <InfoIcon />
                View Reward Details
              </a>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <RewardTierCard
                icon="🏅"
                referrals="2 referrals"
                credit="$10 credit"
                text="Unlock your first future booking credit once two referrals qualify."
              />
              <RewardTierCard
                icon="🎁"
                referrals="5 referrals"
                credit="$25 credit"
                text="Build momentum and earn a larger credit toward eligible SitGuru care."
              />
              <RewardTierCard
                icon="🏆"
                referrals="10 referrals"
                credit="$60 credit"
                text="Reach the top tier and earn your strongest PawPerks Reward."
              />
            </div>
          </div>

          {message || copyError ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-black ${
                copyError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {copyError || message}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] lg:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <LinkIcon />
                  </span>

                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">
                      Share your Friends & Family link
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Invite friends and family. Earn PawPerks Rewards.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-center ring-1 ring-emerald-100">
                  <p className="text-xs font-black text-slate-500">
                    Your referral code
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-wide text-emerald-700">
                    {stats?.referral_code}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 ring-1 ring-slate-50">
                <span className="text-slate-500">
                  <LinkIcon />
                </span>
                <p className="min-w-0 flex-1 break-all text-sm font-bold text-slate-600">
                  {stats?.referral_link}
                </p>
                <button
                  type="button"
                  onClick={copyReferralLink}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                  aria-label="Copy referral link"
                >
                  <CopyIcon />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={copyReferralLink}
                  className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  <CopyIcon />
                  Copy Link
                </button>

                <button
                  type="button"
                  onClick={shareReferralLink}
                  className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  <ShareIcon />
                  Share with Friends & Family
                </button>

                <a
                  href={pawPerksRulesPath}
                  className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  <InfoIcon />
                  View Reward Details
                </a>
              </div>

              <p className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  ✓
                </span>
                Friends & family referrals are tracked automatically.
              </p>
            </div>

            <div
              id="reward-details"
              className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] lg:p-7"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <GiftIcon />
                </span>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Your next PawPerks Reward
                </h2>
              </div>

              <div className="mt-7 flex items-center gap-5">
                <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#fde68a_0%,#f59e0b_100%)] text-5xl shadow-lg shadow-yellow-900/10 ring-4 ring-yellow-100">
                  🐾
                </span>

                <div>
                  <p className="text-6xl font-black tracking-tight text-emerald-700">
                    {remainingToFirstReward}
                    <span className="ml-2 text-2xl">more</span>
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    qualified referral to unlock your first{" "}
                    <span className="font-black text-slate-950">
                      $10 future credit
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div className="mt-7 h-4 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="mt-3 text-sm font-bold text-slate-500">
                {stats?.completed_referrals || 0} of 2 qualified referrals
              </p>

              <a
                href={pawPerksRulesPath}
                className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
              >
                View Reward Details →
              </a>
            </div>
          </div>

          <div className="grid gap-4 rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:grid-cols-4">
            <StatCard
              icon="👥"
              value={`${stats?.invited_count || 0}`}
              label="Friends & Family Invited"
              helper="Thanks for spreading the word!"
            />
            <StatCard
              icon="🏅"
              value={`${stats?.completed_referrals || 0}`}
              label="Qualified Referrals"
              helper="They’ve completed care. Nice work!"
            />
            <StatCard
              icon="💳"
              value={formatCurrency(stats?.available_credit || 0)}
              label="Available Rewards"
              helper="Ready to use on your next booking."
            />
            <StatCard
              icon="⭐"
              value={formatCurrency(stats?.lifetime_credit || 0)}
              label="Lifetime PawPerks"
              helper="Total future credits earned so far."
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:p-7">
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                How Friends & Family Rewards work
              </h2>

              <div className="mt-7 grid gap-6 md:grid-cols-3">
                <HowItWorksStep
                  step="1"
                  icon="✉️"
                  title="Share your link"
                  text="Send your unique PawPerks link to friends and family who would love SitGuru."
                />
                <HowItWorksStep
                  step="2"
                  icon="🐶"
                  title="They join SitGuru"
                  text="Your friend or family member signs up and completes a booking with SitGuru."
                />
                <HowItWorksStep
                  step="3"
                  icon="🎁"
                  title="Earn rewards"
                  text="When their booking is completed, you earn future credits for your next stay."
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:p-7">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Why Pet Parents love PawPerks
                </h2>
                <span className="text-emerald-500">✦</span>
              </div>

              <div className="mt-6 grid gap-5">
                <BenefitRow
                  icon="🛡️"
                  title="Trusted care they can count on"
                  text="Share a service you already trust with the people who matter."
                />
                <BenefitRow
                  icon="🎁"
                  title="Help friends and family find great Pet Care"
                  text="Make it easier for people close to you to find loving, reliable sitters."
                />
                <BenefitRow
                  icon="🔗"
                  title="Easy to share"
                  text="One link. Text, email, or social — your choice."
                />
                <BenefitRow
                  icon="🐾"
                  title="Earn PawPerks Rewards"
                  text="Qualified referrals earn you future credits to use on your next booking."
                />
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[0.22fr_0.78fr_auto] lg:items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                <ShieldIcon />
              </span>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Safe. Simple. Rewarding.
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Friends and family referrals are verified to ensure quality
                  care. Future credits can be used on eligible SitGuru bookings
                  once rewards qualify.
                </p>
              </div>

              <span className="hidden text-4xl text-emerald-600 lg:block">
                🐾
              </span>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                  Official Rules
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Review the full PawPerks program details.
                </h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                  Learn how Friends & Family Rewards qualify, when credits are
                  issued, how rewards can be used, and what activity may not
                  qualify.
                </p>
              </div>

              <a
                href={pawPerksRulesPath}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                <InfoIcon />
                View Official Rules
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
