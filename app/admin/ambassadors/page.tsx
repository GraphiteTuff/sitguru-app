import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Activity,
  AlertTriangle,
  Archive,
  Award,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  HandCoins,
  Link2,
  MapPin,
  MessageCircle,
  PauseCircle,
  PawPrint,
  PlayCircle,
  RotateCcw,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AmbassadorSummaryRow = {
  ambassador_id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  program: string | null;
  internal_role: string | null;
  source: string | null;
  status: string | null;
  referral_code: string | null;
  referral_link: string | null;
  city: string | null;
  state: string | null;
  county: string | null;
  country: string | null;
  training_status: string | null;
  training_percent: number | null;
  created_at: string | null;
  pet_parent_signups: number | null;
  guru_signups: number | null;
  business_signups: number | null;
  completed_bookings: number | null;
  pending_rewards: number | null;
  approved_rewards: number | null;
  ready_for_payout_rewards: number | null;
  paid_rewards: number | null;
  total_earned: number | null;
  total_paid: number | null;
  ambassador_photo_url?: string | null;
  ambassador_photo_path?: string | null;
  photo_approved?: boolean | null;
  photo_uploaded_at?: string | null;
  archived_at?: string | null;
  archived_reason?: string | null;
  ambassador_type?: string | null;
  display_name?: string | null;
  tier?: string | null;
  guru_referral_url?: string | null;
  workspace_exists?: boolean;
  signup_intent?: string | null;
  profile_role?: string | null;
  account_type?: string | null;
  assigned_roles?: string[];
  profile_zip_code?: string | null;
  service_area?: string | null;
  email_verified?: boolean | null;
  phone_verified?: boolean | null;
  needs_attention?: boolean;
  attention_items?: string[];
  auth_created_at?: string | null;
  profile_updated_at?: string | null;
  onboarding_step?: number | null;
  onboarding_percent?: number | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  payout_status?: string | null;
  referral_clicks?: number | null;
  qualified_referrals?: number | null;
  community_leads?: number | null;
  lead_new?: number | null;
  lead_contacted?: number | null;
  lead_interested?: number | null;
  lead_applied?: number | null;
  lead_active?: number | null;
  ambassador_points?: number | null;
  ambassador_rank?: string | null;
  last_activity_at?: string | null;
  social_signups?: number | null;
  facebook_signups?: number | null;
  instagram_signups?: number | null;
  tiktok_signups?: number | null;
  x_signups?: number | null;
  youtube_signups?: number | null;
  onboarding_packet_status?: string | null;
  onboarding_packet_submitted_at?: string | null;
  onboarding_packet_reviewed_at?: string | null;
  stripe_account_id?: string | null;
  stripe_connect_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  charges_enabled?: boolean | null;
  payout_ready?: boolean | null;
  payout_blockers?: string[];
};

type AmbassadorDetailRow = {
  id: string;
  display_name: string | null;
  ambassador_type: string | null;
  tier: string | null;
  status: string | null;
  referral_code: string | null;
  guru_referral_url: string | null;
  ambassador_photo_url: string | null;
  ambassador_photo_path: string | null;
  photo_approved: boolean | null;
  photo_uploaded_at: string | null;
  archived_at: string | null;
  archived_reason: string | null;
  onboarding_step?: number | null;
  onboarding_percent?: number | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  payout_status?: string | null;
  stripe_account_id?: string | null;
  stripe_connect_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  charges_enabled?: boolean | null;
};

type AmbassadorRegistryFilters = {
  q: string;
  status: string;
  type: string;
  training: string;
  photo: string;
  rewards: string;
  attention: string;
};

type GenericRow = Record<string, unknown>;

type AuthUserSnapshot = {
  id: string;
  email?: string | null;
  phone?: string | null;
  created_at?: string | null;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: GenericRow | null;
  app_metadata?: GenericRow | null;
};

type OperationalMetrics = {
  referralClicks: number;
  qualifiedReferrals: number;
  petParentSignups: number;
  guruSignups: number;
  businessSignups: number;
  communityLeads: number;
  completedBookings: number;
  leadNew: number;
  leadContacted: number;
  leadInterested: number;
  leadApplied: number;
  leadActive: number;
  pendingRewards: number;
  approvedRewards: number;
  readyRewards: number;
  paidRewards: number;
  totalEarned: number;
  socialSignups: number;
  facebookSignups: number;
  instagramSignups: number;
  tiktokSignups: number;
  xSignups: number;
  youtubeSignups: number;
  lastActivityAt: string | null;
};

const SUPER_USER_EMAILS = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

const ambassadorQuickActions = [
  {
    label: "Onboarding Sent",
    value: "onboarding_sent",
    icon: <Send className="h-3.5 w-3.5" />,
    className:
      "bg-blue-50 text-blue-800 ring-blue-100 hover:bg-blue-100 hover:text-blue-900",
  },
  {
    label: "Active",
    value: "active",
    icon: <PlayCircle className="h-3.5 w-3.5" />,
    className:
      "bg-emerald-50 text-emerald-800 ring-emerald-100 hover:bg-emerald-100 hover:text-emerald-900",
  },
  {
    label: "Pause",
    value: "paused",
    icon: <PauseCircle className="h-3.5 w-3.5" />,
    className:
      "bg-amber-50 text-amber-800 ring-amber-100 hover:bg-amber-100 hover:text-amber-900",
  },
  {
    label: "Archive",
    value: "archived",
    icon: <Archive className="h-3.5 w-3.5" />,
    className:
      "bg-red-50 text-red-700 ring-red-100 hover:bg-red-100 hover:text-red-800",
  },
];

function isSuperUserEmail(email?: string | null) {
  return SUPER_USER_EMAILS.has((email || "").toLowerCase());
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): GenericRow {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as GenericRow)
    : {};
}

function firstString(record: GenericRow | null | undefined, keys: string[]) {
  if (!record) return "";

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function firstNumber(record: GenericRow | null | undefined, keys: string[]) {
  if (!record) return 0;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number.parseFloat(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function firstBoolean(
  record: GenericRow | null | undefined,
  keys: string[],
): boolean | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") return value;
    if (value === 1 || value === "1" || value === "true") return true;
    if (value === 0 || value === "0" || value === "false") return false;
  }

  return null;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => asString(value)).filter(Boolean)),
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function isWithinDays(value: string | null | undefined, days: number) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const elapsed = Date.now() - date.getTime();
  return elapsed >= 0 && elapsed <= days * 24 * 60 * 60 * 1000;
}

function isMissingAmbassadorWorkspace(ambassador: AmbassadorSummaryRow) {
  return (
    ambassador.workspace_exists === false ||
    ambassador.ambassador_id.startsWith("pending:")
  );
}

function getAccountLifecycleHref(ambassador: AmbassadorSummaryRow) {
  const query = ambassador.user_id || ambassador.email || ambassador.ambassador_id;
  return `/admin/account-lifecycle?query=${encodeURIComponent(query)}`;
}

function getPrimaryAdminHref(ambassador: AmbassadorSummaryRow) {
  if (isMissingAmbassadorWorkspace(ambassador)) {
    return getAccountLifecycleHref(ambassador);
  }

  return `/admin/ambassadors/${ambassador.ambassador_id}`;
}

function getPrimaryAdminLabel(ambassador: AmbassadorSummaryRow) {
  return isMissingAmbassadorWorkspace(ambassador)
    ? "Review Lifecycle"
    : "View Dashboard";
}

function hasNeedsAttention(ambassador: AmbassadorSummaryRow) {
  return Boolean(
    ambassador.needs_attention || ambassador.attention_items?.length,
  );
}

function getRankFromPoints(points: number) {
  if (points >= 100) return "City Captain";
  if (points >= 50) return "Gold";
  if (points >= 20) return "Silver";
  return "Bronze";
}

function normalizeLeadStage(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (["active", "approved", "converted", "complete", "completed"].includes(normalized)) {
    return "active";
  }

  if (["applied", "application_submitted", "submitted"].includes(normalized)) {
    return "applied";
  }

  if (["interested", "qualified", "warm", "considering"].includes(normalized)) {
    return "interested";
  }

  if (["contacted", "follow_up", "followed_up", "replied"].includes(normalized)) {
    return "contacted";
  }

  return "new";
}

function dedupeRowsById(rows: GenericRow[]) {
  const seen = new Set<string>();

  return rows.filter((row, index) => {
    const id =
      firstString(row, ["id"]) ||
      `${firstString(row, ["ambassador_id"])}:${index}`;

    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function normalizeReferralType(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (
    ["pet_parent", "customer", "pet_owner", "owner"].includes(normalized)
  ) {
    return "pet_parent";
  }

  if (
    ["guru", "provider", "sitter", "walker", "caregiver"].includes(normalized)
  ) {
    return "guru";
  }

  if (
    ["business", "partner", "community", "organization"].includes(normalized)
  ) {
    return "business";
  }

  return normalized;
}

function normalizePlatform(value: string) {
  const normalized = value.trim().toLowerCase();

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

function getCanonicalRewardBucket(row: GenericRow) {
  const status = firstString(row, ["status"]).toLowerCase();
  const payoutStatus = firstString(row, ["payout_status", "financial_status"]).toLowerCase();

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

  if (excluded.has(status) || excluded.has(payoutStatus)) {
    return "excluded";
  }

  const paid = new Set(["paid", "payout_paid", "payout_completed", "settled"]);

  if (
    Boolean(firstString(row, ["paid_at"])) ||
    paid.has(status) ||
    paid.has(payoutStatus)
  ) {
    return "paid";
  }

  const ready = new Set([
    "ready_for_payout",
    "queued_for_payout",
    "queued",
  ]);

  if (ready.has(status) || ready.has(payoutStatus)) {
    return "ready";
  }

  const approved = new Set(["approved", "approved_unpaid", "payable"]);

  if (approved.has(status) || approved.has(payoutStatus)) {
    return "approved";
  }

  return "pending";
}

function getCanonicalSocialPlatform(row: GenericRow) {
  const platform = normalizePlatform(
    firstString(row, ["platform", "utm_source"]),
  );

  if (
    ["facebook", "instagram", "tiktok", "x", "youtube"].includes(platform)
  ) {
    return platform;
  }

  const source = normalizePlatform(
    firstString(row, ["source", "referral_source", "utm_source"]),
  );

  if (
    ["facebook", "instagram", "tiktok", "x", "youtube"].includes(source)
  ) {
    return source;
  }

  return "";
}

function isCanonicalSocialReferral(row: GenericRow) {
  if (getCanonicalSocialPlatform(row)) return true;

  const source = firstString(row, [
    "source",
    "referral_source",
    "utm_source",
  ]).toLowerCase();
  const medium = firstString(row, [
    "medium",
    "referral_medium",
    "utm_medium",
  ]).toLowerCase();

  return source.includes("social") || medium.includes("social");
}

function buildOperationalMetrics({
  ambassadorId,
  leadRows,
  referralRows,
  rewardRows,
  activityRows,
}: {
  ambassadorId?: string | null;
  userId?: string | null;
  referralRows: GenericRow[];
  leadRows: GenericRow[];
  rewardRows: GenericRow[];
  activityRows: GenericRow[];
}): OperationalMetrics {
  if (!ambassadorId) {
    return {
      referralClicks: 0,
      qualifiedReferrals: 0,
      petParentSignups: 0,
      guruSignups: 0,
      businessSignups: 0,
      communityLeads: 0,
      completedBookings: 0,
      leadNew: 0,
      leadContacted: 0,
      leadInterested: 0,
      leadApplied: 0,
      leadActive: 0,
      pendingRewards: 0,
      approvedRewards: 0,
      readyRewards: 0,
      paidRewards: 0,
      totalEarned: 0,
      socialSignups: 0,
      facebookSignups: 0,
      instagramSignups: 0,
      tiktokSignups: 0,
      xSignups: 0,
      youtubeSignups: 0,
      lastActivityAt: null,
    };
  }

  const referrals = dedupeRowsById(
    referralRows.filter(
      (row) => firstString(row, ["ambassador_id"]) === ambassadorId,
    ),
  );
  const leads = dedupeRowsById(
    leadRows.filter(
      (row) => firstString(row, ["ambassador_id"]) === ambassadorId,
    ),
  );
  const rewards = dedupeRowsById(
    rewardRows.filter(
      (row) => firstString(row, ["ambassador_id"]) === ambassadorId,
    ),
  );
  const activities = dedupeRowsById(
    activityRows.filter(
      (row) => firstString(row, ["ambassador_id"]) === ambassadorId,
    ),
  );

  const referralClicks = referrals.reduce((sum, row) => {
    const eventType = firstString(row, ["event_type", "type"]).toLowerCase();
    const savedCount = firstNumber(row, [
      "clicks",
      "link_clicks",
      "click_count",
    ]);

    return sum + Math.max(0, savedCount || (eventType.includes("click") ? 1 : 0));
  }, 0);

  const qualifiedReferrals = referrals.filter((row) => {
    const status = firstString(row, [
      "status",
      "referral_status",
      "qualification_status",
    ]).toLowerCase();
    const qualified = firstBoolean(row, [
      "qualified",
      "is_qualified",
      "approved",
    ]);

    return (
      qualified === true ||
      ["qualified", "approved", "converted", "active"].includes(status)
    );
  }).length;

  const countReferralType = (type: "pet_parent" | "guru" | "business") =>
    referrals.filter(
      (row) =>
        normalizeReferralType(
          firstString(row, ["referral_type", "type", "category"]),
        ) === type,
    ).length;

  const completedBookings = referrals.filter((row) => {
    const bookingStatus = firstString(row, ["booking_status"]).toLowerCase();
    const status = firstString(row, ["status"]).toLowerCase();

    return (
      Boolean(firstString(row, ["completed_booking_at"])) ||
      ["booking_completed", "completed"].includes(bookingStatus) ||
      status === "booking_completed"
    );
  }).length;

  const leadCounts = {
    new: 0,
    contacted: 0,
    interested: 0,
    applied: 0,
    active: 0,
  };

  leads.forEach((row) => {
    const stage = normalizeLeadStage(
      firstString(row, ["stage", "status", "lead_status", "pipeline_stage"]),
    );
    leadCounts[stage] += 1;
  });

  const communityLeads = leads.filter((row) => {
    const type = firstString(row, [
      "lead_type",
      "type",
      "category",
    ]).toLowerCase();

    return (
      type.includes("community") ||
      type.includes("neighborhood") ||
      type.includes("campus")
    );
  }).length;

  const rewardTotals = {
    pending: 0,
    approved: 0,
    ready: 0,
    paid: 0,
  };

  rewards.forEach((row) => {
    const bucket = getCanonicalRewardBucket(row);
    const amount = Math.max(
      0,
      firstNumber(row, ["amount", "reward_amount", "payout_amount"]),
    );

    if (bucket === "pending") rewardTotals.pending += amount;
    if (bucket === "approved") rewardTotals.approved += amount;
    if (bucket === "ready") rewardTotals.ready += amount;
    if (bucket === "paid") rewardTotals.paid += amount;
  });

  const socialReferrals = referrals.filter(isCanonicalSocialReferral);
  const platformCount = (platform: string) =>
    socialReferrals.filter(
      (row) => getCanonicalSocialPlatform(row) === platform,
    ).length;

  const lastActivityAt =
    [
      ...activities,
      ...referrals,
      ...rewards,
      ...leads,
    ]
      .map((row) =>
        firstString(row, [
          "created_at",
          "updated_at",
          "paid_at",
          "approved_at",
          "qualified_at",
        ]),
      )
      .filter(Boolean)
      .sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
      )[0] || null;

  return {
    referralClicks,
    qualifiedReferrals,
    petParentSignups: countReferralType("pet_parent"),
    guruSignups: countReferralType("guru"),
    businessSignups: countReferralType("business"),
    communityLeads,
    completedBookings,
    leadNew: leadCounts.new,
    leadContacted: leadCounts.contacted,
    leadInterested: leadCounts.interested,
    leadApplied: leadCounts.applied,
    leadActive: leadCounts.active,
    pendingRewards: rewardTotals.pending,
    approvedRewards: rewardTotals.approved,
    readyRewards: rewardTotals.ready,
    paidRewards: rewardTotals.paid,
    totalEarned:
      rewardTotals.approved +
      rewardTotals.ready +
      rewardTotals.paid,
    socialSignups: socialReferrals.length,
    facebookSignups: platformCount("facebook"),
    instagramSignups: platformCount("instagram"),
    tiktokSignups: platformCount("tiktok"),
    xSignups: platformCount("x"),
    youtubeSignups: platformCount("youtube"),
    lastActivityAt,
  };
}

function getCanonicalTrainingSummary({
  ambassadorId,
  trainingStepRows,
  trainingProgressRows,
}: {
  ambassadorId: string;
  trainingStepRows: GenericRow[];
  trainingProgressRows: GenericRow[];
}) {
  const activeRequiredSteps = dedupeRowsById(trainingStepRows).filter((row) => {
    const isActive = firstBoolean(row, ["is_active"]);
    const isRequired = firstBoolean(row, ["is_required"]);

    return isActive !== false && isRequired !== false;
  });

  const progressRows = dedupeRowsById(
    trainingProgressRows.filter(
      (row) => firstString(row, ["ambassador_id"]) === ambassadorId,
    ),
  );
  const progressByStep = new Map(
    progressRows.map((row) => [
      firstString(row, ["training_step_id"]),
      row,
    ]),
  );

  const completedRequired = activeRequiredSteps.filter((step) => {
    const progress = progressByStep.get(firstString(step, ["id"]));
    const status = firstString(progress, ["status"]).toLowerCase();

    return (
      Boolean(firstString(progress, ["completed_at"])) ||
      ["complete", "completed", "approved"].includes(status)
    );
  }).length;

  const requiredCount = activeRequiredSteps.length;
  const percent = requiredCount
    ? Math.round((completedRequired / requiredCount) * 100)
    : 0;
  const started = progressRows.some(
    (row) =>
      Boolean(firstString(row, ["started_at", "completed_at"])) ||
      Boolean(firstString(row, ["status"])),
  );

  return {
    percent,
    status:
      requiredCount > 0 && completedRequired >= requiredCount
        ? "complete"
        : started
          ? "in_progress"
          : "not_started",
  };
}

function getCanonicalOnboardingSummary({
  ambassadorId,
  onboardingRows,
}: {
  ambassadorId: string;
  onboardingRows: GenericRow[];
}) {
  const matchingRows = dedupeRowsById(
    onboardingRows.filter(
      (row) => firstString(row, ["ambassador_id"]) === ambassadorId,
    ),
  ).sort((a, b) => {
    const aTime = new Date(
      firstString(a, ["updated_at", "submitted_at", "created_at"]) || 0,
    ).getTime();
    const bTime = new Date(
      firstString(b, ["updated_at", "submitted_at", "created_at"]) || 0,
    ).getTime();

    return bTime - aTime;
  });

  const row = matchingRows[0];

  return {
    status: row ? firstString(row, ["status"]) || "not_started" : "not_started",
    submittedAt: row ? firstString(row, ["submitted_at"]) || null : null,
    reviewedAt: row ? firstString(row, ["reviewed_at"]) || null : null,
  };
}

function getCanonicalPayoutReadiness(detail?: AmbassadorDetailRow) {
  const accountId =
    asString(detail?.stripe_account_id) ||
    asString(detail?.stripe_connect_account_id);
  const onboardingComplete =
    detail?.stripe_onboarding_complete === true;
  const payoutsEnabled =
    detail?.stripe_payouts_enabled === true ||
    detail?.payouts_enabled === true;
  const blockers: string[] = [];

  if (!accountId) blockers.push("Stripe account missing");
  if (!onboardingComplete) blockers.push("Stripe onboarding incomplete");
  if (!payoutsEnabled) blockers.push("Stripe payouts disabled");

  return {
    accountId,
    onboardingComplete,
    payoutsEnabled,
    chargesEnabled: detail?.charges_enabled === true,
    ready:
      Boolean(accountId) &&
      onboardingComplete &&
      payoutsEnabled,
    blockers,
  };
}

function isAmbassadorIntentUser({
  authUser,
  profile,
  roles,
}: {
  authUser?: AuthUserSnapshot;
  profile?: GenericRow;
  roles: string[];
}) {
  const metadata = asRecord(authUser?.user_metadata);
  const values = [
    ...roles,
    firstString(profile, ["role"]),
    firstString(profile, ["account_type"]),
    firstString(profile, ["source"]),
    firstString(metadata, ["role"]),
    firstString(metadata, ["account_type"]),
    firstString(metadata, ["signup_role"]),
    firstString(metadata, ["account_intent"]),
    firstString(metadata, ["signup_source"]),
  ]
    .join(" ")
    .toLowerCase();

  return values.includes("ambassador");
}

function buildAttentionItems({
  workspaceExists,
  roles,
  profileRole,
  accountType,
  referralCode,
  phone,
  zipCode,
  city,
  state,
  serviceArea,
  email,
  emailVerified,
  status,
  dashboardEnabled,
  loginEnabled,
}: {
  workspaceExists: boolean;
  roles: string[];
  profileRole: string;
  accountType: string;
  referralCode: string;
  phone: string;
  zipCode: string;
  city: string;
  state: string;
  serviceArea: string;
  email: string;
  emailVerified: boolean | null;
  status: string;
  dashboardEnabled: boolean | null;
  loginEnabled: boolean | null;
}) {
  const items: string[] = [];
  const normalizedRoles = roles.map((role) => role.toLowerCase());
  const normalizedProfileRole = profileRole.toLowerCase();
  const normalizedAccountType = accountType.toLowerCase();

  if (!workspaceExists) items.push("Ambassador workspace missing");
  if (!normalizedRoles.includes("ambassador")) items.push("Ambassador role missing");
  if (
    normalizedProfileRole &&
    normalizedProfileRole !== "ambassador" &&
    normalizedAccountType !== "ambassador" &&
    normalizedAccountType !== "both"
  ) {
    items.push("Profile role mismatch");
  }
  if (!referralCode) items.push("Referral code missing");
  if (!phone) items.push("Phone missing");
  if (!zipCode && !(city && state)) items.push("ZIP or city/state missing");
  if (!serviceArea) items.push("Service/community area missing");
  if (email && emailVerified === false) items.push("Email verification pending");
  if (status === "active" && dashboardEnabled === false) {
    items.push("Active Ambassador dashboard disabled");
  }
  if (status === "active" && loginEnabled === false) {
    items.push("Active Ambassador login disabled");
  }

  return uniqueStrings(items);
}

async function loadAllAuthUsers(): Promise<AuthUserSnapshot[]> {
  const users: AuthUserSnapshot[] = [];
  const perPage = 1000;

  try {
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.warn("Unable to load auth users for Ambassador Intelligence:", error.message);
        break;
      }

      const pageUsers = (data?.users || []) as AuthUserSnapshot[];
      users.push(...pageUsers);

      if (pageUsers.length < perPage) break;
    }
  } catch (error) {
    console.warn("Unable to load auth users for Ambassador Intelligence:", error);
  }

  return users;
}

async function loadOptionalAdminRows(table: string): Promise<GenericRow[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .limit(10000);

    if (error) {
      console.warn(`Unable to load ${table}:`, error.message);
      return [];
    }

    return (data || []) as GenericRow[];
  } catch (error) {
    console.warn(`Unable to load ${table}:`, error);
    return [];
  }
}

function buildUnifiedAmbassadorRows({
  summaryRows,
  detailRows,
  profileRows,
  roleRows,
  authUsers,
  referralRows,
  leadRows,
  rewardRows,
  activityRows,
  trainingStepRows,
  trainingProgressRows,
  onboardingRows,
}: {
  summaryRows: AmbassadorSummaryRow[];
  detailRows: AmbassadorDetailRow[];
  profileRows: GenericRow[];
  roleRows: GenericRow[];
  authUsers: AuthUserSnapshot[];
  referralRows: GenericRow[];
  leadRows: GenericRow[];
  rewardRows: GenericRow[];
  activityRows: GenericRow[];
  trainingStepRows: GenericRow[];
  trainingProgressRows: GenericRow[];
  onboardingRows: GenericRow[];
}) {
  const detailMap = new Map(detailRows.map((row) => [row.id, row]));
  const profileByUserId = new Map<string, GenericRow>();
  const profileByEmail = new Map<string, GenericRow>();
  const authByUserId = new Map(authUsers.map((user) => [user.id, user]));
  const authByEmail = new Map(
    authUsers
      .filter((user) => user.email)
      .map((user) => [String(user.email).toLowerCase(), user]),
  );
  const rolesByUserId = new Map<string, string[]>();

  profileRows.forEach((profile) => {
    const userId = firstString(profile, ["id", "user_id"]);
    const email = firstString(profile, ["email"]).toLowerCase();

    if (userId) profileByUserId.set(userId, profile);
    if (email) profileByEmail.set(email, profile);
  });

  roleRows.forEach((roleRow) => {
    const userId = firstString(roleRow, ["user_id", "profile_id", "id"]);
    const role = firstString(roleRow, ["role", "role_name"]);

    if (!userId || !role) return;

    rolesByUserId.set(
      userId,
      uniqueStrings([...(rolesByUserId.get(userId) || []), role]),
    );
  });

  const existingUserIds = new Set(
    summaryRows.map((row) => row.user_id).filter(Boolean) as string[],
  );
  const existingEmails = new Set(
    summaryRows
      .map((row) => asString(row.email).toLowerCase())
      .filter(Boolean),
  );

  const enrichedRows = summaryRows.map((row) => {
    const detail = detailMap.get(row.ambassador_id);
    const userId = row.user_id || "";
    const email = asString(row.email).toLowerCase();
    const profile =
      profileByUserId.get(userId) || profileByEmail.get(email) || undefined;
    const authUser = authByUserId.get(userId) || authByEmail.get(email);
    const metadata = asRecord(authUser?.user_metadata);
    const roles = uniqueStrings([
      ...(rolesByUserId.get(userId) || []),
      firstString(profile, ["role"]),
    ]);
    const profileRole = firstString(profile, ["role"]);
    const accountType = firstString(profile, ["account_type"]);
    const zipCode = firstString(profile, ["zip_code", "service_zip", "service_zip_code"]);
    const serviceArea = firstString(profile, ["service_area", "community_area"]);
    const profileCity = firstString(profile, ["city", "service_city"]);
    const profileState = firstString(profile, ["state", "service_state"]);
    const referralCode =
      detail?.referral_code ||
      row.referral_code ||
      firstString(profile, ["referral_code", "ambassador_code"]);
    const emailVerified = authUser
      ? Boolean(authUser.email_confirmed_at || authUser.confirmed_at)
      : null;
    const phoneVerified = authUser
      ? Boolean(authUser.phone_confirmed_at)
      : null;
    const points = Math.max(
      0,
      Math.round(
        firstNumber(profile, [
          "ambassador_points",
          "growth_points",
          "rank_points",
          "points_balance",
        ]),
      ),
    );
    const metrics = buildOperationalMetrics({
      ambassadorId: row.ambassador_id,
      userId,
      referralRows,
      leadRows,
      rewardRows,
      activityRows,
    });
    const trainingSummary = getCanonicalTrainingSummary({
      ambassadorId: row.ambassador_id,
      trainingStepRows,
      trainingProgressRows,
    });
    const onboardingSummary = getCanonicalOnboardingSummary({
      ambassadorId: row.ambassador_id,
      onboardingRows,
    });
    const payoutReadiness = getCanonicalPayoutReadiness(detail);
    const status = detail?.status || row.status || "new";
    const dashboardEnabled = detail?.dashboard_enabled ?? null;
    const loginEnabled = detail?.login_enabled ?? null;
    const attentionItems = buildAttentionItems({
      workspaceExists: true,
      roles,
      profileRole,
      accountType,
      referralCode: asString(referralCode),
      phone: asString(row.phone) || firstString(profile, ["phone"]),
      zipCode,
      city: asString(row.city) || profileCity,
      state: asString(row.state) || profileState,
      serviceArea,
      email: asString(row.email) || firstString(profile, ["email"]),
      emailVerified,
      status,
      dashboardEnabled,
      loginEnabled,
    });

    return {
      ...row,
      display_name: detail?.display_name || row.display_name || null,
      ambassador_type: detail?.ambassador_type || row.ambassador_type || null,
      tier: detail?.tier || row.tier || null,
      status,
      referral_code: referralCode || null,
      guru_referral_url: detail?.guru_referral_url || row.guru_referral_url || null,
      ambassador_photo_url: detail?.ambassador_photo_url || row.ambassador_photo_url || firstString(profile, ["avatar_url", "photo_url", "profile_photo_url"]) || null,
      ambassador_photo_path: detail?.ambassador_photo_path || row.ambassador_photo_path || null,
      photo_approved: detail?.photo_approved ?? row.photo_approved ?? false,
      photo_uploaded_at: detail?.photo_uploaded_at || row.photo_uploaded_at || null,
      archived_at: detail?.archived_at || row.archived_at || null,
      archived_reason: detail?.archived_reason || row.archived_reason || null,
      onboarding_step: detail?.onboarding_step ?? null,
      onboarding_percent:
        onboardingSummary.status === "approved" ||
        onboardingSummary.status === "complete" ||
        onboardingSummary.status === "completed"
          ? 100
          : onboardingSummary.status === "submitted" ||
              onboardingSummary.status === "pending_review" ||
              onboardingSummary.status === "in_review"
            ? 75
            : 0,
      onboarding_packet_status: onboardingSummary.status,
      onboarding_packet_submitted_at: onboardingSummary.submittedAt,
      onboarding_packet_reviewed_at: onboardingSummary.reviewedAt,
      training_status: trainingSummary.status,
      training_percent: trainingSummary.percent,
      dashboard_enabled: dashboardEnabled,
      login_enabled: loginEnabled,
      payout_status: detail?.payout_status || null,
      stripe_account_id: payoutReadiness.accountId || null,
      stripe_connect_account_id:
        asString(detail?.stripe_connect_account_id) || null,
      stripe_onboarding_complete: payoutReadiness.onboardingComplete,
      stripe_payouts_enabled: payoutReadiness.payoutsEnabled,
      payouts_enabled: payoutReadiness.payoutsEnabled,
      charges_enabled: payoutReadiness.chargesEnabled,
      payout_ready: payoutReadiness.ready,
      payout_blockers: payoutReadiness.blockers,
      workspace_exists: true,
      signup_intent:
        firstString(metadata, ["account_intent", "signup_role", "role"]) ||
        firstString(profile, ["account_type", "role"]) ||
        "ambassador",
      profile_role: profileRole || null,
      account_type: accountType || null,
      assigned_roles: roles,
      profile_zip_code: zipCode || null,
      service_area: serviceArea || null,
      email_verified: emailVerified,
      phone_verified: phoneVerified,
      needs_attention: attentionItems.length > 0,
      attention_items: attentionItems,
      auth_created_at: authUser?.created_at || null,
      profile_updated_at: firstString(profile, ["updated_at"]) || null,
      referral_clicks: metrics.referralClicks,
      qualified_referrals: metrics.qualifiedReferrals,
      community_leads: metrics.communityLeads,
      lead_new: metrics.leadNew,
      lead_contacted: metrics.leadContacted,
      lead_interested: metrics.leadInterested,
      lead_applied: metrics.leadApplied,
      lead_active: metrics.leadActive,
      ambassador_points: points,
      ambassador_rank: getRankFromPoints(points),
      last_activity_at: metrics.lastActivityAt,
      pet_parent_signups: metrics.petParentSignups,
      guru_signups: metrics.guruSignups,
      business_signups: metrics.businessSignups,
      completed_bookings: metrics.completedBookings,
      pending_rewards: metrics.pendingRewards,
      approved_rewards: metrics.approvedRewards,
      ready_for_payout_rewards: metrics.readyRewards,
      paid_rewards: metrics.paidRewards,
      total_earned: metrics.totalEarned,
      total_paid: metrics.paidRewards,
      social_signups: metrics.socialSignups,
      facebook_signups: metrics.facebookSignups,
      instagram_signups: metrics.instagramSignups,
      tiktok_signups: metrics.tiktokSignups,
      x_signups: metrics.xSignups,
      youtube_signups: metrics.youtubeSignups,
    } satisfies AmbassadorSummaryRow;
  });

  const candidateUserIds = new Set<string>();

  authUsers.forEach((authUser) => {
    const profile = profileByUserId.get(authUser.id);
    const roles = rolesByUserId.get(authUser.id) || [];

    if (isAmbassadorIntentUser({ authUser, profile, roles })) {
      candidateUserIds.add(authUser.id);
    }
  });

  profileRows.forEach((profile) => {
    const userId = firstString(profile, ["id", "user_id"]);
    if (!userId) return;

    const authUser = authByUserId.get(userId);
    const roles = rolesByUserId.get(userId) || [];

    if (isAmbassadorIntentUser({ authUser, profile, roles })) {
      candidateUserIds.add(userId);
    }
  });

  rolesByUserId.forEach((roles, userId) => {
    if (roles.some((role) => role.toLowerCase() === "ambassador")) {
      candidateUserIds.add(userId);
    }
  });

  const pendingRows: AmbassadorSummaryRow[] = [];

  candidateUserIds.forEach((userId) => {
    const authUser = authByUserId.get(userId);
    const profile = profileByUserId.get(userId);
    const metadata = asRecord(authUser?.user_metadata);
    const email = (
      authUser?.email || firstString(profile, ["email"])
    )?.toLowerCase() || "";

    if (existingUserIds.has(userId) || (email && existingEmails.has(email))) {
      return;
    }

    const roles = uniqueStrings([
      ...(rolesByUserId.get(userId) || []),
      firstString(profile, ["role"]),
    ]);
    const fullName =
      firstString(profile, ["full_name", "display_name"]) ||
      firstString(metadata, ["full_name", "name"]) ||
      email.split("@")[0] ||
      "New Ambassador Signup";
    const phone = authUser?.phone || firstString(profile, ["phone"]);
    const profileRole = firstString(profile, ["role"]);
    const accountType = firstString(profile, ["account_type"]);
    const zipCode = firstString(profile, ["zip_code", "service_zip", "service_zip_code"]);
    const serviceArea = firstString(profile, ["service_area", "community_area"]);
    const city = firstString(profile, ["city", "service_city"]);
    const state = firstString(profile, ["state", "service_state"]);
    const referralCode = firstString(profile, ["referral_code", "ambassador_code"]);
    const emailVerified = authUser
      ? Boolean(authUser.email_confirmed_at || authUser.confirmed_at)
      : null;
    const phoneVerified = authUser ? Boolean(authUser.phone_confirmed_at) : null;
    const points = Math.max(
      0,
      Math.round(
        firstNumber(profile, [
          "ambassador_points",
          "growth_points",
          "rank_points",
          "points_balance",
        ]),
      ),
    );
    const metrics = buildOperationalMetrics({
      ambassadorId: null,
      userId,
      referralRows,
      leadRows,
      rewardRows,
      activityRows,
    });
    const attentionItems = buildAttentionItems({
      workspaceExists: false,
      roles,
      profileRole,
      accountType,
      referralCode,
      phone: asString(phone),
      zipCode,
      city,
      state,
      serviceArea,
      email,
      emailVerified,
      status: "signup_incomplete",
      dashboardEnabled: false,
      loginEnabled: true,
    });
    const createdAt =
      authUser?.created_at || firstString(profile, ["created_at"]) || null;

    pendingRows.push({
      ambassador_id: `pending:${userId}`,
      user_id: userId,
      full_name: fullName,
      display_name: firstString(profile, ["display_name"]) || null,
      email: email || null,
      phone: asString(phone) || null,
      program: firstString(metadata, ["program", "ambassador_type"]) || "Ambassador Program",
      internal_role:
        firstString(metadata, ["signup_role", "role", "account_intent"]) ||
        "ambassador",
      source:
        firstString(profile, ["source"]) ||
        firstString(metadata, ["signup_source"]) ||
        "SitGuru signup",
      status: "signup_incomplete",
      referral_code: referralCode || null,
      referral_link: referralCode
        ? `https://www.sitguru.com/signup?ref=${encodeURIComponent(referralCode)}`
        : null,
      city: city || null,
      state: state || null,
      county: firstString(profile, ["county"]) || null,
      country: firstString(profile, ["country"]) || null,
      training_status: "not_started",
      training_percent: 0,
      created_at: createdAt,
      pet_parent_signups: metrics.petParentSignups,
      guru_signups: metrics.guruSignups,
      business_signups: metrics.businessSignups,
      completed_bookings: metrics.completedBookings,
      pending_rewards: metrics.pendingRewards,
      approved_rewards: metrics.approvedRewards,
      ready_for_payout_rewards: metrics.readyRewards,
      paid_rewards: metrics.paidRewards,
      total_earned: metrics.totalEarned,
      total_paid: metrics.paidRewards,
      ambassador_photo_url:
        firstString(profile, ["avatar_url", "photo_url", "profile_photo_url"]) || null,
      ambassador_photo_path: null,
      photo_approved: false,
      photo_uploaded_at: null,
      archived_at: null,
      archived_reason: null,
      ambassador_type:
        firstString(metadata, ["ambassador_type", "program"]) || "Ambassador",
      tier: null,
      guru_referral_url: null,
      workspace_exists: false,
      signup_intent:
        firstString(metadata, ["account_intent", "signup_role", "role"]) ||
        "ambassador",
      profile_role: profileRole || null,
      account_type: accountType || null,
      assigned_roles: roles,
      profile_zip_code: zipCode || null,
      service_area: serviceArea || null,
      email_verified: emailVerified,
      phone_verified: phoneVerified,
      needs_attention: true,
      attention_items: attentionItems,
      auth_created_at: authUser?.created_at || null,
      profile_updated_at: firstString(profile, ["updated_at"]) || null,
      onboarding_step: 0,
      onboarding_percent: 0,
      dashboard_enabled: false,
      login_enabled: true,
      payout_status: "not_ready",
      referral_clicks: metrics.referralClicks,
      qualified_referrals: metrics.qualifiedReferrals,
      community_leads: metrics.communityLeads,
      lead_new: metrics.leadNew,
      lead_contacted: metrics.leadContacted,
      lead_interested: metrics.leadInterested,
      lead_applied: metrics.leadApplied,
      lead_active: metrics.leadActive,
      ambassador_points: points,
      ambassador_rank: getRankFromPoints(points),
      last_activity_at: metrics.lastActivityAt,
      social_signups: 0,
      facebook_signups: 0,
      instagram_signups: 0,
      tiktok_signups: 0,
      x_signups: 0,
      youtube_signups: 0,
      onboarding_packet_status: "workspace_missing",
      onboarding_packet_submitted_at: null,
      onboarding_packet_reviewed_at: null,
      stripe_account_id: null,
      stripe_connect_account_id: null,
      stripe_onboarding_complete: false,
      stripe_payouts_enabled: false,
      payouts_enabled: false,
      charges_enabled: false,
      payout_ready: false,
      payout_blockers: ["Ambassador workspace missing"],
    });
  });

  return [...enrichedRows, ...pendingRows].sort((a, b) => {
    const aTime = new Date(a.auth_created_at || a.created_at || 0).getTime();
    const bTime = new Date(b.auth_created_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });
}

function currency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
}

function numberValue(value: number | null | undefined) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function prettyStatus(status?: string | null) {
  const clean = asString(status);

  if (!clean) return "Not Started";

  return clean
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function isArchivedAmbassador(row: AmbassadorSummaryRow) {
  return Boolean(row.archived_at) || row.status === "archived";
}

function statusClass(status?: string | null) {
  const cleanStatus = status || "";

  if (cleanStatus === "active") {
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  }

  if (
    cleanStatus === "conditional_offer_sent" ||
    cleanStatus === "onboarding_sent"
  ) {
    return "bg-blue-100 text-blue-800 ring-blue-200";
  }

  if (cleanStatus === "paused") {
    return "bg-amber-100 text-amber-800 ring-amber-200";
  }

  if (cleanStatus === "signup_incomplete") {
    return "bg-rose-100 text-rose-800 ring-rose-200";
  }

  if (cleanStatus === "archived") {
    return "bg-red-100 text-red-700 ring-red-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function photoStatusClass(hasPhoto: boolean, approved?: boolean | null) {
  if (!hasPhoto) {
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }

  if (approved) {
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  }

  return "bg-amber-100 text-amber-800 ring-amber-200";
}

function getPhotoStatusLabel(hasPhoto: boolean, approved?: boolean | null) {
  if (!hasPhoto) return "No Photo";
  if (approved) return "Photo Approved";
  return "Photo Pending";
}

function trainingClass(percent: number) {
  if (percent >= 100) return "bg-emerald-600";
  if (percent >= 50) return "bg-blue-500";
  if (percent > 0) return "bg-amber-500";

  return "bg-slate-200";
}

function getAmbassadorName(ambassador: AmbassadorSummaryRow) {
  return (
    asString(ambassador.display_name) ||
    asString(ambassador.full_name) ||
    asString(ambassador.email) ||
    "Unnamed Ambassador"
  );
}

function buildAmbassadorDirectMessageHref(ambassador: AmbassadorSummaryRow) {
  const ambassadorName = getAmbassadorName(ambassador);
  const params = new URLSearchParams({
    threadType: "direct_ambassador",
    inquiry: "partner",
    messageCategory: "direct",
    recipientRole: "ambassador",
    recipientName: ambassadorName,
    source: "admin_ambassadors_dashboard",
    ambassadorName,
  });

  if (!isMissingAmbassadorWorkspace(ambassador)) {
    params.set("ambassadorId", ambassador.ambassador_id);
  }

  if (ambassador.user_id) {
    params.set("recipientId", ambassador.user_id);
  }

  if (ambassador.email) {
    params.set("recipientEmail", ambassador.email);
    params.set("ambassadorEmail", ambassador.email);
  }

  if (ambassador.referral_code) {
    params.set("referralCode", ambassador.referral_code);
  }

  return `/admin/messages?${params.toString()}`;
}

function getInitials(name?: string | null) {
  const cleanName = asString(name) || "SitGuru Ambassador";

  return cleanName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function normalizeText(value?: string | null) {
  return asString(value).toLowerCase();
}

function getAmbassadorTypeLabel(ambassador: AmbassadorSummaryRow) {
  const type = normalizeText(ambassador.ambassador_type);
  const program = normalizeText(ambassador.program);
  const source = normalizeText(ambassador.source);
  const role = normalizeText(ambassador.internal_role);
  const combined = `${type} ${program} ${source} ${role}`;

  if (combined.includes("careerlink") || combined.includes("career link")) {
    return "Community Ambassador";
  }

  if (combined.includes("military")) {
    return "Military Ambassador";
  }

  if (combined.includes("veteran")) {
    return "Veteran Ambassador";
  }

  if (combined.includes("student")) {
    return "Student Ambassador";
  }

  if (combined.includes("vet tech") || combined.includes("veterinary")) {
    return "Vet Tech Ambassador";
  }

  if (combined.includes("trainer")) {
    return "Trainer Ambassador";
  }

  if (combined.includes("groomer")) {
    return "Groomer Ambassador";
  }

  if (combined.includes("pet care") || combined.includes("pet professional")) {
    return "Pet Care Professional Ambassador";
  }

  if (combined.includes("business") || combined.includes("partner")) {
    return "Business Ambassador";
  }

  if (combined.includes("community")) {
    return "Community Ambassador";
  }

  return "Ambassador";
}

function getSourceLabel(ambassador: AmbassadorSummaryRow) {
  const source = asString(ambassador.source);

  if (!source) return "Source not saved";

  const lowerSource = source.toLowerCase();

  if (lowerSource.includes("careerlink") || lowerSource.includes("career link")) {
    return "PA CareerLink";
  }

  return source;
}

function getAmbassadorCategory(ambassador: AmbassadorSummaryRow) {
  const typeLabel = getAmbassadorTypeLabel(ambassador);
  const sourceLabel = getSourceLabel(ambassador);

  if (sourceLabel === "PA CareerLink") return "PA CareerLink";
  if (typeLabel.includes("Student")) return "Student";
  if (typeLabel.includes("Community")) return "Community";
  if (typeLabel.includes("Veteran")) return "Veteran";
  if (typeLabel.includes("Military")) return "Military";
  if (typeLabel.includes("Vet Tech")) return "Vet Tech";
  if (typeLabel.includes("Trainer")) return "Trainer";
  if (typeLabel.includes("Groomer")) return "Groomer";
  if (typeLabel.includes("Pet Care Professional")) return "Pet Care Pro";
  if (typeLabel.includes("Business")) return "Business";

  return "Other";
}

function getLocationLabel(ambassador: AmbassadorSummaryRow) {
  return (
    [ambassador.city, ambassador.state].filter(Boolean).join(", ") ||
    "Location not saved"
  );
}

function buildAdminCards(rows: AmbassadorSummaryRow[]) {
  const activeRows = rows.filter((row) => !isArchivedAmbassador(row));
  const newSignups = rows.filter((row) =>
    isWithinDays(row.auth_created_at || row.created_at, 7),
  );
  const attentionRows = rows.filter(hasNeedsAttention);

  return [
    {
      label: "Total Ambassador Records",
      value: rows.length.toLocaleString(),
      subtext: "All Ambassador workspaces and signup-intent accounts",
      icon: GraduationCap,
      group: "Pipeline",
    },
    {
      label: "Active Pipeline",
      value: activeRows.length.toLocaleString(),
      subtext: "All records not archived",
      icon: Users,
      group: "Pipeline",
    },
    {
      label: "New Signups (7 Days)",
      value: newSignups.length.toLocaleString(),
      subtext: "Recent Ambassador account intent or workspace creation",
      icon: Sparkles,
      group: "Pipeline",
    },
    {
      label: "Needs Attention",
      value: attentionRows.length.toLocaleString(),
      subtext: "Provisioning, role, verification, or required setup issues",
      icon: AlertTriangle,
      group: "Pipeline",
    },
    {
      label: "Referral Link Clicks",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.referral_clicks), 0)
        .toLocaleString(),
      subtext: "Mobile-aligned referral link activity",
      icon: Link2,
      group: "Performance",
    },
    {
      label: "Qualified Referrals",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.qualified_referrals), 0)
        .toLocaleString(),
      subtext: "Approved, qualified, or converted referrals",
      icon: Target,
      group: "Performance",
    },
    {
      label: "Pet Parent Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.pet_parent_signups), 0)
        .toLocaleString(),
      subtext: "Referred Pet Parent accounts",
      icon: PawPrint,
      group: "Performance",
    },
    {
      label: "Guru Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.guru_signups), 0)
        .toLocaleString(),
      subtext: "Referred Guru applicants/accounts",
      icon: Users,
      group: "Performance",
    },
    {
      label: "Business Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.business_signups), 0)
        .toLocaleString(),
      subtext: "Local business and partner leads",
      icon: BriefcaseBusiness,
      group: "Performance",
    },
    {
      label: "Community Leads",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.community_leads), 0)
        .toLocaleString(),
      subtext: "Campus, neighborhood, and community outreach leads",
      icon: MapPin,
      group: "Performance",
    },
    {
      label: "Completed Bookings",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.completed_bookings), 0)
        .toLocaleString(),
      subtext: "Referral-linked completed bookings",
      icon: CheckCircle2,
      group: "Performance",
    },
    {
      label: "Social Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.social_signups), 0)
        .toLocaleString(),
      subtext: "Canonical social referrals across official channels",
      icon: Share2,
      group: "Performance",
    },
    {
      label: "Pending Rewards",
      value: currency(
        rows.reduce((sum, row) => sum + numberValue(row.pending_rewards), 0),
      ),
      subtext: "Possible future reward review",
      icon: Award,
      group: "Rewards",
    },
    {
      label: "Approved Rewards",
      value: currency(
        rows.reduce((sum, row) => sum + numberValue(row.approved_rewards), 0),
      ),
      subtext: "Approved but not yet queued for payout",
      icon: HandCoins,
      group: "Rewards",
    },
    {
      label: "Ready for Payout",
      value: currency(
        rows.reduce(
          (sum, row) => sum + numberValue(row.ready_for_payout_rewards),
          0,
        ),
      ),
      subtext: "Queued for payout processing",
      icon: Wallet,
      group: "Rewards",
    },
    {
      label: "Paid Rewards",
      value: currency(
        rows.reduce((sum, row) => sum + numberValue(row.paid_rewards), 0),
      ),
      subtext: "Rewards already paid",
      icon: Wallet,
      group: "Rewards",
    },
    {
      label: "Payout-Ready Ambassadors",
      value: rows
        .filter((row) => row.payout_ready === true)
        .length.toLocaleString(),
      subtext: "Stripe account, onboarding, and payouts enabled",
      icon: ShieldCheck,
      group: "Rewards",
    },
  ];
}

async function updateAmbassadorPipelineStatus(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperUserEmail(user.email)) {
    redirect("/admin/login");
  }

  const ambassadorId = asString(formData.get("ambassador_id"));
  const nextStatus = asString(formData.get("next_status"));
  const ambassadorName =
    asString(formData.get("ambassador_name")) || "Ambassador";

  if (!ambassadorId || !nextStatus) {
    redirect("/admin/ambassadors?updated=missing");
  }

  const now = new Date().toISOString();

  const statusPatch =
    nextStatus === "archived"
      ? {
          status: "archived",
          archived_at: now,
          archived_reason:
            "Archived from Ambassador Dashboard quick action. Retained for applicant and contractor recordkeeping.",
          updated_at: now,
        }
      : {
          status: nextStatus,
          archived_at: null,
          archived_reason: null,
          updated_at: now,
          ...(nextStatus === "active" ? { activated_at: now } : {}),
        };

  const { error } = await supabase
    .from("ambassadors")
    .update(statusPatch)
    .eq("id", ambassadorId);

  if (error) {
    console.warn("Unable to update Ambassador status:", error);
    redirect("/admin/ambassadors?updated=error");
  }

  const activityTitle =
    nextStatus === "archived"
      ? "Ambassador archived"
      : `Ambassador status updated to ${prettyStatus(nextStatus)}`;

  await supabase.from("ambassador_activity_log").insert({
    ambassador_id: ambassadorId,
    activity_type: "status_update",
    activity_title: activityTitle,
    activity_notes: `${ambassadorName} was updated by ${
      user.email || "Super Admin"
    } from the Ambassador Dashboard.`,
    created_by: user.id,
  });

  revalidatePath("/admin/ambassadors");
  revalidatePath(`/admin/ambassadors/${ambassadorId}`);
  revalidatePath("/admin/hr");

  redirect("/admin/ambassadors?updated=success");
}

function AmbassadorPhoto({
  ambassador,
  size = "normal",
}: {
  ambassador: AmbassadorSummaryRow;
  size?: "normal" | "large";
}) {
  const name = getAmbassadorName(ambassador);
  const hasPhoto = Boolean(ambassador.ambassador_photo_url);
  const dimensionClass = size === "large" ? "h-20 w-20" : "h-14 w-14";
  const initialsClass = size === "large" ? "text-xl" : "text-sm";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[#dbe8d5] bg-[#e8f5e9] font-extrabold text-[#2f6f3e] ${dimensionClass} ${initialsClass}`}
    >
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ambassador.ambassador_photo_url || ""}
          alt={`${name} Ambassador profile`}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(name)
      )}

      <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-white text-[#2f6f3e] shadow-sm">
        <Camera className="h-3 w-3" />
      </span>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] px-4 py-3 text-center">
      <p className="text-xl font-black leading-none text-[#102819]">{value}</p>
      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}

function RewardLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-extrabold text-[#102819]">{value}</span>
    </div>
  );
}

function AmbassadorQuickActions({
  ambassador,
}: {
  ambassador: AmbassadorSummaryRow;
}) {
  const ambassadorName = getAmbassadorName(ambassador);

  if (isMissingAmbassadorWorkspace(ambassador)) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold leading-5 text-rose-800">
        Status actions are unavailable until the missing Ambassador workspace is repaired.
        <Link
          href={getAccountLifecycleHref(ambassador)}
          className="mt-2 inline-flex min-h-9 items-center justify-center rounded-xl bg-rose-700 px-3 py-2 text-xs font-black text-white transition hover:bg-rose-800"
        >
          Review Account Lifecycle
        </Link>
      </div>
    );
  }

  if (isArchivedAmbassador(ambassador)) {
    return (
      <form action={updateAmbassadorPipelineStatus}>
        <input
          type="hidden"
          name="ambassador_id"
          value={ambassador.ambassador_id}
        />
        <input type="hidden" name="ambassador_name" value={ambassadorName} />
        <input type="hidden" name="next_status" value="contacted" />
        <button
          type="submit"
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl bg-green-50 px-4 py-2 text-xs font-extrabold text-green-800 ring-1 ring-green-100 transition hover:bg-green-100 sm:w-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restore
        </button>
      </form>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {ambassadorQuickActions.map((action) => (
        <form key={action.value} action={updateAmbassadorPipelineStatus}>
          <input
            type="hidden"
            name="ambassador_id"
            value={ambassador.ambassador_id}
          />
          <input type="hidden" name="ambassador_name" value={ambassadorName} />
          <input type="hidden" name="next_status" value={action.value} />
          <button
            type="submit"
            className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition ${action.className}`}
          >
            {action.icon}
            {action.label}
          </button>
        </form>
      ))}
    </div>
  );
}

function AmbassadorCard({ ambassador }: { ambassador: AmbassadorSummaryRow }) {
  const ambassadorName = getAmbassadorName(ambassador);
  const ambassadorTypeLabel = getAmbassadorTypeLabel(ambassador);
  const sourceLabel = getSourceLabel(ambassador);
  const locationLabel = getLocationLabel(ambassador);
  const category = getAmbassadorCategory(ambassador);
  const hasPhoto = Boolean(ambassador.ambassador_photo_url);
  const trainingPercent = numberValue(ambassador.training_percent);
  const archived = isArchivedAmbassador(ambassador);

  return (
    <article
      className={`rounded-[2rem] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
        archived
          ? "border-red-100 bg-red-50/30 hover:border-red-200"
          : "border-[#dbe8d5] hover:border-[#b8d9b2]"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <AmbassadorPhoto ambassador={ambassador} size="large" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-extrabold text-[#102819]">
                {ambassadorName}
              </h3>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ring-1 ${photoStatusClass(
                  hasPhoto,
                  ambassador.photo_approved,
                )}`}
              >
                {getPhotoStatusLabel(hasPhoto, ambassador.photo_approved)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-[#f0f7ed] px-3 py-1 text-xs font-extrabold text-[#2f6f3e] ring-1 ring-[#dbe8d5]">
                {ambassadorTypeLabel}
              </span>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">
                {category}
              </span>
            </div>

            <p className="mt-2 truncate text-sm font-semibold text-slate-600">
              {ambassador.email || "No email saved"}
            </p>

            <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-[#2f6f3e]">
              {ambassador.referral_code || "No referral code"}
            </p>

            <p className="mt-1 text-xs text-slate-500">{locationLabel}</p>

            {archived ? (
              <p className="mt-2 rounded-2xl bg-red-100 px-3 py-2 text-xs font-bold leading-5 text-red-800">
                Archived:{" "}
                {ambassador.archived_reason ||
                  "Retained on file. Not active for onboarding."}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${statusClass(
              archived ? "archived" : ambassador.status,
            )}`}
          >
            {archived ? "Archived" : prettyStatus(ambassador.status)}
          </span>
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-800 ring-1 ring-blue-100">
            {sourceLabel}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <CompactMetric
          label="Parents"
          value={numberValue(ambassador.pet_parent_signups)}
        />
        <CompactMetric
          label="Gurus"
          value={numberValue(ambassador.guru_signups)}
        />
        <CompactMetric
          label="Business"
          value={numberValue(ambassador.business_signups)}
        />
        <CompactMetric
          label="Social"
          value={numberValue(ambassador.social_signups)}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
            Rewards
          </p>
          <div className="mt-3 space-y-2">
            <RewardLine
              label="Pending"
              value={currency(ambassador.pending_rewards)}
            />
            <RewardLine
              label="Approved"
              value={currency(ambassador.approved_rewards)}
            />
            <RewardLine
              label="Ready"
              value={currency(ambassador.ready_for_payout_rewards)}
            />
            <RewardLine
              label="Paid"
              value={currency(ambassador.paid_rewards)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
              Training
            </p>
            <p className="text-sm font-extrabold text-[#102819]">
              {trainingPercent}%
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${trainingClass(trainingPercent)}`}
              style={{ width: `${trainingPercent}%` }}
            />
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-500">
            {prettyStatus(ambassador.training_status)}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Onboarding: {prettyStatus(ambassador.onboarding_packet_status)}
          </p>
          <p
            className={`mt-2 text-xs font-black ${
              ambassador.payout_ready ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {ambassador.payout_ready
              ? "Payout setup ready"
              : "Payout setup incomplete"}
          </p>

          {ambassador.ambassador_photo_path ? (
            <p className="mt-3 truncate text-[11px] text-slate-400">
              {ambassador.ambassador_photo_path}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2f6f3e] text-white shadow-sm">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[#102819]">
                SitGuru Messenger
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Open the SitGuru message center for onboarding questions,
                referral-code support, Pet Parent signups, Guru signups, and
                referral credit follow-up for this Ambassador.
              </p>
            </div>
          </div>

          <Link
            href={buildAmbassadorDirectMessageHref(ambassador)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#2f6f3e] px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#255b33]"
          >
            Start Direct Message
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-3">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
          Quick Actions
        </p>
        <AmbassadorQuickActions ambassador={ambassador} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-500">
          Source: {sourceLabel}
        </p>

        <Link
          href={`/admin/ambassadors/${ambassador.ambassador_id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#2f6f3e] px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#255b33]"
        >
          View Dashboard
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function getNotice(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const updated = searchParams?.updated;

  if (updated === "success") {
    return {
      title: "Ambassador updated",
      message: "The Ambassador status was updated successfully.",
      tone: "success" as const,
    };
  }

  if (updated === "missing") {
    return {
      title: "Ambassador not updated",
      message: "The Ambassador ID or next status was missing.",
      tone: "warning" as const,
    };
  }

  if (updated === "error") {
    return {
      title: "Ambassador not updated",
      message:
        "The Ambassador could not be updated. Confirm archive columns and status constraints exist in Supabase.",
      tone: "warning" as const,
    };
  }

  return null;
}


function getSingleSearchParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) {
    return asString(value[0]);
  }

  return asString(value);
}

function buildRegistryFilters(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): AmbassadorRegistryFilters {
  return {
    q: getSingleSearchParam(searchParams, "q"),
    status: getSingleSearchParam(searchParams, "status"),
    type: getSingleSearchParam(searchParams, "type"),
    training: getSingleSearchParam(searchParams, "training"),
    photo: getSingleSearchParam(searchParams, "photo"),
    rewards: getSingleSearchParam(searchParams, "rewards"),
    attention: getSingleSearchParam(searchParams, "attention"),
  };
}

function hasActiveRegistryFilters(filters: AmbassadorRegistryFilters) {
  return Boolean(
    filters.q ||
      filters.status ||
      filters.type ||
      filters.training ||
      filters.photo ||
      filters.rewards ||
      filters.attention,
  );
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function getTrainingFilterMatch(ambassador: AmbassadorSummaryRow, filter: string) {
  const percent = numberValue(ambassador.training_percent);
  const status = normalizeText(ambassador.training_status);

  if (!filter) return true;
  if (filter === "not_started") return percent === 0 || status.includes("not started");
  if (filter === "in_progress") return percent > 0 && percent < 100;
  if (filter === "complete") return percent >= 100 || status.includes("complete");

  return true;
}

function getPhotoFilterMatch(ambassador: AmbassadorSummaryRow, filter: string) {
  const hasPhoto = Boolean(ambassador.ambassador_photo_url);

  if (!filter) return true;
  if (filter === "missing") return !hasPhoto;
  if (filter === "pending") return hasPhoto && ambassador.photo_approved !== true;
  if (filter === "approved") return hasPhoto && ambassador.photo_approved === true;

  return true;
}

function getRewardsFilterMatch(ambassador: AmbassadorSummaryRow, filter: string) {
  const pending = numberValue(ambassador.pending_rewards);
  const approved = numberValue(ambassador.approved_rewards);
  const ready = numberValue(ambassador.ready_for_payout_rewards);
  const paid = numberValue(ambassador.paid_rewards);
  const total = pending + approved + ready + paid;

  if (!filter) return true;
  if (filter === "none") return total === 0;
  if (filter === "pending") return pending > 0 || approved > 0;
  if (filter === "ready") return ready > 0;
  if (filter === "paid") return paid > 0;

  return true;
}

function getAttentionFilterMatch(
  ambassador: AmbassadorSummaryRow,
  filter: string,
) {
  const issues = ambassador.attention_items || [];
  const issueText = issues.join(" ").toLowerCase();

  if (!filter) return true;
  if (filter === "yes") return hasNeedsAttention(ambassador);
  if (filter === "no") return !hasNeedsAttention(ambassador);
  if (filter === "workspace") return isMissingAmbassadorWorkspace(ambassador);
  if (filter === "role") return issueText.includes("role");
  if (filter === "verification") return issueText.includes("verification");
  if (filter === "setup") {
    return (
      issueText.includes("phone") ||
      issueText.includes("zip") ||
      issueText.includes("service/community") ||
      issueText.includes("referral code")
    );
  }

  return true;
}

function filterAmbassadorsForRegistry(
  ambassadors: AmbassadorSummaryRow[],
  filters: AmbassadorRegistryFilters,
) {
  const query = normalizeText(filters.q);

  return ambassadors.filter((ambassador) => {
    const status = isArchivedAmbassador(ambassador)
      ? "archived"
      : normalizeText(ambassador.status);
    const typeLabel = getAmbassadorTypeLabel(ambassador);

    const searchableText = [
      getAmbassadorName(ambassador),
      ambassador.email,
      ambassador.phone,
      ambassador.referral_code,
      ambassador.city,
      ambassador.state,
      ambassador.county,
      ambassador.country,
      ambassador.source,
      ambassador.program,
      ambassador.internal_role,
      typeLabel,
      getSourceLabel(ambassador),
      getAmbassadorCategory(ambassador),
      ambassador.profile_role,
      ambassador.account_type,
      ambassador.profile_zip_code,
      ambassador.service_area,
      ambassador.assigned_roles?.join(" "),
      ambassador.attention_items?.join(" "),
      ambassador.ambassador_rank,
      ambassador.onboarding_packet_status,
      ambassador.payout_ready ? "payout ready" : "payout incomplete",
      ambassador.payout_blockers?.join(" "),
      numberValue(ambassador.social_signups) > 0 ? "social referrals" : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || searchableText.includes(query);
    const matchesStatus = !filters.status || status === filters.status;
    const matchesType = !filters.type || typeLabel === filters.type;
    const matchesTraining = getTrainingFilterMatch(ambassador, filters.training);
    const matchesPhoto = getPhotoFilterMatch(ambassador, filters.photo);
    const matchesRewards = getRewardsFilterMatch(ambassador, filters.rewards);
    const matchesAttention = getAttentionFilterMatch(
      ambassador,
      filters.attention,
    );

    return (
      matchesQuery &&
      matchesStatus &&
      matchesType &&
      matchesTraining &&
      matchesPhoto &&
      matchesRewards &&
      matchesAttention
    );
  });
}

function DashboardStatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof GraduationCap;
}) {
  return (
    <div className="rounded-3xl border border-[#dbe8d5] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-extrabold text-[#102819]">{value}</p>
        </div>
        <div className="rounded-2xl bg-[#e8f5e9] p-3 text-[#2f6f3e]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function AmbassadorGroupSection({
  title,
  description,
  ambassadors,
  icon: Icon,
}: {
  title: string;
  description: string;
  ambassadors: AmbassadorSummaryRow[];
  icon: typeof GraduationCap;
}) {
  if (ambassadors.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] border border-[#dbe8d5] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f5e9] text-[#2f6f3e]">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#102819]">
                {title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
          </div>

          <span className="rounded-2xl bg-[#f0f7ed] px-4 py-3 text-sm font-bold text-[#2f6f3e]">
            {ambassadors.length} records
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {ambassadors.map((ambassador) => (
          <AmbassadorCard
            key={ambassador.ambassador_id}
            ambassador={ambassador}
          />
        ))}
      </div>
    </section>
  );
}


function SignupHealthSection({
  ambassadors,
}: {
  ambassadors: AmbassadorSummaryRow[];
}) {
  const recentOrAttention = ambassadors
    .filter(
      (ambassador) =>
        hasNeedsAttention(ambassador) ||
        isWithinDays(ambassador.auth_created_at || ambassador.created_at, 30),
    )
    .slice(0, 12);

  const missingWorkspaceCount = ambassadors.filter(
    isMissingAmbassadorWorkspace,
  ).length;
  const roleIssueCount = ambassadors.filter((ambassador) =>
    (ambassador.attention_items || []).some((item) =>
      item.toLowerCase().includes("role"),
    ),
  ).length;
  const verificationCount = ambassadors.filter((ambassador) =>
    (ambassador.attention_items || []).some((item) =>
      item.toLowerCase().includes("verification"),
    ),
  ).length;

  return (
    <section className="rounded-[2rem] border border-[#dbe8d5] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#2f6f3e]" />
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2f6f3e]">
              Signup & Workspace Health
            </p>
          </div>
          <h2 className="mt-2 text-2xl font-black text-[#102819]">
            New Ambassador signups and provisioning status
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            This section includes fully provisioned Ambassador workspaces and
            signup-intent accounts that still need role, workspace, referral,
            verification, or required profile repairs.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 xl:min-w-[430px]">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-rose-700">
              Missing Workspace
            </p>
            <p className="mt-1 text-2xl font-black text-rose-900">
              {missingWorkspaceCount}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
              Role Issues
            </p>
            <p className="mt-1 text-2xl font-black text-amber-900">
              {roleIssueCount}
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-blue-700">
              Verification
            </p>
            <p className="mt-1 text-2xl font-black text-blue-900">
              {verificationCount}
            </p>
          </div>
        </div>
      </div>

      {recentOrAttention.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          No recent Ambassador signup or workspace issues require attention.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {recentOrAttention.map((ambassador) => {
            const missingWorkspace = isMissingAmbassadorWorkspace(ambassador);
            const issues = ambassador.attention_items || [];

            return (
              <article
                key={`health-${ambassador.ambassador_id}`}
                className={`rounded-3xl border p-4 ${
                  hasNeedsAttention(ambassador)
                    ? "border-rose-100 bg-rose-50/60"
                    : "border-emerald-100 bg-emerald-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-[#102819]">
                      {getAmbassadorName(ambassador)}
                    </p>
                    <p className="mt-1 break-words text-xs font-semibold text-slate-600">
                      {ambassador.email || "No email saved"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Signed up: {formatDateTime(
                        ambassador.auth_created_at || ambassador.created_at,
                      )}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ${
                      missingWorkspace
                        ? "bg-rose-100 text-rose-800 ring-rose-200"
                        : "bg-emerald-100 text-emerald-800 ring-emerald-200"
                    }`}
                  >
                    {missingWorkspace ? "Workspace Missing" : "Workspace Ready"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-white p-3 ring-1 ring-black/5">
                    <p className="font-black uppercase tracking-wide text-slate-500">
                      Signup Intent
                    </p>
                    <p className="mt-1 font-bold text-[#102819]">
                      {prettyStatus(ambassador.signup_intent)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3 ring-1 ring-black/5">
                    <p className="font-black uppercase tracking-wide text-slate-500">
                      Assigned Roles
                    </p>
                    <p className="mt-1 font-bold text-[#102819]">
                      {ambassador.assigned_roles?.join(", ") || "None saved"}
                    </p>
                  </div>
                </div>

                {issues.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {issues.map((issue) => (
                      <span
                        key={issue}
                        className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-rose-800 ring-1 ring-rose-200"
                      >
                        {issue}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs font-bold text-emerald-800">
                    Required signup workspace records are present.
                  </p>
                )}

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link
                    href={getPrimaryAdminHref(ambassador)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#2f6f3e] px-3 py-2 text-xs font-black text-white transition hover:bg-[#255b33]"
                  >
                    {getPrimaryAdminLabel(ambassador)}
                  </Link>
                  <Link
                    href={buildAmbassadorDirectMessageHref(ambassador)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#cfe4c8] bg-white px-3 py-2 text-xs font-black text-[#2f6f3e] transition hover:bg-[#eef7ea]"
                  >
                    Message
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}


function AmbassadorRegistryTable({
  ambassadors,
  allAmbassadors,
  filters,
}: {
  ambassadors: AmbassadorSummaryRow[];
  allAmbassadors: AmbassadorSummaryRow[];
  filters: AmbassadorRegistryFilters;
}) {
  const activeFilters = hasActiveRegistryFilters(filters);
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "interested", label: "Interested" },
    { value: "onboarding_sent", label: "Onboarding Sent" },
    { value: "paused", label: "Paused" },
    { value: "signup_incomplete", label: "Signup Incomplete" },
    { value: "archived", label: "Archived" },
  ];
  const typeOptions = uniqueSorted(allAmbassadors.map(getAmbassadorTypeLabel));

  return (
    <section className="rounded-[2rem] border border-[#dbe8d5] bg-white shadow-sm">
      <div className="border-b border-[#e2ecd9] p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#2f6f3e]">
              Super Admin Ambassador Registry
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#102819] sm:text-3xl">
              Click into each Ambassador dashboard
            </h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
              View every Ambassador profile, onboarding status, referral code,
              Pet Parent and Guru referral activity, rewards, messages, and admin
              controls from one mobile-friendly registry.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/ambassador-leads"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-sm font-black text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
            >
              View Leads
            </Link>
            <Link
              href="/admin/ambassador-training"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-sm font-black text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
            >
              Training Manager
            </Link>
            <Link
              href="/admin/commissions"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#2f6f3e] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#255b33]"
            >
              Commissions
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-[#e2ecd9] bg-[#fbfcf9] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Ambassador Records
            </p>
            <p className="mt-1 text-2xl font-black text-[#102819]">
              {allAmbassadors.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e2ecd9] bg-[#fbfcf9] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Showing
            </p>
            <p className="mt-1 text-2xl font-black text-[#102819]">
              {ambassadors.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e2ecd9] bg-[#fbfcf9] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Ready for Payout
            </p>
            <p className="mt-1 text-2xl font-black text-[#102819]">
              {currency(
                allAmbassadors.reduce(
                  (sum, ambassador) =>
                    sum + numberValue(ambassador.ready_for_payout_rewards),
                  0,
                ),
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e2ecd9] bg-[#fbfcf9] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Paid Rewards
            </p>
            <p className="mt-1 text-2xl font-black text-[#102819]">
              {currency(
                allAmbassadors.reduce(
                  (sum, ambassador) => sum + numberValue(ambassador.paid_rewards),
                  0,
                ),
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">
              Needs Attention
            </p>
            <p className="mt-1 text-2xl font-black text-rose-900">
              {allAmbassadors.filter(hasNeedsAttention).length}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
              Missing Workspace
            </p>
            <p className="mt-1 text-2xl font-black text-amber-900">
              {allAmbassadors.filter(isMissingAmbassadorWorkspace).length}
            </p>
          </div>
        </div>

        <form
          action="/admin/ambassadors"
          className="mt-5 rounded-[1.5rem] border border-[#e2ecd9] bg-[#f8fbf6] p-4"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_repeat(6,minmax(0,0.8fr))]">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Search
              </span>
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Name, email, code, city, source..."
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Status
              </span>
              <select
                name="status"
                defaultValue={filters.status}
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              >
                <option value="">All Statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Type
              </span>
              <select
                name="type"
                defaultValue={filters.type}
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              >
                <option value="">All Types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Training
              </span>
              <select
                name="training"
                defaultValue={filters.training}
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              >
                <option value="">All Training</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="complete">Complete</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Photo
              </span>
              <select
                name="photo"
                defaultValue={filters.photo}
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              >
                <option value="">All Photos</option>
                <option value="missing">Missing</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Rewards
              </span>
              <select
                name="rewards"
                defaultValue={filters.rewards}
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              >
                <option value="">All Rewards</option>
                <option value="none">No Rewards</option>
                <option value="pending">Pending/Approved</option>
                <option value="ready">Ready for Payout</option>
                <option value="paid">Paid</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Attention
              </span>
              <select
                name="attention"
                defaultValue={filters.attention}
                className="min-h-11 w-full rounded-2xl border border-[#dbe8d5] bg-white px-4 py-2 text-sm font-bold text-[#102819] outline-none transition focus:border-[#2f6f3e] focus:ring-4 focus:ring-[#2f6f3e]/10"
              >
                <option value="">All Records</option>
                <option value="yes">Needs Attention</option>
                <option value="no">No Attention Needed</option>
                <option value="workspace">Missing Workspace</option>
                <option value="role">Role Issues</option>
                <option value="verification">Verification Pending</option>
                <option value="setup">Required Setup Missing</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-slate-500">
              Showing {ambassadors.length} of {allAmbassadors.length} Ambassador records.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {activeFilters ? (
                <Link
                  href="/admin/ambassadors"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-xs font-black text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
                >
                  Clear Filters
                </Link>
              ) : null}
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#2f6f3e] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#255b33]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {ambassadors.length === 0 ? (
        <div className="p-6 text-sm font-semibold text-slate-600">
          {allAmbassadors.length === 0
            ? "No Ambassador records are available yet."
            : "No Ambassador records match the current filters."}
        </div>
      ) : (
        <div className="grid gap-4 p-4 sm:p-5">
          {ambassadors.map((ambassador) => {
            const ambassadorName = getAmbassadorName(ambassador);
            const archived = isArchivedAmbassador(ambassador);
            const hasPhoto = Boolean(ambassador.ambassador_photo_url);
            const trainingPercent = numberValue(ambassador.training_percent);
            const referralTotal =
              numberValue(ambassador.pet_parent_signups) +
              numberValue(ambassador.guru_signups) +
              numberValue(ambassador.business_signups);
            const rewardsTotal =
              numberValue(ambassador.pending_rewards) +
              numberValue(ambassador.approved_rewards) +
              numberValue(ambassador.ready_for_payout_rewards) +
              numberValue(ambassador.paid_rewards);
            const missingWorkspace = isMissingAmbassadorWorkspace(ambassador);
            const attentionItems = ambassador.attention_items || [];

            return (
              <article
                key={ambassador.ambassador_id}
                className={`rounded-[1.6rem] border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 ${
                  hasNeedsAttention(ambassador)
                    ? "border-rose-200 hover:border-rose-300"
                    : "border-[#e2ecd9] hover:border-[#b9d5b7]"
                }`}
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,0.85fr)] xl:items-start">
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                    <AmbassadorPhoto ambassador={ambassador} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-lg font-black leading-tight text-[#102819] sm:text-xl">
                            {ambassadorName}
                          </p>
                          <p className="mt-1 break-words text-sm font-semibold text-slate-600">
                            {ambassador.email || "No email saved"}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            {ambassador.phone || "No phone saved"}
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#2f6f3e]">
                            {getLocationLabel(ambassador)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(
                            archived ? "archived" : ambassador.status,
                          )}`}
                        >
                          {archived ? "Archived" : prettyStatus(ambassador.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Link
                          href={getPrimaryAdminHref(ambassador)}
                          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#2f6f3e] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#255b33]"
                        >
                          {getPrimaryAdminLabel(ambassador)}
                        </Link>
                        <Link
                          href={buildAmbassadorDirectMessageHref(ambassador)}
                          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#cfe4c8] bg-white px-4 py-2 text-sm font-black text-[#2f6f3e] shadow-sm transition hover:bg-[#eef7ea]"
                        >
                          Message
                        </Link>
                        {!missingWorkspace ? (
                          <Link
                            href={getAccountLifecycleHref(ambassador)}
                            className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100 sm:col-span-2"
                          >
                            Account Lifecycle Diagnostics
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-[#edf3e8] bg-[#f8fbf6] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Ambassador Type
                      </p>
                      <p className="mt-2 text-sm font-black text-[#102819]">
                        {getAmbassadorTypeLabel(ambassador)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {getSourceLabel(ambassador)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {ambassador.program || ambassador.internal_role || "Program not saved"}
                      </p>
                      <div className="mt-3 space-y-1 border-t border-[#e2ecd9] pt-3 text-[11px] font-bold text-slate-600">
                        <p>Profile role: {ambassador.profile_role || "Not saved"}</p>
                        <p>Account type: {ambassador.account_type || "Not saved"}</p>
                        <p>
                          Assigned roles: {ambassador.assigned_roles?.join(", ") || "None saved"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#edf3e8] bg-[#f8fbf6] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Referral Code
                      </p>
                      <p className="mt-2 break-words rounded-xl bg-[#f0f7ed] px-3 py-2 text-sm font-black text-[#2f6f3e] ring-1 ring-[#dbe8d5]">
                        {ambassador.referral_code || "Not saved"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ${photoStatusClass(
                            hasPhoto,
                            ambassador.photo_approved,
                          )}`}
                        >
                          {getPhotoStatusLabel(hasPhoto, ambassador.photo_approved)}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ${
                            missingWorkspace
                              ? "bg-rose-100 text-rose-800 ring-rose-200"
                              : "bg-emerald-100 text-emerald-800 ring-emerald-200"
                          }`}
                        >
                          {missingWorkspace ? "Workspace Missing" : "Workspace Ready"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Training
                        </p>
                        <span className="text-xs font-black text-[#102819]">
                          {trainingPercent}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {prettyStatus(ambassador.training_status)}
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${trainingClass(trainingPercent)}`}
                          style={{ width: `${trainingPercent}%` }}
                        />
                      </div>
                      <div className="mt-3 border-t border-[#e2ecd9] pt-3 text-xs font-bold leading-5 text-slate-600">
                        <p>Onboarding: {numberValue(ambassador.onboarding_percent)}%</p>
                        <p>
                          Rank: {ambassador.ambassador_rank || "Bronze"} ({numberValue(ambassador.ambassador_points)} pts)
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Referrals
                      </p>
                      <div className="mt-2 text-xs font-bold leading-5 text-slate-600">
                        <p>{numberValue(ambassador.pet_parent_signups)} Pet Parents</p>
                        <p>{numberValue(ambassador.guru_signups)} Gurus</p>
                        <p>{numberValue(ambassador.business_signups)} Businesses</p>
                        <p>{numberValue(ambassador.community_leads)} Community leads</p>
                        <p>{numberValue(ambassador.referral_clicks)} Link clicks</p>
                        <p>{numberValue(ambassador.qualified_referrals)} Qualified</p>
                        <p>{numberValue(ambassador.social_signups)} Social signups</p>
                        <p className="mt-1 text-[11px] font-bold text-slate-500">
                          FB {numberValue(ambassador.facebook_signups)} · IG {numberValue(ambassador.instagram_signups)} · TikTok {numberValue(ambassador.tiktok_signups)} · X {numberValue(ambassador.x_signups)} · YouTube {numberValue(ambassador.youtube_signups)}
                        </p>
                        <p className="mt-1 font-black text-[#102819]">
                          {referralTotal} signup records
                        </p>
                        <p className="mt-1 text-[11px] font-bold text-slate-500">
                          Pipeline: {numberValue(ambassador.lead_new)} new · {numberValue(ambassador.lead_contacted)} contacted · {numberValue(ambassador.lead_interested)} interested · {numberValue(ambassador.lead_applied)} applied · {numberValue(ambassador.lead_active)} active
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#edf3e8] bg-[#fbfcf9] p-4 sm:col-span-2 xl:col-span-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Rewards
                      </p>
                      <div className="mt-2 text-xs font-bold leading-5 text-slate-600">
                        <p>Pending: {currency(ambassador.pending_rewards)}</p>
                        <p>Approved: {currency(ambassador.approved_rewards)}</p>
                        <p>Ready: {currency(ambassador.ready_for_payout_rewards)}</p>
                        <p>Paid: {currency(ambassador.paid_rewards)}</p>
                        <p className="mt-1 font-black text-[#102819]">
                          {currency(rewardsTotal)} total
                        </p>
                        <p
                          className={`mt-2 text-[11px] font-black ${
                            ambassador.payout_ready
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          {ambassador.payout_ready
                            ? "Payout setup ready"
                            : `Payout blockers: ${
                                ambassador.payout_blockers?.join(", ") ||
                                "Setup incomplete"
                              }`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {hasNeedsAttention(ambassador) ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-rose-900">
                          Admin attention required
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {attentionItems.map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-rose-800 ring-1 ring-rose-200"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                        <p className="mt-3 text-xs font-semibold text-rose-800">
                          Auth created: {formatDateTime(
                            ambassador.auth_created_at || ambassador.created_at,
                          )} · Last activity: {formatDateTime(
                            ambassador.last_activity_at,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function AdminAmbassadorsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase() || "";

  if (!user || !SUPER_USER_EMAILS.has(email)) {
    redirect("/admin/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);

  const { data, error } = await supabase
    .from("admin_ambassador_dashboard_summary")
    .select("*")
    .order("created_at", { ascending: false });

  const summaryRows = (data || []) as AmbassadorSummaryRow[];

  const [
    authUsers,
    profileRows,
    roleRows,
    referralRows,
    leadRows,
    rewardRows,
    activityRows,
    trainingStepRows,
    trainingProgressRows,
    onboardingRows,
  ] = await Promise.all([
    loadAllAuthUsers(),
    loadOptionalAdminRows("profiles"),
    loadOptionalAdminRows("user_roles"),
    loadOptionalAdminRows("ambassador_referrals"),
    loadOptionalAdminRows("ambassador_leads"),
    loadOptionalAdminRows("ambassador_rewards"),
    loadOptionalAdminRows("ambassador_activity_log"),
    loadOptionalAdminRows("ambassador_training_steps"),
    loadOptionalAdminRows("ambassador_training_progress"),
    loadOptionalAdminRows("ambassador_onboarding_packets"),
  ]);

  let detailRows: AmbassadorDetailRow[] = [];

  if (summaryRows.length > 0) {
    const realAmbassadorIds = summaryRows
      .map((row) => row.ambassador_id)
      .filter((id) => id && !id.startsWith("pending:"));

    if (realAmbassadorIds.length > 0) {
      const { data: detailData, error: detailError } = await supabaseAdmin
        .from("ambassadors")
        .select("*")
        .in("id", realAmbassadorIds);

      if (detailError) {
        console.warn("Unable to load Ambassador detail enrichment:", detailError.message);
      }

      detailRows = (detailData || []) as AmbassadorDetailRow[];
    }
  }

  const ambassadors = buildUnifiedAmbassadorRows({
    summaryRows,
    detailRows,
    profileRows,
    roleRows,
    authUsers,
    referralRows,
    leadRows,
    rewardRows,
    activityRows,
    trainingStepRows,
    trainingProgressRows,
    onboardingRows,
  });

  const registryFilters = buildRegistryFilters(resolvedSearchParams);
  const registryAmbassadors = filterAmbassadorsForRegistry(
    ambassadors,
    registryFilters,
  );

  const cards = buildAdminCards(ambassadors);
  const pipelineCards = cards.filter((card) => card.group === "Pipeline");
  const performanceCards = cards.filter((card) => card.group === "Performance");
  const rewardCards = cards.filter((card) => card.group === "Rewards");

  const activeCount = ambassadors.filter(
    (row) => row.status === "active",
  ).length;
  const onboardingCount = ambassadors.filter((row) =>
    ["conditional_offer_sent", "onboarding_sent"].includes(row.status || ""),
  ).length;
  const archivedCount = ambassadors.filter(isArchivedAmbassador).length;
  const photoPendingCount = ambassadors.filter(
    (row) => row.ambassador_photo_url && !row.photo_approved,
  ).length;
  const photoApprovedCount = ambassadors.filter(
    (row) => row.ambassador_photo_url && row.photo_approved,
  ).length;
  const newSignupCount = ambassadors.filter((row) =>
    isWithinDays(row.auth_created_at || row.created_at, 7),
  ).length;
  const needsAttentionCount = ambassadors.filter(hasNeedsAttention).length;
  const missingWorkspaceCount = ambassadors.filter(
    isMissingAmbassadorWorkspace,
  ).length;

  const activeAmbassadors = ambassadors.filter(
    (row) => row.status === "active" && !isArchivedAmbassador(row),
  );
  const onboardingAmbassadors = ambassadors.filter(
    (row) =>
      ["conditional_offer_sent", "onboarding_sent", "new"].includes(
        row.status || "",
      ) && !isArchivedAmbassador(row),
  );
  const paCareerLinkAmbassadors = ambassadors.filter(
    (row) => getAmbassadorCategory(row) === "PA CareerLink",
  );
  const studentAmbassadors = ambassadors.filter(
    (row) => getAmbassadorCategory(row) === "Student",
  );
  const otherAmbassadors = ambassadors.filter((row) => {
    const category = getAmbassadorCategory(row);

    return (
      !isArchivedAmbassador(row) &&
      category !== "PA CareerLink" &&
      category !== "Student" &&
      row.status !== "active" &&
      !["conditional_offer_sent", "onboarding_sent", "new"].includes(
        row.status || "",
      )
    );
  });
  const archivedAmbassadors = ambassadors.filter(isArchivedAmbassador);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f8f3] px-3 py-5 text-[#17351f] sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-[2rem] border border-[#dbe8d5] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#2f6f3e]">
                Admin / Ambassador Intelligence
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102819] sm:text-4xl">
                Ambassador Intelligence
              </h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                View every Ambassador in one clean registry. Track onboarding,
                training, referral codes, Pet Parent and Guru referrals, rewards,
                payout readiness, direct messages, admin dashboard access,
                signup provisioning, role health, canonical social attribution,
                onboarding packets, training progress, and Stripe payout readiness.
                {photoApprovedCount > 0
                  ? ` ${photoApprovedCount} Ambassador photos are approved.`
                  : ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[520px] xl:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Active
                </p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-900">
                  {activeCount}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Onboarding
                </p>
                <p className="mt-1 text-2xl font-extrabold text-blue-900">
                  {onboardingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                  Archived
                </p>
                <p className="mt-1 text-2xl font-extrabold text-red-900">
                  {archivedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Photos Pending
                </p>
                <p className="mt-1 text-2xl font-extrabold text-amber-900">
                  {photoPendingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                  New Signups (7d)
                </p>
                <p className="mt-1 text-2xl font-extrabold text-violet-900">
                  {newSignupCount}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                  Needs Attention
                </p>
                <p className="mt-1 text-2xl font-extrabold text-rose-900">
                  {needsAttentionCount}
                </p>
                <p className="mt-1 text-[10px] font-bold text-rose-700">
                  {missingWorkspaceCount} missing workspace
                </p>
              </div>
            </div>
          </div>
        </section>

        {notice ? (
          <NoticeCard
            title={notice.title}
            message={notice.message}
            tone={notice.tone}
          />
        ) : null}

        {error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
            <h2 className="text-lg font-extrabold">Ambassador data error</h2>
            <p className="mt-2 text-sm">
              SitGuru could not load the ambassador summary view. Supabase
              returned:
            </p>
            <pre className="mt-3 overflow-auto rounded-2xl bg-white p-4 text-xs">
              {error.message}
            </pre>
          </section>
        ) : null}

        <SignupHealthSection ambassadors={ambassadors} />

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[2rem] border border-[#dbe8d5] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#2f6f3e]" />
              <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#102819]">
                Pipeline
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {pipelineCards.map((card) => (
                <DashboardStatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  detail={card.subtext}
                  icon={card.icon}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#dbe8d5] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#2f6f3e]" />
              <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#102819]">
                Performance
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {performanceCards.map((card) => (
                <DashboardStatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  detail={card.subtext}
                  icon={card.icon}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#dbe8d5] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-[#2f6f3e]" />
              <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#102819]">
                Rewards & Payouts
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {rewardCards.map((card) => (
                <DashboardStatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  detail={card.subtext}
                  icon={card.icon}
                />
              ))}
            </div>
          </div>
        </section>

        <AmbassadorRegistryTable
          ambassadors={registryAmbassadors}
          allAmbassadors={ambassadors}
          filters={registryFilters}
        />
      </div>
    </main>
  );
}

function NoticeCard({
  title,
  message,
  tone,
}: {
  title: string;
  message: string;
  tone: "success" | "warning";
}) {
  return (
    <div
      className={`rounded-[24px] border p-4 ${
        tone === "success"
          ? "border-green-200 bg-green-50 text-green-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6">{message}</p>
    </div>
  );
}