import { supabase } from "@/lib/supabase";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";

export type CustomerProfile = {
  full_name: string | null;
  first_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export type ReferralStats = {
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

export async function fetchCustomerProfile(userId: string, email: string | null) {
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

export async function fetchReferralStats(
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
