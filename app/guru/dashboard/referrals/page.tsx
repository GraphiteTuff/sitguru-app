"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Megaphone,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type StatCard = {
  label: string;
  value: string;
  change: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  sparkline: string;
};

type ShareButtonItem = {
  label: string;
  visual: "lucide" | "brand";
  icon?: ComponentType<{ className?: string }>;
  brand?: string;
  tone: string;
  disabledLabel: string;
};

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
  referral_url?: string | null;
  referred_name?: string | null;
  referred_email?: string | null;
  source_channel?: string | null;
  campaign_name?: string | null;
  status?: string | null;
  signup_completed_at?: string | null;
  application_started_at?: string | null;
  application_approved_at?: string | null;
  background_check_completed_at?: string | null;
  first_booking_completed_at?: string | null;
  qualified_at?: string | null;
  reward_pending_at?: string | null;
  reward_paid_at?: string | null;
  rejected_at?: string | null;
  flagged_at?: string | null;
  bookings_completed_count?: number | null;
  reward_amount?: number | null;
  bonus_amount?: number | null;
  total_reward_amount?: number | null;
  payout_status?: string | null;
  admin_status?: string | null;
  fraud_check_status?: string | null;
  admin_notes?: string | null;
  guru_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CampaignRow = {
  id: string;
  guru_user_id: string;
  campaign_name?: string | null;
  referral_code?: string | null;
  referral_url?: string | null;
  source_channel?: string | null;
  is_active?: boolean | null;
  clicks_count?: number | null;
  signups_count?: number | null;
  qualified_count?: number | null;
  rewards_earned?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type RewardRow = {
  id: string;
  referral_id?: string | null;
  guru_user_id?: string | null;
  reward_type?: string | null;
  amount?: number | null;
  status?: string | null;
  payout_reference?: string | null;
  admin_notes?: string | null;
  earned_at?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  audience?: string | null;
  guru_user_id?: string | null;
  is_active?: boolean | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string | null;
};

type ProgramSettingsRow = {
  id?: string;
  program_name?: string | null;
  base_reward_amount?: number | null;
  required_completed_bookings?: number | null;
  payout_delay_days?: number | null;
  tier_5_bonus?: number | null;
  tier_10_bonus?: number | null;
  tier_25_bonus?: number | null;
  program_rules?: string | null;
  is_active?: boolean | null;
};

type ActivityItem = {
  title: string;
  description: string;
  date: string;
  status: string;
  tone: "green" | "blue" | "amber" | "rose";
  rawDate: string;
};

type PendingVerification = {
  id: string;
  name: string;
  status: string;
  date: string;
  initials: string;
};

type ConversionStage = {
  label: string;
  count: number;
  percent: string;
  widthPercent: number;
  colorClass: string;
};

type ReferralChannel = {
  label: string;
  value: string;
  dot: string;
};

const defaultSparkline =
  "M2 28 L18 24 L34 26 L50 18 L66 21 L82 16 L98 22 L114 12";
const signupSparkline =
  "M2 30 L18 26 L34 18 L50 22 L66 20 L82 15 L98 19 L114 10";
const conversionSparkline =
  "M2 27 L18 25 L34 22 L50 20 L66 24 L82 16 L98 18 L114 13";
const qualifiedSparkline =
  "M2 31 L18 25 L34 28 L50 22 L66 20 L82 24 L98 17 L114 12";

const shareButtons: ShareButtonItem[] = [
  {
    label: "Copy Link",
    visual: "lucide",
    icon: Link2,
    tone: "text-slate-700",
    disabledLabel: "Copies referral link locally",
  },
  {
    label: "WhatsApp",
    visual: "lucide",
    icon: MessageCircle,
    tone: "text-emerald-600",
    disabledLabel: "Coming soon",
  },
  {
    label: "Facebook",
    visual: "brand",
    brand: "f",
    tone: "text-blue-600",
    disabledLabel: "Coming soon",
  },
  {
    label: "Instagram",
    visual: "brand",
    brand: "◎",
    tone: "text-pink-500",
    disabledLabel: "Coming soon",
  },
  {
    label: "X (Twitter)",
    visual: "brand",
    brand: "𝕏",
    tone: "text-slate-900",
    disabledLabel: "Coming soon",
  },
];

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

function percent(numerator: number, denominator: number) {
  if (!denominator || denominator <= 0) return "0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function percentNumber(numerator: number, denominator: number) {
  if (!denominator || denominator <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

function safeDateLabel(value?: string | null) {
  if (!value) return "Not dated";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not dated";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function safeDateTimeLabel(value?: string | null) {
  if (!value) return "Not dated";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not dated";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initialsFromName(name: string) {
  const parts = name
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
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

function getStatusLabel(status?: string | null) {
  const value = asText(status).replace(/_/g, " ");
  if (!value) return "Invited";

  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isSignupStatus(status?: string | null) {
  const value = asText(status).toLowerCase();

  return [
    "signed_up",
    "application_started",
    "application_approved",
    "background_check_complete",
    "first_booking_completed",
    "qualified",
    "reward_pending",
    "reward_paid",
  ].includes(value);
}

function isQualifiedStatus(status?: string | null) {
  const value = asText(status).toLowerCase();

  return ["qualified", "reward_pending", "reward_paid"].includes(value);
}

function isPendingRewardStatus(status?: string | null) {
  const value = asText(status).toLowerCase();
  return ["pending", "approved"].includes(value);
}

function isPaidRewardStatus(status?: string | null) {
  return asText(status).toLowerCase() === "paid";
}

function statusTone(status?: string | null): "green" | "blue" | "amber" | "rose" {
  const value = asText(status).toLowerCase();

  if (
    value.includes("paid") ||
    value.includes("qualified") ||
    value.includes("approved")
  ) {
    return "green";
  }

  if (
    value.includes("background") ||
    value.includes("booking") ||
    value.includes("complete")
  ) {
    return "blue";
  }

  if (value.includes("reject") || value.includes("fraud") || value.includes("flag")) {
    return "rose";
  }

  return "amber";
}

function badgeClasses(tone: "green" | "blue" | "amber" | "rose") {
  if (tone === "green") return "bg-emerald-100 !text-emerald-700";
  if (tone === "blue") return "bg-sky-100 !text-sky-700";
  if (tone === "rose") return "bg-rose-100 !text-rose-700";
  return "bg-amber-100 !text-amber-700";
}

function milestoneCount(referrals: ReferralRow[], milestone: string) {
  return referrals.filter((referral) => {
    const status = asText(referral.status).toLowerCase();

    if (milestone === "invited") return true;

    if (milestone === "application_started") {
      return [
        "application_started",
        "application_approved",
        "background_check_complete",
        "first_booking_completed",
        "qualified",
        "reward_pending",
        "reward_paid",
      ].includes(status);
    }

    if (milestone === "application_approved") {
      return [
        "application_approved",
        "background_check_complete",
        "first_booking_completed",
        "qualified",
        "reward_pending",
        "reward_paid",
      ].includes(status);
    }

    if (milestone === "background_check_complete") {
      return [
        "background_check_complete",
        "first_booking_completed",
        "qualified",
        "reward_pending",
        "reward_paid",
      ].includes(status);
    }

    if (milestone === "first_booking_completed") {
      return [
        "first_booking_completed",
        "qualified",
        "reward_pending",
        "reward_paid",
      ].includes(status);
    }

    return false;
  }).length;
}

function buildActivityItems(referrals: ReferralRow[], rewards: RewardRow[]) {
  const items: ActivityItem[] = [];

  referrals.forEach((referral) => {
    const name =
      firstText(referral.referred_name, referral.referred_email) || "Referred Guru";

    if (referral.created_at) {
      items.push({
        title: "Invitation Created",
        description: `${name} was added to your referral pipeline`,
        date: safeDateTimeLabel(referral.created_at),
        status: "Created",
        tone: "green",
        rawDate: referral.created_at,
      });
    }

    if (referral.signup_completed_at) {
      items.push({
        title: "Signup Completed",
        description: `${name} signed up with your referral link`,
        date: safeDateTimeLabel(referral.signup_completed_at),
        status: "Signed Up",
        tone: "green",
        rawDate: referral.signup_completed_at,
      });
    }

    if (referral.application_approved_at) {
      items.push({
        title: "Application Approved",
        description: `${name} was approved by SitGuru Admin`,
        date: safeDateTimeLabel(referral.application_approved_at),
        status: "Approved",
        tone: "green",
        rawDate: referral.application_approved_at,
      });
    }

    if (referral.background_check_completed_at) {
      items.push({
        title: "Background Check Complete",
        description: `${name} completed their background check`,
        date: safeDateTimeLabel(referral.background_check_completed_at),
        status: "Completed",
        tone: "blue",
        rawDate: referral.background_check_completed_at,
      });
    }

    if (referral.first_booking_completed_at) {
      items.push({
        title: "First Booking Completed",
        description: `${name} completed their first SitGuru booking`,
        date: safeDateTimeLabel(referral.first_booking_completed_at),
        status: "Completed",
        tone: "blue",
        rawDate: referral.first_booking_completed_at,
      });
    }

    if (referral.reward_paid_at) {
      items.push({
        title: "Reward Paid",
        description: `${currency(
          asNumber(referral.total_reward_amount || referral.reward_amount),
        )} was paid for ${name}`,
        date: safeDateTimeLabel(referral.reward_paid_at),
        status: "Paid",
        tone: "green",
        rawDate: referral.reward_paid_at,
      });
    }
  });

  rewards.forEach((reward) => {
    if (!reward.created_at) return;

    items.push({
      title: "Reward Ledger Updated",
      description: `${currency(asNumber(reward.amount))} ${getStatusLabel(
        reward.status,
      ).toLowerCase()} referral reward`,
      date: safeDateTimeLabel(reward.created_at),
      status: getStatusLabel(reward.status),
      tone: statusTone(reward.status),
      rawDate: reward.created_at,
    });
  });

  return items
    .sort((a, b) => {
      const aDate = new Date(a.rawDate).getTime();
      const bDate = new Date(b.rawDate).getTime();

      return bDate - aDate;
    })
    .slice(0, 5);
}

function Sparkline({ path, muted = false }: { path: string; muted?: boolean }) {
  return (
    <svg viewBox="0 0 116 36" className="mt-3 h-9 w-full">
      <path
        d={path}
        fill="none"
        stroke={muted ? "#cbd5e1" : "#10b981"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <circle cx="114" cy="12" r="3.5" fill={muted ? "#cbd5e1" : "#10b981"} />
    </svg>
  );
}

function MiniMetricCard({ stat, muted = false }: { stat: StatCard; muted?: boolean }) {
  const Icon = stat.icon;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black !text-slate-950">{stat.label}</p>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-4xl font-black tracking-tight !text-slate-950">
              {stat.value}
            </p>
            <div className="pb-1">
              <p className={muted ? "text-xs font-black !text-slate-500" : "text-xs font-black !text-emerald-600"}>
                {stat.change}
              </p>
              <p className="text-[11px] font-bold !text-slate-500">{stat.helper}</p>
            </div>
          </div>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <Sparkline path={stat.sparkline} muted={muted} />
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-emerald-700"
    >
      <Copy className="h-4 w-4" />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function FakeQrCode() {
  const cells = [
    1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0,
    1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1,
    1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1,
  ];

  return (
    <div className="grid h-24 w-24 grid-cols-8 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {cells.map((cell, index) => (
        <div
          key={index}
          className={cell ? "rounded-sm bg-slate-950" : "rounded-sm bg-white"}
        />
      ))}
    </div>
  );
}

function ShareIcon({ item }: { item: ShareButtonItem }) {
  if (item.visual === "brand") {
    return <span className={`text-3xl font-black ${item.tone}`}>{item.brand}</span>;
  }

  const Icon = item.icon || Link2;

  return <Icon className={`h-6 w-6 ${item.tone}`} />;
}

export default function GuruDashboardReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [pageNotice, setPageNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [guruName, setGuruName] = useState("Guru");
  const [referralCode, setReferralCode] = useState("GURU");
  const [referralUrl, setReferralUrl] = useState("https://sitguru.com/r/guru");
  const [campaignUrl, setCampaignUrl] = useState("https://sitguru.com/ref/guru-summer");

  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [programSettings, setProgramSettings] = useState<ProgramSettingsRow | null>(
    null,
  );
  const [clickCount, setClickCount] = useState(0);

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
          setErrorMessage("Please sign in as a Guru to view referral performance.");
          setLoading(false);
          return;
        }

        const siteOrigin =
          typeof window !== "undefined" ? window.location.origin : "https://sitguru.com";

        const { data: guruData } = await supabase
          .from("gurus")
          .select("id,user_id,display_name,full_name,name,email")
          .eq("user_id", user.id)
          .maybeSingle();

        const guru = (guruData || null) as GuruRow | null;

        const resolvedName =
          firstText(
            guru?.display_name,
            guru?.full_name,
            guru?.name,
            guru?.email,
            user.user_metadata?.display_name,
            user.user_metadata?.full_name,
            user.email,
          ) || "Guru";

        const generatedCode = makeReferralCode(resolvedName, user.id);
        const generatedReferralUrl = `${siteOrigin}/r/${generatedCode.toLowerCase()}`;
        const generatedCampaignUrl = `${siteOrigin}/ref/${generatedCode.toLowerCase()}-summer`;

        if (!mounted) return;

        setGuruName(resolvedName);
        setReferralCode(generatedCode);
        setReferralUrl(generatedReferralUrl);
        setCampaignUrl(generatedCampaignUrl);

        const campaignResponse = await supabase
          .from("guru_referral_campaigns")
          .select("*")
          .eq("guru_user_id", user.id)
          .order("created_at", { ascending: false });

        let campaignRows = ((campaignResponse.data || []) as CampaignRow[]) || [];

        if (!campaignResponse.error && campaignRows.length === 0) {
          const createdCampaign = await supabase
            .from("guru_referral_campaigns")
            .insert({
              guru_user_id: user.id,
              campaign_name: "Default Referral Link",
              referral_code: generatedCode,
              referral_url: generatedReferralUrl,
              source_channel: "default",
              is_active: true,
            })
            .select("*")
            .single();

          if (!createdCampaign.error && createdCampaign.data) {
            campaignRows = [createdCampaign.data as CampaignRow];
          }
        }

        const [
          referralsResponse,
          rewardsResponse,
          announcementsResponse,
          settingsResponse,
          clicksResponse,
        ] = await Promise.all([
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
            .from("guru_referral_announcements")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("guru_referral_program_settings")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("guru_referral_clicks")
            .select("id", { count: "exact", head: true })
            .eq("referrer_user_id", user.id),
        ]);

        if (!mounted) return;

        if (campaignResponse.error) {
          setPageNotice(
            `Referral campaign table is not ready yet: ${campaignResponse.error.message}`,
          );
        }

        if (referralsResponse.error) {
          setPageNotice(
            `Referral tracking table is not ready yet: ${referralsResponse.error.message}`,
          );
        }

        if (rewardsResponse.error) {
          setPageNotice(
            `Referral rewards table is not ready yet: ${rewardsResponse.error.message}`,
          );
        }

        if (announcementsResponse.error) {
          setPageNotice(
            `Referral announcements table is not ready yet: ${announcementsResponse.error.message}`,
          );
        }

        if (settingsResponse.error) {
          setPageNotice(
            `Referral settings table is not ready yet: ${settingsResponse.error.message}`,
          );
        }

        setCampaigns(campaignRows);
        setReferrals(((referralsResponse.data || []) as ReferralRow[]) || []);
        setRewards(((rewardsResponse.data || []) as RewardRow[]) || []);
        setAnnouncements(
          ((announcementsResponse.data || []) as AnnouncementRow[]).filter(
            (announcement) =>
              announcement.audience === "gurus" ||
              !announcement.audience ||
              announcement.guru_user_id === user.id,
          ),
        );
        setProgramSettings((settingsResponse.data as ProgramSettingsRow) || null);

        const campaignClicks = campaignRows.reduce(
          (sum, campaign) => sum + asNumber(campaign.clicks_count),
          0,
        );

        setClickCount(clicksResponse.count || campaignClicks || 0);

        if (
          !campaignResponse.error &&
          !referralsResponse.error &&
          !rewardsResponse.error &&
          !announcementsResponse.error &&
          !settingsResponse.error
        ) {
          setPageNotice("Referral dashboard connected to Supabase.");
        }
      } catch (error) {
        if (!mounted) return;

        setErrorMessage(
          error instanceof Error
            ? `Could not load referral dashboard: ${error.message}`
            : "Could not load referral dashboard. Please refresh and try again.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReferralDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const baseReward = asNumber(programSettings?.base_reward_amount) || 50;
  const requiredBookings =
    asNumber(programSettings?.required_completed_bookings) || 3;
  const payoutDelayDays = asNumber(programSettings?.payout_delay_days) || 15;
  const tier5Bonus = asNumber(programSettings?.tier_5_bonus) || 250;
  const tier10Bonus = asNumber(programSettings?.tier_10_bonus) || 750;
  const tier25Bonus = asNumber(programSettings?.tier_25_bonus) || 2000;

  const signupsCount = referrals.filter((referral) =>
    isSignupStatus(referral.status),
  ).length;

  const qualifiedCount = referrals.filter((referral) =>
    isQualifiedStatus(referral.status),
  ).length;

  const pendingRewardAmount =
    rewards
      .filter((reward) => isPendingRewardStatus(reward.status))
      .reduce((sum, reward) => sum + asNumber(reward.amount), 0) ||
    referrals
      .filter((referral) =>
        ["pending", "approved"].includes(
          asText(referral.payout_status).toLowerCase(),
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
      .filter((referral) => asText(referral.payout_status).toLowerCase() === "paid")
      .reduce(
        (sum, referral) =>
          sum + asNumber(referral.total_reward_amount || referral.reward_amount),
        0,
      );

  const lifetimeRewardAmount =
    rewards.reduce((sum, reward) => sum + asNumber(reward.amount), 0) ||
    referrals
      .filter((referral) => isQualifiedStatus(referral.status))
      .reduce(
        (sum, referral) =>
          sum + asNumber(referral.total_reward_amount || referral.reward_amount),
        0,
      );

  const completedBookingsCount = referrals.reduce(
    (sum, referral) => sum + asNumber(referral.bookings_completed_count),
    0,
  );

  const hasReferralData = referrals.length > 0;
  const hasTrafficData = clickCount > 0 || signupsCount > 0;
  const hasRewardData = pendingRewardAmount > 0 || paidRewardAmount > 0;

  const stats: StatCard[] = [
    {
      label: "Click-through Rate",
      value: percent(signupsCount, clickCount),
      change: `${clickCount} clicks`,
      helper: hasTrafficData ? "tracked clicks" : "waiting for traffic",
      icon: ExternalLink,
      sparkline: defaultSparkline,
    },
    {
      label: "Signups",
      value: String(signupsCount),
      change: `${referrals.length} total`,
      helper: hasReferralData ? "referral records" : "no referrals yet",
      icon: UserPlus,
      sparkline: signupSparkline,
    },
    {
      label: "Conversion Rate",
      value: percent(qualifiedCount, signupsCount),
      change: `${qualifiedCount} qualified`,
      helper: hasReferralData ? "signup to qualified" : "waiting for signups",
      icon: Sparkles,
      sparkline: conversionSparkline,
    },
    {
      label: "Qualified Gurus",
      value: String(qualifiedCount),
      change: `${completedBookingsCount} bookings`,
      helper: hasReferralData ? "completed by referrals" : "none yet",
      icon: ShieldCheck,
      sparkline: qualifiedSparkline,
    },
  ];

  const invitationsSent = referrals.length;
  const applicationsStarted = milestoneCount(referrals, "application_started");
  const applicationsApproved = milestoneCount(referrals, "application_approved");
  const backgroundComplete = milestoneCount(referrals, "background_check_complete");
  const firstBookingComplete = milestoneCount(referrals, "first_booking_completed");

  const conversionStages: ConversionStage[] = [
    {
      label: "Invitations Sent",
      count: invitationsSent,
      percent: percent(invitationsSent, invitationsSent),
      widthPercent: percentNumber(invitationsSent, invitationsSent),
      colorClass: "bg-emerald-500",
    },
    {
      label: "Applications Started",
      count: applicationsStarted,
      percent: percent(applicationsStarted, invitationsSent),
      widthPercent: percentNumber(applicationsStarted, invitationsSent),
      colorClass: "bg-emerald-400",
    },
    {
      label: "Applications Approved",
      count: applicationsApproved,
      percent: percent(applicationsApproved, invitationsSent),
      widthPercent: percentNumber(applicationsApproved, invitationsSent),
      colorClass: "bg-sky-400",
    },
    {
      label: "Background Check Complete",
      count: backgroundComplete,
      percent: percent(backgroundComplete, invitationsSent),
      widthPercent: percentNumber(backgroundComplete, invitationsSent),
      colorClass: "bg-indigo-400",
    },
    {
      label: "First Booking Completed",
      count: firstBookingComplete,
      percent: percent(firstBookingComplete, invitationsSent),
      widthPercent: percentNumber(firstBookingComplete, invitationsSent),
      colorClass: "bg-slate-500",
    },
  ];

  const pendingVerifications: PendingVerification[] = referrals
    .filter((referral) => {
      const status = asText(referral.status).toLowerCase();

      return [
        "application_approved",
        "background_check_complete",
        "first_booking_completed",
      ].includes(status);
    })
    .slice(0, 3)
    .map((referral) => {
      const name =
        firstText(referral.referred_name, referral.referred_email) || "Referred Guru";

      return {
        id: referral.id,
        name,
        status: getStatusLabel(referral.status),
        date: safeDateLabel(referral.updated_at || referral.created_at),
        initials: initialsFromName(name),
      };
    });

  const activityItems = buildActivityItems(referrals, rewards);

  const mainCampaign = campaigns[0];
  const activeReferralUrl = firstText(mainCampaign?.referral_url, referralUrl);
  const activeCampaignUrl = firstText(
    campaigns.find((campaign) =>
      campaign.campaign_name?.toLowerCase().includes("summer"),
    )?.referral_url,
    campaignUrl,
  );

  const nextTierTarget = qualifiedCount >= 10 ? 25 : qualifiedCount >= 5 ? 10 : 5;
  const nextTierBonus =
    nextTierTarget === 25
      ? tier25Bonus
      : nextTierTarget === 10
        ? tier10Bonus
        : tier5Bonus;

  const tierProgress = Math.min(
    100,
    Math.round((qualifiedCount / nextTierTarget) * 100),
  );

  const { referralChannels, channelTotalClicks } = useMemo(() => {
    const baseChannels = [
      { label: "Facebook", count: 0, dot: "bg-blue-500" },
      { label: "Email", count: 0, dot: "bg-sky-400" },
      { label: "WhatsApp", count: 0, dot: "bg-emerald-500" },
      { label: "Instagram", count: 0, dot: "bg-violet-400" },
      { label: "Other", count: 0, dot: "bg-slate-300" },
    ];

    campaigns.forEach((campaign) => {
      const source = asText(campaign.source_channel).toLowerCase();
      const clicks = asNumber(campaign.clicks_count);

      if (source.includes("facebook")) baseChannels[0].count += clicks;
      else if (source.includes("email")) baseChannels[1].count += clicks;
      else if (source.includes("whatsapp")) baseChannels[2].count += clicks;
      else if (source.includes("instagram")) baseChannels[3].count += clicks;
      else baseChannels[4].count += clicks;
    });

    const total = baseChannels.reduce((sum, item) => sum + item.count, 0);

    return {
      channelTotalClicks: total,
      referralChannels: baseChannels.map<ReferralChannel>((item) => ({
        label: item.label,
        value: total > 0 ? percent(item.count, total) : "0%",
        dot: item.dot,
      })),
    };
  }, [campaigns]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_40%,#ecfdf5_100%)] px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px]">
        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_70%_5%,rgba(16,185,129,0.10),transparent_32%),linear-gradient(120deg,#ffffff_0%,#f4fffb_55%,#eef9ff_100%)] px-6 py-8 md:px-10 lg:px-12">
            <div className="absolute right-10 top-10 hidden h-56 w-56 rounded-full bg-emerald-100/40 blur-3xl lg:block" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_0.82fr] lg:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.28em] !text-emerald-600">
                  Guru Referrals
                </p>

                <h1 className="mt-4 text-5xl font-black tracking-[-0.055em] !text-slate-950 md:text-6xl xl:text-7xl">
                  Referral Performance
                </h1>

                <p className="mt-3 max-w-3xl text-base font-semibold leading-7 !text-slate-700 md:text-lg">
                  Track your impact. Grow your network. Earn more.
                </p>

                <p className="mt-2 text-sm font-black !text-emerald-700">
                  Referral dashboard for {guruName}
                </p>

                <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-2xl bg-white/90 px-4 py-3 text-sm font-black !text-slate-800 ring-1 ring-slate-200">
                  <span className="!text-emerald-700">Referral Code:</span>
                  <span>{referralCode}</span>
                  <CopyButton value={activeReferralUrl} />
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-black !text-slate-950">
                      Unlock higher referral rewards
                    </p>
                    <p className="mt-1 text-sm font-semibold !text-slate-600">
                      Earn {currency(baseReward)} when a referred Guru completes
                      their first {requiredBookings} bookings.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <p className="text-sm font-black !text-emerald-700">
                        {qualifiedCount} / {nextTierTarget} Qualified Gurus
                      </p>
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${tierProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Link
                      href="#rewards"
                      className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      View Rewards Tiers
                    </Link>

                    <div className="relative hidden h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] bg-emerald-50 text-5xl ring-1 ring-emerald-100 sm:flex">
                      🎁
                      <span className="absolute -right-2 top-2 text-lg">✨</span>
                      <span className="absolute bottom-3 left-1 text-lg">✨</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section className="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              {stats.map((stat) => (
                <MiniMetricCard
                  key={stat.label}
                  stat={stat}
                  muted={!hasReferralData && !hasTrafficData}
                />
              ))}

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black !text-slate-950">
                      Reward Balance
                    </p>
                    <p className="mt-3 text-4xl font-black tracking-tight !text-slate-950">
                      {currency(pendingRewardAmount)}
                    </p>
                    <p className="mt-2 text-sm font-semibold !text-slate-600">
                      {hasRewardData ? "Available / pending approval" : "No rewards yet"}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black !text-slate-950">
                      Lifetime Earnings
                    </p>
                    <p className="mt-3 text-4xl font-black tracking-tight !text-slate-950">
                      {currency(lifetimeRewardAmount || paidRewardAmount)}
                    </p>
                    <p className="mt-2 text-sm font-semibold !text-slate-600">
                      All-time referral rewards
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                    <Trophy className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        {pageNotice ? (
          <div className="mt-5 rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-semibold !text-sky-900">
            {pageNotice}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold !text-rose-900">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-base font-black !text-slate-950">
              Loading referral dashboard...
            </p>
            <p className="mt-1 text-sm font-semibold !text-slate-600">
              Pulling Guru referral data from Supabase.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.9fr_0.58fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black !text-slate-950">
                      Referral Traffic Over Time
                    </h2>
                    <div className="mt-2 flex items-center gap-4 text-sm font-bold">
                      <span className="inline-flex items-center gap-2 !text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        Clicks
                      </span>
                      <span className="inline-flex items-center gap-2 !text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                        Signups
                      </span>
                    </div>
                  </div>

                  <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black !text-slate-700">
                    Last 30 Days
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="relative h-64 overflow-hidden rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="absolute inset-x-4 top-8 h-px bg-slate-200" />
                  <div className="absolute inset-x-4 top-20 h-px bg-slate-200" />
                  <div className="absolute inset-x-4 top-32 h-px bg-slate-200" />
                  <div className="absolute inset-x-4 top-44 h-px bg-slate-200" />

                  {hasTrafficData ? (
                    <svg viewBox="0 0 720 220" className="h-full w-full">
                      <path
                        d="M18 170 C80 100, 112 80, 164 74 C220 68, 230 130, 288 126 C362 120, 356 48, 430 56 C492 62, 482 110, 548 96 C630 78, 620 50, 702 28"
                        fill="none"
                        stroke="#10b981"
                        strokeLinecap="round"
                        strokeWidth="5"
                      />
                      <path
                        d="M18 195 C78 168, 120 144, 174 148 C246 154, 260 142, 320 142 C385 142, 388 96, 450 102 C518 108, 510 132, 580 120 C635 110, 650 88, 702 82"
                        fill="none"
                        stroke="#38bdf8"
                        strokeLinecap="round"
                        strokeWidth="5"
                      />
                    </svg>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-emerald-600 ring-1 ring-slate-200">
                        <Link2 className="h-7 w-7" />
                      </div>
                      <p className="mt-4 text-lg font-black !text-slate-950">
                        Waiting for referral traffic
                      </p>
                      <p className="mt-2 max-w-md text-sm font-semibold leading-6 !text-slate-600">
                        Share your referral link. Click and signup trends will
                        appear here once traffic is recorded.
                      </p>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-8 right-8 flex justify-between text-xs font-black !text-slate-500">
                    <span>May 1</span>
                    <span>May 8</span>
                    <span>May 15</span>
                    <span>May 22</span>
                    <span>May 29</span>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-black !text-slate-950">
                    Conversion Stages
                  </h2>
                  <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black !text-slate-700">
                    Last 30 Days
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {conversionStages.map((stage) => (
                    <div key={stage.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <p className="font-black !text-slate-800">
                          {stage.label}
                        </p>
                        <p className="font-black !text-slate-600">
                          {stage.count} · {stage.percent}
                        </p>
                      </div>
                      <div className="h-8 overflow-hidden rounded-xl bg-slate-100">
                        <div
                          className={`h-full rounded-xl transition-all ${stage.colorClass}`}
                          style={{ width: `${stage.widthPercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black !text-slate-950">
                  Top Performing Channel
                </h2>

                <div className="mt-6 flex items-center justify-center">
                  {channelTotalClicks > 0 ? (
                    <div className="relative h-44 w-44 rounded-full bg-[conic-gradient(#2563eb_0_37%,#38bdf8_37%_65%,#10b981_65%_85%,#a78bfa_85%_95%,#cbd5e1_95%_100%)]">
                      <div className="absolute inset-10 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                      <div className="absolute inset-10 rounded-full bg-white" />
                      <p className="relative z-10 text-center text-sm font-black !text-slate-500">
                        No channel
                        <br />
                        data yet
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2 text-sm font-bold">
                  {referralChannels.map((channel) => (
                    <div
                      key={channel.label}
                      className="flex items-center justify-between"
                    >
                      <span className="inline-flex items-center gap-2 !text-slate-700">
                        <span className={`h-2.5 w-2.5 rounded-full ${channel.dot}`} />
                        {channel.label}
                      </span>
                      <span className="!text-slate-950">{channel.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
                  <p className="text-sm font-black !text-slate-950">
                    Total Clicks
                  </p>
                  <div className="mt-1 flex items-end justify-between">
                    <p className="text-2xl font-black !text-slate-950">
                      {clickCount}
                    </p>
                    <p className="text-sm font-black !text-emerald-600">
                      {clickCount > 0 ? "Live" : "Waiting"}
                    </p>
                  </div>
                </div>
              </section>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-4">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-black !text-slate-950">
                    Referral Program Rules
                  </h2>
                </div>

                <div className="mt-5 space-y-4">
                  {[
                    "Share your unique link or invite code.",
                    "Referee must be a new Guru.",
                    `Referee must complete background check and ${requiredBookings} completed booking${requiredBookings === 1 ? "" : "s"}.`,
                    `Rewards are paid after a ${payoutDelayDays}-day settlement period.`,
                  ].map((item) => (
                    <div key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <p className="text-sm font-semibold leading-6 !text-slate-700">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/terms"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-black !text-emerald-700 hover:!text-emerald-800"
                >
                  View full program terms
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-black !text-slate-950">
                    Admin Messages
                  </h2>
                </div>

                <div className="mt-5 space-y-3">
                  {announcements.length > 0 ? (
                    announcements.slice(0, 2).map((announcement, index) => (
                      <div
                        key={announcement.id}
                        className={[
                          "rounded-2xl border p-4",
                          index === 0
                            ? "border-sky-100 bg-sky-50"
                            : "border-slate-200 bg-slate-50",
                        ].join(" ")}
                      >
                        <p className="text-sm font-black !text-slate-950">
                          {announcement.title}
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                          {announcement.body}
                        </p>
                        <p className="mt-2 text-xs font-black !text-slate-500">
                          {safeDateLabel(announcement.created_at)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-black !text-slate-950">
                        No active announcements
                      </p>
                      <p className="mt-1 text-sm font-semibold !text-slate-700">
                        SitGuru Admin announcements will appear here.
                      </p>
                    </div>
                  )}
                </div>

                <Link
                  href="/guru/dashboard/messages"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-black !text-emerald-700 hover:!text-emerald-800"
                >
                  View all announcements
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-lg font-black !text-slate-950">
                      Pending Verifications
                    </h2>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black !text-emerald-700">
                    {pendingVerifications.length}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {pendingVerifications.length > 0 ? (
                    pendingVerifications.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black !text-emerald-700">
                            {item.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black !text-slate-950">
                              {item.name}
                            </p>
                            <p className="truncate text-xs font-semibold !text-slate-600">
                              {item.status}
                            </p>
                            <p className="text-xs font-bold !text-slate-500">
                              {item.date}
                            </p>
                          </div>
                        </div>

                        <Link
                          href="/admin"
                          className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black !text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Review
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-black !text-slate-950">
                        No pending verifications
                      </p>
                      <p className="mt-1 text-sm font-semibold !text-slate-700">
                        Admin review items will appear here.
                      </p>
                    </div>
                  )}
                </div>

                <Link
                  href="/admin"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-black !text-emerald-700 hover:!text-emerald-800"
                >
                  View all pending
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Link2 className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-black !text-slate-950">
                    My Referral Links
                  </h2>
                </div>

                <div className="mt-5 space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] !text-slate-500">
                      Share via Email / Messaging
                    </p>
                    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <p className="flex-1 truncate px-4 py-3 text-sm font-bold !text-slate-700">
                        {activeReferralUrl}
                      </p>
                      <CopyButton value={activeReferralUrl} />
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] !text-slate-500">
                      Campaign Link
                    </p>
                    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <p className="flex-1 truncate px-4 py-3 text-sm font-bold !text-slate-700">
                        {activeCampaignUrl}
                      </p>
                      <CopyButton value={activeCampaignUrl} />
                    </div>
                  </div>
                </div>

                <Link
                  href="#share"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-black !text-emerald-700 hover:!text-emerald-800"
                >
                  Manage all links
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_0.95fr_0.72fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-black !text-slate-950">
                  Recent Referral Activity
                </h2>

                <div className="mt-5 space-y-4">
                  {activityItems.length > 0 ? (
                    activityItems.map((item, index) => (
                      <div key={`${item.title}-${item.rawDate}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={[
                              "flex h-9 w-9 items-center justify-center rounded-full ring-4",
                              item.tone === "green"
                                ? "bg-emerald-100 text-emerald-700 ring-emerald-50"
                                : item.tone === "blue"
                                  ? "bg-sky-100 text-sky-700 ring-sky-50"
                                  : item.tone === "rose"
                                    ? "bg-rose-100 text-rose-700 ring-rose-50"
                                    : "bg-amber-100 text-amber-700 ring-amber-50",
                            ].join(" ")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          {index !== activityItems.length - 1 ? (
                            <div className="mt-2 h-10 w-px bg-slate-200" />
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1 pb-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-black !text-slate-950">
                                {item.title}
                              </p>
                              <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                                {item.description}
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <p className="text-xs font-bold !text-slate-500">
                                {item.date}
                              </p>
                              <span
                                className={[
                                  "mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black",
                                  badgeClasses(item.tone),
                                ].join(" ")}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-black !text-slate-950">
                        No referral activity yet
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                        Share your link to start building your SitGuru referral
                        activity timeline.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section
                id="share"
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-black !text-slate-950">
                  Share Your Link Everywhere
                </h2>
                <p className="mt-1 text-sm font-semibold !text-slate-600">
                  More ways to grow your network.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {shareButtons.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      disabled={item.label !== "Copy Link"}
                      title={item.disabledLabel}
                      className={[
                        "group relative flex min-h-[92px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-black !text-slate-700 shadow-sm transition",
                        item.label === "Copy Link"
                          ? "hover:border-emerald-200 hover:bg-emerald-50"
                          : "cursor-not-allowed opacity-90",
                      ].join(" ")}
                      onClick={async () => {
                        if (item.label !== "Copy Link") return;

                        try {
                          await navigator.clipboard.writeText(activeReferralUrl);
                        } catch {
                          // Clipboard can fail in some local browser/security contexts.
                        }
                      }}
                    >
                      <ShareIcon item={item} />
                      <span>{item.label}</span>

                      {item.label !== "Copy Link" ? (
                        <span className="absolute right-2 top-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] !text-slate-500">
                          Soon
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-black !text-slate-950">
                      Your Referral Link
                    </p>

                    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <p className="flex-1 truncate px-4 py-3 text-sm font-bold !text-slate-700">
                        {activeReferralUrl}
                      </p>
                      <CopyButton value={activeReferralUrl} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <QrCode className="mb-2 h-5 w-5 text-emerald-600" />
                      <p className="text-sm font-black !text-slate-950">
                        QR Code
                      </p>
                      <p className="mt-1 text-sm font-semibold !text-slate-600">
                        Scan to sign up
                      </p>
                    </div>

                    <FakeQrCode />
                  </div>
                </div>
              </section>

              <section
                id="rewards"
                className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-100 blur-2xl" />
                <div className="relative">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-3xl ring-1 ring-amber-200">
                    🏆
                  </div>

                  <h2 className="text-2xl font-black tracking-tight !text-slate-950">
                    You’re making an impact!
                  </h2>

                  <p className="mt-3 text-sm font-semibold leading-7 !text-slate-700">
                    Keep sharing and grow the SitGuru community. Your next bonus
                    tier unlocks at {nextTierTarget} qualified Gurus for{" "}
                    {currency(nextTierBonus)}.
                  </p>

                  <div className="mt-5 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black !text-emerald-800">
                        {qualifiedCount} / {nextTierTarget} Qualified Gurus
                      </p>
                      <p className="text-sm font-black !text-emerald-800">
                        {tierProgress}%
                      </p>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${tierProgress}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href="#rewards"
                    className="mt-5 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    View Rewards Tiers
                  </Link>
                </div>
              </section>
            </section>

            <section className="mt-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                    <ShieldCheck className="h-7 w-7" />
                  </div>

                  <div>
                    <p className="text-lg font-black !text-emerald-900">
                      Secure. Transparent. Built for Trust.
                    </p>
                    <p className="mt-2 max-w-5xl text-sm font-semibold leading-7 !text-emerald-900">
                      All referrals are tracked in real time and validated
                      through Admin approval, fraud checks, background
                      completion, and qualified booking milestones before rewards
                      are paid.
                    </p>
                  </div>
                </div>

                <Link
                  href="/help"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-black !text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                >
                  Learn how it works
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
