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
  GraduationCap,
  FileText,
  KeyRound,
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

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
        .select("id, referral_type, status, booking_status")
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

  return (
    <main className="min-h-[100svh] bg-[#f8fbf6] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm sm:rounded-[34px]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="bg-[radial-gradient(circle_at_95%_10%,rgba(16,185,129,0.16),transparent_28%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_100%)] p-5 sm:p-7">
              <div className="flex min-w-0 items-start gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-green-100 text-xl font-black text-green-900 ring-1 ring-green-200 sm:h-20 sm:w-20">
                  {ambassadorAvatarUrl ? (
                    <Image
                      src={ambassadorAvatarUrl}
                      alt={`${fullName} profile photo`}
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    getInitials(fullName)
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-700 sm:text-xs">
                    SitGuru Ambassador Dashboard
                  </p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-green-950 sm:text-5xl">
                    Hi, {firstName}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                    Your command center for referral links, Ambassador
                    onboarding, training, rewards, and SitGuru support.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill>{asString(ambassadorRecord.status) || "active"}</Pill>
                    <Pill>
                      {asString(ambassadorRecord.referral_status) ||
                        "Referral Code Active"}
                    </Pill>
                    <Pill>{onboardingPacket.label}</Pill>
                  </div>

                  <div className="mt-4 rounded-3xl border border-green-200 bg-white/90 p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-700">
                      Ambassador Referral Code
                    </p>
                    <p className="mt-1 break-all text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                      {referralCode}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Share this code with every Pet Parent, future Guru, local
                      partner, or social media referral so SitGuru can track
                      activity back to you.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-green-100 bg-white p-5 sm:p-7 lg:border-l lg:border-t-0">
              <div className="grid gap-3">
                <DashboardSwitcherPanel
                  access={dashboardAccess}
                  current="ambassador"
                />

                <Link
                  href={onboardingPacket.href}
                  className="flex min-h-14 items-center justify-between rounded-2xl bg-green-800 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
                >
                  {onboardingCtaLabel}
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/ambassador/dashboard/messages?support=admin&role=ambassador"
                  className="flex min-h-14 items-center justify-between rounded-2xl border border-green-200 bg-white px-5 py-4 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  Message Center
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/ambassador/dashboard/social"
                  className="flex min-h-14 items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
                >
                  <span className="inline-flex items-center gap-2">
                    <Share2 size={17} />
                    Social Center
                  </span>
                  <ArrowRight size={17} />
                </Link>

                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100"
                  >
                    <LogOut size={17} />
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <AmbassadorProgressPanel
          onboardingPacket={onboardingPacket}
          trainingProgress={trainingProgress}
          referralCode={referralCode}
          stats={stats}
        />

        <section>
          <DashboardCard>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <SectionHeader
                icon={<Share2 size={22} />}
                title="Ambassador Social Center"
                detail="Open your official @SitGuruOfficial channels, use platform-specific tracked signup links and QR codes, and monitor canonical Facebook, Instagram, TikTok, X, and YouTube referral activity."
              />

              <Link
                href="/ambassador/dashboard/social"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Open Social Center
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {["Facebook", "Instagram", "TikTok", "X", "YouTube"].map(
                (platform) => (
                  <div
                    key={platform}
                    className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                      {platform}
                    </p>
                    <p className="mt-1 text-sm font-black text-green-950">
                      @SitGuruOfficial
                    </p>
                  </div>
                ),
              )}
            </div>

            <p className="mt-4 text-xs font-bold leading-5 text-slate-600">
              Social signup milestones remain separate from approved and paid
              rewards. SitGuru creates and reviews canonical reward records
              before social activity becomes confirmed earnings.
            </p>
          </DashboardCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)]">
          <DashboardCard>
            <SectionHeader
              icon={<MessageCircle size={22} />}
              title="Ambassador Message Center"
              detail="Use SitGuru messages instead of email when you need Admin help, referral tracking support, payout questions, event support, or quick follow-up."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href="/ambassador/dashboard/messages?role=ambassador"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                Open Message Center
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/ambassador/dashboard/messages?support=admin&role=ambassador"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Message SitGuru Admin
                <ArrowRight size={17} />
              </Link>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<ShieldCheck size={22} />}
              title="Connected Support"
              detail="Messages stay in SitGuru so Admin and Ambassadors can keep referral, reward, and outreach conversations in one place."
            />
          </DashboardCard>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            icon={<PawPrint size={20} />}
            label="Pet Parents"
            value={String(stats.petParentSignups)}
            detail="Referred signups"
          />
          <StatCard
            icon={<Users size={20} />}
            label="Gurus"
            value={String(stats.guruSignups)}
            detail="Referred applicants"
          />
          <StatCard
            icon={<ClipboardCheck size={20} />}
            label="Bookings"
            value={String(stats.completedBookings)}
            detail="Completed referrals"
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Pending"
            value={money(stats.pendingRewards)}
            detail="Awaiting approval"
          />
          <StatCard
            icon={<BadgeCheck size={20} />}
            label="Approved"
            value={money(stats.approvedRewards + stats.readyRewards)}
            detail="Approved / ready"
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Paid"
            value={money(stats.paidRewards)}
            detail="Already paid"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <DashboardCard>
            <SectionHeader
              icon={<DollarSign size={22} />}
              title="Payout Readiness"
              detail="Rewards can be tracked before payout setup is complete, but payment remains protected until every required payout item is ready."
            />

            <div className="mt-5 flex flex-col gap-4 rounded-[24px] border border-green-100 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                  Current Status
                </p>
                <p className="mt-1 text-2xl font-black text-green-950">
                  {payoutReadiness.statusLabel}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-600">
                  {payoutReadiness.completedCount}/{payoutReadiness.totalCount} payout requirements complete
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                  payoutReadiness.ready
                    ? "bg-green-800 text-white"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {payoutReadiness.ready ? "Ready" : "Setup Needed"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {payoutReadiness.items.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-4 ${
                    item.complete
                      ? "border-green-100 bg-green-50"
                      : "border-amber-100 bg-amber-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-green-950">
                      {item.label}
                    </p>
                    <span
                      className={`h-3 w-3 rounded-full ${
                        item.complete ? "bg-green-600" : "bg-amber-500"
                      }`}
                    />
                  </div>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<BadgeCheck size={22} />}
              title="Verified Referral Tracking"
              detail="This dashboard now reads the same Ambassador referral and reward records used by SitGuru Admin."
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                  Pet Parents
                </p>
                <p className="mt-1 text-3xl font-black text-green-950">
                  {stats.petParentSignups}
                </p>
              </div>
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                  Gurus
                </p>
                <p className="mt-1 text-3xl font-black text-green-950">
                  {stats.guruSignups}
                </p>
              </div>
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                  Businesses
                </p>
                <p className="mt-1 text-3xl font-black text-green-950">
                  {stats.businessSignups}
                </p>
              </div>
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                  Completed Bookings
                </p>
                <p className="mt-1 text-3xl font-black text-green-950">
                  {stats.completedBookings}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-green-100 bg-white p-4 text-sm font-bold leading-6 text-slate-600">
              Referral code <span className="font-black text-green-950">{referralCode}</span> is carried through signup source, program, platform, and UTM tracking on both referral links.
            </div>
          </DashboardCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
          <DashboardCard>
            <SectionHeader
              icon={<DollarSign size={22} />}
              title="Verified Reward Activity"
              detail="Ambassadors should always know how verified rewards may be earned and what SitGuru reviews before approval."
            />

            <div className="mt-5 grid gap-3">
              <RewardStructureRow
                label="Pending review"
                value={money(stats.pendingRewards)}
                detail="Tracked rewards waiting for SitGuru review."
              />
              <RewardStructureRow
                label="Approved"
                value={money(stats.approvedRewards)}
                detail="Approved rewards that have not moved to payout yet."
              />
              <RewardStructureRow
                label="Ready for payout"
                value={money(stats.readyRewards)}
                detail="Approved rewards currently queued for payout."
              />
              <RewardStructureRow
                label="Paid"
                value={money(stats.paidRewards)}
                detail="Rewards already recorded as paid."
              />
            </div>

            <div className="mt-5 rounded-[24px] border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-green-700">
                    Live verified activity
                  </p>
                  <h3 className="mt-1 text-xl font-black text-green-950">
                    Rewards shown here come from SitGuru records.
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Referral counts and reward totals are read from the same
                    Ambassador referral and reward records used by SitGuru
                    Admin. No projected or guaranteed earnings are included.
                  </p>
                </div>
                <span className="inline-flex shrink-0 rounded-full bg-green-800 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white">
                  Admin Verified
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ProjectionExampleCard
                  title="Tracked referrals"
                  value={String(
                    stats.petParentSignups +
                      stats.guruSignups +
                      stats.businessSignups
                  )}
                  detail="Pet Parent, Guru, and business referrals connected to this Ambassador record."
                />
                <ProjectionExampleCard
                  title="Completed bookings"
                  value={String(stats.completedBookings)}
                  detail="Referral-linked bookings recorded as completed."
                />
                <ProjectionExampleCard
                  title="Approved and ready"
                  value={money(stats.approvedRewards + stats.readyRewards)}
                  detail="Approved rewards, including amounts currently ready for payout."
                />
                <ProjectionExampleCard
                  title="Paid to date"
                  value={money(stats.paidRewards)}
                  detail="Rewards recorded as paid in SitGuru."
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs font-bold leading-5 text-green-950">
              Reward eligibility and amounts are controlled by SitGuru Admin
              records and the approved Ambassador program terms. Fake,
              duplicate, self-created, canceled, refunded, or unverifiable
              activity does not qualify.
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<Users size={22} />}
              title="SitGuru Pack Leader Program"
              detail="An invite-only leadership path for trusted Ambassadors who want to help grow SitGuru in their service area."
            />

            <div className="mt-5 grid gap-3">
              <ReminderItem>
                Pack Leaders mentor direct Ambassadors and help grow verified
                local activity.
              </ReminderItem>
              <ReminderItem>
                One level only: rewards are tied to direct Ambassadors, not a
                recruiting chain.
              </ReminderItem>
              <ReminderItem>
                Pack Leader rewards are based on verified SitGuru activity and
                SitGuru share.
              </ReminderItem>
              <ReminderItem>
                Founding Pack Leaders may support a city, school, military
                community, or service area.
              </ReminderItem>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-950">
              Pack Leader participation is reviewed and approved by SitGuru. No
              earnings are guaranteed.
            </div>
          </DashboardCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <DashboardCard>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                  <KeyRound size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Ambassador Code
                  </p>
                  <h2 className="mt-1 break-all text-4xl font-black text-green-950">
                    {referralCode}
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Use this code with every Pet Parent, future Guru, partner,
                    or local referral conversation so activity can be tracked.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <ReferralLinkCard
                icon={<PawPrint size={22} />}
                title="Pet Parent Referral Link"
                detail="Share this with Pet Parents who may need trusted pet care."
                url={petParentUrl}
              />
              <ReferralLinkCard
                icon={<Users size={22} />}
                title="Guru Referral Link"
                detail="Share this with people who may want to apply as a Guru."
                url={guruUrl}
              />
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<Sparkles size={22} />}
              title="Today’s Focus"
              detail="Simple next actions to keep the Ambassador workflow moving."
            />

            <div className="mt-4 grid gap-3">
              <Link
                href={onboardingPacket.href}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  onboardingPacket.status === "complete"
                    ? "bg-green-50 text-green-900 ring-1 ring-green-100"
                    : onboardingPacket.status === "pending"
                      ? "bg-amber-50 text-amber-900 ring-1 ring-amber-100"
                      : "bg-rose-50 text-rose-900 ring-1 ring-rose-100"
                }`}
              >
                {onboardingPacket.label}: {onboardingPacket.helper}
              </Link>

              <ReminderItem>
                Share your Pet Parent link with one local pet family.
              </ReminderItem>
              <ReminderItem>
                Share your Guru link with one potential sitter, walker, or pet
                professional.
              </ReminderItem>
              <Link
                href="/ambassador/dashboard/messages?support=admin&role=ambassador"
                className="flex items-start gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-950 transition hover:bg-green-100"
              >
                <MessageCircle size={17} className="mt-1 shrink-0 text-green-800" />
                <span>
                  Message SitGuru Admin if a referral is missing from tracking.
                </span>
              </Link>
            </div>
          </DashboardCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <DashboardCard>
            <SectionHeader
              icon={<BadgeCheck size={22} />}
              title="Referral Health"
              detail="Quick view of how your code is performing."
            />
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-950">
                {stats.petParentSignups +
                  stats.guruSignups +
                  stats.businessSignups} total referred signups
              </div>
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-950">
                {stats.completedBookings} completed referral bookings
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<DollarSign size={22} />}
              title="Reward Summary"
              detail="Referral rewards are reviewed and approved by SitGuru."
            />
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-950">
                Pending: {money(stats.pendingRewards)}
              </div>
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-950">
                Approved / ready:{" "}
                {money(stats.approvedRewards + stats.readyRewards)}
              </div>
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-950">
                Paid: {money(stats.paidRewards)}
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<ShieldCheck size={22} />}
              title="Program Rules"
              detail="Referral-first. Commission-based. Hourly only by exception."
            />
            <div className="mt-4 grid gap-3">
              <ReminderItem>
                Do not promise guaranteed bookings or earnings.
              </ReminderItem>
              <ReminderItem>
                Use approved SitGuru messaging when sharing.
              </ReminderItem>
              <ReminderItem>
                Hourly work must be separately approved in writing.
              </ReminderItem>
            </div>
          </DashboardCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <DashboardCard>
            <SectionHeader
              icon={<Sparkles size={22} />}
              title="Today"
              detail="Quick actions an Ambassador can do while walking, talking, or sharing from a phone."
            />
            <div className="mt-4 grid gap-3">
              <ReminderItem>
                Send your Pet Parent link to 3 local pet families.
              </ReminderItem>
              <ReminderItem>
                Send your Guru link to 1 potential sitter, walker, groomer,
                trainer, or pet professional.
              </ReminderItem>
              <ReminderItem>
                Invite 5 people to follow @SitGuruOfficial.
              </ReminderItem>
              <Link
                href="/ambassador/dashboard/messages?support=admin&role=ambassador"
                className="flex items-start gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-950 transition hover:bg-green-100"
              >
                <MessageCircle size={17} className="mt-1 shrink-0 text-green-800" />
                <span>
                  Message SitGuru Admin if a referral, flyer, or QR code support
                  item is needed.
                </span>
              </Link>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<ClipboardCheck size={22} />}
              title="This Week"
              detail="Weekly goals to keep local growth moving."
            />
            <div className="mt-4 grid gap-3">
              <ReminderItem>
                Post or share SitGuru in 2 approved local groups or community
                pages.
              </ReminderItem>
              <ReminderItem>
                Talk to 1 local pet business, rescue, groomer, trainer, or
                apartment community.
              </ReminderItem>
              <ReminderItem>
                Follow up with every person who asked for the link but has not
                signed up yet.
              </ReminderItem>
              <ReminderItem>
                Check your dashboard for verified signups, rewards, and next
                milestone.
              </ReminderItem>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<BadgeCheck size={22} />}
              title="This Month"
              detail="Monthly Ambassador focus for stronger growth and better rewards."
            />
            <div className="mt-4 grid gap-3">
              <ReminderItem>
                Work toward the next verified social signup milestone.
              </ReminderItem>
              <ReminderItem>
                Identify 3 new potential Gurus in your city or service area.
              </ReminderItem>
              <ReminderItem>
                Ask SitGuru for updated flyers, QR codes, or event support
                before local outreach.
              </ReminderItem>
              <ReminderItem>
                Review rewards and request help if anything looks missing.
              </ReminderItem>
            </div>
          </DashboardCard>
        </section>

        <section>
          <DashboardCard>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)] lg:items-start">
              <div>
                <SectionHeader
                  icon={<MessageCircle size={22} />}
                  title="Support Request Center"
                  detail="Use one simple request card when you need flyers, QR codes, missing-referral help, talking points, or social media support."
                />

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <SupportOption
                    icon={<FileText size={18} />}
                    title="Flyers"
                    detail="Updated local flyers or print-ready handouts."
                  />
                  <SupportOption
                    icon={<QrCode size={18} />}
                    title="QR Codes"
                    detail="Fresh QR codes for Pet Parent, Guru, or social outreach."
                  />
                  <SupportOption
                    icon={<MessageCircle size={18} />}
                    title="Missing Referral"
                    detail="A signup or booking is not showing on your dashboard."
                  />
                  <SupportOption
                    icon={<BookOpenCheck size={18} />}
                    title="Talking Points"
                    detail="Help with wording, local outreach, or social media posts."
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-green-100 bg-green-50 p-4 sm:p-5">
                <div className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm font-black leading-6 text-green-950 ring-1 ring-green-100">
                  Ambassador goal: encourage people to follow @SitGuruOfficial
                  and sign up using your referral link or code. Verified social
                  signups may count toward social growth bonuses after SitGuru
                  review.
                </div>

                <Link
                  href="/ambassador/dashboard/messages?support=admin&role=ambassador"
                  className="mb-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
                >
                  Open SitGuru Admin Chat
                  <ArrowRight size={17} />
                </Link>

                <form
                  action="mailto:support@sitguru.com"
                  method="post"
                  encType="text/plain"
                  className="grid gap-3"
                >
                  <input
                    type="hidden"
                    name="Ambassador referral code"
                    value={referralCode}
                  />

                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-green-900">
                      What do you need?
                    </span>
                    <select
                      name="Support request type"
                      defaultValue="flyers"
                      className="min-h-12 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-950 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
                    >
                      <option value="flyers">
                        Request flyers / print-ready handouts
                      </option>
                      <option value="qr-codes">Request QR codes</option>
                      <option value="missing-referral">
                        Referral or booking is missing
                      </option>
                      <option value="talking-points">
                        Need talking points or local outreach wording
                      </option>
                      <option value="social-media-support">
                        Need help growing @SitGuruOfficial
                      </option>
                      <option value="event-support">
                        Need event, table, or community outreach support
                      </option>
                      <option value="other-support">
                        Other Ambassador support request
                      </option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-green-900">
                      Optional note
                    </span>
                    <textarea
                      name="Support details"
                      rows={4}
                      placeholder="Example: I need a QR code for Pet Parent signups for a local event this weekend."
                      className="rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-green-950 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
                  >
                    Email SitGuru Support
                    <ArrowRight size={17} />
                  </button>

                  <p className="text-xs font-bold leading-5 text-green-900/75">
                    Use Admin Chat for the fastest support. The email form remains as
                    a backup if you need to send a longer offline request.
                  </p>
                </form>
              </div>
            </div>
          </DashboardCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <DashboardCard>
            <SectionHeader
              icon={<PawPrint size={22} />}
              title="PawPerks / PetPerks Talking Points"
              detail="Use these programs as an easy conversation starter with Pet Parents, local businesses, future Gurus, and community partners."
            />

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="text-sm font-black text-green-950">
                  PawPerks for Pet Parents
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Mention PawPerks when talking with Pet Parents who want
                  trusted care, rewards, local pet resources, and reasons to
                  keep using SitGuru.
                </p>
              </div>
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="text-sm font-black text-green-950">
                  PetPerks for partners
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Mention PetPerks when talking with groomers, trainers,
                  rescues, vets, apartments, and local pet-friendly businesses.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <ReminderItem>
                Use PawPerks/PetPerks as a softer way to start the SitGuru
                conversation.
              </ReminderItem>
              <ReminderItem>
                Tell people to sign up with your Ambassador code so activity can
                be verified.
              </ReminderItem>
              <ReminderItem>
                Ask SitGuru for updated flyers or QR codes before local
                outreach.
              </ReminderItem>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<PlayCircle size={22} />}
              title="Ambassador Promo Video"
              detail="A quick motivation video for Ambassadors before outreach, events, or social sharing."
            />

            {ambassadorPromoVideoUrl ? (
              <div className="mt-5 overflow-hidden rounded-[24px] border border-green-100 bg-black shadow-sm">
                {isDirectVideoFile(ambassadorPromoVideoUrl) ? (
                  <video
                    controls
                    preload="metadata"
                    playsInline
                    className="aspect-video w-full bg-black"
                  >
                    <source src={ambassadorPromoVideoUrl} type="video/mp4" />
                    Your browser does not support the SitGuru Ambassador promo
                    video.
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
            ) : (
              <div className="mt-5 rounded-[24px] border border-dashed border-green-200 bg-green-50 p-5 text-sm font-bold leading-6 text-green-950">
                Add a promo video at
                <span className="mx-1 rounded-lg bg-white px-2 py-1 font-black">
                  public/videos/sitguru-ambassador-promo.mp4
                </span>
                and this card will automatically show the video here.
              </div>
            )}
          </DashboardCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <DashboardCard>
            <SectionHeader
              icon={<GraduationCap size={22} />}
              title="Training"
              detail="Complete Ambassador training before moving into full active status."
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/ambassador/dashboard/training"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                View Training
                <ArrowRight size={17} />
              </Link>
              <span className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-900">
                {trainingProgress.label}
              </span>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<MessageCircle size={22} />}
              title="Message SitGuru Admin"
              detail="Open Ambassador quick chat for referrals, rewards, partners, events, missing tracking, or local outreach support."
            />
            <Link
              href="/ambassador/dashboard/messages?support=admin&role=ambassador"
              className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              Message SitGuru Admin
              <ArrowRight size={17} />
            </Link>
          </DashboardCard>
        </section>
      </div>
    </main>
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