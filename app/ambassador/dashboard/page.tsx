import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  ClipboardCheck,
  DollarSign,
  ExternalLink,
  GraduationCap,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PawPrint,
  PlayCircle,
  QrCode,
  ShieldCheck,
  Share2,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SocialPlatformKey =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x"
  | "youtube";

type SocialPlatformStats = Record<SocialPlatformKey, number>;

type AmbassadorRecord = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  login_username?: string | null;
  referral_code?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  dashboard_slug?: string | null;
  status?: string | null;
  referral_status?: string | null;
  onboarding_status?: string | null;
  training_status?: string | null;
  pet_parent_referral_url?: string | null;
  guru_referral_url?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  payout_status?: string | null;
  payout_method?: string | null;
  tax_info_status?: string | null;
  ready_for_payout_at?: string | null;
  terms_accepted_at?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
};

type ProfileRow = {
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
  role?: string | null;
  account_type?: string | null;
};

type DashboardAccess = {
  petParent: boolean;
  guru: boolean;
  ambassador: boolean;
};

type ReferralStats = {
  petParentSignups: number;
  guruSignups: number;
  businessSignups: number;
  completedBookings: number;
  socialSignups: number;
  socialPlatforms: SocialPlatformStats;
  pendingRewards: number;
  approvedRewards: number;
  readyRewards: number;
  paidRewards: number;
};

type TrainingProgressSummary = {
  label: string;
  percent: number;
  completedRequired: number;
  requiredCount: number;
  complete: boolean;
};

type PayoutReadinessSummary = {
  ready: boolean;
  statusLabel: string;
  completedCount: number;
  totalCount: number;
  items: {
    label: string;
    complete: boolean;
    detail: string;
  }[];
};

type AmbassadorOnboardingPacketDisplay = {
  label: string;
  status: "complete" | "pending" | "needs_action";
  href: string;
  helper: string;
  submittedAt: string | null;
  reviewedAt: string | null;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const parsed = Number(value);
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

function formatDate(value?: string | null) {
  if (!value) return "Not saved";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not saved";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function getAmbassadorOnboardingPacketDisplay(
  ambassadorId: string,
  userId?: string | null,
): Promise<AmbassadorOnboardingPacketDisplay> {
  const href = "/ambassador/dashboard/onboarding-packet";

  try {
    let query = supabaseAdmin
      .from("ambassador_onboarding_packets")
      .select("status, submitted_at, reviewed_at, admin_notes")
      .eq("ambassador_id", ambassadorId);

    if (!ambassadorId && userId) {
      query = supabaseAdmin
        .from("ambassador_onboarding_packets")
        .select("status, submitted_at, reviewed_at, admin_notes")
        .eq("user_id", userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.warn(
        "Unable to load Ambassador onboarding packet status:",
        error,
      );
      return {
        label: "Needs Action",
        status: "needs_action",
        href,
        helper:
          "Review referral, commission, conduct, and payout expectations before sharing SitGuru as an Ambassador.",
        submittedAt: null,
        reviewedAt: null,
      };
    }

    const status = asString(data?.status).toLowerCase();

    if (["approved", "complete", "completed"].includes(status)) {
      return {
        label: "Complete",
        status: "complete",
        href,
        helper:
          "Your Ambassador onboarding packet has been reviewed and marked complete.",
        submittedAt: asString(data?.submitted_at) || null,
        reviewedAt: asString(data?.reviewed_at) || null,
      };
    }

    if (["submitted", "pending_review", "in_review"].includes(status)) {
      return {
        label: "Submitted",
        status: "pending",
        href,
        helper:
          "Your Ambassador onboarding packet is submitted and waiting for SitGuru review.",
        submittedAt: asString(data?.submitted_at) || null,
        reviewedAt: asString(data?.reviewed_at) || null,
      };
    }

    if (["needs_fix", "needs_action"].includes(status)) {
      return {
        label: "Needs Fix",
        status: "needs_action",
        href,
        helper:
          asString(data?.admin_notes) ||
          "SitGuru needs one or more updates before Ambassador onboarding can be completed.",
        submittedAt: asString(data?.submitted_at) || null,
        reviewedAt: asString(data?.reviewed_at) || null,
      };
    }

    return {
      label: "Needs Action",
      status: "needs_action",
      href,
      helper:
        "Review referral, commission, conduct, and payout expectations before sharing SitGuru as an Ambassador.",
      submittedAt: asString(data?.submitted_at) || null,
      reviewedAt: asString(data?.reviewed_at) || null,
    };
  } catch (error) {
    console.warn("Unable to load Ambassador onboarding packet status:", error);
    return {
      label: "Needs Action",
      status: "needs_action",
      href,
      helper:
        "Review referral, commission, conduct, and payout expectations before sharing SitGuru as an Ambassador.",
      submittedAt: null,
      reviewedAt: null,
    };
  }
}

function getFirstName(name: string) {
  return name.split(" ").filter(Boolean)[0] || "Ambassador";
}

function normalizeAvatarUrl(value?: string | null) {
  if (!value) return "";

  const cleanValue = value.trim();

  if (!cleanValue) return "";

  return cleanValue;
}

function getAmbassadorAvatarUrl({
  ambassador,
  profile,
  metadataAvatarUrl,
  metadataPictureUrl,
}: {
  ambassador: AmbassadorRecord;
  profile: ProfileRow | null;
  metadataAvatarUrl?: string | null;
  metadataPictureUrl?: string | null;
}) {
  return (
    normalizeAvatarUrl(profile?.profile_photo_url) ||
    normalizeAvatarUrl(profile?.photo_url) ||
    normalizeAvatarUrl(profile?.image_url) ||
    normalizeAvatarUrl(profile?.avatar_url) ||
    normalizeAvatarUrl(ambassador.profile_photo_url) ||
    normalizeAvatarUrl(ambassador.photo_url) ||
    normalizeAvatarUrl(ambassador.image_url) ||
    normalizeAvatarUrl(ambassador.avatar_url) ||
    normalizeAvatarUrl(metadataAvatarUrl) ||
    normalizeAvatarUrl(metadataPictureUrl) ||
    ""
  );
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SG"
  );
}

function normalizeRoleValue(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function hasPetParentRole(value: unknown) {
  const role = normalizeRoleValue(value);

  return (
    role === "customer" ||
    role === "pet_parent" ||
    role === "pet-parent" ||
    role === "pet_owner" ||
    role === "pet-owner" ||
    role === "parent" ||
    role === "both"
  );
}

function hasGuruRole(value: unknown) {
  const role = normalizeRoleValue(value);

  return (
    role === "guru" ||
    role === "future_guru" ||
    role === "future-guru" ||
    role === "provider" ||
    role === "sitter" ||
    role === "walker" ||
    role === "caretaker" ||
    role === "both"
  );
}

function hasAmbassadorRole(value: unknown) {
  const role = normalizeRoleValue(value);

  return (
    role === "ambassador" ||
    role === "ambassadors" ||
    role === "rep" ||
    role === "representative" ||
    role === "sitguru_rep"
  );
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

const SOCIAL_PLATFORMS: Array<{
  key: SocialPlatformKey;
  label: string;
  handle: string;
  destination: string;
}> = [
  {
    key: "facebook",
    label: "Facebook",
    handle: "@SitGuruOfficial",
    destination: "https://www.facebook.com/SitGuruOfficial",
  },
  {
    key: "instagram",
    label: "Instagram",
    handle: "@SitGuruOfficial",
    destination: "https://www.instagram.com/SitGuruOfficial",
  },
  {
    key: "tiktok",
    label: "TikTok",
    handle: "@SitGuruOfficial",
    destination: "https://www.tiktok.com/@SitGuruOfficial",
  },
  {
    key: "x",
    label: "X",
    handle: "@SitGuruOfficial",
    destination: "https://x.com/SitGuruOfficial",
  },
  {
    key: "youtube",
    label: "YouTube",
    handle: "@SitGuruOfficial",
    destination: "https://www.youtube.com/@SitGuruOfficial",
  },
];

function getShortReferralPath({
  referralCode,
  type,
}: {
  referralCode: string;
  type: "pet-parent" | "guru";
}) {
  return `/r/${encodeURIComponent(referralCode)}/${type}`;
}

function getShortSocialPath({
  referralCode,
  platform,
}: {
  referralCode: string;
  platform: SocialPlatformKey;
}) {
  return `/r/social/${encodeURIComponent(referralCode)}/${platform}`;
}

function getCompactDisplayUrl(path: string) {
  return `sitguru.com${path}`;
}

function getQrImageUrl(path: string) {
  const destination = `${getSiteUrl()}${path}`;

  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(
    destination,
  )}`;
}

function getReferralSocialPlatform(row: AnyRow): SocialPlatformKey | null {
  const directPlatform = asString(row.platform).toLowerCase();
  const source = asString(row.source).toLowerCase();
  const medium = asString(row.medium).toLowerCase();
  const campaign = asString(row.campaign).toLowerCase();
  const combined = `${directPlatform} ${source} ${medium} ${campaign}`;

  if (combined.includes("facebook")) return "facebook";
  if (combined.includes("instagram")) return "instagram";
  if (combined.includes("tiktok")) return "tiktok";
  if (
    directPlatform === "x" ||
    combined.includes("twitter") ||
    combined.includes("x.com")
  ) {
    return "x";
  }
  if (combined.includes("youtube")) return "youtube";

  return null;
}

function normalizeUrl(value: string, fallbackPath: string) {
  const siteUrl = getSiteUrl();
  const cleanValue = value.trim();

  if (cleanValue.startsWith("http://") || cleanValue.startsWith("https://")) {
    return cleanValue;
  }

  if (cleanValue.startsWith("/")) return `${siteUrl}${cleanValue}`;

  return `${siteUrl}${fallbackPath}`;
}

function getEmbeddableVideoUrl(value?: string | null) {
  const cleanValue = asString(value);

  if (!cleanValue) return "";

  try {
    const url = new URL(cleanValue);

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.replace(/^\/+/, "");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.hostname.includes("vimeo.com")) {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
    }

    return cleanValue;
  } catch {
    return cleanValue;
  }
}

function isDirectVideoFile(value: string) {
  const cleanValue = value.toLowerCase().split("?")[0];

  return (
    cleanValue.endsWith(".mp4") ||
    cleanValue.endsWith(".webm") ||
    cleanValue.endsWith(".mov") ||
    cleanValue.startsWith("/videos/")
  );
}

function getReferralUrl({
  storedUrl,
  referralCode,
  type,
}: {
  storedUrl?: string | null;
  referralCode: string;
  type: "pet-parent" | "guru";
}) {
  const role = type === "pet-parent" ? "pet_parent" : "guru";
  const nextPath =
    type === "pet-parent" ? "/customer/dashboard" : "/guru/dashboard";

  const fallbackPath = `/signup?role=${role}`;

  const baseUrl = normalizeUrl(asString(storedUrl), fallbackPath);
  const url = new URL(baseUrl);

  url.searchParams.set("role", role);
  url.searchParams.set("ambassador_referral_code", referralCode);
  url.searchParams.set("ambassador_code", referralCode);
  url.searchParams.set("ref", referralCode);
  url.searchParams.set("source", "ambassador_dashboard");
  url.searchParams.set("program", "ambassador");
  url.searchParams.set("platform", "web");
  url.searchParams.set("utm_source", "sitguru_ambassador");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set(
    "utm_campaign",
    type === "pet-parent"
      ? "ambassador_pet_parent_referral"
      : "ambassador_guru_referral",
  );
  url.searchParams.set("next", nextPath);

  return url.toString();
}

async function signOutAction() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/ambassador/login");
}

async function safeReferralCount({
  table,
  referralCode,
  referralColumns,
  extraFilters = {},
}: {
  table: string;
  referralCode: string;
  referralColumns: string[];
  extraFilters?: Record<string, string>;
}) {
  const matchingIds = new Set<string>();

  for (const column of referralColumns) {
    try {
      let query = supabaseAdmin
        .from(table)
        .select("id")
        .eq(column, referralCode);

      Object.entries(extraFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.limit(1000);

      if (error || !Array.isArray(data)) continue;

      data.forEach((row: AnyRow) => {
        const id = asString(row.id);
        if (id) matchingIds.add(id);
      });
    } catch {
      // Older live tables may not have every referral column. Skip safely.
    }
  }

  return matchingIds.size;
}

async function getLegacyReferralStats(
  referralCode: string,
): Promise<ReferralStats> {
  const [petParentSignups, guruSignups, completedBookings] = await Promise.all([
    safeReferralCount({
      table: "profiles",
      referralCode,
      referralColumns: ["ambassador_referral_code"],
    }),
    safeReferralCount({
      table: "guru_applications",
      referralCode,
      referralColumns: ["ambassador_referral_code", "referral_code"],
    }),
    safeReferralCount({
      table: "bookings",
      referralCode,
      referralColumns: ["ambassador_referral_code", "referral_code"],
      extraFilters: { status: "completed" },
    }),
  ]);

  return {
    petParentSignups,
    guruSignups,
    businessSignups: 0,
    completedBookings,
    socialSignups: 0,
    socialPlatforms: {
      facebook: 0,
      instagram: 0,
      tiktok: 0,
      x: 0,
      youtube: 0,
    },
    pendingRewards: 0,
    approvedRewards: 0,
    readyRewards: 0,
    paidRewards: 0,
  };
}

async function getCanonicalReferralStats(
  ambassadorId: string,
): Promise<ReferralStats | null> {
  try {
    const [referralResult, rewardResult] = await Promise.all([
      supabaseAdmin
        .from("ambassador_referrals")
        .select("id, referral_type, status, booking_status, source, medium, campaign, platform")
        .eq("ambassador_id", ambassadorId)
        .limit(5000),
      supabaseAdmin
        .from("ambassador_rewards")
        .select("amount, status, financial_status")
        .eq("ambassador_id", ambassadorId)
        .limit(5000),
    ]);

    if (referralResult.error || rewardResult.error) {
      return null;
    }

    const referrals = (referralResult.data || []) as AnyRow[];
    const rewards = (rewardResult.data || []) as AnyRow[];
    const socialPlatforms: SocialPlatformStats = {
      facebook: 0,
      instagram: 0,
      tiktok: 0,
      x: 0,
      youtube: 0,
    };

    referrals.forEach((row) => {
      const platform = getReferralSocialPlatform(row);
      if (platform) socialPlatforms[platform] += 1;
    });

    const socialSignups = Object.values(socialPlatforms).reduce(
      (sum, count) => sum + count,
      0,
    );

    const rewardSum = (statuses: string[]) =>
      rewards
        .filter((row) => {
          const status = asString(row.status).toLowerCase();
          const financialStatus = asString(row.financial_status).toLowerCase();

          return statuses.includes(status) || statuses.includes(financialStatus);
        })
        .reduce((sum, row) => sum + asNumber(row.amount), 0);

    return {
      petParentSignups: referrals.filter(
        (row) => asString(row.referral_type).toLowerCase() === "pet_parent",
      ).length,
      guruSignups: referrals.filter(
        (row) => asString(row.referral_type).toLowerCase() === "guru",
      ).length,
      businessSignups: referrals.filter(
        (row) => asString(row.referral_type).toLowerCase() === "business",
      ).length,
      completedBookings: referrals.filter((row) =>
        ["booking_completed", "completed"].includes(
          asString(row.booking_status).toLowerCase(),
        ),
      ).length,
      socialSignups,
      socialPlatforms,
      pendingRewards: rewardSum(["pending", "pending_review"]),
      approvedRewards: rewardSum(["approved"]),
      readyRewards: rewardSum(["ready_for_payout"]),
      paidRewards: rewardSum(["paid"]),
    };
  } catch {
    return null;
  }
}

async function getReferralStats({
  ambassadorId,
  referralCode,
}: {
  ambassadorId: string;
  referralCode: string;
}): Promise<ReferralStats> {
  const canonical = await getCanonicalReferralStats(ambassadorId);

  if (canonical) {
    return canonical;
  }

  return getLegacyReferralStats(referralCode);
}

async function getTrainingProgressSummary({
  ambassadorId,
  fallbackStatus,
}: {
  ambassadorId: string;
  fallbackStatus: string;
}): Promise<TrainingProgressSummary> {
  try {
    const [stepsResult, progressResult] = await Promise.all([
      supabaseAdmin
        .from("ambassador_training_steps")
        .select("id, is_required, is_active")
        .eq("is_active", true),
      supabaseAdmin
        .from("ambassador_training_progress")
        .select("training_step_id, status, started_at, completed_at")
        .eq("ambassador_id", ambassadorId),
    ]);

    if (stepsResult.error || progressResult.error) {
      throw stepsResult.error || progressResult.error;
    }

    const requiredSteps = ((stepsResult.data || []) as AnyRow[]).filter(
      (step) => step.is_required !== false,
    );
    const progressRows = (progressResult.data || []) as AnyRow[];
    const progressByStep = new Map(
      progressRows.map((row) => [asString(row.training_step_id), row]),
    );

    const completedRequired = requiredSteps.filter((step) => {
      const progress = progressByStep.get(asString(step.id));
      const status = asString(progress?.status).toLowerCase();

      return Boolean(
        progress?.completed_at ||
          status === "complete" ||
          status === "completed" ||
          status === "approved",
      );
    }).length;

    const requiredCount = requiredSteps.length;
    const percent = requiredCount
      ? Math.round((completedRequired / requiredCount) * 100)
      : 0;
    const complete = requiredCount > 0 && completedRequired >= requiredCount;
    const hasStarted = progressRows.some(
      (row) => row.started_at || asString(row.status),
    );

    return {
      label: complete
        ? "Complete"
        : hasStarted
          ? `In Progress (${percent}%)`
          : fallbackStatus || "Not Started",
      percent,
      completedRequired,
      requiredCount,
      complete,
    };
  } catch {
    const normalized = fallbackStatus.toLowerCase();
    const complete =
      normalized.includes("complete") ||
      normalized.includes("approved") ||
      normalized.includes("done");

    return {
      label: fallbackStatus || "Not Started",
      percent: complete ? 100 : 0,
      completedRequired: complete ? 1 : 0,
      requiredCount: 1,
      complete,
    };
  }
}

function getPayoutReadiness(
  ambassador: AmbassadorRecord,
): PayoutReadinessSummary {
  const taxStatus = asString(ambassador.tax_info_status).toLowerCase();
  const payoutStatus = asString(ambassador.payout_status);
  const items = [
    {
      label: "Terms accepted",
      complete: Boolean(ambassador.terms_accepted_at),
      detail: ambassador.terms_accepted_at
        ? `Accepted ${formatDate(ambassador.terms_accepted_at)}`
        : "Complete the Ambassador terms before rewards can be paid.",
    },
    {
      label: "Stripe account",
      complete: Boolean(asString(ambassador.stripe_account_id)),
      detail: ambassador.stripe_account_id
        ? "Stripe Connect account is linked."
        : "Stripe Connect has not been linked yet.",
    },
    {
      label: "Stripe onboarding",
      complete: ambassador.stripe_onboarding_complete === true,
      detail:
        ambassador.stripe_onboarding_complete === true
          ? "Stripe onboarding is complete."
          : "Stripe onboarding still needs attention.",
    },
    {
      label: "Payouts enabled",
      complete: ambassador.stripe_payouts_enabled === true,
      detail:
        ambassador.stripe_payouts_enabled === true
          ? "Stripe payouts are enabled."
          : "Stripe payouts are not enabled yet.",
    },
    {
      label: "Tax information",
      complete: Boolean(taxStatus && taxStatus !== "not_started"),
      detail: taxStatus
        ? `Tax status: ${taxStatus.replace(/_/g, " ")}`
        : "Tax information has not been started.",
    },
    {
      label: "Payout method",
      complete: Boolean(asString(ambassador.payout_method)),
      detail: ambassador.payout_method
        ? `Method: ${ambassador.payout_method}`
        : "No payout method is saved.",
    },
  ];

  const completedCount = items.filter((item) => item.complete).length;
  const ready = items.every((item) => item.complete);

  return {
    ready,
    statusLabel:
      payoutStatus || (ready ? "Ready for payout" : "Setup incomplete"),
    completedCount,
    totalCount: items.length,
    items,
  };
}

export default async function AmbassadorDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/ambassador/login");
  }

  const userEmail = asString(user.email).toLowerCase();

  const { data: ambassadorByUserId, error: ambassadorByUserIdError } =
    await supabaseAdmin
      .from("ambassadors")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

  if (ambassadorByUserIdError) {
    console.error(
      "Ambassador workspace lookup by user ID failed:",
      ambassadorByUserIdError.message,
    );
  }

  let ambassador = ambassadorByUserId as AmbassadorRecord | null;

  if (!ambassador && userEmail) {
    const { data: ambassadorByEmail, error: ambassadorByEmailError } =
      await supabaseAdmin
        .from("ambassadors")
        .select("*")
        .or(
          `login_email.eq.${userEmail},contact_email.eq.${userEmail},email.eq.${userEmail}`,
        )
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (ambassadorByEmailError) {
      console.error(
        "Ambassador workspace lookup by email failed:",
        ambassadorByEmailError.message,
      );
    }

    ambassador = ambassadorByEmail as AmbassadorRecord | null;
  }

  const ambassadorStatus = asString(ambassador?.status).toLowerCase();
  const hasWorkspaceAccess =
    Boolean(ambassador?.id) &&
    ambassador?.dashboard_enabled === true &&
    ambassador?.login_enabled === true &&
    ambassadorStatus !== "archived";

  if (!ambassador || !hasWorkspaceAccess) {
    await supabase.auth.signOut();
    redirect("/ambassador/login?error=restricted");
  }

  const [profileResult, roleRowsResult, guruAccessResult] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select(
        "avatar_url,profile_photo_url,photo_url,image_url,role,account_type",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id),
    supabaseAdmin.from("gurus").select("id").eq("user_id", user.id).limit(1),
  ]);

  const ambassadorRecord = ambassador;
  const profile = (profileResult.data || null) as ProfileRow | null;
  const roleValues = new Set<string>();

  if (profile?.role) roleValues.add(profile.role);
  if (profile?.account_type) roleValues.add(profile.account_type);

  (roleRowsResult.data || []).forEach((row: AnyRow) => {
    const role = asString(row.role);
    if (role) roleValues.add(role);
  });

  const roleList = Array.from(roleValues);

  const dashboardAccess: DashboardAccess = {
    petParent: roleList.some(hasPetParentRole),
    guru: roleList.some(hasGuruRole) || Boolean(guruAccessResult.data?.length),
    ambassador:
      roleList.some(hasAmbassadorRole) || Boolean(ambassadorRecord.id),
  };
  const fullName = asString(ambassadorRecord.full_name) || "SitGuru Ambassador";
  const firstName = getFirstName(fullName);
  const referralCode = asString(ambassadorRecord.referral_code);
  const metadataAvatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;
  const metadataPictureUrl =
    typeof user.user_metadata?.picture === "string"
      ? user.user_metadata.picture
      : null;
  const ambassadorAvatarUrl = getAmbassadorAvatarUrl({
    ambassador: ambassadorRecord,
    profile,
    metadataAvatarUrl,
    metadataPictureUrl,
  });

  if (!referralCode) {
    redirect("/ambassador/login?error=not_found");
  }

  const petParentUrl = getReferralUrl({
    storedUrl: ambassadorRecord.pet_parent_referral_url,
    referralCode,
    type: "pet-parent",
  });
  const guruUrl = getReferralUrl({
    storedUrl: ambassadorRecord.guru_referral_url,
    referralCode,
    type: "guru",
  });
  const petParentShortPath = getShortReferralPath({
    referralCode,
    type: "pet-parent",
  });
  const guruShortPath = getShortReferralPath({
    referralCode,
    type: "guru",
  });
  const ambassadorPromoVideoUrl = getEmbeddableVideoUrl(
    process.env.NEXT_PUBLIC_AMBASSADOR_PROMO_VIDEO_URL ||
      process.env.NEXT_PUBLIC_AMBASSADOR_MOTIVATION_VIDEO_URL ||
      "/videos/sitguru-ambassador-promo.mp4",
  );
  const [stats, onboardingPacket, trainingProgress] = await Promise.all([
    getReferralStats({
      ambassadorId: ambassadorRecord.id,
      referralCode,
    }),
    getAmbassadorOnboardingPacketDisplay(
      ambassadorRecord.id,
      ambassadorRecord.user_id || user.id,
    ),
    getTrainingProgressSummary({
      ambassadorId: ambassadorRecord.id,
      fallbackStatus:
        asString(ambassadorRecord.training_status) || "Not Started",
    }),
  ]);
  const payoutReadiness = getPayoutReadiness(ambassadorRecord);

  const onboardingCtaLabel =
    onboardingPacket.status === "complete"
      ? "Review Onboarding"
      : onboardingPacket.status === "pending"
        ? "View Submitted Packet"
        : "Complete Onboarding";

  const verifiedReferralTotal =
    stats.petParentSignups +
    stats.guruSignups +
    stats.businessSignups;
  const approvedAndReady =
    stats.approvedRewards + stats.readyRewards;
  const socialMilestones = [
    {
      verified: 25,
      reward: 25,
      reached: stats.socialSignups >= 25,
    },
    {
      verified: 50,
      reward: 100,
      reached: stats.socialSignups >= 50,
    },
    {
      verified: 150,
      reward: 200,
      reached: stats.socialSignups >= 150,
    },
  ];
  const nextSocialMilestone =
    socialMilestones.find((milestone) => !milestone.reached) ||
    socialMilestones[socialMilestones.length - 1];

  return (
    <main className="min-h-[100svh] bg-[#f8fbf6] px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <section className="overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <div className="bg-[radial-gradient(circle_at_95%_10%,rgba(16,185,129,0.16),transparent_28%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] p-5 sm:p-6">
              <div className="flex min-w-0 items-start gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-green-100 text-xl font-black text-green-900 ring-1 ring-green-200">
                  {ambassadorAvatarUrl ? (
                    <Image
                      src={ambassadorAvatarUrl}
                      alt={`${fullName} profile photo`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    getInitials(fullName)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-700 sm:text-xs">
                    SitGuru Ambassador Command Center
                  </p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                    Hi, {firstName}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                    Event-ready referral, social, commission, training, payout,
                    and support tools in one compact dashboard.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill>{asString(ambassadorRecord.status) || "active"}</Pill>
                    <Pill>{onboardingPacket.label}</Pill>
                    <Pill>{trainingProgress.label}</Pill>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-green-200 bg-white/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-700">
                        Ambassador Code
                      </p>
                      <p className="mt-1 break-all text-3xl font-black tracking-tight text-green-950">
                        {referralCode}
                      </p>
                    </div>
                    <p className="max-w-xl text-xs font-bold leading-5 text-slate-600">
                      Use this code on every referral, social post, QR flyer,
                      vendor table, and local outreach conversation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-green-100 bg-white p-5 lg:border-l lg:border-t-0">
              <DashboardSwitcherPanel
                access={dashboardAccess}
                current="ambassador"
              />

              <div className="mt-3 grid grid-cols-2 gap-2">
                <QuickActionLink
                  href="/ambassador/dashboard/social"
                  icon={<Share2 size={17} />}
                  label="Social"
                />
                <QuickActionLink
                  href="/ambassador/dashboard/commissions"
                  icon={<WalletCards size={17} />}
                  label="Commissions"
                />
                <QuickActionLink
                  href="/ambassador/dashboard/referrals"
                  icon={<Users size={17} />}
                  label="Referrals"
                />
                <QuickActionLink
                  href="/ambassador/dashboard/payouts"
                  icon={<DollarSign size={17} />}
                  label="Payouts"
                />
                <QuickActionLink
                  href="/ambassador/dashboard/training"
                  icon={<GraduationCap size={17} />}
                  label="Training"
                />
                <QuickActionLink
                  href="/ambassador/dashboard/messages?support=admin&role=ambassador"
                  icon={<MessageCircle size={17} />}
                  label="Messages"
                />
              </div>

              <form action={signOutAction} className="mt-3">
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-800 transition hover:bg-slate-100"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard
            icon={<PawPrint size={19} />}
            label="Pet Parents"
            value={String(stats.petParentSignups)}
            detail="Verified signups"
          />
          <StatCard
            icon={<Users size={19} />}
            label="Gurus"
            value={String(stats.guruSignups)}
            detail="Verified applicants"
          />
          <StatCard
            icon={<Share2 size={19} />}
            label="Social"
            value={String(stats.socialSignups)}
            detail={`Next: ${nextSocialMilestone.verified}`}
          />
          <StatCard
            icon={<ClipboardCheck size={19} />}
            label="Bookings"
            value={String(stats.completedBookings)}
            detail="Completed referrals"
          />
          <StatCard
            icon={<BadgeCheck size={19} />}
            label="Approved"
            value={money(approvedAndReady)}
            detail="Approved / ready"
          />
          <StatCard
            icon={<DollarSign size={19} />}
            label="Paid"
            value={money(stats.paidRewards)}
            detail="Paid to date"
          />
        </section>

        <section className="rounded-[28px] border border-green-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeader
              icon={<LayoutDashboard size={22} />}
              title="Event Mode Toolkit"
              detail="Short referral links, scannable QR codes, official social channels, and live milestone progress for phones and tablets."
            />
            <div className="flex flex-wrap gap-2">
              <Link
                href="/ambassador/dashboard/social"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-black text-green-900 transition hover:bg-green-100"
              >
                Full Social Center
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/ambassador/dashboard/referrals"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-2 text-sm font-black text-white transition hover:bg-green-900"
              >
                Referral Center
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <CompactReferralCard
                icon={<PawPrint size={20} />}
                title="Pet Parent"
                detail="Trusted pet care signup"
                shortPath={petParentShortPath}
                fallbackUrl={petParentUrl}
              />
              <CompactReferralCard
                icon={<Users size={20} />}
                title="Guru"
                detail="Future Guru application"
                shortPath={guruShortPath}
                fallbackUrl={guruUrl}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {SOCIAL_PLATFORMS.map((platform) => {
                const shortPath = getShortSocialPath({
                  referralCode,
                  platform: platform.key,
                });

                return (
                  <SocialPlatformCard
                    key={platform.key}
                    platform={platform.key}
                    label={platform.label}
                    handle={platform.handle}
                    destination={platform.destination}
                    shortPath={shortPath}
                    verifiedCount={stats.socialPlatforms[platform.key]}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-green-100 bg-[#fbfcf9] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                  Verified Social Signup Milestones
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Updated milestone schedule: 25 verified signups earns $25,
                  50 earns $100, and 150 earns $200 after SitGuru review.
                </p>
              </div>
              <span className="rounded-full bg-green-800 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white">
                {stats.socialSignups} verified
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {socialMilestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.verified}
                  verified={milestone.verified}
                  reward={milestone.reward}
                  current={stats.socialSignups}
                  reached={milestone.reached}
                />
              ))}
            </div>

            <p className="mt-3 text-xs font-bold leading-5 text-slate-600">
              QR scans and channel visits are outreach activity. A reward becomes
              confirmed only after SitGuru verifies the qualifying signup and
              creates or approves the canonical reward record.
            </p>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <DashboardCard>
            <SectionHeader
              icon={<WalletCards size={22} />}
              title="Commissions & Rewards"
              detail="Personal pending, approved, ready-for-payout, and paid records."
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <CompactStatusItem label="Pending" value={money(stats.pendingRewards)} />
              <CompactStatusItem label="Approved" value={money(stats.approvedRewards)} />
              <CompactStatusItem label="Ready" value={money(stats.readyRewards)} />
              <CompactStatusItem label="Paid" value={money(stats.paidRewards)} />
            </div>
            <Link
              href="/ambassador/dashboard/commissions"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-2 text-sm font-black text-white transition hover:bg-green-900"
            >
              Open Commissions
              <ArrowRight size={16} />
            </Link>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<BadgeCheck size={22} />}
              title="Referral Tracking"
              detail="Canonical Pet Parent, Guru, business, booking, and social activity."
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <CompactStatusItem label="All referrals" value={String(verifiedReferralTotal)} />
              <CompactStatusItem label="Businesses" value={String(stats.businessSignups)} />
              <CompactStatusItem label="Bookings" value={String(stats.completedBookings)} />
              <CompactStatusItem label="Social" value={String(stats.socialSignups)} />
            </div>
            <Link
              href="/ambassador/dashboard/referrals"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-black text-green-900 transition hover:bg-green-100"
            >
              Open Referral Details
              <ArrowRight size={16} />
            </Link>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<DollarSign size={22} />}
              title="Payout Readiness"
              detail={`${payoutReadiness.completedCount}/${payoutReadiness.totalCount} requirements complete.`}
            />
            <div className="mt-4 grid gap-2">
              {payoutReadiness.items.slice(0, 4).map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black ${
                    item.complete
                      ? "bg-green-50 text-green-950"
                      : "bg-amber-50 text-amber-950"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`h-3 w-3 rounded-full ${
                      item.complete ? "bg-green-600" : "bg-amber-500"
                    }`}
                  />
                </div>
              ))}
            </div>
            <Link
              href="/ambassador/dashboard/payouts"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2 text-sm font-black text-green-900 transition hover:bg-green-50"
            >
              Review Payout Setup
              <ArrowRight size={16} />
            </Link>
          </DashboardCard>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SetupActionCard
            icon={<ClipboardCheck size={21} />}
            title="Onboarding"
            status={onboardingPacket.label}
            detail={onboardingPacket.helper}
            href={onboardingPacket.href}
          />
          <SetupActionCard
            icon={<GraduationCap size={21} />}
            title="Training"
            status={trainingProgress.label}
            detail={`${trainingProgress.completedRequired}/${trainingProgress.requiredCount} required steps complete.`}
            href="/ambassador/dashboard/training"
          />
          <SetupActionCard
            icon={<MessageCircle size={21} />}
            title="Admin Support"
            status="Connected"
            detail="Referral, payout, event, flyer, and QR support."
            href="/ambassador/dashboard/messages?support=admin&role=ambassador"
          />
          <SetupActionCard
            icon={<Share2 size={21} />}
            title="Social Center"
            status={`${stats.socialSignups} verified`}
            detail="Official channels, platform activity, QR codes, and milestones."
            href="/ambassador/dashboard/social"
          />
        </section>

        <details className="group rounded-[28px] border border-green-100 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-green-950">
                  More Ambassador Tools
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Progress, program rules, support options, talking points, and
                  the Ambassador promo video.
                </p>
              </div>
            </div>
            <ArrowRight
              size={20}
              className="text-green-800 transition group-open:rotate-90"
            />
          </summary>

          <div className="grid gap-4 border-t border-green-100 p-5 lg:grid-cols-2">
            <AmbassadorProgressPanel
              onboardingPacket={onboardingPacket}
              trainingProgress={trainingProgress}
              referralCode={referralCode}
              stats={stats}
            />

            <DashboardCard>
              <SectionHeader
                icon={<ShieldCheck size={22} />}
                title="Program Rules"
                detail="Clear expectations protect Ambassadors and the SitGuru community."
              />
              <div className="mt-4 grid gap-3">
                <ReminderItem>
                  Do not promise guaranteed bookings, rewards, or earnings.
                </ReminderItem>
                <ReminderItem>
                  Use approved SitGuru messaging and tracked links.
                </ReminderItem>
                <ReminderItem>
                  Fake, duplicate, canceled, refunded, self-created, or
                  unverifiable activity does not qualify.
                </ReminderItem>
              </div>
            </DashboardCard>

            <DashboardCard>
              <SectionHeader
                icon={<MessageCircle size={22} />}
                title="Support Request Center"
                detail="Use SitGuru messages for flyers, QR codes, event support, missing referrals, and talking points."
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SupportOption
                  icon={<FileText size={18} />}
                  title="Flyers"
                  detail="Print-ready event and outreach material."
                />
                <SupportOption
                  icon={<QrCode size={18} />}
                  title="QR Support"
                  detail="Referral and social QR troubleshooting."
                />
                <SupportOption
                  icon={<MessageCircle size={18} />}
                  title="Missing Referral"
                  detail="A signup, booking, or reward is missing."
                />
                <SupportOption
                  icon={<BookOpenCheck size={18} />}
                  title="Talking Points"
                  detail="Approved local and social outreach wording."
                />
              </div>
              <Link
                href="/ambassador/dashboard/messages?support=admin&role=ambassador"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-2 text-sm font-black text-white transition hover:bg-green-900"
              >
                Message SitGuru Admin
                <ArrowRight size={16} />
              </Link>
            </DashboardCard>

            <DashboardCard>
              <SectionHeader
                icon={<PlayCircle size={22} />}
                title="Ambassador Promo Video"
                detail="Quick motivation before an event, outreach visit, or social post."
              />
              {ambassadorPromoVideoUrl ? (
                <div className="mt-4 overflow-hidden rounded-[22px] border border-green-100 bg-black">
                  {isDirectVideoFile(ambassadorPromoVideoUrl) ? (
                    <video
                      controls
                      preload="metadata"
                      playsInline
                      className="aspect-video w-full bg-black"
                    >
                      <source
                        src={ambassadorPromoVideoUrl}
                        type="video/mp4"
                      />
                    </video>
                  ) : (
                    <iframe
                      src={ambassadorPromoVideoUrl}
                      title="SitGuru Ambassador Promo Video"
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : null}
            </DashboardCard>
          </div>
        </details>
      </div>
    </main>
  );
}

function QuickActionLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center justify-between gap-2 rounded-2xl border border-green-100 bg-green-50 px-3 py-3 text-xs font-black text-green-950 transition hover:border-green-200 hover:bg-green-100"
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ArrowRight size={14} />
    </Link>
  );
}

function CompactReferralCard({
  icon,
  title,
  detail,
  shortPath,
  fallbackUrl,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  shortPath: string;
  fallbackUrl: string;
}) {
  return (
    <div className="rounded-[24px] border border-green-100 bg-green-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-green-800 ring-1 ring-green-100">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-green-950">{title}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">{detail}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[92px_minmax(0,1fr)] items-center gap-3">
        <a
          href={shortPath}
          aria-label={`Open ${title} referral QR link`}
          className="rounded-2xl bg-white p-2 ring-1 ring-green-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getQrImageUrl(shortPath)}
            alt={`${title} referral QR code`}
            className="aspect-square w-full"
          />
        </a>

        <div className="min-w-0">
          <p className="break-words rounded-xl bg-white px-3 py-2 text-xs font-black leading-5 text-green-950 ring-1 ring-green-100">
            {getCompactDisplayUrl(shortPath)}
          </p>
          <div className="mt-2 grid gap-2">
            <Link
              href={shortPath}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-green-800 px-3 py-2 text-xs font-black text-white hover:bg-green-900"
            >
              Open Short Link
              <ExternalLink size={13} />
            </Link>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noreferrer"
              className="text-center text-[10px] font-black text-green-700 hover:text-green-900"
            >
              Open full tracked signup link
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialPlatformCard({
  platform,
  label,
  handle,
  destination,
  shortPath,
  verifiedCount,
}: {
  platform: SocialPlatformKey;
  label: string;
  handle: string;
  destination: string;
  shortPath: string;
  verifiedCount: number;
}) {
  return (
    <div className="rounded-[22px] border border-green-100 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <SocialBrandIcon platform={platform} />
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-green-950">{label}</p>
          <p className="truncate text-[10px] font-bold text-slate-500">
            {handle}
          </p>
        </div>
      </div>

      <a
        href={shortPath}
        aria-label={`Open tracked ${label} QR link`}
        className="mx-auto mt-3 block w-[104px] rounded-2xl bg-green-50 p-2 ring-1 ring-green-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getQrImageUrl(shortPath)}
          alt={`${label} SitGuru QR code`}
          className="aspect-square w-full"
        />
      </a>

      <p className="mt-2 text-center text-lg font-black text-green-950">
        {verifiedCount}
      </p>
      <p className="text-center text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
        verified
      </p>

      <div className="mt-2 grid gap-1">
        <Link
          href={shortPath}
          className="inline-flex min-h-8 items-center justify-center rounded-xl bg-green-800 px-2 py-1.5 text-[10px] font-black text-white hover:bg-green-900"
        >
          Tracked QR Link
        </Link>
        <a
          href={destination}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-8 items-center justify-center gap-1 rounded-xl border border-green-100 bg-green-50 px-2 py-1.5 text-[10px] font-black text-green-900 hover:bg-green-100"
        >
          Official Channel
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}

function SocialBrandIcon({
  platform,
}: {
  platform: SocialPlatformKey;
}) {
  const common =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-900 ring-1 ring-green-100";

  if (platform === "facebook") {
    return (
      <span className={common} aria-label="Facebook">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
      <span className={common} aria-label="Instagram">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
          <circle cx="17.5" cy="6.7" r="1.2" fill="currentColor" />
        </svg>
      </span>
    );
  }

  if (platform === "tiktok") {
    return (
      <span className={common} aria-label="TikTok">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
      <span className={common} aria-label="X">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 3h4.4l4.3 5.8L17.8 3H20l-6.3 7.3L20.5 21h-4.4l-4.7-6.4L5.8 21H3.5l6.9-8L4 3Zm3.2 1.7 9.8 14.6h1.3L8.5 4.7H7.2Z"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className={common} aria-label="YouTube">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.6 12 5.6 12 5.6s-5 0-6.9.5A3 3 0 0 0 3 8.2 31 31 0 0 0 2.6 12 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.9.5 6.9.5 6.9.5s5 0 6.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8ZM10.2 15.4V8.6l5.9 3.4-5.9 3.4Z"
        />
      </svg>
    </span>
  );
}

function MilestoneCard({
  verified,
  reward,
  current,
  reached,
}: {
  verified: number;
  reward: number;
  current: number;
  reached: boolean;
}) {
  const progress = Math.min(100, Math.round((current / verified) * 100));

  return (
    <div
      className={`rounded-2xl border p-4 ${
        reached
          ? "border-green-200 bg-green-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {verified} Verified
          </p>
          <p className="mt-1 text-2xl font-black text-green-950">
            ${reward}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${
            reached
              ? "bg-green-800 text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {reached ? "Reached" : `${progress}%`}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-green-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function CompactStatusItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-green-700">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-green-950">{value}</p>
    </div>
  );
}

function SetupActionCard({
  icon,
  title,
  status,
  detail,
  href,
}: {
  icon: ReactNode;
  title: string;
  status: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[24px] border border-green-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-800">
          {icon}
        </div>
        <ArrowRight
          size={17}
          className="text-green-700 transition group-hover:translate-x-0.5"
        />
      </div>
      <p className="mt-3 text-base font-black text-green-950">{title}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-green-700">
        {status}
      </p>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
        {detail}
      </p>
    </Link>
  );
}

function AmbassadorProgressPanel({
  onboardingPacket,
  trainingProgress,
  referralCode,
  stats,
}: {
  onboardingPacket: AmbassadorOnboardingPacketDisplay;
  trainingProgress: TrainingProgressSummary;
  referralCode: string;
  stats: ReferralStats;
}) {
  const hasReferralActivity =
    stats.petParentSignups +
      stats.guruSignups +
      stats.businessSignups +
      stats.completedBookings >
    0;

  const steps = [
    {
      label: "Referral Code",
      value: referralCode ? "Ready" : "Needed",
      complete: Boolean(referralCode),
      helper: "Share this with every referral.",
    },
    {
      label: "Onboarding",
      value: onboardingPacket.label,
      complete: onboardingPacket.status === "complete",
      pending: onboardingPacket.status === "pending",
      helper:
        onboardingPacket.status === "complete"
          ? "Reviewed by SitGuru."
          : onboardingPacket.helper,
    },
    {
      label: "Training",
      value: trainingProgress.label,
      complete: trainingProgress.complete,
      helper:
        trainingProgress.requiredCount > 0
          ? `${trainingProgress.completedRequired}/${trainingProgress.requiredCount} required training steps complete.`
          : "No required training steps are currently configured.",
    },
    {
      label: "Referral Activity",
      value: hasReferralActivity ? "Started" : "No activity yet",
      complete: hasReferralActivity,
      helper: "Activity appears after tracked signups or bookings.",
    },
  ];

  const completeCount = steps.filter((step) => step.complete).length;

  return (
    <section className="rounded-[28px] border border-green-100 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
            Where You Are
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-green-950">
            Ambassador Progress
          </h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Quick status view so Ambassadors know what is done, what is pending,
            and what to do next.
          </p>
        </div>

        <div className="rounded-2xl bg-green-50 px-4 py-3 text-center ring-1 ring-green-100">
          <p className="text-2xl font-black text-green-950">
            {completeCount}/{steps.length}
          </p>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
            areas ready
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.label}
            className={`rounded-2xl border p-4 ${
              step.complete
                ? "border-green-200 bg-green-50"
                : step.pending
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                {step.label}
              </p>
              <span
                className={`h-3 w-3 rounded-full ${
                  step.complete
                    ? "bg-green-600"
                    : step.pending
                      ? "bg-amber-500"
                      : "bg-slate-300"
                }`}
              />
            </div>
            <p className="mt-2 text-lg font-black text-slate-950">
              {step.value}
            </p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
              {step.helper}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardSwitcherPanel({
  access,
  current,
}: {
  access: DashboardAccess;
  current: "pet_parent" | "guru" | "ambassador";
}) {
  const dashboardLinks = [
    access.petParent
      ? {
          key: "pet_parent",
          label: "Pet Parent Dashboard",
          href: "/customer/dashboard/profile",
          helper: "Pets, bookings, PawPerks, and care details",
        }
      : null,
    access.guru
      ? {
          key: "guru",
          label: "Guru Dashboard",
          href: "/guru/dashboard",
          helper: "Services, bookings, messages, and earnings",
        }
      : null,
    access.ambassador
      ? {
          key: "ambassador",
          label: "Ambassador Dashboard",
          href: "/ambassador/dashboard",
          helper: "Referrals, training, rewards, and outreach",
        }
      : null,
  ].filter(Boolean) as {
    key: "pet_parent" | "guru" | "ambassador";
    label: string;
    href: string;
    helper: string;
  }[];

  if (dashboardLinks.length <= 1) return null;

  return (
    <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-green-800">
        Switch Dashboard
      </p>
      <div className="mt-3 grid gap-2">
        {dashboardLinks.map((dashboard) => {
          const isCurrent = dashboard.key === current;

          if (isCurrent) {
            return (
              <div
                key={dashboard.key}
                className="rounded-2xl border border-green-200 bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-green-950">
                    {dashboard.label}
                  </p>
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-green-800">
                    Current
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                  {dashboard.helper}
                </p>
              </div>
            );
          }

          return (
            <Link
              key={dashboard.key}
              href={dashboard.href}
              className="group rounded-2xl border border-green-100 bg-white px-4 py-3 transition hover:border-green-200 hover:bg-green-100/50"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-green-950">
                  {dashboard.label}
                </p>
                <ArrowRight
                  size={15}
                  className="text-green-800 transition group-hover:translate-x-0.5"
                />
              </div>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                {dashboard.helper}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[#dfe9e2] bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
      {children}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
      {children}
    </span>
  );
}

function ReferralLinkCard({
  icon,
  title,
  detail,
  url,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  url: string;
}) {
  return (
    <DashboardCard>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {detail}
          </p>
          <div className="mt-4 rounded-2xl border border-green-100 bg-[#fbfcf9] px-4 py-3">
            <p className="break-all text-sm font-black text-green-950">{url}</p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-[#dfe9e2] bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-green-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <div>
        <h2 className="text-2xl font-black text-green-950">{title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          {detail}
        </p>
      </div>
    </div>
  );
}

function SupportOption({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-900">
        {icon}
      </div>
      <h3 className="text-base font-black text-green-950">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function ProjectionExampleCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-black text-green-950">{title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-green-800">
        {value}
      </p>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function RewardStructureRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-[#fbfcf9] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-green-950">{label}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            {detail}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-green-800 px-3 py-2 text-sm font-black text-white">
          {value}
        </span>
      </div>
    </div>
  );
}

function ReminderItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-950">
      <Sparkles size={17} className="mt-1 shrink-0 text-green-800" />
      <span>{children}</span>
    </div>
  );
}