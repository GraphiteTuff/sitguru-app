// lib/ambassador/ledger.ts
/**
 * Brand Ambassador click + referral ledger helpers (admin + self-service).
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import { getAppOrigin } from "@/lib/config/site";
import type {
  AmbassadorNetworkKpis,
  AmbassadorPerformanceRow,
  AmbassadorPayoutStatus,
  AmbassadorProfileRow,
} from "@/lib/ambassador/ledger-types";

function asNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeSlug(value: string) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

export function buildAmbassadorReferralLink(slug: string) {
  const code = normalizeSlug(slug);
  // Prefer existing short-link surface used by Ambassadors + QR flows
  return `${getAppOrigin()}/r/${encodeURIComponent(code)}`;
}

/**
 * Resolve ledger profile by slug, creating it from public.ambassadors when needed
 * so the performance ledger extends the live workspace table.
 */
const INACTIVE_AMBASSADOR_STATUSES = new Set([
  "archived",
  "inactive",
  "rejected",
  "declined",
  "not_a_fit",
  "paused",
  "suspended",
]);

function profileFromAmbassador(row: {
  id?: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  referral_code?: string | null;
  status?: string | null;
  city?: string | null;
  state?: string | null;
} | null) {
  if (!row?.id || !row.referral_code) return null;
  const status = String(row.status || "").toLowerCase();
  if (INACTIVE_AMBASSADOR_STATUSES.has(status)) return null;
  const code = normalizeSlug(row.referral_code);
  return {
    id: row.id,
    user_id: row.user_id || "",
    ambassador_record_id: row.id,
    referral_code_slug: code,
    display_name: row.full_name || row.email || code,
    region: [row.city, row.state].filter(Boolean).join(", "),
    commission_rate_per_booking: 0,
    lifetime_payouts_sum: 0,
    is_active: true,
  } as AmbassadorProfileRow;
}

export async function findAmbassadorProfileBySlug(slug: string) {
  const code = normalizeSlug(slug);
  if (!code) return null;

  const { data: ambassador, error } = await supabaseAdmin
    .from("ambassadors")
    .select("id,user_id,full_name,email,referral_code,status,city,state")
    .ilike("referral_code", code)
    .maybeSingle();

  if (error) {
    console.warn("[ambassador-ledger] ambassador lookup failed:", error.message);
    return null;
  }

  return profileFromAmbassador(
    (ambassador || null) as {
      id?: string;
      user_id?: string | null;
      full_name?: string | null;
      email?: string | null;
      referral_code?: string | null;
      status?: string | null;
      city?: string | null;
      state?: string | null;
    } | null,
  );
}

export async function findAmbassadorProfileByUserId(userId: string) {
  const { data: ambassador, error } = await supabaseAdmin
    .from("ambassadors")
    .select("id,user_id,full_name,email,referral_code,status,city,state")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[ambassador-ledger] ambassador user lookup failed:", error.message);
    return null;
  }

  return profileFromAmbassador(
    (ambassador || null) as {
      id?: string;
      user_id?: string | null;
      referral_code?: string | null;
      status?: string | null;
    } | null,
  );
}

async function ensureLegacyReferralCodeId(params: {
  code: string;
  ambassadorRecordId?: string | null;
  userId: string;
}) {
  const code = normalizeSlug(params.code);
  const { data: existing } = await supabaseAdmin
    .from("referral_codes")
    .select("id")
    .ilike("code", code)
    .limit(1)
    .maybeSingle();

  if (existing && (existing as { id?: string }).id) {
    return String((existing as { id: string }).id);
  }

  const now = new Date().toISOString();
  const insertPayload: Record<string, unknown> = {
    code,
    slug: code.toLowerCase(),
    owner_user_id: params.userId || null,
    owner_type: "ambassador",
    ambassador_id: params.ambassadorRecordId || null,
    status: "active",
    campaign_type: "ambassador",
    created_at: now,
    updated_at: now,
  };

  const { data: created, error } = await supabaseAdmin
    .from("referral_codes")
    .insert(insertPayload)
    .select("id")
    .maybeSingle();

  if (!error && created && (created as { id?: string }).id) {
    return String((created as { id: string }).id);
  }

  // Schema-tolerant minimal insert
  const retry = await supabaseAdmin
    .from("referral_codes")
    .insert({ code, is_active: true })
    .select("id")
    .maybeSingle();

  return retry.data ? String((retry.data as { id: string }).id) : null;
}

async function dualWriteLegacyReferralClick(params: {
  profile: AmbassadorProfileRow;
  landingPath?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  ipAddress?: string | null;
}) {
  try {
    const referralCodeId = await ensureLegacyReferralCodeId({
      code: params.profile.referral_code_slug,
      ambassadorRecordId: params.profile.ambassador_record_id,
      userId: params.profile.user_id,
    });
    if (!referralCodeId) return;

    let ipHash: string | null = null;
    if (params.ipAddress) {
      const data = new TextEncoder().encode(params.ipAddress);
      const hash = await crypto.subtle.digest("SHA-256", data);
      ipHash = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    await supabaseAdmin.from("referral_clicks").insert({
      referral_code_id: referralCodeId,
      landing_page: params.landingPath || "/",
      utm_source: params.utmSource || null,
      utm_medium: params.utmMedium || null,
      utm_campaign: params.utmCampaign || null,
      ip_hash: ipHash,
      user_agent: params.userAgent || null,
      referrer: params.referrer || null,
    });
  } catch (error) {
    console.warn("[ambassador-ledger] legacy referral_clicks dual-write skipped:", error);
  }
}

export async function recordAmbassadorClick(params: {
  slug: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  landingPath?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  sessionId?: string | null;
  /** When true, skip writing referral_clicks (caller already did). */
  skipLegacyDualWrite?: boolean;
}) {
  const profile = await findAmbassadorProfileBySlug(params.slug);
  if (!profile) {
    return { ok: false as const, error: "Unknown or inactive referral code." };
  }

  if (!params.skipLegacyDualWrite) {
    await dualWriteLegacyReferralClick({
      profile,
      landingPath: params.landingPath,
      utmSource: params.utmSource,
      utmMedium: params.utmMedium,
      utmCampaign: params.utmCampaign,
      userAgent: params.userAgent,
      referrer: params.referrer,
      ipAddress: params.ipAddress,
    });
  }

  return {
    ok: true as const,
    clickId: "",
    ambassadorId: profile.id,
    referralCode: profile.referral_code_slug,
  };
}

export async function attributeSignupToAmbassador(params: {
  newUserId: string;
  referralSlug: string;
  referredRole?: string | null;
}) {
  const profile = await findAmbassadorProfileBySlug(params.referralSlug);
  if (!profile) return { ok: false as const, error: "Invalid referral code." };

  const { data: existing } = await supabaseAdmin
    .from("ambassador_referrals")
    .select("id")
    .eq("ambassador_id", profile.id)
    .eq("referred_user_id", params.newUserId)
    .limit(1)
    .maybeSingle();

  if (existing && (existing as { id?: string }).id) {
    return { ok: true as const, ambassadorId: profile.id, rate: 0 };
  }

  const { error } = await supabaseAdmin.from("ambassador_referrals").insert({
    ambassador_id: profile.id,
    referral_code: profile.referral_code_slug,
    referral_type: params.referredRole || "pet_parent",
    referred_user_id: params.newUserId,
    status: "signed_up",
    booking_status: "none",
    signup_date: new Date().toISOString(),
  });

  if (error && !/duplicate|unique/i.test(error.message)) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, ambassadorId: profile.id, rate: 0 };
}

/**
 * Record / refresh commission when a referred customer starts checkout.
 * Captures booking value × profile commission rate with PENDING_AUDIT status.
 */
export async function recordAmbassadorBookingCommission(params: {
  referralSlug: string;
  payerUserId?: string | null;
  bookingId: string;
  bookingTotal: number;
  referredRole?: string | null;
}) {
  const profile = await findAmbassadorProfileBySlug(params.referralSlug);
  if (!profile || !profile.is_active) {
    return { ok: false as const, error: "Unknown or inactive ambassador code." };
  }

  const payerUserId = params.payerUserId?.trim() || null;
  if (!payerUserId) {
    return { ok: false as const, error: "Booking has no Pet Parent account." };
  }

  const { data: existing } = await supabaseAdmin
    .from("ambassador_referrals")
    .select("id")
    .eq("ambassador_id", profile.id)
    .eq("referred_user_id", payerUserId)
    .limit(1)
    .maybeSingle();

  const referralId = (existing as { id?: string } | null)?.id;
  if (!referralId) {
    return {
      ok: false as const,
      error: "This account does not have a locked Ambassador referral.",
    };
  }

  const { error } = await supabaseAdmin
    .from("ambassador_referrals")
    .update({
      booking_id: params.bookingId,
      booking_status: "started",
      updated_at: new Date().toISOString(),
    })
    .eq("id", referralId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return {
    ok: true as const,
    ambassadorId: profile.id,
    rate: 0,
    commissionEarned: 0,
    referralId,
  };
}

export async function loadNetworkKpis(): Promise<AmbassadorNetworkKpis> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ count: activeLocalReps }, { data: todayRefs }, { data: pending }, { data: regions }] =
    await Promise.all([
      supabaseAdmin
        .from("ambassador_profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabaseAdmin
        .from("ambassador_referrals")
        .select("referral_id")
        .gte("created_at", startOfDay.toISOString()),
      supabaseAdmin
        .from("ambassador_referrals")
        .select("commission_earned,payout_status")
        .in("payout_status", ["PENDING_AUDIT", "APPROVED"]),
      supabaseAdmin
        .from("ambassador_profiles")
        .select("id,region")
        .eq("is_active", true),
    ]);

  const pendingPayoutPool = (pending || []).reduce(
    (sum, row) => sum + asNumber((row as { commission_earned?: number }).commission_earned),
    0,
  );

  // Top region by click volume today → fallback to profile counts
  const { data: clickRows } = await supabaseAdmin
    .from("ambassador_clicks")
    .select("ambassador_id")
    .gte("created_at", startOfDay.toISOString())
    .limit(5000);

  const clicksByAmbassador = new Map<string, number>();
  for (const row of clickRows || []) {
    const id = String((row as { ambassador_id?: string }).ambassador_id || "");
    if (!id) continue;
    clicksByAmbassador.set(id, (clicksByAmbassador.get(id) || 0) + 1);
  }

  const regionScores = new Map<string, number>();
  for (const row of regions || []) {
    const region =
      String((row as { region?: string }).region || "").trim() || "Unassigned";
    const id = String((row as { id?: string }).id || "");
    const score = clicksByAmbassador.get(id) || 1;
    regionScores.set(region, (regionScores.get(region) || 0) + score);
  }

  let topPerformingRegion = "—";
  let best = -1;
  for (const [region, score] of regionScores) {
    if (score > best) {
      best = score;
      topPerformingRegion = region;
    }
  }

  return {
    activeLocalReps: activeLocalReps || 0,
    totalReferralsToday: (todayRefs || []).length,
    pendingPayoutPool,
    topPerformingRegion,
  };
}

export async function loadAmbassadorPerformanceRows(): Promise<
  AmbassadorPerformanceRow[]
> {
  const { data: profiles, error } = await supabaseAdmin
    .from("ambassador_profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !profiles?.length) return [];

  const ids = profiles.map((p) => String((p as { id: string }).id));

  const [{ data: clicks }, { data: referrals }] = await Promise.all([
    supabaseAdmin
      .from("ambassador_clicks")
      .select("ambassador_id")
      .in("ambassador_id", ids)
      .limit(20000),
    supabaseAdmin
      .from("ambassador_referrals")
      .select("ambassador_id,commission_earned,payout_status")
      .in("ambassador_id", ids)
      .limit(20000),
  ]);

  const clickCounts = new Map<string, number>();
  for (const row of clicks || []) {
    const id = String((row as { ambassador_id?: string }).ambassador_id || "");
    clickCounts.set(id, (clickCounts.get(id) || 0) + 1);
  }

  const refMeta = new Map<
    string,
    { count: number; pending: number; approved: number; pool: number }
  >();
  for (const row of referrals || []) {
    const id = String((row as { ambassador_id?: string }).ambassador_id || "");
    const status = String(
      (row as { payout_status?: string }).payout_status || "",
    );
    const earned = asNumber((row as { commission_earned?: number }).commission_earned);
    const meta = refMeta.get(id) || {
      count: 0,
      pending: 0,
      approved: 0,
      pool: 0,
    };
    meta.count += 1;
    if (status === "PENDING_AUDIT") meta.pending += earned;
    if (status === "APPROVED") meta.approved += earned;
    if (status === "PENDING_AUDIT" || status === "APPROVED") meta.pool += earned;
    refMeta.set(id, meta);
  }

  return (profiles as AmbassadorProfileRow[]).map((p) => {
    const clicksN = clickCounts.get(p.id) || 0;
    const meta = refMeta.get(p.id) || {
      count: 0,
      pending: 0,
      approved: 0,
      pool: 0,
    };
    const conversionRate =
      clicksN > 0 ? Math.round((meta.count / clicksN) * 1000) / 10 : 0;

    return {
      profileId: p.id,
      userId: p.user_id,
      displayName: p.display_name || p.referral_code_slug,
      referralCode: p.referral_code_slug,
      referralLink: buildAmbassadorReferralLink(p.referral_code_slug),
      region: p.region || "Unassigned",
      clicks: clicksN,
      referrals: meta.count,
      conversionRate,
      earningsPool: meta.pool,
      pendingAudit: meta.pending,
      approvedPool: meta.approved,
      lifetimePaid: asNumber(p.lifetime_payouts_sum),
      isActive: Boolean(p.is_active),
    };
  });
}

export async function batchUpdateReferralStatus(params: {
  ambassadorId: string;
  fromStatuses: AmbassadorPayoutStatus[];
  toStatus: AmbassadorPayoutStatus;
  payoutBatchId?: string | null;
}) {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    payout_status: params.toStatus,
    updated_at: now,
  };
  if (params.toStatus === "APPROVED") patch.approved_at = now;
  if (params.toStatus === "PAID") {
    patch.paid_at = now;
    if (params.payoutBatchId) patch.payout_batch_id = params.payoutBatchId;
  }
  if (params.toStatus === "VOID") patch.voided_at = now;

  const { data, error } = await supabaseAdmin
    .from("ambassador_referrals")
    .update(patch)
    .eq("ambassador_id", params.ambassadorId)
    .in("payout_status", params.fromStatuses)
    .select("referral_id");

  if (error) return { ok: false as const, error: error.message, updated: 0 };
  return { ok: true as const, updated: (data || []).length };
}

export async function loadSelfServiceStats(userId: string) {
  const profile = await findAmbassadorProfileByUserId(userId);
  if (!profile) return null;

  const since = new Date();
  since.setDate(since.getDate() - 56);

  const { data: codeRow } = await supabaseAdmin
    .from("referral_codes")
    .select("id")
    .eq("ambassador_id", profile.id)
    .limit(1)
    .maybeSingle();
  const referralCodeId = (codeRow as { id?: string } | null)?.id || "";

  const [{ data: clicks }, { data: referrals }, { data: rewards }] =
    await Promise.all([
      referralCodeId
        ? supabaseAdmin
            .from("referral_clicks")
            .select("created_at")
            .eq("referral_code_id", referralCodeId)
            .gte("created_at", since.toISOString())
        : Promise.resolve({ data: [] as Array<{ created_at?: string }> }),
      supabaseAdmin
        .from("ambassador_referrals")
        .select("created_at,status,booking_status,referral_type")
        .eq("ambassador_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("ambassador_rewards")
        .select("amount,status,paid_at")
        .eq("ambassador_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  // Weekly signup buckets (last 8 weeks)
  const weeks: Array<{ label: string; signups: number; earnings: number }> = [];
  for (let i = 7; i >= 0; i -= 1) {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const label = `${start.getMonth() + 1}/${start.getDate()}`;
    const inWeek = (referrals || []).filter((r) => {
      const t = new Date(String((r as { created_at?: string }).created_at)).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    weeks.push({
      label,
      signups: inWeek.length,
      earnings: 0,
    });
  }

  const pendingCommissions = (rewards || [])
    .filter((reward) => {
      const status = String((reward as { status?: string }).status || "").toLowerCase();
      return status === "pending" || status === "approved" || status === "pending_audit";
    })
    .reduce(
      (sum, reward) => sum + asNumber((reward as { amount?: number }).amount),
      0,
    );
  const lifetimePaid = (rewards || [])
    .filter(
      (reward) =>
        String((reward as { status?: string }).status || "").toLowerCase() === "paid",
    )
    .reduce(
      (sum, reward) => sum + asNumber((reward as { amount?: number }).amount),
      0,
    );

  return {
    profile,
    referralLink: buildAmbassadorReferralLink(profile.referral_code_slug),
    clicksTotal: (clicks || []).length,
    referralsTotal: (referrals || []).length,
    pendingCommissions,
    lifetimePaid,
    weekly: weeks,
    payoutReceipts: (rewards || [])
      .filter(
        (reward) =>
          String((reward as { status?: string }).status || "").toLowerCase() === "paid",
      )
      .map((reward) => ({
        amount: asNumber((reward as { amount?: number }).amount),
        paidAt: String((reward as { paid_at?: string }).paid_at || ""),
        batchId: "",
      })),
  };
}
