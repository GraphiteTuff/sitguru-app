import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getReferralReportingEpoch, resolveReferralPeriod, isReferralActivitySince, type ReferralReportingPeriod } from "@/lib/referrals/reporting-epoch";

type Row = Record<string, unknown>;
const str = (value: unknown) => typeof value === "string" ? value.trim() : "";
const num = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const codeKey = (code: unknown) => str(code).toUpperCase();
export type GrowthReferrer = {
  code: string; name: string; type: string; partnerId: string | null;
  visits: number; qr: number; signups: number; bookings: number;
  lastActivity: string | null; active: boolean;
};
export type ReferralGrowthReport = {
  generatedAt: string;
  totals: { codes: number; visits: number; qr: number; signups: number; bookings: number; rewardsPending: number; partnerCampaigns: number; };
  referrers: GrowthReferrer[];
  partnerSources: Array<{ name: string; code: string; visits: number; qr: number; signups: number; bookings: number; lastActivity: string | null }>;
  recent: Array<{ date: string; code: string; type: string; channel: string }>;
  warnings: string[];
  dateWindowDays: number | null;
  period: ReferralReportingPeriod;
  baselineStartedAt: string | null;
  baselineLabel: string | null;
};

async function rows(
  table: string, columns: string, limit: number,
  dateColumn?: string, since?: string | null,
): Promise<{ data: Row[]; warning: string }> {
  try {
    const all: Row[] = [];
    // PostgREST usually caps responses at 1,000 rows. Explicit pagination
    // prevents a dashboard from silently reporting only the first page.
    for (let offset = 0; offset < limit; offset += 900) {
      const pageSize = Math.min(900, limit - offset);
      let query = supabaseAdmin.from(table).select(columns);
      if (dateColumn && since) query = query.gte(dateColumn, since);
      if (dateColumn) query = query.order(dateColumn, { ascending: false });
      const { data, error } = await query.range(offset, offset + pageSize - 1);
      if (error) return { data: all, warning: `${table}: ${error.message}` };
      const page = (data || []) as unknown as Row[];
      all.push(...page);
      if (page.length < pageSize) break;
    }
    return {
      data: all,
      warning: all.length >= limit ? `${table}: ${limit.toLocaleString()}-row reporting cap reached` : "",
    };
  } catch (error) {
    return { data: [], warning: `${table}: ${error instanceof Error ? error.message : "unavailable"}` };
  }
}

/**
 * Admin/manager reporting only. Legacy PawPerks 'link_visit' rows mirror
 * referral_clicks, so they are NOT added to clicks again. No rewards are
 * inferred from clicks; signups/bookings use separate recorded outcomes.
 */
export async function loadReferralGrowthReport(period: ReferralReportingPeriod = "since_reset"): Promise<ReferralGrowthReport> {
  const epoch = await getReferralReportingEpoch();
  const isoStart = resolveReferralPeriod(epoch, period);
  const dateWindowDays = ["7", "30", "90"].includes(period) ? Number(period) : null;
  const since = (date: unknown) => isReferralActivitySince(date, isoStart);
  const results = await Promise.all([
    rows("referral_codes", "id,code,owner_type,owner_name,partner_id,ambassador_id,status", 4000),
    rows("referral_clicks", "id,referral_code_id,utm_medium,utm_source,created_at", 20000, "created_at", isoStart),
    rows("pawperks_referral_events", "id,submitted_code,referred_user_id,referred_email,event_type,occurred_at,source,medium", 20000, "occurred_at", isoStart),
    rows("pawperks_referral_relationships", "id,referral_code,referred_user_id,referred_email,signup_at,first_booking_at,created_at", 6000),
    rows("partner_tracking_events", "id,partner_id,referral_code,event_type,event_source,event_medium,created_at", 10000, "created_at", isoStart),
    rows("partners", "id,business_name,referral_code,status", 1000),
    rows("partner_campaigns", "id,partner_id,status", 1000),
    rows("referral_rewards", "id,status,amount", 4000),
    rows("growth_campaign_events", "id,referral_code,partner_code,ambassador_code,event_type,user_id,booking_id,created_at", 20000, "created_at", isoStart),
  ]);
  const [codes, clicks, pawEvents, relationships, partnerEvents, partners, campaigns, rewards, growth] = results.map(r => r.data);
  const warnings = results.map(r => r.warning).filter(Boolean);
  const byId = new Map<string, GrowthReferrer>();
  const byCode = new Map<string, GrowthReferrer>();
  const recent: ReferralGrowthReport["recent"] = [];
  const ensure = (code: string, type = "unmapped"): GrowthReferrer => {
    let found = byCode.get(codeKey(code));
    if (!found) {
      found = { code: codeKey(code), name: code || "Unknown", type, partnerId: null, visits: 0, qr: 0, signups: 0, bookings: 0, lastActivity: null, active: true };
      byCode.set(codeKey(code), found);
    }
    return found;
  };
  codes.forEach(row => {
    const code = codeKey(row.code);
    if (!code) return;
    const item = ensure(code, str(row.owner_type) || "general");
    item.name = str(row.owner_name) || code;
    item.type = str(row.owner_type) || "general";
    item.partnerId = str(row.partner_id) || null;
    item.active = str(row.status) === "active";
    byId.set(str(row.id), item);
  });
  partners.forEach(row => {
    const code = codeKey(row.referral_code);
    if (!code) return;
    const item = ensure(code, "partner");
    item.name = str(row.business_name) || item.name;
    item.type = "partner";
    item.partnerId = str(row.id) || null;
  });
  const missingPartnerRegistry = partners.filter(row =>
    codeKey(row.referral_code) && !codes.some(c => codeKey(c.code) === codeKey(row.referral_code))
  ).length;
  if (missingPartnerRegistry) warnings.push(
    `${missingPartnerRegistry} Partner profile(s) have codes not yet linked to the referral registry`
  );
  const unlinkedAmbassadorCodes = codes.filter(row =>
    str(row.owner_type) === "ambassador" && str(row.status) === "active" && !str(row.ambassador_id)
  ).length;
  if (unlinkedAmbassadorCodes) warnings.push(
    `${unlinkedAmbassadorCodes} active Ambassador codes need an owner link audit`
  );
  const touch = (item: GrowthReferrer, date: unknown) => {
    const value = str(date);
    if (value && (!item.lastActivity || item.lastActivity < value)) item.lastActivity = value;
  };
  clicks.forEach(row => {
    if (!since(row.created_at)) return;
    const item = byId.get(str(row.referral_code_id));
    if (!item) return;
    if (str(row.utm_medium).toLowerCase() === "qr") item.qr++;
    else item.visits++;
    touch(item, row.created_at);
    recent.push({ date: str(row.created_at), code: item.code, type: str(row.utm_medium) === "qr" ? "QR scan" : "Link visit", channel: str(row.utm_source) || "sitguru" });
  });
  // Only count direct partner_tracking_events when no canonical referral-code ID exists.
  const partnerById = new Map(partners.map(p => [str(p.id), p] as const));
  const canonicalActive = new Set<string>();
  clicks.forEach(row => { if (since(row.created_at)) { const owner = byId.get(str(row.referral_code_id)); if (owner) canonicalActive.add(owner.code); } });
  partnerEvents.forEach(row => {
    if (!since(row.created_at) || !["click","view"].includes(str(row.event_type))) return;
    const partner = partnerById.get(str(row.partner_id));
    const code = codeKey(row.referral_code || partner?.referral_code);
    if (!code) return;
    const item = ensure(code, "partner");
    if (!item.partnerId) item.partnerId = str(row.partner_id) || null;
    if (partner) item.name = str(partner.business_name) || item.name;
    // Canonical click storage is authoritative when a referral code has
    // tracked visits. Partner events remain a separate historical source.
    if (!canonicalActive.has(code)) {
      if (str(row.event_medium) === "qr") item.qr++;
      else item.visits++;
      touch(item, row.created_at);
    }
  });

  const conversionKeys = new Set<string>();
  function countOutcome(code: unknown, user: unknown, type: "signup" | "booking", date: unknown) {
    if (!since(date)) return;
    const normalized = codeKey(code);
    const userKey = str(user);
    if (!normalized || !userKey) return;
    const identity = `${normalized}:${type}:${userKey.toLowerCase()}`;
    if (conversionKeys.has(identity)) return;
    conversionKeys.add(identity);
    const item = ensure(normalized);
    item[type === "signup" ? "signups" : "bookings"]++;
    touch(item, date);
    recent.push({ date: str(date), code: normalized, type: type === "signup" ? "Signup" : "Booking", channel: "verified event" });
  }
  pawEvents.forEach(row => {
    if (str(row.event_type) === "signup_capture") countOutcome(row.submitted_code, row.referred_user_id || row.referred_email, "signup", row.occurred_at);
  });
  relationships.forEach(row => {
    countOutcome(row.referral_code, row.referred_user_id || row.referred_email, "signup", row.signup_at);
    countOutcome(row.referral_code, row.referred_user_id || row.referred_email, "booking", row.first_booking_at);
  });
  growth.forEach(row => {
    const code = row.referral_code || row.partner_code || row.ambassador_code;
    const type = str(row.event_type);
    if (type === "signup") countOutcome(code, row.user_id, "signup", row.created_at);
    if (type === "booking") countOutcome(code, row.user_id || row.booking_id, "booking", row.created_at);
  });
  const referrers = [...byCode.values()].filter(r => r.code).sort((a,b) => b.signups-a.signups || b.bookings-a.bookings || (b.visits+b.qr)-(a.visits+a.qr));
  const partnerSources = referrers.filter(r => r.type === "partner" || r.partnerId).map(r => ({
    name: r.name, code: r.code, visits: r.visits, qr: r.qr, signups: r.signups, bookings: r.bookings, lastActivity: r.lastActivity,
  }));
  const totals = {
    codes: codes.filter(r => str(r.status) === "active").length,
    visits: referrers.reduce((s,r) => s+r.visits,0),
    qr: referrers.reduce((s,r) => s+r.qr,0),
    signups: referrers.reduce((s,r) => s+r.signups,0),
    bookings: referrers.reduce((s,r) => s+r.bookings,0),
    rewardsPending: rewards.filter(r => ["pending","under_review","approved"].includes(str(r.status).toLowerCase())).length,
    partnerCampaigns: campaigns.filter(r => str(r.status) === "active").length,
  };
  return { generatedAt: new Date().toISOString(), totals, referrers, partnerSources,
    recent: recent.sort((a,b) => b.date.localeCompare(a.date)).slice(0,60),
    warnings, dateWindowDays, period, baselineStartedAt: epoch?.startedAt ?? null,
    baselineLabel: epoch?.label ?? null };
}
