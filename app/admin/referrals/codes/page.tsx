import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  Activity,
  Archive,
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Filter,
  Gift,
  HandCoins,
  HeartHandshake,
  MousePointerClick,
  Plus,
  QrCode,
  ScanLine,
  Search,
  Sparkles,
  Target,
  Trash2,
  XCircle,
} from "lucide-react";

import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  AdminWorkplaceActions,
  AdminWorkplaceDenied,
  AdminWorkplaceHealth,
  GrowthCard,
  GrowthPageFrame,
} from "@/components/admin/growth/GrowthPageFrame";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAdminIdentity } from "@/lib/admin/access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>
  | undefined;

type DbRow = Record<string, unknown>;

type ReferralCode = {
  id: string;
  code: string;
  normalized_code?: string | null;
  program_type?: string | null;
  owner_type?: string | null;
  owner_user_id?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  issued_to_type?: string | null;
  issued_to_user_id?: string | null;
  issued_to_name?: string | null;
  issued_to_email?: string | null;
  source?: string | null;
  campaign?: string | null;
  activity?: string | null;
  landing_path?: string | null;
  landing_url?: string | null;
  status?: string | null;
  payout_eligible?: boolean | null;
  payout_type?: string | null;
  payout_amount?: number | null;
  payout_status?: string | null;
  payout_trigger?: string | null;
  payout_notes?: string | null;
  usage_count?: number | null;
  converted_count?: number | null;
  approved_count?: number | null;
  booking_count?: number | null;
  revenue_amount?: number | null;
  notes?: string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  archived_at?: string | null;
  archived_reason?: string | null;
  voided_at?: string | null;
  void_reason?: string | null;
  deleted_at?: string | null;
  delete_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ReferralActivity = {
  id: string;
  referral_code_id?: string | null;
  code: string;
  activity_type?: string | null;
  program_type?: string | null;
  source?: string | null;
  campaign?: string | null;
  activity?: string | null;
  referrer_name?: string | null;
  referrer_email?: string | null;
  referrer_role?: string | null;
  referred_name?: string | null;
  referred_email?: string | null;
  referred_role?: string | null;
  signup_path?: string | null;
  conversion_stage?: string | null;
  conversion_status?: string | null;
  payout_eligible?: boolean | null;
  payout_type?: string | null;
  payout_amount?: number | null;
  payout_status?: string | null;
  payout_paid_at?: string | null;
  payout_notes?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CanonicalReferralCode = {
  id: string;
  code?: string | null;
  normalized_code?: string | null;
  user_id?: string | null;
  owner_type?: string | null;
  primary_role?: string | null;
  owner_display_name?: string | null;
  owner_email?: string | null;
  program_context?: string | null;
  program_type?: string | null;
  campaign_type?: string | null;
  legacy_source_table?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type CanonicalRelationship = {
  id: string;
  referral_code?: string | null;
  referrer_user_id?: string | null;
  referrer_role?: string | null;
  referrer_display_name?: string | null;
  referred_user_id?: string | null;
  referred_role?: string | null;
  referred_display_name?: string | null;
  referred_email?: string | null;
  source?: string | null;
  platform?: string | null;
  medium?: string | null;
  campaign?: string | null;
  status?: string | null;
  referral_stage?: string | null;
  signup_at?: string | null;
  activated_at?: string | null;
  qualified_at?: string | null;
  first_booking_at?: string | null;
  reward_status?: string | null;
  reward_amount?: number | null;
  reward_payment_reference?: string | null;
  code_owner_type?: string | null;
  code_owner_primary_role?: string | null;
  code_owner_display_name?: string | null;
  code_owner_email?: string | null;
  tracked_link_visits?: number | null;
  tracked_qr_scans?: number | null;
  created_at?: string | null;
};

type CanonicalEvent = {
  id: string;
  submitted_code?: string | null;
  event_type?: string | null;
  referred_name?: string | null;
  referred_email?: string | null;
  referred_role_at_signup?: string | null;
  source?: string | null;
  platform?: string | null;
  medium?: string | null;
  campaign?: string | null;
  landing_page?: string | null;
  conversion_stage?: string | null;
  conversion_status?: string | null;
  occurred_at?: string | null;
  created_at?: string | null;
};

type ReferralAuditRow = {
  id: string;
  relationship_id?: string | null;
  actor_source?: string | null;
  operation?: string | null;
  old_record?: DbRow | null;
  new_record?: DbRow | null;
  created_at?: string | null;
};

type LiveAmbassadorCode = {
  id: string;
  name: string;
  email: string;
  code: string;
  status: string;
  inRegistry: boolean;
};

const adminRoutes = {
  dashboard: "/admin",
  hub: "/admin/referrals",
  codes: "/admin/referrals/codes",
  gurus: "/admin/referrals/gurus",
  petParents: "/admin/referrals/pet-parents",
  ambassadors: "/admin/referrals/ambassadors",
  partners: "/admin/referrals/partners",
  applications: "/admin/referrals/applications",
  payouts: "/admin/referrals/payouts",
  inventory: "/admin/referrals/inventory",
  rewards: "/admin/rewards",
};

const programOptions = [
  { value: "admin_created", label: "Admin Created" },
  { value: "guru_lead", label: "Guru Lead" },
  { value: "guru_referral", label: "Guru Referral" },
  { value: "pet_parent_referral", label: "Pet Parent Referral" },
  { value: "customer_referral", label: "Customer Referral" },
  { value: "ambassador_referral", label: "Ambassador Referral" },
  { value: "partner", label: "Partner" },
  { value: "petperks", label: "PetPerks" },
  { value: "event", label: "Event" },
  { value: "campaign", label: "Campaign" },
  { value: "marketing_referral", label: "Marketing Referral" },
  { value: "signup_code", label: "Signup Code" },
  { value: "profile_referral", label: "Profile Referral" },
  { value: "general", label: "General" },
];

const ownerTypeOptions = [
  { value: "admin", label: "Admin" },
  { value: "guru", label: "Guru" },
  { value: "guru_lead", label: "Guru Lead" },
  { value: "pet_parent", label: "Pet Parent" },
  { value: "customer", label: "Customer" },
  { value: "ambassador", label: "Ambassador" },
  { value: "ambassador_lead", label: "Ambassador Lead" },
  { value: "partner", label: "Partner" },
  { value: "petperks", label: "PetPerks" },
  { value: "marketing", label: "Marketing" },
  { value: "marketing_campaign", label: "Marketing Campaign" },
  { value: "signup_lead", label: "Signup Lead" },
  { value: "profile", label: "Profile" },
  { value: "lead", label: "Lead" },
  { value: "event", label: "Event" },
  { value: "campaign", label: "Campaign" },
  { value: "system", label: "System" },
  { value: "unknown", label: "Unknown" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "needs_review", label: "Needs Review" },
  { value: "archived", label: "Archived" },
  { value: "voided", label: "Voided" },
  { value: "deleted", label: "Deleted/Test Removed" },
  { value: "pending", label: "Pending" },
  { value: "draft", label: "Draft" },
];

const payoutStatusOptions = [
  { value: "not_evaluated", label: "Not Evaluated" },
  { value: "not_eligible", label: "Not Eligible" },
  { value: "pending_review", label: "Pending Review" },
  { value: "eligible", label: "Eligible" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "declined", label: "Declined" },
  { value: "voided", label: "Voided" },
  { value: "manual_review", label: "Manual Review" },
];

const conversionStageOptions = [
  { value: "code_created", label: "Code Created" },
  { value: "shared_sent", label: "Shared / Sent" },
  { value: "clicked_used", label: "Clicked / Used" },
  { value: "signed_up", label: "Signed Up" },
  { value: "profile_started", label: "Profile Started" },
  { value: "onboarding_started", label: "Onboarding Started" },
  { value: "approved", label: "Approved" },
  { value: "bookable_active", label: "Bookable / Active" },
  { value: "first_booking", label: "First Booking" },
  { value: "payout_eligible", label: "Payout Eligible" },
  { value: "paid", label: "Paid" },
  { value: "closed", label: "Closed" },
  { value: "needs_review", label: "Needs Review" },
];

function asString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(String(value || "").replace(/[$,]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyToNull(value: unknown) {
  const text = asString(value);
  return text ? text : null;
}

function normalizeCode(value: unknown) {
  const raw = asString(value).toUpperCase();

  return raw
    .replace(/[^A-Z0-9-_]/g, "")
    .replace(/--+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

function generateCode(seed: string) {
  const cleanSeed = normalizeCode(seed)
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);

  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(2, 7);

  return `${cleanSeed || "SITGURU"}-${random}`;
}

function money(value: unknown) {
  const amount = asNumber(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function number(value: unknown) {
  return new Intl.NumberFormat("en-US").format(asNumber(value));
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCase(value: unknown) {
  const text = asString(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "—";
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeJsonPreview(value: unknown) {
  if (!value) return "No additional details";

  try {
    const output = JSON.stringify(value);
    return output.length > 240 ? `${output.slice(0, 237)}...` : output;
  } catch {
    return "Details could not be displayed";
  }
}

function canonicalCodeLabel(code: CanonicalReferralCode) {
  return code.normalized_code || code.code || "—";
}

function canonicalOwnerLabel(code: CanonicalReferralCode) {
  return (
    code.owner_display_name ||
    code.owner_email ||
    code.user_id ||
    "Owner needs review"
  );
}

function relationshipReferrerLabel(relationship: CanonicalRelationship) {
  return (
    relationship.referrer_display_name ||
    relationship.code_owner_display_name ||
    relationship.code_owner_email ||
    relationship.referrer_user_id ||
    "Referrer needs review"
  );
}

function relationshipReferredLabel(relationship: CanonicalRelationship) {
  return (
    relationship.referred_display_name ||
    relationship.referred_email ||
    relationship.referred_user_id ||
    "Referred member"
  );
}

function isCanonicalCodeMatch(code: CanonicalReferralCode, search: string) {
  if (!search) return true;

  return [
    code.code,
    code.normalized_code,
    code.owner_type,
    code.primary_role,
    code.owner_display_name,
    code.owner_email,
    code.program_context,
    code.program_type,
    code.campaign_type,
    code.legacy_source_table,
    code.status,
  ]
    .join(" ")
    .toLowerCase()
    .includes(search.toLowerCase());
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];

  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function labelFor(options: { value: string; label: string }[], value?: string | null) {
  const found = options.find((option) => option.value === value);
  return found?.label || value || "—";
}

function isProgramMatch(code: ReferralCode, search: string) {
  if (!search) return true;

  const text = [
    code.code,
    code.program_type,
    code.owner_type,
    code.owner_name,
    code.owner_email,
    code.issued_to_name,
    code.issued_to_email,
    code.source,
    code.campaign,
    code.activity,
    code.status,
    code.payout_status,
    code.notes,
  ]
    .join(" ")
    .toLowerCase();

  return text.includes(search.toLowerCase());
}

function getOwnerLabel(code: ReferralCode) {
  return (
    code.owner_name ||
    code.owner_email ||
    code.issued_to_name ||
    code.issued_to_email ||
    "Owner needs review"
  );
}

function getIssuedToLabel(code: ReferralCode) {
  return code.issued_to_name || code.issued_to_email || "Not assigned";
}

function getLandingUrl(code: ReferralCode) {
  if (code.landing_url) return code.landing_url;

  if (code.landing_path) {
    return `https://www.sitguru.com${code.landing_path}`;
  }

  if (
    code.program_type === "guru_lead" ||
    code.program_type === "guru_referral" ||
    code.owner_type === "guru" ||
    code.owner_type === "guru_lead"
  ) {
    return `https://www.sitguru.com/become-a-guru?ref=${encodeURIComponent(
      code.code,
    )}`;
  }

  if (
    code.program_type === "ambassador_referral" ||
    code.owner_type === "ambassador" ||
    code.owner_type === "ambassador_lead"
  ) {
    return `https://www.sitguru.com/ambassador/signup?ref=${encodeURIComponent(
      code.code,
    )}`;
  }

  return `https://www.sitguru.com/signup?ref=${encodeURIComponent(code.code)}`;
}

function isNeedsReview(code: ReferralCode) {
  return (
    !code.owner_name ||
    !code.owner_email ||
    code.status === "needs_review" ||
    code.owner_type === "unknown" ||
    code.program_type === "general"
  );
}

function isActive(code: ReferralCode) {
  return code.status === "active" && !code.archived_at && !code.voided_at && !code.deleted_at;
}

function isPayoutOpen(code: ReferralCode) {
  return ["pending_review", "eligible", "approved", "manual_review"].includes(
    code.payout_status || "",
  );
}

function reviewReason(code: ReferralCode) {
  if (code.status === "needs_review") return "Marked needs review";
  if (!code.owner_name || !code.owner_email) return "Missing owner";
  if (code.owner_type === "unknown") return "Unknown owner type";
  if (code.program_type === "general") return "General program";
  return "Needs review";
}

async function getReferralData(
  params: Record<string, string | string[] | undefined>,
) {
  const q = getParam(params, "q");
  const program = getParam(params, "program");
  const status = getParam(params, "status");
  const payout = getParam(params, "payout");

  const [
    codesResult,
    activityResult,
    canonicalCodesResult,
    relationshipsResult,
    eventsResult,
    auditResult,
    ambassadorsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("referral_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2500),
    supabaseAdmin
      .from("referral_activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabaseAdmin
      .from("pawperks_account_referral_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabaseAdmin
      .from("admin_referral_tracking")
      .select("*")
      .order("signup_at", { ascending: false })
      .limit(5000),
    supabaseAdmin
      .from("pawperks_referral_events")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(10000),
    supabaseAdmin
      .from("pawperks_referral_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    supabaseAdmin.from("ambassadors").select("*").limit(500),
  ]);

  const codes = ((codesResult.data || []) as ReferralCode[]).filter((code) => {
    const matchesSearch = isProgramMatch(code, q);
    const matchesProgram = !program || code.program_type === program;
    const matchesStatus = !status || code.status === status;
    const matchesPayout = !payout || code.payout_status === payout;

    return matchesSearch && matchesProgram && matchesStatus && matchesPayout;
  });

  const allCodes = ((codesResult.data || []) as ReferralCode[]) || [];
  const activities = ((activityResult.data || []) as ReferralActivity[]) || [];
  const allCanonicalCodes =
    ((canonicalCodesResult.data || []) as CanonicalReferralCode[]) || [];
  const canonicalCodes = allCanonicalCodes.filter((code) => {
    const matchesSearch = isCanonicalCodeMatch(code, q);
    const matchesProgram =
      !program ||
      code.program_type === program ||
      code.program_context === program ||
      code.campaign_type === program;
    const matchesStatus = !status || code.status === status;
    return matchesSearch && matchesProgram && matchesStatus;
  });
  const relationships =
    ((relationshipsResult.data || []) as CanonicalRelationship[]) || [];
  const events = ((eventsResult.data || []) as CanonicalEvent[]) || [];
  const audits = ((auditResult.data || []) as ReferralAuditRow[]) || [];
  const knownCodes = new Set(
    [
      ...allCodes.map((code) => normalizeCode(code.normalized_code || code.code)),
      ...allCanonicalCodes.map((code) =>
        normalizeCode(code.normalized_code || code.code),
      ),
    ].filter(Boolean),
  );
  const ambassadorCodes: LiveAmbassadorCode[] = (
    (ambassadorsResult.data || []) as DbRow[]
  )
    .map((row) => {
      const code = normalizeCode(row.referral_code);
      return {
        id: asString(row.id),
        name:
          asString(row.full_name) ||
          asString(row.display_name) ||
          asString(row.email) ||
          "Ambassador",
        email: asString(row.email) || asString(row.login_email),
        code,
        status: asString(row.status) || "active",
        inRegistry: knownCodes.has(code),
      };
    })
    .filter((row) => row.id && row.code);

  const metrics = {
    totalCodes: allCodes.length,
    activeCodes: allCodes.filter(isActive).length,
    needsReview: allCodes.filter(isNeedsReview).length,
    guruCodes: allCodes.filter((code) =>
      ["guru_lead", "guru_referral"].includes(code.program_type || ""),
    ).length,
    petParentCodes: allCodes.filter((code) =>
      ["pet_parent_referral", "customer_referral"].includes(
        code.program_type || "",
      ),
    ).length,
    ambassadorCodes: Math.max(
      allCodes.filter(
        (code) =>
          code.program_type === "ambassador_referral" ||
          code.owner_type === "ambassador",
      ).length,
      ambassadorCodes.length,
    ),
    liveAmbassadorCodes: ambassadorCodes.length,
    missingAmbassadorCodes: ambassadorCodes.filter((row) => !row.inRegistry)
      .length,
    partnerCodes: allCodes.filter((code) =>
      ["partner", "petperks"].includes(code.program_type || ""),
    ).length,
    campaignCodes: allCodes.filter((code) =>
      ["campaign", "event", "marketing_referral", "signup_code"].includes(
        code.program_type || "",
      ),
    ).length,
    usageCount: allCodes.reduce(
      (sum, code) => sum + asNumber(code.usage_count),
      0,
    ),
    convertedCount: allCodes.reduce(
      (sum, code) => sum + asNumber(code.converted_count),
      0,
    ),
    approvedCount: allCodes.reduce(
      (sum, code) => sum + asNumber(code.approved_count),
      0,
    ),
    bookings: allCodes.reduce(
      (sum, code) => sum + asNumber(code.booking_count),
      0,
    ),
    revenue: allCodes.reduce(
      (sum, code) => sum + asNumber(code.revenue_amount),
      0,
    ),
    pendingPayouts: allCodes.filter(isPayoutOpen).length,
    paidPayouts: allCodes.filter(
      (code) => code.payout_status === "paid",
    ).length,
  };

  const canonicalMetrics = {
    totalCodes: allCanonicalCodes.length,
    activeCodes: allCanonicalCodes.filter(
      (code) => (code.status || "active") === "active",
    ).length,
    relationships: relationships.length,
    linkVisits: events.filter((event) => event.event_type === "link_visit").length,
    qrScans: events.filter((event) => event.event_type === "qr_scan").length,
    signupCaptures: events.filter(
      (event) => event.event_type === "signup_capture",
    ).length,
    qualified: relationships.filter(
      (relationship) =>
        relationship.status === "qualified" || Boolean(relationship.qualified_at),
    ).length,
    completedBookings: relationships.filter((relationship) =>
      Boolean(relationship.first_booking_at),
    ).length,
    rewardReview: relationships.filter((relationship) =>
      ["pending_review", "eligible", "approved", "manual_review"].includes(
        relationship.reward_status || "",
      ),
    ).length,
    paidRewards: relationships.filter(
      (relationship) =>
        relationship.reward_status === "paid" &&
        Boolean(relationship.reward_payment_reference),
    ).length,
  };

  return {
    codes,
    allCodes,
    activities,
    metrics,
    canonicalCodes,
    allCanonicalCodes,
    relationships,
    events,
    audits,
    ambassadorCodes,
    canonicalMetrics,
    filters: { q, program, status, payout },
    sourceHealth: [
      {
        id: "referral_codes",
        label: "referral_codes",
        ok: !codesResult.error,
        rowCount: allCodes.length,
      },
      {
        id: "pawperks_account_referral_codes",
        label: "pawperks_account_referral_codes",
        ok: !canonicalCodesResult.error,
        rowCount: allCanonicalCodes.length,
      },
      {
        id: "ambassadors",
        label: "ambassadors",
        ok: !ambassadorsResult.error,
        rowCount: ambassadorCodes.length,
      },
      {
        id: "admin_referral_tracking",
        label: "admin_referral_tracking",
        ok: !relationshipsResult.error,
        rowCount: relationships.length,
      },
      {
        id: "pawperks_referral_events",
        label: "pawperks_referral_events",
        ok: !eventsResult.error,
        rowCount: events.length,
      },
      {
        id: "pawperks_referral_audit_log",
        label: "pawperks_referral_audit_log",
        ok: !auditResult.error,
        rowCount: audits.length,
      },
    ],
    warnings: [
      codesResult.error ? `referral_codes: ${codesResult.error.message}` : "",
      activityResult.error
        ? `referral_activity: ${activityResult.error.message}`
        : "",
      canonicalCodesResult.error
        ? `pawperks_account_referral_codes: ${canonicalCodesResult.error.message}`
        : "",
      relationshipsResult.error
        ? `admin_referral_tracking: ${relationshipsResult.error.message}`
        : "",
      eventsResult.error
        ? `pawperks_referral_events: ${eventsResult.error.message}`
        : "",
      auditResult.error
        ? `pawperks_referral_audit_log: ${auditResult.error.message}`
        : "",
      ambassadorsResult.error
        ? `ambassadors: ${ambassadorsResult.error.message}`
        : "",
    ].filter(Boolean),
  };
}

async function createReferralCode(formData: FormData) {
  "use server";

  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    throw new Error("Admin access required.");
  }

  const rawCode = normalizeCode(formData.get("code"));
  const ownerName = emptyToNull(formData.get("owner_name"));
  const issuedToName = emptyToNull(formData.get("issued_to_name"));
  const source = emptyToNull(formData.get("source"));
  const campaign = emptyToNull(formData.get("campaign"));
  const programType = asString(formData.get("program_type")) || "admin_created";
  const ownerType = asString(formData.get("owner_type")) || "admin";

  const code =
    rawCode ||
    generateCode(
      [
        ownerName,
        issuedToName,
        campaign,
        source,
        labelFor(programOptions, programType),
      ]
        .filter(Boolean)
        .join(" "),
    );

  const landingPath =
    emptyToNull(formData.get("landing_path")) ||
    (programType.includes("guru")
      ? `/become-a-guru?ref=${code}`
      : programType.includes("ambassador")
        ? `/ambassador/signup?ref=${code}`
        : `/signup?ref=${code}`);

  const payoutAmount = asNumber(formData.get("payout_amount"));

  const payload = {
    code,
    program_type: programType,
    owner_type: ownerType,
    owner_name: ownerName,
    owner_email: emptyToNull(formData.get("owner_email")),
    issued_to_type: emptyToNull(formData.get("issued_to_type")),
    issued_to_name: issuedToName,
    issued_to_email: emptyToNull(formData.get("issued_to_email")),
    source,
    campaign,
    activity: emptyToNull(formData.get("activity")),
    landing_path: landingPath,
    landing_url: emptyToNull(formData.get("landing_url")),
    status: "active",
    payout_eligible: asString(formData.get("payout_eligible")) === "yes",
    payout_type: emptyToNull(formData.get("payout_type")),
    payout_amount: payoutAmount || null,
    payout_status: asString(formData.get("payout_status")) || "not_eligible",
    payout_trigger: emptyToNull(formData.get("payout_trigger")),
    payout_notes: emptyToNull(formData.get("payout_notes")),
    notes: emptyToNull(formData.get("notes")),
    created_by_name: actor.email || "Admin Portal",
    updated_by_name: actor.email || "Admin Portal",
  };

  const { data, error } = await supabaseAdmin
    .from("referral_codes")
    .upsert(payload, { onConflict: "code" })
    .select("id")
    .single();

  if (!error && data?.id) {
    await supabaseAdmin.from("referral_code_audit").insert({
      referral_code_id: data.id,
      action: "generate_or_issue_code",
      action_label: "Generated or issued referral code",
      new_status: "active",
      new_values: payload,
      performed_by_name: actor.email || "Admin Portal",
      notes: "Code generated or safely updated from Referral Code Registry.",
    });
  }

  revalidatePath(adminRoutes.codes);
  revalidatePath(adminRoutes.hub);
}

async function updateReferralCode(formData: FormData) {
  "use server";

  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    throw new Error("Admin access required.");
  }

  const id = asString(formData.get("id"));
  if (!id) return;

  const payoutAmount = asNumber(formData.get("payout_amount"));

  const payload = {
    program_type: asString(formData.get("program_type")) || "admin_created",
    owner_type: asString(formData.get("owner_type")) || "admin",
    owner_name: emptyToNull(formData.get("owner_name")),
    owner_email: emptyToNull(formData.get("owner_email")),
    issued_to_type: emptyToNull(formData.get("issued_to_type")),
    issued_to_name: emptyToNull(formData.get("issued_to_name")),
    issued_to_email: emptyToNull(formData.get("issued_to_email")),
    source: emptyToNull(formData.get("source")),
    campaign: emptyToNull(formData.get("campaign")),
    activity: emptyToNull(formData.get("activity")),
    landing_path: emptyToNull(formData.get("landing_path")),
    landing_url: emptyToNull(formData.get("landing_url")),
    status: asString(formData.get("status")) || "active",
    payout_eligible: asString(formData.get("payout_eligible")) === "yes",
    payout_type: emptyToNull(formData.get("payout_type")),
    payout_amount: payoutAmount || null,
    payout_status: asString(formData.get("payout_status")) || "not_eligible",
    payout_trigger: emptyToNull(formData.get("payout_trigger")),
    payout_notes: emptyToNull(formData.get("payout_notes")),
    notes: emptyToNull(formData.get("notes")),
    updated_by_name: actor.email || "Admin Portal",
  };

  await supabaseAdmin.from("referral_codes").update(payload).eq("id", id);

  await supabaseAdmin.from("referral_code_audit").insert({
    referral_code_id: id,
    action: "update_code",
    action_label: "Updated referral code record",
    new_status: payload.status,
    new_values: payload,
    performed_by_name: actor.email || "Admin Portal",
    notes: "Referral code updated from dashboard.",
  });

  revalidatePath(adminRoutes.codes);
  revalidatePath(adminRoutes.hub);
}

async function changeReferralCodeStatus(formData: FormData) {
  "use server";

  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    throw new Error("Admin access required.");
  }

  const id = asString(formData.get("id"));
  const actionType = asString(formData.get("action_type"));
  const reason = emptyToNull(formData.get("reason"));

  if (!id || !actionType) return;

  const now = new Date().toISOString();

  const payload: Record<string, unknown> = {
    updated_by_name: actor.email || "Admin Portal",
  };

  if (actionType === "archive") {
    payload.status = "archived";
    payload.archived_at = now;
    payload.archived_reason = reason || "Archived from Referral Code Registry.";
  }

  if (actionType === "void") {
    payload.status = "voided";
    payload.voided_at = now;
    payload.void_reason = reason || "Voided from Referral Dashboard.";
  }

  if (actionType === "delete_test") {
    payload.status = "deleted";
    payload.deleted_at = now;
    payload.delete_reason =
      reason || "Marked as deleted/test record from Referral Dashboard.";
  }

  if (actionType === "reactivate") {
    payload.status = "active";
    payload.archived_at = null;
    payload.archived_reason = null;
    payload.voided_at = null;
    payload.void_reason = null;
    payload.deleted_at = null;
    payload.delete_reason = null;
  }

  await supabaseAdmin.from("referral_codes").update(payload).eq("id", id);

  await supabaseAdmin.from("referral_code_audit").insert({
    referral_code_id: id,
    action: actionType,
    action_label: `Referral code ${actionType}`,
    new_status: asString(payload.status),
    new_values: payload,
    performed_by_name: actor.email || "Admin Portal",
    notes: reason,
  });

  revalidatePath(adminRoutes.codes);
  revalidatePath(adminRoutes.hub);
}

async function addReferralActivity(formData: FormData) {
  "use server";

  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    throw new Error("Admin access required.");
  }

  const code = normalizeCode(formData.get("code"));
  if (!code) return;

  const stage = asString(formData.get("conversion_stage")) || "shared_sent";
  const payoutAmount = asNumber(formData.get("payout_amount"));

  const { data: codeRecord } = await supabaseAdmin
    .from("referral_codes")
    .select("*")
    .eq("normalized_code", code)
    .maybeSingle();

  const payload = {
    referral_code_id: (codeRecord as ReferralCode | null)?.id || null,
    code,
    activity_type: asString(formData.get("activity_type")) || "manual",
    program_type:
      emptyToNull(formData.get("program_type")) ||
      (codeRecord as ReferralCode | null)?.program_type ||
      null,
    source:
      emptyToNull(formData.get("source")) ||
      (codeRecord as ReferralCode | null)?.source ||
      null,
    campaign:
      emptyToNull(formData.get("campaign")) ||
      (codeRecord as ReferralCode | null)?.campaign ||
      null,
    activity: emptyToNull(formData.get("activity")),
    referrer_name: emptyToNull(formData.get("referrer_name")),
    referrer_email: emptyToNull(formData.get("referrer_email")),
    referrer_role: emptyToNull(formData.get("referrer_role")),
    referred_name: emptyToNull(formData.get("referred_name")),
    referred_email: emptyToNull(formData.get("referred_email")),
    referred_role: emptyToNull(formData.get("referred_role")),
    signup_path: emptyToNull(formData.get("signup_path")),
    conversion_stage: stage,
    conversion_status: asString(formData.get("conversion_status")) || "open",
    payout_eligible: asString(formData.get("payout_eligible")) === "yes",
    payout_type: emptyToNull(formData.get("payout_type")),
    payout_amount: payoutAmount || null,
    payout_status: asString(formData.get("payout_status")) || "not_eligible",
    payout_notes: emptyToNull(formData.get("payout_notes")),
    notes: emptyToNull(formData.get("notes")),
    created_by_name: actor.email || "Admin Portal",
    updated_by_name: actor.email || "Admin Portal",
  };

  const { data: activity } = await supabaseAdmin
    .from("referral_activity")
    .insert(payload)
    .select("id")
    .single();

  if (codeRecord?.id) {
    const current = codeRecord as ReferralCode;

    const convertedStages = [
      "signed_up",
      "profile_started",
      "onboarding_started",
      "approved",
      "bookable_active",
      "first_booking",
      "payout_eligible",
      "paid",
    ];

    const approvedStages = [
      "approved",
      "bookable_active",
      "first_booking",
      "payout_eligible",
      "paid",
    ];

    await supabaseAdmin
      .from("referral_codes")
      .update({
        usage_count: asNumber(current.usage_count) + 1,
        converted_count:
          asNumber(current.converted_count) +
          (convertedStages.includes(stage) ? 1 : 0),
        approved_count:
          asNumber(current.approved_count) +
          (approvedStages.includes(stage) ? 1 : 0),
        booking_count:
          asNumber(current.booking_count) + (stage === "first_booking" ? 1 : 0),
        payout_status:
          payload.payout_status !== "not_eligible"
            ? payload.payout_status
            : current.payout_status,
        updated_by_name: actor.email || "Admin Portal",
      })
      .eq("id", current.id);

    await supabaseAdmin.from("referral_code_audit").insert({
      referral_code_id: current.id,
      referral_activity_id: activity?.id || null,
      action: "add_referral_activity",
      action_label: "Added referral activity",
      new_status: stage,
      new_values: payload,
      performed_by_name: actor.email || "Admin Portal",
      notes: "Manual activity added and code counts updated.",
    });
  }

  revalidatePath(adminRoutes.codes);
  revalidatePath(adminRoutes.hub);
}

export default async function AdminReferralCodesPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied
        title="Admin access required."
        detail="Sign in with an authorized SitGuru admin account to manage referral codes."
      />
    );
  }

  const resolvedParams = await Promise.resolve(searchParams || {});
  const data = await getReferralData(resolvedParams);
  const reviewCodes = data.allCodes.filter(isNeedsReview).slice(0, 8);
  const missingAmbassadorCodes = data.ambassadorCodes.filter(
    (row) => !row.inRegistry,
  );

  return (
    <GrowthPageFrame
      kicker="Referral Code Workplace"
      title="Issue, fix, and track every SitGuru code."
      detail="Generate a code, clear the review queue, and keep Ambassador, Guru, and PawPerks attribution on one board."
      action={
        <a
          href="#generate-code"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          <Plus size={17} />
          Generate code
        </a>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href={adminRoutes.hub}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          <ArrowLeft size={14} />
          Referrals workplace
        </Link>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          {actor.email}
        </span>
      </div>

      {data.warnings.length ? (
        <GrowthCard className="border-amber-200 bg-amber-50">
          <p className="text-sm font-black text-amber-950">
            Some referral reads were skipped
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm font-semibold text-amber-900">
            {data.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </GrowthCard>
      ) : null}

      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3">
        <AdminThemeCard
          label="Active codes"
          value={data.metrics.activeCodes}
          helper={`${number(data.metrics.totalCodes)} in registry`}
          tone="emerald"
          icon={<Sparkles size={18} />}
        />
        <AdminThemeCard
          label="Needs review"
          value={data.metrics.needsReview}
          helper="Missing owner or marked"
          tone="amber"
          icon={<Search size={18} />}
        />
        <AdminThemeCard
          label="Ambassador live"
          value={data.metrics.liveAmbassadorCodes}
          helper={
            data.metrics.missingAmbassadorCodes
              ? `${data.metrics.missingAmbassadorCodes} not in registry`
              : "Workspace codes connected"
          }
          tone="sky"
          icon={<HeartHandshake size={18} />}
        />
        <AdminThemeCard
          label="Canonical codes"
          value={data.canonicalMetrics.totalCodes}
          helper={`${number(data.canonicalMetrics.relationships)} relationships`}
          tone="violet"
          icon={<QrCode size={18} />}
        />
        <AdminThemeCard
          label="Reward review"
          value={data.canonicalMetrics.rewardReview}
          helper={`${number(data.canonicalMetrics.paidRewards)} paid with reference`}
          tone="rose"
          icon={<BadgeDollarSign size={18} />}
        />
        <AdminThemeCard
          label="Tracked visits"
          value={data.canonicalMetrics.linkVisits}
          helper={`${number(data.canonicalMetrics.qrScans)} QR scans`}
          tone="slate"
          icon={<MousePointerClick size={18} />}
        />
      </section>

      <AdminWorkplaceActions
        actions={[
          {
            href: "#generate-code",
            label: "Generate code",
            detail: "Issue a Guru, Ambassador, or campaign code",
            icon: Plus,
            primary: true,
          },
          {
            href: "#review-queue",
            label: "Review queue",
            detail: `${number(data.metrics.needsReview)} codes need an owner or program`,
            icon: Search,
          },
          {
            href: "#add-activity",
            label: "Add activity",
            detail: "Log a signup, approval, or payout stage",
            icon: MousePointerClick,
          },
          {
            href: adminRoutes.inventory,
            label: "PawPerks inventory",
            detail: "Find missing, duplicate, and conflict codes",
            icon: Gift,
          },
          {
            href: adminRoutes.ambassadors,
            label: "Ambassador codes",
            detail: `${number(data.metrics.liveAmbassadorCodes)} live workspace codes`,
            icon: HeartHandshake,
          },
          {
            href: adminRoutes.rewards,
            label: "Rewards auditor",
            detail: `${number(data.canonicalMetrics.rewardReview)} payouts to review`,
            icon: HandCoins,
          },
        ]}
      />

      <GrowthCard id="review-queue">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
              Work queue
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Codes that need an owner or program
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Fix these first so attribution and payouts stay attached to a real
              person.
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-black text-amber-800 ring-1 ring-amber-100">
            {number(data.metrics.needsReview)} open
          </span>
        </div>

        {reviewCodes.length ? (
          <div className="mt-4 grid min-w-0 gap-3">
            {reviewCodes.map((code) => (
              <div
                key={code.id}
                className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{code.code}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                    {getOwnerLabel(code)} · {reviewReason(code)}
                  </p>
                </div>
                <Link
                  href={`${adminRoutes.codes}?q=${encodeURIComponent(code.code)}#editable-registry`}
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-white px-4 text-xs font-black text-amber-900 ring-1 ring-amber-200"
                >
                  Open registry
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Review queue is clear. New codes will land here if they are missing
            an owner or still marked general.
          </p>
        )}
      </GrowthCard>

      {missingAmbassadorCodes.length ? (
        <GrowthCard>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
                Ambassador circuit
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Live codes missing from the editable registry
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                These Ambassadors already have workspace codes. Issue or sync
                them here so Admin can edit and audit the same string.
              </p>
            </div>
            <span className="rounded-full bg-sky-50 px-4 py-2 text-xs font-black text-sky-800 ring-1 ring-sky-100">
              {number(missingAmbassadorCodes.length)} missing
            </span>
          </div>
          <div className="mt-4 grid min-w-0 gap-3">
            {missingAmbassadorCodes.slice(0, 8).map((row) => (
              <div
                key={row.id}
                className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{row.code}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                    {row.name}
                    {row.email ? ` · ${row.email}` : ""}
                  </p>
                </div>
                <a
                  href="#generate-code"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-white px-4 text-xs font-black text-sky-900 ring-1 ring-sky-200"
                >
                  Issue in registry
                </a>
              </div>
            ))}
          </div>
        </GrowthCard>
      ) : null}

      <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <DashboardCard id="generate-code">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">
                Generate / Issue Referral Code
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Create a permanent code for a Guru, Pet Parent, Ambassador,
                Partner, PetPerks, lead, event, or campaign. Leave code blank to
                auto-generate one.
              </p>
            </div>

            <form action={createReferralCode} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Input label="Code" name="code" placeholder="NADIAROMERO" />
                <Select
                  label="Program Type"
                  name="program_type"
                  options={programOptions}
                  defaultValue="admin_created"
                />
                <Select
                  label="Owner Type"
                  name="owner_type"
                  options={ownerTypeOptions}
                  defaultValue="admin"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Owner Name" name="owner_name" placeholder="Nadia Romero" />
                <Input label="Owner Email" name="owner_email" placeholder="name@email.com" />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Select
                  label="Issued To Type"
                  name="issued_to_type"
                  options={ownerTypeOptions}
                  defaultValue="lead"
                />
                <Input label="Issued To Name" name="issued_to_name" />
                <Input label="Issued To Email" name="issued_to_email" />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Input label="Source" name="source" placeholder="ZipRecruiter" />
                <Input label="Campaign" name="campaign" placeholder="June Guru Recruiting" />
                <Input label="Activity" name="activity" placeholder="Dog sitter outreach" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Landing Path"
                  name="landing_path"
                  placeholder="/become-a-guru?ref=CODE"
                />
                <Input
                  label="Full Landing URL"
                  name="landing_url"
                  placeholder="Optional"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <Select
                  label="Payout Eligible?"
                  name="payout_eligible"
                  options={[
                    { value: "no", label: "No" },
                    { value: "yes", label: "Yes" },
                  ]}
                  defaultValue="no"
                />
                <Input label="Payout Type" name="payout_type" placeholder="Commission" />
                <Input label="Payout Amount" name="payout_amount" placeholder="25" />
                <Select
                  label="Payout Status"
                  name="payout_status"
                  options={payoutStatusOptions}
                  defaultValue="not_eligible"
                />
              </div>

              <Input
                label="Payout Trigger"
                name="payout_trigger"
                placeholder="First completed booking, approval, manual review..."
              />

              <Textarea
                label="Notes"
                name="notes"
                placeholder="Why this code was created, who approved it, and any accountability notes."
              />

              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                <Plus size={17} />
                Generate / Issue Code
              </button>
            </form>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-5">
          <DashboardCard id="add-activity">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">
                Add Referral Activity
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Use this when someone uses a code, signs up, becomes approved,
                becomes bookable, or needs payout review.
              </p>
            </div>

            <form action={addReferralActivity} className="grid gap-4">
              <Input label="Code" name="code" placeholder="NADIAROMERO" required />

              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="Conversion Stage"
                  name="conversion_stage"
                  options={conversionStageOptions}
                  defaultValue="shared_sent"
                />
                <Select
                  label="Program Type"
                  name="program_type"
                  options={programOptions}
                  defaultValue="general"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Referrer Name" name="referrer_name" />
                <Input label="Referrer Email" name="referrer_email" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Referred Person" name="referred_name" />
                <Input label="Referred Email" name="referred_email" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Source" name="source" placeholder="PA CareerLink" />
                <Input label="Campaign" name="campaign" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Signup Path" name="signup_path" placeholder="/become-a-guru" />
                <Select
                  label="Payout Status"
                  name="payout_status"
                  options={payoutStatusOptions}
                  defaultValue="not_eligible"
                />
              </div>

              <Textarea
                label="Notes"
                name="notes"
                placeholder="What happened, who followed up, payout notes, or next action."
              />

              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                <MousePointerClick size={17} />
                Add Activity
              </button>
            </form>
          </DashboardCard>
        </div>
      </section>

      <DashboardCard>
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
              Universal Relationships
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Referrer to referred-member tracking
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              One durable first-touch relationship per referred SitGuru account,
              including source, platform, stage, qualification, booking, and reward review.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 ring-1 ring-emerald-100">
            {number(data.relationships.length)} relationships
          </span>
        </div>

        <CanonicalRelationshipList relationships={data.relationships.slice(0, 100)} />
      </DashboardCard>

      <DashboardCard>
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
              Universal Code Registry
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Every canonical referral code
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Pet Parent, Guru, Ambassador, partner, campaign, profile, and legacy codes
              absorbed into one durable registry.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 ring-1 ring-emerald-100">
            {number(data.canonicalCodes.length)} matching codes
          </span>
        </div>

        <CanonicalCodeRegistry codes={data.canonicalCodes.slice(0, 250)} />
      </DashboardCard>

      <DashboardCard id="editable-registry">
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Editable Referral Code Registry
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Manage the existing referral_codes records that synchronize into the
              universal registry. Archive or void real records instead of deleting.
            </p>
          </div>

          <form className="grid w-full gap-3 xl:max-w-5xl xl:grid-cols-5">
            <label className="xl:col-span-2">
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Search
              </span>
              <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-green-100 bg-white px-3 shadow-sm">
                <Search size={16} className="text-green-800" />
                <input
                  name="q"
                  defaultValue={data.filters.q}
                  placeholder="Code, owner, source, email..."
                  className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <Select
              label="Program"
              name="program"
              options={[{ value: "", label: "All Programs" }, ...programOptions]}
              defaultValue={data.filters.program}
            />

            <Select
              label="Status"
              name="status"
              options={[{ value: "", label: "All Statuses" }, ...statusOptions]}
              defaultValue={data.filters.status}
            />

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-2 text-sm font-black text-white transition hover:bg-green-900"
              >
                <Filter size={16} />
                Filter
              </button>
            </div>
          </form>
        </div>

        <MobileReferralList codes={data.codes} />

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#edf3ee] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <th className="pb-3">Code</th>
                <th className="pb-3">Program</th>
                <th className="pb-3">Owner / Issued</th>
                <th className="pb-3">Source</th>
                <th className="pb-3">Usage</th>
                <th className="pb-3">Payout</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Updated</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.codes.length ? (
                data.codes.map((code) => (
                  <tr
                    key={code.id}
                    className="border-b border-[#f1f5f2] align-top last:border-0"
                  >
                    <td className="py-4">
                      <div>
                        <p className="font-black text-green-950">{code.code}</p>
                        <a
                          href={getLandingUrl(code)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-black text-green-700 hover:text-green-900"
                        >
                          Open link <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                    <td className="py-4">
                      <ProgramBadge value={code.program_type || "general"} />
                      <p className="mt-2 text-xs font-bold text-slate-500">
                        {labelFor(ownerTypeOptions, code.owner_type)}
                      </p>
                    </td>
                    <td className="py-4">
                      <p className="font-black text-slate-950">
                        {getOwnerLabel(code)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Issued to: {getIssuedToLabel(code)}
                      </p>
                    </td>
                    <td className="py-4">
                      <p className="font-bold text-slate-700">
                        {code.source || "—"}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {code.campaign || code.activity || "No campaign"}
                      </p>
                    </td>
                    <td className="py-4">
                      <div className="grid gap-1 text-xs font-black text-slate-600">
                        <span>Used: {number(code.usage_count)}</span>
                        <span>Converted: {number(code.converted_count)}</span>
                        <span>Approved: {number(code.approved_count)}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <PayoutBadge value={code.payout_status || "not_eligible"} />
                      <p className="mt-2 text-xs font-bold text-slate-500">
                        {code.payout_amount ? money(code.payout_amount) : "No amount"}
                      </p>
                    </td>
                    <td className="py-4">
                      <StatusBadge value={code.status || "active"} />
                      {isNeedsReview(code) ? (
                        <p className="mt-2 text-xs font-black text-amber-700">
                          Needs review
                        </p>
                      ) : null}
                    </td>
                    <td className="py-4 text-xs font-bold text-slate-500">
                      {formatDate(code.updated_at || code.created_at)}
                    </td>
                    <td className="py-4">
                      <details className="group">
                        <summary className="cursor-pointer rounded-2xl border border-green-100 bg-green-50 px-3 py-2 text-xs font-black text-green-800 transition hover:bg-green-100">
                          Edit / Actions
                        </summary>

                        <div className="mt-3 w-[420px] max-w-[80vw] rounded-2xl border border-green-100 bg-white p-4 shadow-lg">
                          <ReferralEditForm code={code} />
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8">
                    <EmptyState
                      title="No referral codes match your filters"
                      detail="Clear filters or generate a new referral code."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      <section className="grid w-full min-w-0 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <DashboardCard>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                  Canonical Event Stream
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Links, QR scans, signups, and lifecycle events
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Append-only activity from tracked routes, signup provisioning,
                  verification, activation, booking, and approved reward processes.
                </p>
              </div>
              <Activity className="h-6 w-6 shrink-0 text-emerald-700" />
            </div>
            <CanonicalEventFeed events={data.events.slice(0, 25)} />
          </DashboardCard>
        </div>

        <div className="xl:col-span-5">
          <DashboardCard>
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                Admin Audit
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Referral relationship history
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Database audit entries for relationship inserts, updates, and deletes.
              </p>
            </div>
            <ReferralAuditFeed audits={data.audits.slice(0, 20)} />
          </DashboardCard>
        </div>
      </section>

      <section className="grid w-full min-w-0 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <DashboardCard>
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">
                Recent Referral Activity
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Latest manual and system activity tied to referral codes.
              </p>
            </div>

            <div className="grid gap-3">
              {data.activities.slice(0, 12).map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-black text-green-950">{activity.code}</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {labelFor(conversionStageOptions, activity.conversion_stage)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Referrer: {activity.referrer_name || activity.referrer_email || "—"}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        Referred: {activity.referred_name || activity.referred_email || "—"}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <PayoutBadge value={activity.payout_status || "not_eligible"} />
                      <p className="mt-2 text-xs font-bold text-slate-500">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {!data.activities.length ? (
                <EmptyState
                  title="No referral activity yet"
                  detail="Use Add Referral Activity when someone uses a code, signs up, gets approved, or needs payout review."
                />
              ) : null}
            </div>
          </DashboardCard>
        </div>

        <div className="xl:col-span-5">
          <DashboardCard>
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">
                Where Codes Are Captured
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                These are the SitGuru areas that should capture or accept codes.
              </p>
            </div>

            <div className="grid gap-3">
              <CapturePoint
                title="Universal Signup Input"
                detail="/signup accepts one optional referral code for Pet Parents, Gurus, Ambassadors, partners, and campaigns."
              />
              <CapturePoint
                title="Tracked Web and QR Routes"
                detail="/r/CODE/pet-parent, /r/CODE/guru, and /r/social/CODE/PLATFORM capture visits or scans before signup."
              />
              <CapturePoint
                title="Web App and Mobile App"
                detail="URL parameters, cookies, local storage, OAuth callbacks, and provisioning preserve the same referral attribution."
              />
              <CapturePoint
                title="Guru Leads"
                detail="Admin-created candidate codes from ZipRecruiter, PA CareerLink, events, and direct outreach."
              />
              <CapturePoint
                title="Partners / PetPerks"
                detail="Clinic, partner, business, door hanger, flyer, and campaign codes."
              />
              <CapturePoint
                title="Bookings / Payouts"
                detail="Future booking attribution, payout eligibility, commissions, and reward status."
              />
            </div>
          </DashboardCard>
        </div>
      </section>

      <AdminWorkplaceHealth
        sources={data.sourceHealth}
        helper="Live tables that feed this workplace"
        links={
          <>
            <Link
              href={adminRoutes.gurus}
              className="rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
            >
              Guru desk
            </Link>
            <Link
              href={adminRoutes.petParents}
              className="rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
            >
              Pet Parent desk
            </Link>
            <Link
              href={adminRoutes.payouts}
              className="rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
            >
              Payouts
            </Link>
          </>
        }
      />
    </GrowthPageFrame>
  );
}

function CanonicalRelationshipList({
  relationships,
}: {
  relationships: CanonicalRelationship[];
}) {
  if (!relationships.length) {
    return (
      <EmptyState
        title="No universal referral relationships yet"
        detail="A durable relationship appears after a valid referral code is attached to a newly provisioned SitGuru account."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {relationships.map((relationship) => (
        <article
          key={relationship.id}
          className="rounded-2xl border border-[#e3ece5] bg-[#fbfcf9] p-4"
        >
          <div className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_0.8fr_0.8fr] xl:items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                Referrer
              </p>
              <p className="mt-1 font-black text-green-950">
                {relationshipReferrerLabel(relationship)}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {titleCase(
                  relationship.referrer_role ||
                    relationship.code_owner_primary_role ||
                    relationship.code_owner_type,
                )}
              </p>
              <p className="mt-2 break-all text-xs font-black text-emerald-700">
                Code: {relationship.referral_code || "—"}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                Referred Member
              </p>
              <p className="mt-1 font-black text-slate-950">
                {relationshipReferredLabel(relationship)}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {titleCase(relationship.referred_role)}
              </p>
              <p className="mt-2 text-xs font-bold text-slate-500">
                Signed up {formatDateTime(relationship.signup_at)}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                Attribution
              </p>
              <p className="mt-1 text-sm font-black text-slate-800">
                {relationship.source || "Unknown source"}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {[relationship.platform, relationship.medium, relationship.campaign]
                  .filter(Boolean)
                  .join(" • ") || "No platform or campaign"}
              </p>
              <p className="mt-2 text-xs font-black text-emerald-700">
                {number(relationship.tracked_link_visits)} links •{" "}
                {number(relationship.tracked_qr_scans)} QR
              </p>
            </div>

            <div className="xl:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                Progress
              </p>
              <div className="mt-1 flex flex-wrap gap-2 xl:justify-end">
                <StatusBadge value={relationship.status || "pending"} />
                <PayoutBadge value={relationship.reward_status || "not_evaluated"} />
              </div>
              <p className="mt-2 text-xs font-black text-slate-600">
                Stage: {titleCase(relationship.referral_stage)}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {relationship.first_booking_at
                  ? `First booking ${formatDate(relationship.first_booking_at)}`
                  : relationship.qualified_at
                    ? `Qualified ${formatDate(relationship.qualified_at)}`
                    : relationship.activated_at
                      ? `Activated ${formatDate(relationship.activated_at)}`
                      : "Awaiting next verified stage"}
              </p>
              {relationship.reward_status === "paid" ? (
                <p className="mt-2 text-xs font-black text-green-700">
                  {relationship.reward_payment_reference
                    ? "Paid with payment reference"
                    : "Paid status needs reference review"}
                </p>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function CanonicalCodeRegistry({
  codes,
}: {
  codes: CanonicalReferralCode[];
}) {
  if (!codes.length) {
    return (
      <EmptyState
        title="No canonical referral codes match"
        detail="Clear the search filters or create a referral code in the editable registry."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {codes.map((code) => (
        <article
          key={code.id}
          className="rounded-2xl border border-[#e3ece5] bg-[#fbfcf9] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-all text-lg font-black text-green-950">
                {canonicalCodeLabel(code)}
              </p>
              <p className="mt-1 truncate text-sm font-black text-slate-800">
                {canonicalOwnerLabel(code)}
              </p>
            </div>
            <StatusBadge value={code.status || "active"} />
          </div>

          <div className="mt-4 grid gap-2">
            <MobileMeta
              label="Owner Type"
              value={titleCase(code.primary_role || code.owner_type)}
            />
            <MobileMeta
              label="Program"
              value={titleCase(
                code.program_context || code.program_type || code.campaign_type,
              )}
            />
            <MobileMeta
              label="Source"
              value={titleCase(code.legacy_source_table)}
            />
            <MobileMeta label="Created" value={formatDate(code.created_at)} />
          </div>

          <a
            href={`/signup?ref=${encodeURIComponent(canonicalCodeLabel(code))}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2 text-xs font-black text-green-800 transition hover:bg-green-50"
          >
            Open General Referral Link
            <ExternalLink size={13} />
          </a>
        </article>
      ))}
    </div>
  );
}

function CanonicalEventFeed({ events }: { events: CanonicalEvent[] }) {
  if (!events.length) {
    return (
      <EmptyState
        title="No canonical referral events yet"
        detail="Tracked link visits, QR scans, signup captures, and lifecycle events will appear here."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {events.map((event) => {
        const isQr = event.event_type === "qr_scan";
        const isLink = event.event_type === "link_visit";

        return (
          <article
            key={event.id}
            className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  {isQr ? (
                    <ScanLine size={18} />
                  ) : isLink ? (
                    <MousePointerClick size={18} />
                  ) : (
                    <Activity size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-green-950">
                    {titleCase(event.event_type)}
                  </p>
                  <p className="mt-1 break-all text-xs font-black text-emerald-700">
                    {event.submitted_code || "No submitted code"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {event.referred_name ||
                      event.referred_email ||
                      titleCase(event.referred_role_at_signup)}
                  </p>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                    {[event.source, event.platform, event.medium, event.campaign]
                      .filter(Boolean)
                      .join(" • ") || "No source details"}
                  </p>
                  {event.landing_page ? (
                    <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                      {event.landing_page}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 sm:text-right">
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                  {titleCase(event.conversion_stage || event.conversion_status)}
                </span>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  {formatDateTime(event.occurred_at || event.created_at)}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ReferralAuditFeed({ audits }: { audits: ReferralAuditRow[] }) {
  if (!audits.length) {
    return (
      <EmptyState
        title="No audit entries yet"
        detail="Relationship insert, update, and delete history will appear here."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {audits.map((audit) => (
        <details
          key={audit.id}
          className="group rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4"
        >
          <summary className="cursor-pointer list-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-green-950">
                  {titleCase(audit.operation)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {titleCase(audit.actor_source)}
                </p>
              </div>
              <p className="shrink-0 text-xs font-bold text-slate-500">
                {formatDateTime(audit.created_at)}
              </p>
            </div>
          </summary>

          <div className="mt-3 rounded-xl bg-white p-3 text-xs font-semibold leading-5 text-slate-600 ring-1 ring-slate-100">
            <p className="break-all">
              Relationship: {audit.relationship_id || "—"}
            </p>
            <p className="mt-2 break-all">
              New: {safeJsonPreview(audit.new_record)}
            </p>
            {audit.old_record ? (
              <p className="mt-2 break-all">
                Previous: {safeJsonPreview(audit.old_record)}
              </p>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}

function DashboardCard({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <GrowthCard id={id} className="min-w-0">
      {children}
    </GrowthCard>
  );
}

function Input({
  label,
  name,
  placeholder,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string | number | null;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="min-h-11 w-full rounded-2xl border border-green-100 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
      />
    </label>
  );
}

function Textarea({
  label,
  name,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string | null;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <textarea
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        rows={4}
        className="w-full rounded-2xl border border-green-100 bg-white px-3 py-3 text-sm font-bold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="min-h-11 w-full rounded-2xl border border-green-100 bg-white px-3 text-sm font-black text-slate-800 shadow-sm outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
      >
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProgramBadge({ value }: { value: string }) {
  const isGuru = value.includes("guru");
  const isAmbassador = value.includes("ambassador");
  const isPetParent = value.includes("pet_parent") || value.includes("customer");
  const isPartner = value.includes("partner") || value.includes("petperks");

  const classes = isGuru
    ? "bg-green-100 text-green-800"
    : isAmbassador
      ? "bg-blue-100 text-blue-800"
      : isPetParent
        ? "bg-purple-100 text-purple-800"
        : isPartner
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${classes}`}>
      {labelFor(programOptions, value)}
    </span>
  );
}

function StatusBadge({ value }: { value: string }) {
  const classes =
    value === "active"
      ? "bg-green-100 text-green-800"
      : value === "needs_review"
        ? "bg-amber-100 text-amber-800"
        : value === "voided" || value === "deleted"
          ? "bg-red-100 text-red-700"
          : value === "archived"
            ? "bg-slate-100 text-slate-700"
            : "bg-blue-100 text-blue-800";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${classes}`}>
      {labelFor(statusOptions, value)}
    </span>
  );
}

function PayoutBadge({ value }: { value: string }) {
  const classes =
    value === "paid"
      ? "bg-green-100 text-green-800"
      : value === "approved" || value === "eligible"
        ? "bg-blue-100 text-blue-800"
        : value === "pending_review" || value === "manual_review"
          ? "bg-amber-100 text-amber-800"
          : value === "declined" || value === "voided"
            ? "bg-red-100 text-red-700"
            : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${classes}`}>
      {labelFor(payoutStatusOptions, value)}
    </span>
  );
}

function MobileReferralList({ codes }: { codes: ReferralCode[] }) {
  if (!codes.length) {
    return (
      <div className="lg:hidden">
        <EmptyState
          title="No referral codes match your filters"
          detail="Clear filters or generate a new referral code."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:hidden">
      {codes.map((code) => (
        <article
          key={`mobile-${code.id}`}
          className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4"
        >
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-lg font-black text-green-950">{code.code}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">
                {getOwnerLabel(code)}
              </p>
              <p className="text-xs font-bold text-slate-500">
                Issued to: {getIssuedToLabel(code)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <ProgramBadge value={code.program_type || "general"} />
              <StatusBadge value={code.status || "active"} />
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <MobileMeta label="Source" value={code.source || "—"} />
            <MobileMeta label="Campaign" value={code.campaign || code.activity || "—"} />
            <MobileMeta label="Used" value={number(code.usage_count)} />
            <MobileMeta label="Converted" value={number(code.converted_count)} />
            <MobileMeta label="Approved" value={number(code.approved_count)} />
            <MobileMeta label="Payout" value={labelFor(payoutStatusOptions, code.payout_status)} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={getLandingUrl(code)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2 text-xs font-black text-green-800"
            >
              Open Link <ExternalLink size={13} />
            </a>

            <details>
              <summary className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-2 text-xs font-black text-white">
                Edit
              </summary>

              <div className="mt-3 rounded-2xl border border-green-100 bg-white p-4 shadow-lg">
                <ReferralEditForm code={code} />
              </div>
            </details>
          </div>
        </article>
      ))}
    </div>
  );
}

function MobileMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <span className="truncate text-right text-xs font-black text-slate-700">
        {value}
      </span>
    </div>
  );
}

function ReferralEditForm({ code }: { code: ReferralCode }) {
  return (
    <div className="grid gap-4">
      <form action={updateReferralCode} className="grid gap-3">
        <input type="hidden" name="id" value={code.id} />

        <div className="rounded-2xl bg-green-50 p-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-green-800">
            Permanent Code
          </p>
          <p className="mt-1 text-lg font-black text-green-950">{code.code}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Program"
            name="program_type"
            options={programOptions}
            defaultValue={code.program_type || "general"}
          />
          <Select
            label="Owner Type"
            name="owner_type"
            options={ownerTypeOptions}
            defaultValue={code.owner_type || "unknown"}
          />
        </div>

        <Input label="Owner Name" name="owner_name" defaultValue={code.owner_name} />
        <Input label="Owner Email" name="owner_email" defaultValue={code.owner_email} />
        <Input
          label="Issued To Name"
          name="issued_to_name"
          defaultValue={code.issued_to_name}
        />
        <Input
          label="Issued To Email"
          name="issued_to_email"
          defaultValue={code.issued_to_email}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Source" name="source" defaultValue={code.source} />
          <Input label="Campaign" name="campaign" defaultValue={code.campaign} />
        </div>

        <Input label="Activity" name="activity" defaultValue={code.activity} />
        <Input
          label="Landing Path"
          name="landing_path"
          defaultValue={code.landing_path}
        />
        <Input
          label="Landing URL"
          name="landing_url"
          defaultValue={code.landing_url}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Status"
            name="status"
            options={statusOptions}
            defaultValue={code.status || "active"}
          />
          <Select
            label="Payout Status"
            name="payout_status"
            options={payoutStatusOptions}
            defaultValue={code.payout_status || "not_eligible"}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Payout Eligible?"
            name="payout_eligible"
            options={[
              { value: "no", label: "No" },
              { value: "yes", label: "Yes" },
            ]}
            defaultValue={code.payout_eligible ? "yes" : "no"}
          />
          <Input
            label="Payout Amount"
            name="payout_amount"
            defaultValue={code.payout_amount || ""}
          />
        </div>

        <Input
          label="Payout Trigger"
          name="payout_trigger"
          defaultValue={code.payout_trigger}
        />
        <Textarea label="Notes" name="notes" defaultValue={code.notes} />

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-2 text-sm font-black text-white transition hover:bg-green-900"
        >
          <Edit3 size={15} />
          Save Code
        </button>
      </form>

      <div className="grid gap-2 sm:grid-cols-2">
        <StatusActionForm id={code.id} actionType="archive" label="Archive" icon={<Archive size={14} />} />
        <StatusActionForm id={code.id} actionType="void" label="Void" icon={<XCircle size={14} />} />
        <StatusActionForm id={code.id} actionType="delete_test" label="Delete Test" icon={<Trash2 size={14} />} />
        <StatusActionForm id={code.id} actionType="reactivate" label="Reactivate" icon={<CheckCircle2 size={14} />} />
      </div>
    </div>
  );
}

function StatusActionForm({
  id,
  actionType,
  label,
  icon,
}: {
  id: string;
  actionType: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <form action={changeReferralCodeStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action_type" value={actionType} />
      <input type="hidden" name="reason" value={`${label} from dashboard`} />
      <button
        type="submit"
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
      >
        {icon}
        {label}
      </button>
    </form>
  );
}

function CapturePoint({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
          <Target size={18} />
        </div>
        <div>
          <p className="font-black text-slate-950">{title}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/60 p-6 text-center">
      <p className="font-black text-green-950">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-green-900/70">
        {detail}
      </p>
    </div>
  );
}