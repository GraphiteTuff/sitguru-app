import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  Archive,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Edit3,
  ExternalLink,
  Filter,
  Gift,
  HandCoins,
  HeartHandshake,
  Megaphone,
  MousePointerClick,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

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

type ProgramCard = {
  title: string;
  description: string;
  href: string;
  icon: typeof Users;
  count: number;
  detail: string;
  tone: "green" | "emerald" | "blue" | "purple" | "amber" | "rose";
};

const adminRoutes = {
  dashboard: "/admin",
  referrals: "/admin/referrals",
  gurus: "/admin/referrals/gurus",
  petParents: "/admin/referrals/pet-parents",
  ambassadors: "/admin/referrals/ambassadors",
  partners: "/admin/referrals/partners",
  applications: "/admin/referrals/applications",
  payouts: "/admin/referrals/payouts",
  inventory: "/admin/referrals/inventory",
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

async function getReferralData(
  params: Record<string, string | string[] | undefined>,
) {
  const q = getParam(params, "q");
  const program = getParam(params, "program");
  const status = getParam(params, "status");
  const payout = getParam(params, "payout");

  const [codesResult, activityResult] = await Promise.all([
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
    ambassadorCodes: allCodes.filter(
      (code) => code.program_type === "ambassador_referral",
    ).length,
    partnerCodes: allCodes.filter((code) =>
      ["partner", "petperks"].includes(code.program_type || ""),
    ).length,
    campaignCodes: allCodes.filter((code) =>
      ["campaign", "event", "marketing_referral", "signup_code"].includes(
        code.program_type || "",
      ),
    ).length,
    usageCount: allCodes.reduce((sum, code) => sum + asNumber(code.usage_count), 0),
    convertedCount: allCodes.reduce(
      (sum, code) => sum + asNumber(code.converted_count),
      0,
    ),
    approvedCount: allCodes.reduce(
      (sum, code) => sum + asNumber(code.approved_count),
      0,
    ),
    bookings: allCodes.reduce((sum, code) => sum + asNumber(code.booking_count), 0),
    revenue: allCodes.reduce((sum, code) => sum + asNumber(code.revenue_amount), 0),
    pendingPayouts: allCodes.filter(isPayoutOpen).length,
    paidPayouts: allCodes.filter((code) => code.payout_status === "paid").length,
  };

  const programCards: ProgramCard[] = [
    {
      title: "Guru Referral Program",
      description: "Track Guru leads, new Guru signup codes, approvals, and bookable activation.",
      href: adminRoutes.gurus,
      icon: UserPlus,
      count: metrics.guruCodes,
      detail: "Guru codes",
      tone: "green",
    },
    {
      title: "Pet Parent / PetPerks",
      description: "Track Pet Parent signup codes, PetPerks, and customer referral activity.",
      href: adminRoutes.petParents,
      icon: Gift,
      count: metrics.petParentCodes,
      detail: "Pet Parent codes",
      tone: "purple",
    },
    {
      title: "Ambassador Referrals",
      description: "Track ambassador codes, outreach links, signups, and future commission review.",
      href: adminRoutes.ambassadors,
      icon: HeartHandshake,
      count: metrics.ambassadorCodes,
      detail: "Ambassador codes",
      tone: "blue",
    },
    {
      title: "Partners / Clinics",
      description: "Track partner, clinic, PetPerks, and local business referral codes.",
      href: adminRoutes.partners,
      icon: ShieldCheck,
      count: metrics.partnerCodes,
      detail: "Partner codes",
      tone: "emerald",
    },
    {
      title: "Applications / Signups",
      description: "Review who used a code and where they are in the conversion stage.",
      href: adminRoutes.applications,
      icon: ClipboardList,
      count: metrics.convertedCount,
      detail: "Converted signups",
      tone: "amber",
    },
    {
      title: "Payout Accountability",
      description: "Review eligible, approved, paid, declined, and manual payout records.",
      href: adminRoutes.payouts,
      icon: HandCoins,
      count: metrics.pendingPayouts,
      detail: "Payouts needing review",
      tone: "rose",
    },
  ];

  return {
    codes,
    allCodes,
    activities,
    metrics,
    programCards,
    filters: {
      q,
      program,
      status,
      payout,
    },
    warnings: [
      codesResult.error ? `referral_codes: ${codesResult.error.message}` : "",
      activityResult.error ? `referral_activity: ${activityResult.error.message}` : "",
    ].filter(Boolean),
  };
}

async function createReferralCode(formData: FormData) {
  "use server";

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
    created_by_name: "Admin Command Center",
    updated_by_name: "Admin Command Center",
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
      performed_by_name: "Admin Command Center",
      notes: "Code generated or safely updated from Referral Command Center.",
    });
  }

  revalidatePath(adminRoutes.referrals);
}

async function updateReferralCode(formData: FormData) {
  "use server";

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
    updated_by_name: "Admin Command Center",
  };

  await supabaseAdmin.from("referral_codes").update(payload).eq("id", id);

  await supabaseAdmin.from("referral_code_audit").insert({
    referral_code_id: id,
    action: "update_code",
    action_label: "Updated referral code record",
    new_status: payload.status,
    new_values: payload,
    performed_by_name: "Admin Command Center",
    notes: "Referral code updated from command center.",
  });

  revalidatePath(adminRoutes.referrals);
}

async function changeReferralCodeStatus(formData: FormData) {
  "use server";

  const id = asString(formData.get("id"));
  const actionType = asString(formData.get("action_type"));
  const reason = emptyToNull(formData.get("reason"));

  if (!id || !actionType) return;

  const now = new Date().toISOString();

  const payload: Record<string, unknown> = {
    updated_by_name: "Admin Command Center",
  };

  if (actionType === "archive") {
    payload.status = "archived";
    payload.archived_at = now;
    payload.archived_reason = reason || "Archived from Referral Command Center.";
  }

  if (actionType === "void") {
    payload.status = "voided";
    payload.voided_at = now;
    payload.void_reason = reason || "Voided from Referral Command Center.";
  }

  if (actionType === "delete_test") {
    payload.status = "deleted";
    payload.deleted_at = now;
    payload.delete_reason =
      reason || "Marked as deleted/test record from Referral Command Center.";
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
    performed_by_name: "Admin Command Center",
    notes: reason,
  });

  revalidatePath(adminRoutes.referrals);
}

async function addReferralActivity(formData: FormData) {
  "use server";

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
    created_by_name: "Admin Command Center",
    updated_by_name: "Admin Command Center",
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
        updated_by_name: "Admin Command Center",
      })
      .eq("id", current.id);

    await supabaseAdmin.from("referral_code_audit").insert({
      referral_code_id: current.id,
      referral_activity_id: activity?.id || null,
      action: "add_referral_activity",
      action_label: "Added referral activity",
      new_status: stage,
      new_values: payload,
      performed_by_name: "Admin Command Center",
      notes: "Manual activity added and code counts updated.",
    });
  }

  revalidatePath(adminRoutes.referrals);
}

export default async function AdminReferralCommandCenter({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolvedParams = await Promise.resolve(searchParams || {});
  const data = await getReferralData(resolvedParams);

  return (
    <main className="w-full min-w-0 space-y-5">
      <section className="rounded-[28px] border border-green-100 bg-gradient-to-br from-white via-[#f7fbf4] to-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div className="min-w-0">
            <Link
              href={adminRoutes.dashboard}
              className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-black text-green-800 shadow-sm ring-1 ring-green-100 transition hover:bg-green-50 hover:text-green-950 sm:text-sm"
            >
              ← Back to Admin
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl xl:text-5xl">
                Referral Command Center
              </h1>
              <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-green-800 sm:text-xs">
                Accountability Hub
              </span>
            </div>

            <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
              Generate, issue, update, archive, and track referral codes across
              Gurus, Pet Parents, Ambassadors, Partners, PetPerks, campaigns,
              events, signups, bookings, and payout accountability.
            </p>
          </div>

          <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto">
            <Link
              href={adminRoutes.inventory}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-900 shadow-sm transition hover:bg-amber-100"
            >
              <Search size={17} />
              Read-only Inventory
            </Link>

            <a
              href="#generate-code"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <Plus size={17} />
              Generate Code
            </a>

            <a
              href="#add-activity"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <MousePointerClick size={17} />
              Add Activity
            </a>
          </div>
        </div>
      </section>

      {data.warnings.length ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          {data.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </section>
      ) : null}

      <section className="grid w-full min-w-0 gap-3 rounded-[28px] border border-green-100 bg-white p-3 shadow-sm sm:grid-cols-2 sm:p-4 lg:grid-cols-4 2xl:grid-cols-8">
        <MetricTile label="Total Codes" value={number(data.metrics.totalCodes)} />
        <MetricTile label="Active Codes" value={number(data.metrics.activeCodes)} />
        <MetricTile label="Needs Review" value={number(data.metrics.needsReview)} />
        <MetricTile label="Converted" value={number(data.metrics.convertedCount)} />
        <MetricTile label="Approved" value={number(data.metrics.approvedCount)} />
        <MetricTile label="Bookings" value={number(data.metrics.bookings)} />
        <MetricTile label="Revenue" value={money(data.metrics.revenue)} />
        <MetricTile
          label="Payout Review"
          value={number(data.metrics.pendingPayouts)}
        />
      </section>

      <section className="grid w-full min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-6">
        {data.programCards.map((card) => (
          <ProgramCard key={card.title} card={card} />
        ))}
      </section>

      <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <DashboardCard>
            <div id="generate-code" className="mb-5">
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
          <DashboardCard>
            <div id="add-activity" className="mb-5">
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
            <h2 className="text-xl font-black text-slate-950">
              Referral Code Registry
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Search and filter all absorbed and admin-generated codes. Codes are
              preserved; archive or void real records instead of deleting.
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
                title="Guru Signup"
                detail="/become-a-guru?ref=CODE and Guru signup code field."
              />
              <CapturePoint
                title="Pet Parent Signup"
                detail="/signup?ref=CODE and Referral / PetPerks code field."
              />
              <CapturePoint
                title="Ambassador Signup"
                detail="/ambassador/signup?ref=CODE and ambassador outreach links."
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
    </main>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-w-0 rounded-[24px] border border-[#e3ece5] bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5">
      {children}
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-[#fbfcf9] px-4 py-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-green-950 sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function ProgramCard({ card }: { card: ProgramCard }) {
  const Icon = card.icon;

  const toneClasses = {
    green: "bg-green-50 text-green-800 border-green-100",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-100",
    blue: "bg-blue-50 text-blue-800 border-blue-100",
    purple: "bg-purple-50 text-purple-800 border-purple-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    rose: "bg-rose-50 text-rose-800 border-rose-100",
  };

  return (
    <Link
      href={card.href}
      className="group rounded-[24px] border border-[#e3ece5] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg sm:rounded-[28px] sm:p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${toneClasses[card.tone]}`}
        >
          <Icon size={22} />
        </div>

        <span className="text-3xl font-black text-green-950">
          {number(card.count)}
        </span>
      </div>

      <h2 className="text-xl font-black tracking-tight text-slate-950">
        {card.title}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {card.description}
      </p>
      <p className="mt-3 text-sm font-black text-green-900 group-hover:text-green-700">
        {card.detail} →
      </p>
    </Link>
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
      <input type="hidden" name="reason" value={`${label} from command center`} />
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