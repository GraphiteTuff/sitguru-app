/**
 * Security-isolated Pet Officer query helpers (Delilah + Scout).
 *
 * SERVER ONLY — do not import from client components.
 *
 * Guarantees:
 * - Delilah tools filter exclusively by the calling Ambassador's session /
 *   ledger profile id. Global platform financial ledgers are blocked.
 * - Scout tools filter exclusively by the logged-in Guru's provider /
 *   user id. Parent user matrices are blocked.
 * - Every DB field is read with optional chaining / defensive defaults so a
 *   blank profile row or unconfigured payout field never crashes a server
 *   component or stream handler.
 */

import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findAmbassadorProfileByUserId } from "@/lib/ambassador/ledger";

/* -------------------------------------------------------------------------- */
/* Shared defensive helpers                                                   */
/* -------------------------------------------------------------------------- */

type AnyRow = Record<string, unknown>;

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%\s,()]/g, ""));
    if (!Number.isFinite(parsed)) return 0;
    return value.includes("(") && value.includes(")") ? -parsed : parsed;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function safeIso(value: unknown) {
  const raw = asString(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

/** Explicit block list — guest officers must never query these. */
export const BLOCKED_GLOBAL_LEDGER_TABLES = [
  "commission_ledger",
  "general_ledger",
  "admin_financial_snapshots",
  "platform_payout_batches",
  "parent_user_matrix",
  "user_matrices",
] as const;

export function assertGuestSafeTable(table: string) {
  const normalized = asString(table).toLowerCase();
  if (
    BLOCKED_GLOBAL_LEDGER_TABLES.some(
      (blocked) =>
        normalized === blocked || normalized.includes("global_ledger"),
    )
  ) {
    throw new Error(
      `Blocked: guest Pet Officers cannot query global ledger table "${table}".`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Zod input schemas (read-only query helpers)                                */
/* -------------------------------------------------------------------------- */

export const AmbassadorSessionSchema = z.object({
  /** Supabase auth user id for the calling Ambassador session. */
  sessionUserId: z
    .string()
    .uuid()
    .describe("Calling Ambassador's authenticated session user id"),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

export const GuruProviderSessionSchema = z.object({
  /** Supabase auth user id for the logged-in Guru. */
  sessionUserId: z
    .string()
    .uuid()
    .describe("Logged-in Guru's authenticated session user id"),
  /** Optional gurus.id provider row — still scoped to this user. */
  providerId: z.string().uuid().optional().nullable(),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

export type AmbassadorSessionInput = z.infer<typeof AmbassadorSessionSchema>;
export type GuruProviderSessionInput = z.infer<typeof GuruProviderSessionSchema>;

/* -------------------------------------------------------------------------- */
/* Delilah — Ambassador Advocate tools                                        */
/* -------------------------------------------------------------------------- */

export const AMBASSADOR_SOCIAL_MILESTONES = [
  { signups: 25, label: "25 verified social signups", reward: 25 },
  { signups: 50, label: "50 verified social signups", reward: 100 },
  { signups: 150, label: "150 verified social signups", reward: 200 },
] as const;

export type AmbassadorReferralRow = {
  referralId: string;
  referredRole: string;
  commissionEarned: number;
  payoutStatus: string;
  totalBookingValue: number;
  createdAt: string | null;
};

export type PendingCommissionSummary = {
  profileId: string | null;
  displayName: string;
  referralCode: string;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  lifetimePaid: number;
  items: AmbassadorReferralRow[];
};

export type MilestoneProgressSummary = {
  verifiedSignups: number;
  linkClicks: number;
  milestones: Array<{
    signups: number;
    label: string;
    reward: number;
    reached: boolean;
    remaining: number;
  }>;
  nextMilestone: {
    signups: number;
    label: string;
    reward: number;
    remaining: number;
  } | null;
};

/**
 * Fetch referrals for the calling Ambassador only (session user id → ledger
 * profile). Never returns global platform referral ledgers.
 */
export async function getAmbassadorReferrals(
  input: AmbassadorSessionInput,
): Promise<{
  ok: boolean;
  profileId: string | null;
  referrals: AmbassadorReferralRow[];
  total: number;
  message: string;
}> {
  try {
    const parsed = AmbassadorSessionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        profileId: null,
        referrals: [],
        total: 0,
        message: "Invalid Ambassador session scope.",
      };
    }

    const sessionUserId = parsed.data.sessionUserId;
    const limit = parsed.data.limit ?? 20;
    const profile = await findAmbassadorProfileByUserId(sessionUserId).catch(
      () => null,
    );
    const profileId = asString(profile?.id) || null;

    if (!profileId) {
      return {
        ok: true,
        profileId: null,
        referrals: [],
        total: 0,
        message:
          "No ambassador ledger profile yet — referrals will appear once your code is live.",
      };
    }

    assertGuestSafeTable("ambassador_referrals");

    const { data, error } = await supabaseAdmin
      .from("ambassador_referrals")
      .select(
        "referral_id,referred_role,commission_earned,payout_status,total_booking_value,created_at,ambassador_id",
      )
      .eq("ambassador_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return {
        ok: false,
        profileId,
        referrals: [],
        total: 0,
        message: error?.message || "Unable to load referrals.",
      };
    }

    const rows = (Array.isArray(data) ? data : []) as AnyRow[];
    const referrals: AmbassadorReferralRow[] = rows.map((row) => ({
      referralId: asString(row?.referral_id) || asString(row?.id) || "—",
      referredRole: asString(row?.referred_role) || "unknown",
      commissionEarned: asNumber(row?.commission_earned),
      payoutStatus: asString(row?.payout_status) || "UNKNOWN",
      totalBookingValue: asNumber(row?.total_booking_value),
      createdAt: safeIso(row?.created_at),
    }));

    return {
      ok: true,
      profileId,
      referrals,
      total: referrals.length,
      message: referrals.length
        ? `Loaded ${referrals.length} referral(s) for your pack.`
        : "No referrals yet — keep sniffing out new leads!",
    };
  } catch (error) {
    return {
      ok: false,
      profileId: null,
      referrals: [],
      total: 0,
      message:
        error instanceof Error ? error.message : "Referral lookup failed.",
    };
  }
}

/**
 * Pending / approved treat commissions for this Ambassador only.
 * Blocks all global platform financial ledgers.
 */
export async function getPendingCommissions(
  input: AmbassadorSessionInput,
): Promise<{
  ok: boolean;
  summary: PendingCommissionSummary;
  message: string;
}> {
  const empty: PendingCommissionSummary = {
    profileId: null,
    displayName: "",
    referralCode: "",
    pendingCount: 0,
    pendingAmount: 0,
    approvedCount: 0,
    approvedAmount: 0,
    lifetimePaid: 0,
    items: [],
  };

  try {
    const parsed = AmbassadorSessionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        summary: empty,
        message: "Invalid Ambassador session scope.",
      };
    }

    const profile = await findAmbassadorProfileByUserId(
      parsed.data.sessionUserId,
    ).catch(() => null);

    const profileId = asString(profile?.id) || null;
    if (!profileId) {
      return {
        ok: true,
        summary: empty,
        message: "No commission profile yet — treat commissions unlock after your first verified referral.",
      };
    }

    assertGuestSafeTable("ambassador_referrals");

    const { data, error } = await supabaseAdmin
      .from("ambassador_referrals")
      .select(
        "referral_id,referred_role,commission_earned,payout_status,total_booking_value,created_at",
      )
      .eq("ambassador_id", profileId)
      .in("payout_status", ["PENDING_AUDIT", "APPROVED"])
      .order("created_at", { ascending: false })
      .limit(parsed.data.limit ?? 20);

    if (error) {
      return {
        ok: false,
        summary: {
          ...empty,
          profileId,
          displayName: asString(profile?.display_name),
          referralCode: asString(profile?.referral_code_slug),
          lifetimePaid: asNumber(profile?.lifetime_payouts_sum),
        },
        message: error?.message || "Unable to load pending commissions.",
      };
    }

    const rows = (Array.isArray(data) ? data : []) as AnyRow[];
    const items: AmbassadorReferralRow[] = rows.map((row) => ({
      referralId: asString(row?.referral_id) || "—",
      referredRole: asString(row?.referred_role) || "unknown",
      commissionEarned: asNumber(row?.commission_earned),
      payoutStatus: asString(row?.payout_status) || "UNKNOWN",
      totalBookingValue: asNumber(row?.total_booking_value),
      createdAt: safeIso(row?.created_at),
    }));

    const pendingItems = items.filter(
      (item) => item.payoutStatus === "PENDING_AUDIT",
    );
    const approvedItems = items.filter(
      (item) => item.payoutStatus === "APPROVED",
    );

    const summary: PendingCommissionSummary = {
      profileId,
      displayName:
        asString(profile?.display_name) ||
        asString(profile?.referral_code_slug) ||
        "Ambassador",
      referralCode: asString(profile?.referral_code_slug),
      pendingCount: pendingItems.length,
      pendingAmount: pendingItems.reduce(
        (sum, item) => sum + item.commissionEarned,
        0,
      ),
      approvedCount: approvedItems.length,
      approvedAmount: approvedItems.reduce(
        (sum, item) => sum + item.commissionEarned,
        0,
      ),
      lifetimePaid: asNumber(profile?.lifetime_payouts_sum),
      items,
    };

    return {
      ok: true,
      summary,
      message: `Treat commissions: ${money(summary.pendingAmount)} pending audit · ${money(summary.approvedAmount)} approved.`,
    };
  } catch (error) {
    return {
      ok: false,
      summary: empty,
      message:
        error instanceof Error
          ? error.message
          : "Pending commission lookup failed.",
    };
  }
}

/**
 * Milestone progress for growing the pack — scoped to this Ambassador's
 * referrals + link clicks only.
 */
export async function getMilestoneProgress(
  input: AmbassadorSessionInput,
): Promise<{
  ok: boolean;
  progress: MilestoneProgressSummary;
  message: string;
}> {
  const empty: MilestoneProgressSummary = {
    verifiedSignups: 0,
    linkClicks: 0,
    milestones: AMBASSADOR_SOCIAL_MILESTONES.map((m) => ({
      ...m,
      reached: false,
      remaining: m.signups,
    })),
    nextMilestone: {
      signups: AMBASSADOR_SOCIAL_MILESTONES[0].signups,
      label: AMBASSADOR_SOCIAL_MILESTONES[0].label,
      reward: AMBASSADOR_SOCIAL_MILESTONES[0].reward,
      remaining: AMBASSADOR_SOCIAL_MILESTONES[0].signups,
    },
  };

  try {
    const parsed = AmbassadorSessionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        progress: empty,
        message: "Invalid Ambassador session scope.",
      };
    }

    const profile = await findAmbassadorProfileByUserId(
      parsed.data.sessionUserId,
    ).catch(() => null);
    const profileId = asString(profile?.id) || null;

    if (!profileId) {
      return {
        ok: true,
        progress: empty,
        message: "Milestone tracking starts once your Ambassador profile is live.",
      };
    }

    assertGuestSafeTable("ambassador_referrals");
    assertGuestSafeTable("ambassador_clicks");

    const [{ data: referrals, error: refError }, { data: clicks, error: clickError }] =
      await Promise.all([
        supabaseAdmin
          .from("ambassador_referrals")
          .select("referral_id,payout_status")
          .eq("ambassador_id", profileId)
          .limit(500),
        supabaseAdmin
          .from("ambassador_clicks")
          .select("created_at")
          .eq("ambassador_id", profileId)
          .limit(2000),
      ]);

    if (refError || clickError) {
      return {
        ok: false,
        progress: empty,
        message:
          refError?.message ||
          clickError?.message ||
          "Unable to load milestone progress.",
      };
    }

    const referralRows = (Array.isArray(referrals) ? referrals : []) as AnyRow[];
    const verifiedSignups = referralRows.filter((row) => {
      const status = asString(row?.payout_status).toUpperCase();
      return status !== "VOID";
    }).length;
    const linkClicks = (Array.isArray(clicks) ? clicks : []).length;

    const milestones = AMBASSADOR_SOCIAL_MILESTONES.map((m) => ({
      signups: m.signups,
      label: m.label,
      reward: m.reward,
      reached: verifiedSignups >= m.signups,
      remaining: Math.max(0, m.signups - verifiedSignups),
    }));

    const next = milestones.find((m) => !m.reached) || null;

    return {
      ok: true,
      progress: {
        verifiedSignups,
        linkClicks,
        milestones,
        nextMilestone: next
          ? {
              signups: next.signups,
              label: next.label,
              reward: next.reward,
              remaining: next.remaining,
            }
          : null,
      },
      message: next
        ? `${verifiedSignups} verified signups · ${linkClicks} link clicks · ${next.remaining} more to hit ${next.label}.`
        : `${verifiedSignups} verified signups · all social milestones unlocked!`,
    };
  } catch (error) {
    return {
      ok: false,
      progress: empty,
      message:
        error instanceof Error
          ? error.message
          : "Milestone progress lookup failed.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Scout — Guru Logistics Captain tools                                       */
/* -------------------------------------------------------------------------- */

export type AssignedWalkRow = {
  bookingId: string;
  petName: string;
  serviceType: string;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  parentLabel: string;
};

export type UniversityCertificationSummary = {
  badgeStatus: string;
  certificateStatus: string;
  issuedAt: string | null;
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
  isComplete: boolean;
  certificationLabel: string;
};

export type ProviderPayoutCacheSummary = {
  providerId: string | null;
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  stripeReady: boolean;
  paypalReady: boolean;
  connectedCount: number;
  statusLabel: string;
  recentPayoutHints: Array<{
    bookingId: string;
    amount: number;
    status: string;
    completedAt: string | null;
  }>;
};

async function resolveGuruProviderScope(input: GuruProviderSessionInput): Promise<{
  sessionUserId: string;
  providerId: string | null;
  guruIds: string[];
  guruRow: AnyRow | null;
}> {
  const parsed = GuruProviderSessionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      sessionUserId: "",
      providerId: null,
      guruIds: [],
      guruRow: null,
    };
  }

  const sessionUserId = parsed.data.sessionUserId;
  const requestedProviderId = asString(parsed.data.providerId) || null;

  let guruRow: AnyRow | null = null;

  try {
    const byUser = await supabaseAdmin
      .from("gurus")
      .select(
        "id,user_id,email,full_name,display_name,stripe_account_id,stripe_onboarding_complete,charges_enabled,payouts_enabled",
      )
      .eq("user_id", sessionUserId)
      .maybeSingle();

    if (!byUser.error && byUser.data) {
      guruRow = byUser.data as AnyRow;
    }
  } catch {
    guruRow = null;
  }

  // If a providerId was supplied, only honor it when it belongs to this user.
  const ownedProviderId = asString(guruRow?.id) || null;
  const providerId =
    requestedProviderId &&
    ownedProviderId &&
    requestedProviderId === ownedProviderId
      ? requestedProviderId
      : ownedProviderId;

  const guruIds = Array.from(
    new Set(
      [providerId, asString(guruRow?.user_id), sessionUserId]
        .map((value) => asString(value))
        .filter(Boolean),
    ),
  );

  return { sessionUserId, providerId, guruIds, guruRow };
}

/**
 * Assigned walks / bookings for this Guru provider only.
 * Blocks parent user matrices.
 */
export async function getAssignedWalks(
  input: GuruProviderSessionInput,
): Promise<{
  ok: boolean;
  providerId: string | null;
  walks: AssignedWalkRow[];
  total: number;
  message: string;
}> {
  try {
    const scope = await resolveGuruProviderScope(input);
    if (!scope.sessionUserId || !scope.guruIds.length) {
      return {
        ok: false,
        providerId: null,
        walks: [],
        total: 0,
        message: "Invalid Guru provider session scope.",
      };
    }

    assertGuestSafeTable("bookings");

    const limit = input?.limit ?? 20;
    let rows: AnyRow[] = [];

    const bySitter = await supabaseAdmin
      .from("bookings")
      .select(
        "id,pet_name,animal_name,service_type,service,status,start_time,end_time,scheduled_start,scheduled_end,customer_name,parent_name,sitter_id,guru_id,provider_id",
      )
      .in("sitter_id", scope.guruIds)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!bySitter.error && Array.isArray(bySitter.data) && bySitter.data.length) {
      rows = bySitter.data as AnyRow[];
    } else {
      const byGuru = await supabaseAdmin
        .from("bookings")
        .select(
          "id,pet_name,animal_name,service_type,service,status,start_time,end_time,scheduled_start,scheduled_end,customer_name,parent_name,sitter_id,guru_id,provider_id",
        )
        .in("guru_id", scope.guruIds)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!byGuru.error && Array.isArray(byGuru.data)) {
        rows = byGuru.data as AnyRow[];
      } else if (byGuru.error && bySitter.error) {
        // Try provider_id as last resort — still scoped to this Guru.
        const byProvider = await supabaseAdmin
          .from("bookings")
          .select(
            "id,pet_name,animal_name,service_type,service,status,start_time,end_time,scheduled_start,scheduled_end,customer_name,parent_name,sitter_id,guru_id,provider_id",
          )
          .in("provider_id", scope.guruIds)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (!byProvider.error && Array.isArray(byProvider.data)) {
          rows = byProvider.data as AnyRow[];
        }
      }
    }

    const walks: AssignedWalkRow[] = rows.map((row) => ({
      bookingId: asString(row?.id) || "—",
      petName:
        asString(row?.pet_name) ||
        asString(row?.animal_name) ||
        "Pet",
      serviceType:
        asString(row?.service_type) ||
        asString(row?.service) ||
        "Care visit",
      status: asString(row?.status) || "unknown",
      scheduledStart:
        safeIso(row?.scheduled_start) ||
        safeIso(row?.start_time),
      scheduledEnd:
        safeIso(row?.scheduled_end) ||
        safeIso(row?.end_time),
      // Display label only — never dump parent user matrices.
      parentLabel:
        asString(row?.customer_name) ||
        asString(row?.parent_name) ||
        "Pet Parent",
    }));

    return {
      ok: true,
      providerId: scope.providerId,
      walks,
      total: walks.length,
      message: walks.length
        ? `Tracking the trail on ${walks.length} assigned visit(s).`
        : "No assigned walks on the board yet — check back after your next booking.",
    };
  } catch (error) {
    return {
      ok: false,
      providerId: null,
      walks: [],
      total: 0,
      message:
        error instanceof Error ? error.message : "Assigned walks lookup failed.",
    };
  }
}

/**
 * University / certification progress for this Guru only.
 */
export async function getUniversityCertifications(
  input: GuruProviderSessionInput,
): Promise<{
  ok: boolean;
  certification: UniversityCertificationSummary;
  message: string;
}> {
  const empty: UniversityCertificationSummary = {
    badgeStatus: "Locked",
    certificateStatus: "not_started",
    issuedAt: null,
    totalSteps: 0,
    completedSteps: 0,
    progressPercent: 0,
    isComplete: false,
    certificationLabel: "Certified Guru: Not started",
  };

  try {
    const scope = await resolveGuruProviderScope(input);
    if (!scope.sessionUserId) {
      return {
        ok: false,
        certification: empty,
        message: "Invalid Guru provider session scope.",
      };
    }

    assertGuestSafeTable("academy_certifications");

    const academyType = "guru";
    const [
      certificationResult,
      stepsResult,
      stepProgressResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("academy_certifications")
        .select("badge_status,certificate_status,issued_at")
        .eq("academy_type", academyType)
        .eq("user_id", scope.sessionUserId)
        .maybeSingle(),
      supabaseAdmin
        .from("ambassador_training_steps")
        .select("id,step_number,is_active")
        .eq("academy_type", academyType)
        .eq("is_active", true)
        .order("step_number", { ascending: true }),
      supabaseAdmin
        .from("academy_step_progress")
        .select("training_step_id,status,completed_at")
        .eq("academy_type", academyType)
        .eq("user_id", scope.sessionUserId),
    ]);

    const certRow = (certificationResult?.data || null) as AnyRow | null;
    const steps = Array.isArray(stepsResult?.data) ? stepsResult.data : [];
    const stepProgress = Array.isArray(stepProgressResult?.data)
      ? stepProgressResult.data
      : [];

    const totalSteps = steps.length || 1;
    const completedSteps = stepProgress.filter((row) => {
      const status = asString((row as AnyRow)?.status).toLowerCase();
      return (
        status === "completed" ||
        status === "complete" ||
        Boolean(safeIso((row as AnyRow)?.completed_at))
      );
    }).length;

    const progressPercent = Math.min(
      100,
      Math.round((completedSteps / Math.max(totalSteps, 1)) * 100),
    );
    const badgeStatus = asString(certRow?.badge_status) || "Locked";
    const certificateStatus =
      asString(certRow?.certificate_status) || "not_started";
    const isComplete =
      badgeStatus.toLowerCase() === "earned" ||
      badgeStatus.toLowerCase() === "unlocked" ||
      certificateStatus.toLowerCase() === "issued" ||
      progressPercent >= 100;

    const certification: UniversityCertificationSummary = {
      badgeStatus,
      certificateStatus,
      issuedAt: safeIso(certRow?.issued_at),
      totalSteps,
      completedSteps,
      progressPercent,
      isComplete,
      certificationLabel: isComplete
        ? "Certified Guru: Badge earned"
        : `Certified Guru: ${progressPercent}% · earning your certification badges`,
    };

    return {
      ok: true,
      certification,
      message: certification.certificationLabel,
    };
  } catch (error) {
    return {
      ok: false,
      certification: empty,
      message:
        error instanceof Error
          ? error.message
          : "University certification lookup failed.",
    };
  }
}

/**
 * Provider payout readiness cache for this Guru only.
 * Never touches parent user matrices or global admin payout ledgers.
 */
export async function getProviderPayoutCache(
  input: GuruProviderSessionInput,
): Promise<{
  ok: boolean;
  cache: ProviderPayoutCacheSummary;
  message: string;
}> {
  const empty: ProviderPayoutCacheSummary = {
    providerId: null,
    stripeAccountId: null,
    stripeOnboardingComplete: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    stripeReady: false,
    paypalReady: false,
    connectedCount: 0,
    statusLabel: "Payout setup not configured",
    recentPayoutHints: [],
  };

  try {
    const scope = await resolveGuruProviderScope(input);
    if (!scope.sessionUserId) {
      return {
        ok: false,
        cache: empty,
        message: "Invalid Guru provider session scope.",
      };
    }

    const guru = scope.guruRow;
    const stripeAccountId = asString(guru?.stripe_account_id) || null;
    const stripeOnboardingComplete = Boolean(
      guru?.stripe_onboarding_complete,
    );
    const chargesEnabled = Boolean(guru?.charges_enabled);
    const payoutsEnabled = Boolean(guru?.payouts_enabled);

    let stripeReady =
      Boolean(stripeAccountId) &&
      stripeOnboardingComplete &&
      chargesEnabled &&
      payoutsEnabled;
    let paypalReady = false;

    try {
      assertGuestSafeTable("user_payout_accounts");
      const { data } = await supabaseAdmin
        .from("user_payout_accounts")
        .select(
          "provider,onboarding_status,account_status,payouts_enabled,charges_enabled,details_submitted",
        )
        .eq("user_id", scope.sessionUserId)
        .in("provider", ["stripe", "paypal"]);

      for (const row of (Array.isArray(data) ? data : []) as AnyRow[]) {
        const provider = asString(row?.provider).toLowerCase();
        const onboardingStatus = asString(row?.onboarding_status).toLowerCase();
        const accountStatus = asString(row?.account_status).toLowerCase();
        const ready =
          row?.payouts_enabled === true ||
          onboardingStatus === "ready" ||
          accountStatus === "ready" ||
          accountStatus === "active";

        if (provider === "stripe") stripeReady = stripeReady || ready;
        if (provider === "paypal") paypalReady = paypalReady || ready;
      }
    } catch {
      // Unconfigured payout table — keep defaults.
    }

    const recentPayoutHints: ProviderPayoutCacheSummary["recentPayoutHints"] =
      [];

    try {
      assertGuestSafeTable("bookings");
      if (scope.guruIds.length) {
        const { data } = await supabaseAdmin
          .from("bookings")
          .select(
            "id,status,net_amount,guru_payout,payout_amount,completed_at,updated_at,sitter_id,guru_id",
          )
          .in("sitter_id", scope.guruIds)
          .order("updated_at", { ascending: false })
          .limit(5);

        for (const row of (Array.isArray(data) ? data : []) as AnyRow[]) {
          recentPayoutHints.push({
            bookingId: asString(row?.id) || "—",
            amount:
              asNumber(row?.guru_payout) ||
              asNumber(row?.payout_amount) ||
              asNumber(row?.net_amount),
            status: asString(row?.status) || "unknown",
            completedAt:
              safeIso(row?.completed_at) || safeIso(row?.updated_at),
          });
        }
      }
    } catch {
      // Blank booking payout fields are fine.
    }

    const connectedCount = Number(stripeReady) + Number(paypalReady);
    const statusLabel =
      connectedCount >= 2
        ? "Both payout options connected"
        : connectedCount === 1
          ? "One payout option ready"
          : stripeAccountId
            ? "Payout setup started — finish onboarding"
            : "Payout setup not configured";

    const cache: ProviderPayoutCacheSummary = {
      providerId: scope.providerId,
      stripeAccountId,
      stripeOnboardingComplete,
      chargesEnabled,
      payoutsEnabled,
      stripeReady,
      paypalReady,
      connectedCount,
      statusLabel,
      recentPayoutHints,
    };

    return {
      ok: true,
      cache,
      message: statusLabel,
    };
  } catch (error) {
    return {
      ok: false,
      cache: empty,
      message:
        error instanceof Error
          ? error.message
          : "Provider payout cache lookup failed.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Snapshot compilers for the generic stream endpoint                         */
/* -------------------------------------------------------------------------- */

export async function compileDelilahSnapshot(sessionUserId: string) {
  const scope = { sessionUserId, limit: 15 as const };
  const [referrals, commissions, milestones] = await Promise.all([
    getAmbassadorReferrals(scope),
    getPendingCommissions(scope),
    getMilestoneProgress(scope),
  ]);

  const lines: string[] = [
    "# Delilah · Ambassador Advocate Snapshot",
    `- Session user: ${sessionUserId}`,
    `- Profile id: ${referrals?.profileId ?? commissions?.summary?.profileId ?? "unconfigured"}`,
    "",
    "## Referrals (growing the pack)",
    `- Total loaded: ${referrals?.total ?? 0}`,
    `- Note: ${referrals?.message ?? ""}`,
  ];

  for (const row of referrals?.referrals?.slice?.(0, 8) ?? []) {
    lines.push(
      `- ${row?.referralId ?? "—"} · ${row?.referredRole ?? "?"} · ${money(row?.commissionEarned ?? 0)} · ${row?.payoutStatus ?? "?"} · ${row?.createdAt ?? "n/a"}`,
    );
  }

  const summary = commissions?.summary;
  lines.push(
    "",
    "## Treat commissions",
    `- Pending audit: ${summary?.pendingCount ?? 0} · ${money(summary?.pendingAmount ?? 0)}`,
    `- Approved: ${summary?.approvedCount ?? 0} · ${money(summary?.approvedAmount ?? 0)}`,
    `- Lifetime paid: ${money(summary?.lifetimePaid ?? 0)}`,
    `- Referral code: ${summary?.referralCode || "unconfigured"}`,
  );

  const progress = milestones?.progress;
  lines.push(
    "",
    "## Milestone progress",
    `- Verified signups: ${progress?.verifiedSignups ?? 0}`,
    `- Link clicks: ${progress?.linkClicks ?? 0}`,
  );
  for (const m of progress?.milestones ?? []) {
    lines.push(
      `- ${m?.label ?? ""} · reward $${m?.reward ?? 0} · ${m?.reached ? "REACHED" : `${m?.remaining ?? "?"} remaining`}`,
    );
  }

  lines.push(
    "",
    "## Security fence",
    "- Scope: this Ambassador session only.",
    "- Blocked: global platform financial ledgers.",
  );

  return {
    markdownContext: lines.join("\n"),
    referrals,
    commissions,
    milestones,
  };
}

export async function compileScoutSnapshot(
  sessionUserId: string,
  providerId?: string | null,
) {
  const scope = {
    sessionUserId,
    providerId: providerId || null,
    limit: 15 as const,
  };
  const [walks, certs, payouts] = await Promise.all([
    getAssignedWalks(scope),
    getUniversityCertifications(scope),
    getProviderPayoutCache(scope),
  ]);

  const lines: string[] = [
    "# Scout · Guru Logistics Captain Snapshot",
    `- Session user: ${sessionUserId}`,
    `- Provider id: ${walks?.providerId ?? payouts?.cache?.providerId ?? "unconfigured"}`,
    "",
    "## Assigned walks (tracking the trail)",
    `- Total loaded: ${walks?.total ?? 0}`,
    `- Note: ${walks?.message ?? ""}`,
  ];

  for (const walk of walks?.walks?.slice?.(0, 8) ?? []) {
    lines.push(
      `- ${walk?.bookingId ?? "—"} · ${walk?.petName ?? "Pet"} · ${walk?.serviceType ?? "Care"} · ${walk?.status ?? "?"} · start ${walk?.scheduledStart ?? "n/a"} · parent ${walk?.parentLabel ?? "Pet Parent"}`,
    );
  }

  const cert = certs?.certification;
  lines.push(
    "",
    "## University certifications (earning your certification badges)",
    `- Label: ${cert?.certificationLabel ?? "Not started"}`,
    `- Badge: ${cert?.badgeStatus ?? "Locked"} · Certificate: ${cert?.certificateStatus ?? "not_started"}`,
    `- Progress: ${cert?.completedSteps ?? 0}/${cert?.totalSteps ?? 0} (${cert?.progressPercent ?? 0}%)`,
    `- Issued: ${cert?.issuedAt ?? "n/a"}`,
  );

  const cache = payouts?.cache;
  lines.push(
    "",
    "## Provider payout cache",
    `- Status: ${cache?.statusLabel ?? "unconfigured"}`,
    `- Stripe ready: ${cache?.stripeReady ? "yes" : "no"} · PayPal ready: ${cache?.paypalReady ? "yes" : "no"}`,
    `- Stripe account: ${cache?.stripeAccountId ? "connected" : "blank"}`,
    `- Onboarding complete: ${cache?.stripeOnboardingComplete ? "yes" : "no"}`,
    `- Charges enabled: ${cache?.chargesEnabled ? "yes" : "no"} · Payouts enabled: ${cache?.payoutsEnabled ? "yes" : "no"}`,
  );

  for (const hint of cache?.recentPayoutHints?.slice?.(0, 5) ?? []) {
    lines.push(
      `- Booking ${hint?.bookingId ?? "—"} · ${money(hint?.amount ?? 0)} · ${hint?.status ?? "?"} · ${hint?.completedAt ?? "n/a"}`,
    );
  }

  lines.push(
    "",
    "## Security fence",
    "- Scope: this Guru provider session only.",
    "- Blocked: parent user matrices and admin global ledgers.",
  );

  return {
    markdownContext: lines.join("\n"),
    walks,
    certs,
    payouts,
  };
}
