import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Copy,
  Gift,
  Link2,
  MapPin,
  MousePointerClick,
  PauseCircle,
  PlayCircle,
  Sparkles,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import BackToPartnersButton from "../_components/back-to-partners-button";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type AmbassadorStatus = "active" | "paused" | "suspended" | "archived" | "lead";

type PartnerAmbassador = {
  id: string;
  source_table: "ambassador_leads" | "ambassadors";
  display_name: string;
  email: string;
  phone: string;
  program: string;
  source: string;
  city: string;
  state: string;
  county: string;
  country: string;
  location: string;
  status: AmbassadorStatus;
  hr_status: string;
  tier: "bronze" | "silver" | "gold" | "city_captain";
  points: number;
  referral_code: string;
  customer_referral_url: string;
  guru_referral_url: string;
  partner_referral_url: string;
  contractor_status: string;
  payout_eligible: boolean;
  approved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  notes: string;
};

type AmbassadorTrackingSummary = {
  clicks: number;
  views: number;
  signups: number;
  bookings: number;
  revenue: number;
  rewards: number;
  pendingRewards: number;
  pendingPayouts: number;
  paidPayouts: number;
  lastActivity: string | null;
  sources: string[];
};

const partnerRoutes = {
  dashboard: "/admin",
  hr: "/admin/hr",
  ambassadorLeads: "/admin/ambassador-leads",
  partners: "/admin/partners",
  partnerApplications: "/admin/partners/applications",
  partnerAmbassadors: "/admin/partners/ambassadors",
  partnerCampaigns: "/admin/partners/campaigns",
  partnerRewards: "/admin/partners/rewards",
  partnerPayouts: "/admin/partners/payouts",
  referrals: "/admin/referrals",
  messages: "/admin/messages",
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }

  return false;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not Available";

  return value
    .split("_")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getDate(row: AnyRow) {
  return (
    asString(row.created_at) ||
    asString(row.updated_at) ||
    asString(row.approved_at) ||
    null
  );
}

function getStatus(row: AnyRow) {
  return getText(row, ["status", "lead_status", "application_status"], "new")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isApprovedLead(row: AnyRow) {
  const status = getStatus(row);

  return (
    status === "approved" ||
    status === "active" ||
    Boolean(getText(row, ["approved_at"])) ||
    Boolean(getText(row, ["referral_code"])) ||
    asBoolean(row.payout_eligible)
  );
}

function isPendingLead(row: AnyRow) {
  const status = getStatus(row);

  return (
    status === "new" ||
    status === "pending" ||
    status === "submitted" ||
    status === "review" ||
    status === "in_review" ||
    status === "contacted" ||
    status === "interested" ||
    status === "signed_up"
  );
}

function getDisplayName(row: AnyRow, fallback = "Ambassador") {
  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return getText(
    row,
    [
      "display_name",
      "full_name",
      "name",
      "lead_name",
      "applicant_name",
      "candidate_name",
      "contact_name",
      "email",
    ],
    fallback,
  );
}

function getEmail(row: AnyRow) {
  return getText(
    row,
    ["email", "lead_email", "applicant_email", "candidate_email", "contact_email"],
    "Not available",
  );
}

function getPhone(row: AnyRow) {
  return getText(
    row,
    ["phone", "phone_number", "mobile", "lead_phone", "applicant_phone"],
    "Not available",
  );
}

function getProgram(row: AnyRow) {
  const program = getText(row, ["program", "program_name", "program_type"]);
  const type = getText(row, ["ambassador_type", "type", "role"]);
  const combined = `${program} ${type} ${getText(row, ["notes"])}`.toLowerCase();

  if (program) return program;
  if (combined.includes("student") || combined.includes("campus")) {
    return "Student Hire";
  }
  if (
    combined.includes("military") ||
    combined.includes("veteran") ||
    combined.includes("guard") ||
    combined.includes("reserve")
  ) {
    return "Military Hire";
  }
  if (combined.includes("community") || combined.includes("neighborhood")) {
    return "Community Hire";
  }

  return "Community Hire";
}

function getSource(row: AnyRow) {
  const source = getText(row, ["source", "lead_source", "signup_source", "utm_source"]);
  if (source) return source;

  const text = `${getText(row, ["notes"])} ${getText(row, ["program"])} ${getText(row, ["ambassador_type"])}`.toLowerCase();

  if (text.includes("indeed")) return "Indeed";
  if (text.includes("careerlink") || text.includes("career link")) return "PA CareerLink";
  if (text.includes("handshake")) return "Handshake";
  if (text.includes("linkedin") || text.includes("linked in")) return "LinkedIn";
  if (text.includes("referral")) return "Referral";
  if (text.includes("website") || text.includes("site")) return "Website";

  return "Other";
}

function getLocation(row: AnyRow) {
  const location = getText(row, ["location", "territory"]);
  const city = getText(row, ["city"]);
  const state = getText(row, ["state"]);
  const zip = getText(row, ["zip_code", "postal_code"]);

  if (location) return location;
  if (city && state && zip) return `${city}, ${state} ${zip}`;
  if (city && state) return `${city}, ${state}`;
  if (state) return state;
  if (city) return city;

  return "Not provided";
}

function normalizeTier(value: unknown): PartnerAmbassador["tier"] {
  const tier = asString(value).toLowerCase();

  if (tier === "city_captain") return "city_captain";
  if (tier === "gold") return "gold";
  if (tier === "silver") return "silver";

  return "bronze";
}

function normalizePartnerStatus(row: AnyRow, sourceTable: PartnerAmbassador["source_table"]): AmbassadorStatus {
  const status = getStatus(row);

  if (status === "paused") return "paused";
  if (status === "suspended") return "suspended";
  if (status === "archived") return "archived";
  if (status === "active" || status === "approved") return "active";
  if (sourceTable === "ambassadors") return "active";

  return "lead";
}

function statusClasses(status: AmbassadorStatus) {
  switch (status) {
    case "active":
      return "border-green-200 bg-green-50 text-green-800";
    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "suspended":
      return "border-red-200 bg-red-50 text-red-800";
    case "archived":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-800";
  }
}

function tierClasses(tier: PartnerAmbassador["tier"]) {
  switch (tier) {
    case "city_captain":
      return "border-green-300 bg-green-100 text-green-900";
    case "gold":
      return "border-yellow-300 bg-yellow-50 text-yellow-900";
    case "silver":
      return "border-slate-300 bg-slate-50 text-slate-800";
    case "bronze":
    default:
      return "border-orange-200 bg-orange-50 text-orange-800";
  }
}

function tierIcon(tier: PartnerAmbassador["tier"]) {
  switch (tier) {
    case "city_captain":
      return "🛡️";
    case "gold":
      return "🥇";
    case "silver":
      return "🥈";
    case "bronze":
    default:
      return "🥉";
  }
}

function createReferralCode(name: string | null) {
  const base = (name || "AMBASSADOR")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `${base || "AMB"}-${suffix}`;
}

function buildReferralBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.sitguru.com"
  );
}

function buildCustomerReferralUrl(referralCode: string) {
  if (!referralCode) return "Not generated";
  return `${buildReferralBaseUrl()}/signup?ref=${encodeURIComponent(referralCode)}`;
}

function buildGuruReferralUrl(referralCode: string) {
  if (!referralCode) return "Not generated";
  return `${buildReferralBaseUrl()}/gurus/apply?ref=${encodeURIComponent(referralCode)}`;
}

function buildPartnerReferralUrl(referralCode: string) {
  if (!referralCode) return "Not generated";
  return `${buildReferralBaseUrl()}/partners?ref=${encodeURIComponent(referralCode)}`;
}

function referralCodeFor(row: AnyRow) {
  return getText(row, ["referral_code", "code", "ambassador_code"]);
}

function getLeadReferralCode(row: AnyRow) {
  const existing = referralCodeFor(row);
  if (existing) return existing;

  return "";
}

function getEventReferralCode(row: AnyRow) {
  return getText(row, ["referral_code", "code", "ambassador_referral_code"]);
}

function eventType(row: AnyRow) {
  return getText(row, ["event_type", "type", "conversion_type"], "").toLowerCase();
}

function eventAmount(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value > 0) return value;
  }

  return 0;
}

function isWithinLastDays(value: string | null, days: number) {
  if (!value) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return parsed >= cutoff;
}

function countByValue<T>(items: T[], getKey: (item: T) => string, limit: number) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Partner ambassadors query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Partner ambassadors query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

function mergeRows(...groups: AnyRow[][]) {
  const merged: AnyRow[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const row of group) {
      const key =
        getText(row, ["id", "email", "user_id", "created_at"]) ||
        `${getDisplayName(row)}-${getEmail(row)}-${merged.length}`;

      if (seen.has(key)) continue;

      seen.add(key);
      merged.push(row);
    }
  }

  return merged;
}

async function activateAmbassadorLead(formData: FormData) {
  "use server";

  const leadId = asString(formData.get("lead_id"));
  const leadName = asString(formData.get("lead_name"));
  const existingCode = asString(formData.get("referral_code"));
  const referralCode = existingCode || createReferralCode(leadName);

  if (!leadId) {
    return;
  }

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("ambassador_leads")
    .update({
      status: "approved",
      referral_code: referralCode,
      approved_at: now,
      payout_eligible: true,
      contractor_status: "ready",
      updated_at: now,
    })
    .eq("id", leadId);

  if (error) {
    console.warn("Unable to activate ambassador lead:", error);
  }

  revalidatePath(partnerRoutes.partnerAmbassadors);
  revalidatePath(partnerRoutes.ambassadorLeads);
  revalidatePath(partnerRoutes.hr);
  revalidatePath(partnerRoutes.dashboard);
}

async function pauseAmbassadorLead(formData: FormData) {
  "use server";

  const leadId = asString(formData.get("lead_id"));

  if (!leadId) {
    return;
  }

  const { error } = await supabaseAdmin
    .from("ambassador_leads")
    .update({
      status: "paused",
      payout_eligible: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) {
    console.warn("Unable to pause ambassador lead:", error);
  }

  revalidatePath(partnerRoutes.partnerAmbassadors);
  revalidatePath(partnerRoutes.ambassadorLeads);
  revalidatePath(partnerRoutes.hr);
  revalidatePath(partnerRoutes.dashboard);
}

function normalizeLeadAmbassador(row: AnyRow, sourceTable: PartnerAmbassador["source_table"]): PartnerAmbassador {
  const displayName = getDisplayName(row);
  const referralCode = getLeadReferralCode(row);
  const city = getText(row, ["city"]);
  const state = getText(row, ["state"]);
  const county = getText(row, ["county"]);
  const country = getText(row, ["country"], "United States");
  const program = getProgram(row);
  const status = normalizePartnerStatus(row, sourceTable);

  return {
    id: getText(row, ["id"], `${displayName}-${getEmail(row)}`),
    source_table: sourceTable,
    display_name: displayName,
    email: getEmail(row),
    phone: getPhone(row),
    program,
    source: getSource(row),
    city,
    state,
    county,
    country,
    location: getLocation(row),
    status,
    hr_status: formatLabel(getStatus(row)),
    tier: normalizeTier(row.tier),
    points: asNumber(row.points),
    referral_code: referralCode,
    customer_referral_url:
      getText(row, ["customer_referral_url"]) || buildCustomerReferralUrl(referralCode),
    guru_referral_url:
      getText(row, ["guru_referral_url"]) || buildGuruReferralUrl(referralCode),
    partner_referral_url:
      getText(row, ["partner_referral_url"]) || buildPartnerReferralUrl(referralCode),
    contractor_status: getText(row, ["contractor_status"], "not_started"),
    payout_eligible: asBoolean(row.payout_eligible) || status === "active",
    approved_at: getText(row, ["approved_at"]) || null,
    created_at: getText(row, ["created_at"]) || null,
    updated_at: getText(row, ["updated_at"]) || null,
    notes: getText(row, ["notes", "message", "description"], "No notes yet."),
  };
}

function buildTrackingSummary(
  ambassador: PartnerAmbassador,
  trackingEvents: AnyRow[],
  referralConversions: AnyRow[],
  networkReferrals: AnyRow[],
  rewards: AnyRow[],
  payouts: AnyRow[],
): AmbassadorTrackingSummary {
  const codes = new Set(
    [ambassador.referral_code]
      .filter(Boolean)
      .map((code) => code.toLowerCase()),
  );

  const matchesAmbassador = (row: AnyRow) => {
    const rowCode = getEventReferralCode(row).toLowerCase();
    const ambassadorId = getText(row, ["ambassador_id"]);
    const leadId = getText(row, ["lead_id", "ambassador_lead_id"]);
    const email = getText(row, ["email", "ambassador_email"]);

    return (
      (rowCode && codes.has(rowCode)) ||
      ambassadorId === ambassador.id ||
      leadId === ambassador.id ||
      (email && email.toLowerCase() === ambassador.email.toLowerCase())
    );
  };

  const events = trackingEvents.filter(matchesAmbassador);
  const conversions = referralConversions.filter(matchesAmbassador);
  const referrals = networkReferrals.filter(matchesAmbassador);
  const ambassadorRewards = rewards.filter(matchesAmbassador);
  const ambassadorPayouts = payouts.filter(matchesAmbassador);

  const clicks = events.filter((event) => {
    const type = eventType(event);
    return type.includes("click") || type.includes("visit");
  }).length;

  const views = events.filter((event) => {
    const type = eventType(event);
    return type.includes("view") || type.includes("page");
  }).length;

  const signupConversions = conversions.filter((event) => {
    const type = eventType(event);
    return type.includes("signup") || type.includes("lead") || type.includes("conversion");
  }).length;

  const referralSignups = referrals.filter((event) => {
    const type = eventType(event);
    const status = getStatus(event);
    return (
      type.includes("signup") ||
      status === "converted" ||
      status === "approved" ||
      status === "active"
    );
  }).length;

  const bookings =
    events.filter((event) => eventType(event).includes("booking")).length +
    conversions.filter((event) => eventType(event).includes("booking")).length +
    referrals.filter((event) => eventType(event).includes("booking")).length;

  const revenue = [...events, ...conversions, ...referrals].reduce(
    (sum, row) =>
      sum +
      eventAmount(row, [
        "revenue_amount",
        "booking_amount",
        "amount",
        "total_amount",
        "total_customer_paid",
      ]),
    0,
  );

  const rewardAmount = ambassadorRewards.reduce(
    (sum, row) =>
      sum +
      eventAmount(row, ["reward_amount", "amount", "payout_amount", "total"]),
    0,
  );

  const pendingRewards = ambassadorRewards.filter((row) => {
    const status = getStatus(row);
    return status === "pending" || status === "new" || status === "approved";
  }).length;

  const pendingPayouts = ambassadorPayouts.filter((row) => {
    const status = getStatus(row);
    return status === "pending" || status === "approved" || status === "ready";
  }).length;

  const paidPayouts = ambassadorPayouts.filter((row) => {
    const status = getStatus(row);
    return status === "paid" || status === "completed" || status === "complete";
  }).length;

  const dates = [...events, ...conversions, ...referrals, ...ambassadorRewards, ...ambassadorPayouts]
    .map(getDate)
    .filter(Boolean)
    .map((date) => new Date(date as string).getTime())
    .filter((time) => Number.isFinite(time));

  const lastActivity = dates.length
    ? new Date(Math.max(...dates)).toISOString()
    : ambassador.updated_at || ambassador.approved_at || ambassador.created_at;

  const sources = Array.from(
    new Set(
      events
        .map((event) => getText(event, ["event_source", "source", "utm_source"]))
        .filter(Boolean),
    ),
  ).slice(0, 3);

  return {
    clicks,
    views,
    signups: signupConversions + referralSignups,
    bookings,
    revenue,
    rewards: rewardAmount,
    pendingRewards,
    pendingPayouts,
    paidPayouts,
    lastActivity,
    sources,
  };
}

async function getPartnerAmbassadorData() {
  const [
    ambassadorLeadsResult,
    ambassadorsResult,
    trackingEventsResult,
    networkClickEventsResult,
    referralConversionsResult,
    networkReferralsResult,
    networkRewardsResult,
    referralRewardsResult,
    partnerPayoutsResult,
  ] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin
        .from("ambassador_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "ambassador_leads",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("ambassadors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "ambassadors",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("partner_tracking_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "partner_tracking_events",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("network_click_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "network_click_events",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("referral_conversions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "referral_conversions",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("network_referrals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "network_referrals",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("network_rewards")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "network_rewards",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("referral_rewards")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "referral_rewards",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("partner_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "partner_payouts",
    ),
  ]);

  const ambassadorLeads = ((ambassadorLeadsResult.data || []) as AnyRow[]).filter(Boolean);
  const ambassadors = ((ambassadorsResult.data || []) as AnyRow[]).filter(Boolean);
  const trackingEvents = [
    ...(((trackingEventsResult.data || []) as AnyRow[]).filter(Boolean)),
    ...(((networkClickEventsResult.data || []) as AnyRow[]).filter(Boolean)),
  ];
  const referralConversions = ((referralConversionsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkReferrals = ((networkReferralsResult.data || []) as AnyRow[]).filter(Boolean);
  const rewards = mergeRows(
    ((networkRewardsResult.data || []) as AnyRow[]).filter(Boolean),
    ((referralRewardsResult.data || []) as AnyRow[]).filter(Boolean),
  );
  const payouts = ((partnerPayoutsResult.data || []) as AnyRow[]).filter(Boolean);

  const approvedLeadRows = ambassadorLeads.filter(isApprovedLead);
  const pendingLeadRows = ambassadorLeads.filter(isPendingLead);

  const normalizedAmbassadors = mergeRows(
    approvedLeadRows.map((row) => ({ ...row, source_table: "ambassador_leads" })),
    ambassadors.map((row) => ({ ...row, source_table: "ambassadors" })),
  )
    .map((row) =>
      normalizeLeadAmbassador(
        row,
        getText(row, ["source_table"]) === "ambassadors"
          ? "ambassadors"
          : "ambassador_leads",
      ),
    )
    .sort((a, b) => {
      const dateA = new Date(a.approved_at || a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.approved_at || b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    });

  const pendingLeads = pendingLeadRows
    .map((row) => normalizeLeadAmbassador(row, "ambassador_leads"))
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    });

  const trackingByAmbassador = new Map<string, AmbassadorTrackingSummary>();

  normalizedAmbassadors.forEach((ambassador) => {
    trackingByAmbassador.set(
      ambassador.id,
      buildTrackingSummary(
        ambassador,
        trackingEvents,
        referralConversions,
        networkReferrals,
        rewards,
        payouts,
      ),
    );
  });

  const activeAmbassadors = normalizedAmbassadors.filter(
    (ambassador) => ambassador.status === "active",
  );

  const payoutReadyAmbassadors = normalizedAmbassadors.filter(
    (ambassador) => ambassador.payout_eligible,
  );

  const totalClicks = Array.from(trackingByAmbassador.values()).reduce(
    (sum, item) => sum + item.clicks,
    0,
  );
  const totalSignups = Array.from(trackingByAmbassador.values()).reduce(
    (sum, item) => sum + item.signups,
    0,
  );
  const totalBookings = Array.from(trackingByAmbassador.values()).reduce(
    (sum, item) => sum + item.bookings,
    0,
  );
  const totalRevenue = Array.from(trackingByAmbassador.values()).reduce(
    (sum, item) => sum + item.revenue,
    0,
  );
  const totalRewards = Array.from(trackingByAmbassador.values()).reduce(
    (sum, item) => sum + item.rewards,
    0,
  );
  const pendingRewards = Array.from(trackingByAmbassador.values()).reduce(
    (sum, item) => sum + item.pendingRewards,
    0,
  );
  const pendingPayouts = Array.from(trackingByAmbassador.values()).reduce(
    (sum, item) => sum + item.pendingPayouts,
    0,
  );

  return {
    ambassadors: normalizedAmbassadors,
    pendingLeads,
    trackingByAmbassador,
    programBreakdown: countByValue(normalizedAmbassadors, (ambassador) => ambassador.program, 5),
    sourceBreakdown: countByValue(normalizedAmbassadors, (ambassador) => ambassador.source, 6),
    statusBreakdown: countByValue(normalizedAmbassadors, (ambassador) => ambassador.status, 5),
    metrics: {
      totalAmbassadors: normalizedAmbassadors.length,
      activeAmbassadors: activeAmbassadors.length,
      pendingActivation: pendingLeads.length,
      payoutReady: payoutReadyAmbassadors.length,
      missingReferralCodes: normalizedAmbassadors.filter(
        (ambassador) => !ambassador.referral_code,
      ).length,
      totalClicks,
      totalSignups,
      totalBookings,
      totalRevenue,
      totalRewards,
      pendingRewards,
      pendingPayouts,
      recentActivity: normalizedAmbassadors.filter((ambassador) =>
        isWithinLastDays(
          ambassador.updated_at || ambassador.approved_at || ambassador.created_at,
          14,
        ),
      ).length,
    },
  };
}

export default async function PartnerAmbassadorsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const data = await getPartnerAmbassadorData();

  return (
    <main className="w-full min-w-0 space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <BackToPartnersButton />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl xl:text-5xl">
              Partner Ambassadors
            </h1>
            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-green-800">
              Growth Network
            </span>
          </div>

          <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
            Manage approved ambassadors after HR screening. This page connects
            approved Ambassador Leads to referral codes, signup attribution,
            rewards, commissions, and payout readiness.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
          <Link
            href={partnerRoutes.ambassadorLeads}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
          >
            <UserCheck size={17} />
            HR Leads
          </Link>

          <Link
            href={partnerRoutes.partnerRewards}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-800 to-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:brightness-105"
          >
            <Gift size={17} />
            Rewards
          </Link>
        </div>
      </div>

      <div className="rounded-[28px] border border-green-200 bg-green-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white">
            <ShieldCheckIcon />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-green-950">
              Ambassador payout workflow
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-green-900/75">
              HR owns applicant screening and contractor readiness. Partner
              Ambassadors owns referral codes, signup attribution, rewards,
              commissions, and payout readiness once an ambassador is approved.
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-3 rounded-[28px] border border-green-100 bg-gradient-to-r from-[#f7fbf4] via-white to-[#f7fbf4] p-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          title="Active Ambassadors"
          value={number(data.metrics.activeAmbassadors)}
          detail={`${number(data.metrics.totalAmbassadors)} total approved/connected`}
          icon={<Users size={20} />}
        />
        <MetricTile
          title="Pending Activation"
          value={number(data.metrics.pendingActivation)}
          detail="HR leads not yet approved"
          icon={<BadgeCheck size={20} />}
        />
        <MetricTile
          title="Payout Ready"
          value={number(data.metrics.payoutReady)}
          detail={`${number(data.metrics.pendingPayouts)} pending payout rows`}
          icon={<WalletCards size={20} />}
        />
        <MetricTile
          title="Referral Signups"
          value={number(data.metrics.totalSignups)}
          detail={`${number(data.metrics.totalClicks)} tracked clicks`}
          icon={<MousePointerClick size={20} />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <DashboardCard>
            <SectionHeader
              title="Active Ambassador Network"
              subtitle="Approved HR ambassador leads and legacy ambassador records with referral and payout readiness."
              href={partnerRoutes.partnerAmbassadors}
              action="Refresh"
            />

            <MobileAmbassadorCards
              ambassadors={data.ambassadors}
              trackingByAmbassador={data.trackingByAmbassador}
            />

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#edf3ee] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <th className="pb-3">Ambassador</th>
                    <th className="pb-3">Program</th>
                    <th className="pb-3">Referral Code</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Performance</th>
                    <th className="pb-3">Rewards</th>
                    <th className="pb-3">Payout</th>
                    <th className="pb-3">Links</th>
                  </tr>
                </thead>

                <tbody>
                  {data.ambassadors.length ? (
                    data.ambassadors.map((ambassador) => {
                      const tracking =
                        data.trackingByAmbassador.get(ambassador.id) ||
                        emptyTrackingSummary();

                      return (
                        <tr
                          key={`${ambassador.source_table}-${ambassador.id}`}
                          className="border-b border-[#f1f5f2] align-top last:border-0"
                        >
                          <td className="py-4">
                            <AmbassadorIdentity ambassador={ambassador} />
                          </td>

                          <td className="py-4">
                            <div className="space-y-2">
                              <ProgramBadge program={ambassador.program} />
                              <p className="text-xs font-bold text-slate-500">
                                {ambassador.source}
                              </p>
                            </div>
                          </td>

                          <td className="py-4">
                            <ReferralCodeBlock ambassador={ambassador} />
                          </td>

                          <td className="py-4">
                            <div className="space-y-2">
                              <StatusBadge status={ambassador.status} />
                              <TierBadge tier={ambassador.tier} />
                              <p className="text-xs font-bold text-slate-500">
                                HR: {ambassador.hr_status}
                              </p>
                            </div>
                          </td>

                          <td className="py-4">
                            <PerformanceStack tracking={tracking} />
                          </td>

                          <td className="py-4">
                            <div className="space-y-1 text-xs font-bold text-slate-600">
                              <p>{money(tracking.rewards)} rewards</p>
                              <p>{number(tracking.pendingRewards)} pending</p>
                              <p>{money(tracking.revenue)} revenue</p>
                            </div>
                          </td>

                          <td className="py-4">
                            <PayoutBadge ambassador={ambassador} tracking={tracking} />
                          </td>

                          <td className="py-4">
                            <ReferralLinks ambassador={ambassador} />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <EmptyTableRow
                      colSpan={8}
                      title="No active ambassadors yet"
                      detail="Approve ambassador leads from HR to activate referral codes, payout eligibility, and tracking here."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-4">
          <DashboardCard>
            <SectionHeader
              title="Activate HR Leads"
              subtitle="Move screened applicants from HR into the active ambassador growth network."
              href={partnerRoutes.ambassadorLeads}
              action="Open HR Leads"
            />

            <div className="space-y-3">
              {data.pendingLeads.length ? (
                data.pendingLeads.slice(0, 8).map((lead) => (
                  <div
                    key={`pending-${lead.id}`}
                    className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">
                          {lead.display_name}
                        </p>
                        <p className="truncate text-xs font-bold text-slate-500">
                          {lead.email}
                        </p>
                      </div>
                      <ProgramBadge program={lead.program} />
                    </div>

                    <div className="mt-3 grid gap-2 rounded-2xl bg-white p-3 text-xs font-bold text-slate-600">
                      <div className="flex items-center justify-between gap-2">
                        <span>Source</span>
                        <span className="text-right text-slate-900">{lead.source}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Status</span>
                        <span className="text-right text-slate-900">{lead.hr_status}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Location</span>
                        <span className="text-right text-slate-900">{lead.location}</span>
                      </div>
                    </div>

                    <form action={activateAmbassadorLead} className="mt-3">
                      <input type="hidden" name="lead_id" value={lead.id} />
                      <input type="hidden" name="lead_name" value={lead.display_name} />
                      <input type="hidden" name="referral_code" value={lead.referral_code} />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
                      >
                        <PlayCircle size={16} />
                        Activate Ambassador
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No HR leads waiting"
                  detail="New, contacted, interested, and signed-up leads from Ambassador Leads will appear here until they are approved."
                />
              )}
            </div>
          </DashboardCard>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-4">
          <DashboardCard>
            <SectionHeader
              title="Program Mix"
              subtitle="Approved ambassadors by SitGuru program."
              href={partnerRoutes.ambassadorLeads}
              action="View Leads"
            />
            <BreakdownList items={data.programBreakdown} />
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-4">
          <DashboardCard>
            <SectionHeader
              title="Recruiting Sources"
              subtitle="Where approved ambassadors originated."
              href={partnerRoutes.hr}
              action="Open HR"
            />
            <BreakdownList items={data.sourceBreakdown} />
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-4">
          <DashboardCard>
            <SectionHeader
              title="Ambassador Revenue"
              subtitle="Signup, booking, reward, and payout readiness snapshot."
              href={partnerRoutes.partnerPayouts}
              action="Payouts"
            />

            <div className="grid gap-3">
              <SummaryRow
                icon={<TrendingIcon />}
                label="Attributed Revenue"
                value={money(data.metrics.totalRevenue)}
              />
              <SummaryRow
                icon={<Gift size={18} />}
                label="Rewards Earned"
                value={money(data.metrics.totalRewards)}
              />
              <SummaryRow
                icon={<WalletCards size={18} />}
                label="Pending Rewards"
                value={number(data.metrics.pendingRewards)}
              />
              <SummaryRow
                icon={<Link2 size={18} />}
                label="Missing Referral Codes"
                value={number(data.metrics.missingReferralCodes)}
              />
            </div>
          </DashboardCard>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ActionCard
          href={partnerRoutes.ambassadorLeads}
          icon={<UserCheck size={20} />}
          title="Review HR Ambassador Leads"
          detail="Screen and manage applicants before they become payout-eligible ambassadors."
        />
        <ActionCard
          href={partnerRoutes.referrals}
          icon={<Sparkles size={20} />}
          title="Open Growth & Referrals"
          detail="Review referral attribution, signup activity, and conversion progress."
        />
        <ActionCard
          href={partnerRoutes.partnerPayouts}
          icon={<WalletCards size={20} />}
          title="Manage Ambassador Payouts"
          detail="Approve pending rewards and payout-ready ambassador activity."
        />
      </section>
    </main>
  );
}

function emptyTrackingSummary(): AmbassadorTrackingSummary {
  return {
    clicks: 0,
    views: 0,
    signups: 0,
    bookings: 0,
    revenue: 0,
    rewards: 0,
    pendingRewards: 0,
    pendingPayouts: 0,
    paidPayouts: 0,
    lastActivity: null,
    sources: [],
  };
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-w-0 rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function MetricTile({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-3xl font-black text-green-950">{value}</p>
      <p className="mt-1 text-sm font-bold leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
  action,
}: {
  title: string;
  subtitle: string;
  href: string;
  action: string;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div className="min-w-0">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
          {subtitle}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2 text-sm font-black text-green-800 transition hover:bg-green-50"
      >
        {action}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function AmbassadorIdentity({ ambassador }: { ambassador: PartnerAmbassador }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-black text-green-800">
        {getInitials(ambassador.display_name)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-black text-slate-950">
          {ambassador.display_name}
        </p>
        <p className="truncate text-xs font-bold text-slate-500">
          {ambassador.email}
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <MapPin size={12} />
          {ambassador.location}
        </p>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SG";
}

function ProgramBadge({ program }: { program: string }) {
  const styles =
    program === "Student Hire"
      ? "border-blue-100 bg-blue-50 text-blue-800"
      : program === "Military Hire"
        ? "border-emerald-100 bg-emerald-50 text-emerald-800"
        : "border-green-100 bg-green-50 text-green-800";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${styles}`}
    >
      {program}
    </span>
  );
}

function StatusBadge({ status }: { status: AmbassadorStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses(status)}`}
    >
      {formatLabel(status)}
    </span>
  );
}

function TierBadge({ tier }: { tier: PartnerAmbassador["tier"] }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tierClasses(tier)}`}
    >
      {tierIcon(tier)} {formatLabel(tier)}
    </span>
  );
}

function ReferralCodeBlock({ ambassador }: { ambassador: PartnerAmbassador }) {
  if (!ambassador.referral_code) {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
        Needs code
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-3 py-2 text-xs font-black text-green-900">
        <Copy size={13} />
        {ambassador.referral_code}
      </div>
      <p className="max-w-[210px] truncate text-[11px] font-bold text-slate-500">
        {ambassador.customer_referral_url}
      </p>
    </div>
  );
}

function PerformanceStack({ tracking }: { tracking: AmbassadorTrackingSummary }) {
  return (
    <div className="grid gap-1 text-xs font-bold text-slate-600">
      <p>{number(tracking.clicks)} clicks</p>
      <p>{number(tracking.signups)} signups</p>
      <p>{number(tracking.bookings)} bookings</p>
      <p>Last: {formatDate(tracking.lastActivity)}</p>
    </div>
  );
}

function PayoutBadge({
  ambassador,
  tracking,
}: {
  ambassador: PartnerAmbassador;
  tracking: AmbassadorTrackingSummary;
}) {
  if (!ambassador.payout_eligible) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
        Not ready
      </span>
    );
  }

  if (tracking.pendingPayouts > 0) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
        Pending
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">
      Eligible
    </span>
  );
}

function ReferralLinks({ ambassador }: { ambassador: PartnerAmbassador }) {
  return (
    <div className="space-y-2 text-xs font-black">
      <ReferralLink href={ambassador.customer_referral_url} label="Parent" />
      <ReferralLink href={ambassador.guru_referral_url} label="Guru" />
      <ReferralLink href={ambassador.partner_referral_url} label="Partner" />
      {ambassador.source_table === "ambassador_leads" && ambassador.status === "active" ? (
        <form action={pauseAmbassadorLead}>
          <input type="hidden" name="lead_id" value={ambassador.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800 transition hover:bg-amber-100"
          >
            <PauseCircle size={13} />
            Pause
          </button>
        </form>
      ) : null}
    </div>
  );
}

function ReferralLink({ href, label }: { href: string; label: string }) {
  if (!href || href === "Not generated") {
    return (
      <span className="block rounded-full bg-slate-100 px-3 py-1 text-slate-500">
        {label}: none
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-full bg-green-50 px-3 py-1 text-green-800 transition hover:bg-green-100"
    >
      {label} →
    </Link>
  );
}

function MobileAmbassadorCards({
  ambassadors,
  trackingByAmbassador,
}: {
  ambassadors: PartnerAmbassador[];
  trackingByAmbassador: Map<string, AmbassadorTrackingSummary>;
}) {
  if (!ambassadors.length) {
    return (
      <div className="lg:hidden">
        <EmptyState
          title="No active ambassadors yet"
          detail="Approve ambassador leads from HR to activate referral tracking."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:hidden">
      {ambassadors.map((ambassador) => {
        const tracking =
          trackingByAmbassador.get(ambassador.id) || emptyTrackingSummary();

        return (
          <article
            key={`mobile-${ambassador.source_table}-${ambassador.id}`}
            className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <AmbassadorIdentity ambassador={ambassador} />
              <StatusBadge status={ambassador.status} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ProgramBadge program={ambassador.program} />
              <TierBadge tier={ambassador.tier} />
              <PayoutBadge ambassador={ambassador} tracking={tracking} />
            </div>

            <div className="mt-4 grid gap-2 rounded-2xl bg-white p-3 text-xs font-bold text-slate-600">
              <MobileMeta label="Referral Code" value={ambassador.referral_code || "Needs code"} />
              <MobileMeta label="Clicks" value={number(tracking.clicks)} />
              <MobileMeta label="Signups" value={number(tracking.signups)} />
              <MobileMeta label="Rewards" value={money(tracking.rewards)} />
              <MobileMeta label="Payout Ready" value={ambassador.payout_eligible ? "Yes" : "No"} />
            </div>

            <div className="mt-4">
              <ReferralLinks ambassador={ambassador} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MobileMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="truncate text-right text-slate-950">{value}</span>
    </div>
  );
}

function EmptyTableRow({
  colSpan,
  title,
  detail,
}: {
  colSpan: number;
  title: string;
  detail: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10">
        <EmptyState title={title} detail={detail} />
      </td>
    </tr>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-green-200 bg-green-50/60 p-8 text-center">
      <Users className="mx-auto mb-3 text-green-700" size={32} />
      <h3 className="text-lg font-black text-green-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-green-900/70">
        {detail}
      </p>
    </div>
  );
}

function BreakdownList({ items }: { items: { label: string; value: number }[] }) {
  if (!items.length) {
    return (
      <EmptyState
        title="No data yet"
        detail="Ambassador records will appear here as they are approved and activated."
      />
    );
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const width = total ? Math.round((item.value / total) * 100) : 0;

        return (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-700">
                {formatLabel(item.label)}
              </p>
              <p className="text-sm font-black text-green-800">
                {number(item.value)}
              </p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#eef4ef]">
              <div
                className="h-full rounded-full bg-green-700"
                style={{ width: `${Math.max(4, width)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
          {icon}
        </div>
        <p className="truncate text-sm font-black text-slate-700">{label}</p>
      </div>
      <p className="shrink-0 text-sm font-black text-green-900">{value}</p>
    </div>
  );
}

function TrendingIcon() {
  return <BarChart3 size={18} />;
}

function ShieldCheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.75 5.75 6.1v5.1c0 4.05 2.66 7.85 6.25 9.05 3.59-1.2 6.25-5 6.25-9.05V6.1L12 3.75Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.25 12.1 1.85 1.85 3.9-4.15"
      />
    </svg>
  );
}

function ActionCard({
  href,
  icon,
  title,
  detail,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {detail}
      </p>
      <p className="mt-5 text-sm font-black text-green-800">
        Open <span className="transition group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}
