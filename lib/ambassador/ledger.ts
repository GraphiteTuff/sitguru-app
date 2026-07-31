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
export async function findAmbassadorProfileBySlug(slug: string) {
  const code = normalizeSlug(slug);
  if (!code) return null;

  const { data, error } = await supabaseAdmin
    .from("ambassador_profiles")
    .select("*")
    .eq("referral_code_slug", code)
    .eq("is_active", true)
    .maybeSingle();

  if (!error && data) return data as AmbassadorProfileRow;

  // Fallback: live ambassadors.referral_code → upsert ledger profile
  const { data: ambassador } = await supabaseAdmin
    .from("ambassadors")
    .select("id,user_id,full_name,email,referral_code,status,dashboard_enabled")
    .ilike("referral_code", code)
    .maybeSingle();

  const row = ambassador as {
    id?: string;
    user_id?: string;
    full_name?: string;
    email?: string;
    referral_code?: string;
    status?: string;
    dashboard_enabled?: boolean;
  } | null;

  if (!row?.user_id || !row.id) return null;
  const status = String(row.status || "").toLowerCase();
  if (status === "archived" || status === "inactive" || status === "rejected") {
    return null;
  }

  const payload = {
    user_id: row.user_id,
    ambassador_record_id: row.id,
    referral_code_slug: code,
    display_name: row.full_name || row.email || code,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data: upserted, error: upsertError } = await supabaseAdmin
    .from("ambassador_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (upsertError || !upserted) {
    console.warn(
      "[ambassador-ledger] profile upsert from ambassadors failed:",
      upsertError?.message,
    );
    return null;
  }

  return upserted as AmbassadorProfileRow;
}

export async function findAmbassadorProfileByUserId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("ambassador_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) return data as AmbassadorProfileRow;

  // Bootstrap ledger row from live ambassadors workspace if missing
  const { data: ambassador } = await supabaseAdmin
    .from("ambassadors")
    .select("id,user_id,full_name,email,referral_code,status")
    .eq("user_id", userId)
    .maybeSingle();

  const row = ambassador as {
    id?: string;
    user_id?: string;
    full_name?: string;
    email?: string;
    referral_code?: string;
    status?: string;
  } | null;

  if (!row?.user_id || !row.referral_code) return null;

  return findAmbassadorProfileBySlug(String(row.referral_code));
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
    owner_user_id: params.userId,
    ambassador_id: params.ambassadorRecordId || null,
    type: "ambassador",
    is_active: true,
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

  const { data, error } = await supabaseAdmin
    .from("ambassador_clicks")
    .insert({
      ambassador_id: profile.id,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      landing_path: params.landingPath || null,
      referrer: params.referrer || null,
      utm_source: params.utmSource || null,
      utm_medium: params.utmMedium || null,
      utm_campaign: params.utmCampaign || null,
      session_id: params.sessionId || null,
    })
    .select("click_id")
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  // Extend existing tracking stack — do not silo clicks only in the new table
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
    clickId: String((data as { click_id?: string } | null)?.click_id || ""),
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

  const rate = asNumber(profile.commission_rate_per_booking);
  const { error } = await supabaseAdmin.from("ambassador_referrals").upsert(
    {
      ambassador_id: profile.id,
      new_user_id: params.newUserId,
      referred_role: params.referredRole || null,
      total_booking_value: 0,
      commission_earned: 0,
      payout_status: "PENDING_AUDIT" satisfies AmbassadorPayoutStatus,
    },
    { onConflict: "ambassador_id,new_user_id", ignoreDuplicates: true },
  );

  if (error) {
    // Unique index may not be recognized as onConflict target on older PostgREST —
    // fall back to insert-ignore pattern
    const insert = await supabaseAdmin.from("ambassador_referrals").insert({
      ambassador_id: profile.id,
      new_user_id: params.newUserId,
      referred_role: params.referredRole || null,
      total_booking_value: 0,
      commission_earned: rate > 0 ? 0 : 0,
      payout_status: "PENDING_AUDIT",
    });
    if (insert.error && !/duplicate|unique/i.test(insert.error.message)) {
      return { ok: false as const, error: insert.error.message };
    }
  }

  return { ok: true as const, ambassadorId: profile.id, rate };
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

  const bookingTotal = Math.max(0, asNumber(params.bookingTotal));
  const rate = asNumber(profile.commission_rate_per_booking);
  const commissionEarned =
    Math.round(bookingTotal * rate * 100) / 100;
  const payerUserId = params.payerUserId?.trim() || null;
  const notes = `booking:${params.bookingId};rate:${rate}`;

  if (payerUserId) {
    const { data: existing } = await supabaseAdmin
      .from("ambassador_referrals")
      .select("referral_id,total_booking_value,commission_earned")
      .eq("ambassador_id", profile.id)
      .eq("new_user_id", payerUserId)
      .maybeSingle();

    if (existing?.referral_id) {
      const prevValue = asNumber(
        (existing as { total_booking_value?: number }).total_booking_value,
      );
      const prevCommission = asNumber(
        (existing as { commission_earned?: number }).commission_earned,
      );
      const { error } = await supabaseAdmin
        .from("ambassador_referrals")
        .update({
          total_booking_value: Math.round((prevValue + bookingTotal) * 100) / 100,
          commission_earned:
            Math.round((prevCommission + commissionEarned) * 100) / 100,
          payout_status: "PENDING_AUDIT" satisfies AmbassadorPayoutStatus,
          notes,
          referred_role: params.referredRole || null,
        })
        .eq("referral_id", existing.referral_id);

      if (error) {
        return { ok: false as const, error: error.message };
      }

      return {
        ok: true as const,
        ambassadorId: profile.id,
        rate,
        commissionEarned,
        referralId: String(existing.referral_id),
      };
    }
  }

  const { data, error } = await supabaseAdmin
    .from("ambassador_referrals")
    .insert({
      ambassador_id: profile.id,
      new_user_id: payerUserId,
      referred_role: params.referredRole || null,
      total_booking_value: bookingTotal,
      commission_earned: commissionEarned,
      payout_status: "PENDING_AUDIT" satisfies AmbassadorPayoutStatus,
      notes,
    })
    .select("referral_id")
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return {
    ok: true as const,
    ambassadorId: profile.id,
    rate,
    commissionEarned,
    referralId: String((data as { referral_id?: string } | null)?.referral_id || ""),
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

  const [{ data: clicks }, { data: referrals }, { data: payouts }] =
    await Promise.all([
      supabaseAdmin
        .from("ambassador_clicks")
        .select("created_at")
        .eq("ambassador_id", profile.id)
        .gte("created_at", since.toISOString()),
      supabaseAdmin
        .from("ambassador_referrals")
        .select(
          "created_at,commission_earned,payout_status,total_booking_value,referred_role",
        )
        .eq("ambassador_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("ambassador_referrals")
        .select("commission_earned,paid_at,payout_batch_id,payout_status")
        .eq("ambassador_id", profile.id)
        .eq("payout_status", "PAID")
        .order("paid_at", { ascending: false })
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
      earnings: inWeek.reduce(
        (s, r) => s + asNumber((r as { commission_earned?: number }).commission_earned),
        0,
      ),
    });
  }

  const pendingCommissions = (referrals || [])
    .filter((r) =>
      ["PENDING_AUDIT", "APPROVED"].includes(
        String((r as { payout_status?: string }).payout_status || ""),
      ),
    )
    .reduce(
      (s, r) => s + asNumber((r as { commission_earned?: number }).commission_earned),
      0,
    );

  return {
    profile,
    referralLink: buildAmbassadorReferralLink(profile.referral_code_slug),
    clicksTotal: (clicks || []).length,
    referralsTotal: (referrals || []).length,
    pendingCommissions,
    lifetimePaid: asNumber(profile.lifetime_payouts_sum),
    weekly: weeks,
    payoutReceipts: (payouts || []).map((p) => ({
      amount: asNumber((p as { commission_earned?: number }).commission_earned),
      paidAt: String((p as { paid_at?: string }).paid_at || ""),
      batchId: String((p as { payout_batch_id?: string }).payout_batch_id || ""),
    })),
  };
}
