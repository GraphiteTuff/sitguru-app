// lib/ambassador/ledger.ts
/**
 * Brand Ambassador click + referral ledger helpers (admin + self-service).
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import { getAppOrigin } from "@/lib/config/site";
import { canUseMarketplaceRoleWorkspaces } from "@/lib/dashboard/founder-workspaces";
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

function isRetiredAmbassadorStatus(value: unknown) {
  const status = String(value || "").trim().toLowerCase();
  return (
    status === "archived" ||
    status === "inactive" ||
    status === "rejected" ||
    status === "denied" ||
    status === "not_a_fit"
  );
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function mapToLedgerProfile(
  row: Record<string, unknown> | null | undefined,
): AmbassadorProfileRow | null {
  if (!row) return null;

  const userId = firstText(row.user_id);
  const code = normalizeSlug(
    firstText(row.referral_code_slug, row.referral_code, row.code),
  );
  const id = firstText(row.id, row.ambassador_record_id, userId);
  if (!userId || !code || !id) return null;
  if (isRetiredAmbassadorStatus(row.status)) return null;
  if (row.is_active === false) return null;

  return {
    id,
    user_id: userId,
    ambassador_record_id: firstText(row.ambassador_record_id, row.id) || null,
    referral_code_slug: code,
    display_name:
      firstText(row.display_name, row.full_name, row.email, code) || null,
    region: firstText(row.region, row.city, row.state) || null,
    commission_rate_per_booking: asNumber(
      row.commission_rate_per_booking ?? row.commission_rate,
    ),
    lifetime_payouts_sum: asNumber(
      row.lifetime_payouts_sum ?? row.total_commission_paid,
    ),
    is_active: true,
  };
}

export async function canAccessAmbassadorLedger(input: {
  userId: string;
  email?: string | null;
}) {
  if (canUseMarketplaceRoleWorkspaces(input.email)) return true;

  const email = String(input.email || "").trim().toLowerCase();

  const [{ data: profile }, { data: roleRows }, { data: ambassador }] =
    await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("role, account_type")
        .eq("id", input.userId)
        .maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", input.userId),
      supabaseAdmin
        .from("ambassadors")
        .select("id, status, dashboard_enabled, login_enabled")
        .eq("user_id", input.userId)
        .maybeSingle(),
    ]);

  const tokens = [
    (profile as { role?: string } | null)?.role,
    (profile as { account_type?: string } | null)?.account_type,
    ...((roleRows || []) as Array<{ role?: string | null }>).map((row) => row.role),
  ].map((value) => String(value || "").trim().toLowerCase());

  if (
    tokens.some(
      (role) =>
        role.includes("ambassador") ||
        role === "admin" ||
        role === "super_admin" ||
        role === "founder",
    )
  ) {
    return true;
  }

  if (ambassador?.id && !isRetiredAmbassadorStatus(ambassador.status)) {
    return true;
  }

  if (email && !email.includes(",") && !email.includes("(")) {
    const { data: byEmail } = await supabaseAdmin
      .from("ambassadors")
      .select("id, status")
      .or(
        `email.eq.${email},login_email.eq.${email},contact_email.eq.${email}`,
      )
      .maybeSingle();

    if (byEmail?.id && !isRetiredAmbassadorStatus(byEmail.status)) {
      return true;
    }
  }

  return false;
}

/**
 * Resolve ledger profile by slug from the live ambassadors workspace first.
 * The production ambassador_profiles table uses different column names than
 * the original ledger sketch, so we map instead of failing the circuit.
 */
export async function findAmbassadorProfileBySlug(slug: string) {
  const code = normalizeSlug(slug);
  if (!code) return null;

  const { data: ambassador } = await supabaseAdmin
    .from("ambassadors")
    .select("id,user_id,full_name,email,referral_code,status,dashboard_enabled")
    .ilike("referral_code", code)
    .maybeSingle();

  const fromAmbassador = mapToLedgerProfile(
    ambassador as Record<string, unknown> | null,
  );
  if (fromAmbassador) return fromAmbassador;

  const { data: ledger } = await supabaseAdmin
    .from("ambassador_profiles")
    .select("*")
    .or(`referral_code.eq.${code},referral_code.ilike.${code}`)
    .maybeSingle();

  return mapToLedgerProfile(ledger as Record<string, unknown> | null);
}

export async function findAmbassadorProfileByUserId(userId: string) {
  return ensureAmbassadorLedgerForUser(userId);
}

function proposeAmbassadorCode(input: {
  name?: string | null;
  email?: string | null;
  userId: string;
}) {
  const fromName = normalizeSlug(firstText(input.name));
  const fromEmail = normalizeSlug(
    firstText(input.email).split("@")[0] || "",
  );
  const base = (fromName || fromEmail || "AMB").slice(0, 10);
  const suffix = input.userId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `${base}${suffix}`.slice(0, 16);
}

/**
 * Every live Ambassador is ledger-connected. If the workspace exists but
 * the referral code is blank, one is created instead of breaking the circuit.
 */
export async function ensureAmbassadorLedgerForUser(
  userId: string,
  email?: string | null,
) {
  const cleanEmail = String(email || "").trim().toLowerCase();

  let ambassador: Record<string, unknown> | null = null;

  const { data: byUser } = await supabaseAdmin
    .from("ambassadors")
    .select("id,user_id,full_name,email,referral_code,status")
    .eq("user_id", userId)
    .maybeSingle();

  ambassador = (byUser as Record<string, unknown> | null) || null;

  if (
    !ambassador &&
    cleanEmail &&
    !cleanEmail.includes(",") &&
    !cleanEmail.includes("(")
  ) {
    const { data: byEmail } = await supabaseAdmin
      .from("ambassadors")
      .select("id,user_id,full_name,email,referral_code,status")
      .or(
        `email.eq.${cleanEmail},login_email.eq.${cleanEmail},contact_email.eq.${cleanEmail}`,
      )
      .maybeSingle();
    ambassador = (byEmail as Record<string, unknown> | null) || null;
  }

  if (ambassador && !isRetiredAmbassadorStatus(ambassador.status)) {
    let mapped = mapToLedgerProfile(ambassador);

    if (!mapped) {
      const nextCode = proposeAmbassadorCode({
        name: firstText(ambassador.full_name),
        email: firstText(ambassador.email, cleanEmail),
        userId: firstText(ambassador.user_id, userId),
      });

      const { data: updated } = await supabaseAdmin
        .from("ambassadors")
        .update({
          referral_code: nextCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", firstText(ambassador.id))
        .select("id,user_id,full_name,email,referral_code,status")
        .maybeSingle();

      mapped = mapToLedgerProfile(updated as Record<string, unknown> | null);
    }

    if (mapped) {
      await ensureLegacyReferralCodeId({
        code: mapped.referral_code_slug,
        ambassadorRecordId: mapped.ambassador_record_id,
        userId: mapped.user_id,
      });
      return mapped;
    }
  }

  const { data: ledger } = await supabaseAdmin
    .from("ambassador_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const fromLedger = mapToLedgerProfile(ledger as Record<string, unknown> | null);
  if (fromLedger) {
    await ensureLegacyReferralCodeId({
      code: fromLedger.referral_code_slug,
      ambassadorRecordId: fromLedger.ambassador_record_id,
      userId: fromLedger.user_id,
    });
  }

  return fromLedger;
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

async function countClicksForCode(code: string) {
  try {
    const { data: codeRow } = await supabaseAdmin
      .from("referral_codes")
      .select("id")
      .ilike("code", code)
      .maybeSingle();

    const codeId = (codeRow as { id?: string } | null)?.id;
    if (!codeId) return 0;

    const { count } = await supabaseAdmin
      .from("referral_clicks")
      .select("id", { count: "exact", head: true })
      .eq("referral_code_id", codeId);

    return count || 0;
  } catch {
    return 0;
  }
}

async function loadLiveReferralRows(profile: AmbassadorProfileRow) {
  const code = profile.referral_code_slug;
  const { data: byCode, error: byCodeError } = await supabaseAdmin
    .from("ambassador_referrals")
    .select("id, created_at, status, referral_code, ambassador_id")
    .ilike("referral_code", code)
    .limit(500);

  if (!byCodeError && byCode) return byCode;

  const { data: byId, error: byIdError } = await supabaseAdmin
    .from("ambassador_referrals")
    .select("id, created_at, status, referral_code, ambassador_id")
    .eq("ambassador_id", profile.id)
    .limit(500);

  if (!byIdError && byId) return byId;
  return [];
}

export async function loadSelfServiceStats(
  userId: string,
  email?: string | null,
) {
  const profile = await ensureAmbassadorLedgerForUser(userId, email);
  if (!profile) return null;

  const since = new Date();
  since.setDate(since.getDate() - 56);

  const [clicksTotal, referrals] = await Promise.all([
    countClicksForCode(profile.referral_code_slug),
    loadLiveReferralRows(profile),
  ]);
  const payouts: Array<Record<string, unknown>> = [];

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
    clicksTotal,
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
