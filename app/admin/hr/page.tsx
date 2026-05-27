import type { ReactNode } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  HeartHandshake,
  MapPin,
  MessageCircle,
  PawPrint,
  Plus,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

const adminRoutes = {
  dashboard: "/admin",
  hr: "/admin/hr",
  ambassadors: "/admin/ambassadors",
  ambassadorLeads: "/admin/ambassador-leads",
  programs: "/admin/programs",
  gurus: "/admin/gurus",
  newGuru: "/admin/gurus/new",
  backgroundChecks: "/admin/background-checks",
  partners: "/admin/partners",
  partnerApplications: "/admin/partners/applications",
  referrals: "/admin/referrals",
  messages: "/admin/messages",
  exports: "/admin/exports",
};

const programOrder = ["Student Hire", "Community Hire", "Military Hire"];

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
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
    asString(row.applied_at) ||
    asString(row.submitted_at) ||
    asString(row.last_contacted_at) ||
    asString(row.date) ||
    null
  );
}

function getStatus(row: AnyRow) {
  return getText(
    row,
    [
      "status",
      "lead_status",
      "application_status",
      "approval_status",
      "background_check_status",
    ],
    "new",
  ).toLowerCase();
}

function isArchivedStatus(row: AnyRow) {
  const status = getStatus(row);

  return (
    status === "archived" ||
    status === "archive" ||
    status === "retained" ||
    Boolean(asString(row.archived_at))
  );
}

function isPendingStatus(row: AnyRow) {
  if (isArchivedStatus(row)) return false;

  const status = getStatus(row);

  return (
    status === "new" ||
    status === "pending" ||
    status === "submitted" ||
    status === "review" ||
    status === "in_review" ||
    status === "contacted" ||
    status === "interested" ||
    status === "applied" ||
    status === "conditional_offer_sent" ||
    status === "onboarding_sent"
  );
}

function isApprovedStatus(row: AnyRow) {
  if (isArchivedStatus(row)) return false;

  const status = getStatus(row);

  return (
    status === "approved" ||
    status === "active" ||
    status === "enabled" ||
    status === "live" ||
    status === "complete" ||
    status === "completed"
  );
}

function getRole(row: AnyRow) {
  return getText(
    row,
    ["role", "user_role", "account_type", "type", "segment"],
    "",
  ).toLowerCase();
}

function getParticipantType(row: AnyRow) {
  return getText(
    row,
    ["participant_type", "partner_type", "program_type", "type", "role"],
    "",
  ).toLowerCase();
}

function getDisplayName(row: AnyRow, fallback = "Applicant") {
  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return getText(
    row,
    [
      "full_name",
      "display_name",
      "name",
      "lead_name",
      "applicant_name",
      "candidate_name",
      "contact_name",
      "guru_name",
      "email",
    ],
    fallback,
  );
}

function getEmail(row: AnyRow) {
  return getText(
    row,
    [
      "email",
      "lead_email",
      "applicant_email",
      "candidate_email",
      "contact_email",
    ],
    "—",
  );
}

function getLocation(row: AnyRow) {
  const city = getText(row, ["city", "service_city", "location_city"]);
  const state = getText(row, ["state", "service_state", "location_state"]);
  const location = getText(row, ["location", "market", "area"]);

  if (city || state) return [city, state].filter(Boolean).join(", ");
  return location || "—";
}

function getCombinedText(row: AnyRow) {
  return [
    getText(row, ["program", "program_name", "program_type", "lead_program"]),
    getText(row, ["participant_type", "partner_type", "type", "role"]),
    getText(row, ["source", "lead_source", "signup_source", "utm_source"]),
    getText(row, ["campaign", "campaign_name", "utm_campaign"]),
    getText(row, ["title", "name", "interest", "notes", "message"]),
    getText(row, ["position", "job_title", "posting_title"]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getProgramLabel(row: AnyRow) {
  const text = getCombinedText(row);
  const explicitProgram = getText(
    row,
    ["program", "program_name", "program_type", "lead_program"],
    "",
  );

  if (programOrder.includes(explicitProgram)) return explicitProgram;

  if (text.includes("student")) return "Student Hire";
  if (text.includes("community")) return "Community Hire";

  if (
    text.includes("military") ||
    text.includes("veteran") ||
    text.includes("active-duty") ||
    text.includes("active duty") ||
    text.includes("guard") ||
    text.includes("reserve")
  ) {
    return "Military Hire";
  }

  return "Community Hire";
}

function getSourceLabel(row: AnyRow) {
  const source = getText(
    row,
    ["source", "lead_source", "signup_source", "utm_source", "referral_source"],
    "",
  );
  const text = `${source} ${getCombinedText(row)}`.toLowerCase();

  if (text.includes("careerlink") || text.includes("career link")) {
    return "PA CareerLink";
  }
  if (text.includes("indeed")) return "Indeed";
  if (text.includes("handshake")) return "Handshake";
  if (text.includes("linkedin") || text.includes("linked in")) return "LinkedIn";
  if (
    text.includes("college") ||
    text.includes("university") ||
    text.includes("campus")
  ) {
    return "College / University";
  }
  if (
    text.includes("student organization") ||
    text.includes("student org") ||
    text.includes("club") ||
    text.includes("fraternity") ||
    text.includes("sorority")
  ) {
    return "Student Organization";
  }
  if (
    text.includes("military") ||
    text.includes("veteran") ||
    text.includes("active-duty") ||
    text.includes("active duty") ||
    text.includes("guard") ||
    text.includes("reserve")
  ) {
    return "Military / Veteran Organization";
  }
  if (text.includes("referral")) return "Referral";
  if (text.includes("website") || text.includes("site")) return "Website";

  return source || "Other";
}

function isAmbassadorLead(row: AnyRow) {
  const text = getCombinedText(row);
  const participantType = getParticipantType(row);

  return (
    text.includes("ambassador") ||
    text.includes("careerlink") ||
    text.includes("career link") ||
    text.includes("student hire") ||
    text.includes("community hire") ||
    text.includes("military hire") ||
    text.includes("veteran") ||
    participantType.includes("ambassador")
  );
}

function isGuruApplicant(row: AnyRow) {
  const text = getCombinedText(row);
  const role = getRole(row);
  const participantType = getParticipantType(row);

  return (
    text.includes("guru") ||
    text.includes("pet care") ||
    text.includes("sitter") ||
    text.includes("walker") ||
    role.includes("guru") ||
    participantType.includes("guru")
  );
}

function isWithinLastDays(value: string | null, days: number) {
  if (!value) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return parsed >= cutoff;
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`HR query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`HR query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

function mergeRows(...groups: AnyRow[][]) {
  const merged: AnyRow[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const row of group) {
      const sourceTable = getText(row, ["__source_table"], "unknown");
      const id = getText(row, ["id"]);
      const email = getEmail(row).toLowerCase();
      const name = getDisplayName(row).toLowerCase();
      const date = getDate(row);
      const fallbackKey = `${sourceTable}:${email}:${name}:${date}:${merged.length}`;
      const key = id ? `${sourceTable}:${id}` : fallbackKey;

      if (seen.has(key)) continue;

      seen.add(key);
      merged.push(row);
    }
  }

  return merged;
}

function withSourceTable(row: AnyRow, sourceTable: string) {
  return {
    ...row,
    __source_table: sourceTable,
  };
}

function normalizeLead(row: AnyRow) {
  return {
    raw: row,
    name: getDisplayName(row),
    email: getEmail(row),
    program: getProgramLabel(row),
    source: getSourceLabel(row),
    status: getReadableStatus(row),
    location: getLocation(row),
    date: getDate(row),
    archived: isArchivedStatus(row),
  };
}

function getReadableStatus(row: AnyRow) {
  const status = getStatus(row);

  if (status === "new") return "New";
  if (status === "pending") return "New";
  if (status === "submitted") return "New";
  if (status === "review") return "New";
  if (status === "in_review") return "New";
  if (status === "applied") return "New";
  if (status === "conditional_offer_sent") return "Contacted";
  if (status === "onboarding_sent") return "Contacted";
  if (status === "contacted") return "Contacted";
  if (status === "interested") return "Interested";
  if (status === "signed_up") return "Signed Up";
  if (status === "signup") return "Signed Up";
  if (status === "converted") return "Signed Up";
  if (status === "approved") return "Approved";
  if (status === "active") return "Approved";
  if (status === "enabled") return "Approved";
  if (status === "live") return "Approved";
  if (status === "complete") return "Approved";
  if (status === "completed") return "Approved";
  if (status === "not_moving_forward") return "Not Moving Forward";
  if (status === "not_a_fit") return "Not Moving Forward";
  if (status === "not_moving") return "Not Moving Forward";
  if (status === "declined") return "Not Moving Forward";
  if (status === "rejected") return "Not Moving Forward";
  if (status === "inactive") return "Not Moving Forward";
  if (status === "archived") return "Archived";

  return (
    status
      .split("_")
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ") || "New"
  );
}

async function getHrData() {
  const [
    ambassadorLeadsResult,
    ambassadorsResult,
    guruApplicationsResult,
    gurusResult,
    partnerApplicationsResult,
    networkPartnerLeadsResult,
    networkParticipantsResult,
    launchSignupsResult,
    launchWaitlistResult,
    programApplicationsResult,
    backgroundChecksResult,
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
        .from("guru_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "guru_applications",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("gurus")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "gurus",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "partner_applications",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("network_partner_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "network_partner_leads",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("network_program_participants")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "network_program_participants",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_signups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_signups",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_waitlist",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("program_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "program_applications",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("background_checks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "background_checks",
    ),
  ]);

  const ambassadorLeads = ((ambassadorLeadsResult.data || []) as AnyRow[]).map(
    (row) => withSourceTable(row, "ambassador_leads"),
  );
  const ambassadors = ((ambassadorsResult.data || []) as AnyRow[]).map((row) =>
    withSourceTable(row, "ambassadors"),
  );
  const guruApplications = ((guruApplicationsResult.data || []) as AnyRow[]).map(
    (row) => withSourceTable(row, "guru_applications"),
  );
  const gurus = ((gurusResult.data || []) as AnyRow[]).map((row) =>
    withSourceTable(row, "gurus"),
  );
  const partnerApplications = (
    (partnerApplicationsResult.data || []) as AnyRow[]
  ).map((row) => withSourceTable(row, "partner_applications"));
  const networkPartnerLeads = (
    (networkPartnerLeadsResult.data || []) as AnyRow[]
  ).map((row) => withSourceTable(row, "network_partner_leads"));
  const networkParticipants = (
    (networkParticipantsResult.data || []) as AnyRow[]
  ).map((row) => withSourceTable(row, "network_program_participants"));
  const launchSignups = ((launchSignupsResult.data || []) as AnyRow[]).map(
    (row) => withSourceTable(row, "launch_signups"),
  );
  const launchWaitlist = ((launchWaitlistResult.data || []) as AnyRow[]).map(
    (row) => withSourceTable(row, "launch_waitlist"),
  );
  const programApplications = (
    (programApplicationsResult.data || []) as AnyRow[]
  ).map((row) => withSourceTable(row, "program_applications"));
  const backgroundChecks = (
    (backgroundChecksResult.data || []) as AnyRow[]
  ).map((row) => withSourceTable(row, "background_checks"));

  const allAmbassadorRows = mergeRows(
    ambassadorLeads,
    ambassadors,
    partnerApplications.filter(isAmbassadorLead),
    networkPartnerLeads.filter(isAmbassadorLead),
    networkParticipants.filter(isAmbassadorLead),
    launchSignups.filter(isAmbassadorLead),
    launchWaitlist.filter(isAmbassadorLead),
    programApplications.filter(isAmbassadorLead),
  ).sort((a, b) => {
    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const allGuruRows = mergeRows(
    guruApplications,
    gurus,
    partnerApplications.filter(isGuruApplicant),
    launchSignups.filter(isGuruApplicant),
    launchWaitlist.filter(isGuruApplicant),
    programApplications.filter(isGuruApplicant),
  ).sort((a, b) => {
    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const ambassadorRecords = allAmbassadorRows.map(normalizeLead);
  const guruRecords = allGuruRows.map(normalizeLead);
  const backgroundCheckRecords = backgroundChecks.map(normalizeLead);

  const activeAmbassadorRecords = ambassadorRecords.filter(
    (record) => !record.archived,
  );
  const archivedAmbassadorRecords = ambassadorRecords.filter(
    (record) => record.archived,
  );
  const pendingGuruRecords = guruRecords.filter((record) =>
    isPendingStatus(record.raw),
  );
  const approvedGuruRecords = guruRecords.filter((record) =>
    isApprovedStatus(record.raw),
  );
  const pendingBackgroundCheckRecords = backgroundCheckRecords.filter((record) =>
    isPendingStatus(record.raw),
  );
  const approvedBackgroundCheckRecords = backgroundCheckRecords.filter((record) =>
    isApprovedStatus(record.raw),
  );

  const metrics = {
    ambassadorLeads: ambassadorRecords.length,
    activeAmbassadorLeads: activeAmbassadorRecords.length,
    archivedAmbassadorLeads: archivedAmbassadorRecords.length,
    studentHire: ambassadorRecords.filter(
      (record) => record.program === "Student Hire",
    ).length,
    communityHire: ambassadorRecords.filter(
      (record) => record.program === "Community Hire",
    ).length,
    militaryHire: ambassadorRecords.filter(
      (record) => record.program === "Military Hire",
    ).length,
    activeStudentHire: activeAmbassadorRecords.filter(
      (record) => record.program === "Student Hire",
    ).length,
    activeCommunityHire: activeAmbassadorRecords.filter(
      (record) => record.program === "Community Hire",
    ).length,
    activeMilitaryHire: activeAmbassadorRecords.filter(
      (record) => record.program === "Military Hire",
    ).length,
    activeGuruApplicants: guruRecords.filter((record) => !record.archived).length,
    pendingGuruApplicants: pendingGuruRecords.length,
    approvedGuruApplicants: approvedGuruRecords.length,
    pendingBackgroundChecks: pendingBackgroundCheckRecords.length,
    approvedBackgroundChecks: approvedBackgroundCheckRecords.length,
    recentApplicants: [...ambassadorRecords, ...guruRecords].filter((record) =>
      isWithinLastDays(record.date, 14),
    ).length,
  };

  return {
    metrics,
    recentAmbassadorLeads: activeAmbassadorRecords.slice(0, 8),
    recentGuruApplicants: guruRecords.filter((record) => !record.archived).slice(0, 8),
    pendingBackgroundChecks: pendingBackgroundCheckRecords.slice(0, 8),
  };
}

export default async function AdminHrPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const data = await getHrData();

  return (
    <main className="w-full min-w-0 space-y-5">
      <section className="rounded-[28px] border border-green-100 bg-gradient-to-br from-white via-[#f7fbf4] to-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div className="min-w-0">
            <Link
              href={adminRoutes.dashboard}
              className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-black text-green-800 shadow-sm ring-1 ring-green-100 transition hover:bg-green-50 hover:text-green-950 sm:text-sm"
            >
              <ArrowLeft size={16} />
              Back to Admin
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl xl:text-5xl">
                Human Resources
              </h1>
              <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-green-800 sm:text-xs">
                Hiring Command Center
              </span>
            </div>

            <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
              Manage SitGuru hiring, ambassador recruiting, Indeed and PA
              CareerLink leads, Guru applicants, onboarding, trust and safety
              checks, archived applicant records, and future contractor
              documentation in one mobile-friendly workspace.
            </p>
          </div>

          <div className="grid w-full shrink-0 gap-3 sm:grid-cols-3 xl:w-auto">
            <Link
              href={adminRoutes.ambassadorLeads}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Plus size={17} />
              Add Lead
            </Link>

            <Link
              href={adminRoutes.ambassadors}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <HeartHandshake size={17} />
              Dashboards
            </Link>

            <Link
              href={adminRoutes.newGuru}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-800 to-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:brightness-105"
            >
              <PawPrint size={17} />
              Add Guru
            </Link>
          </div>
        </div>
      </section>

      <section className="grid w-full min-w-0 gap-3 rounded-[28px] border border-green-100 bg-white p-3 shadow-sm sm:grid-cols-2 sm:p-4 lg:grid-cols-3 2xl:grid-cols-7">
        <DataHealthTile
          label="Ambassador Leads"
          value={number(data.metrics.ambassadorLeads)}
        />
        <DataHealthTile
          label="Active Leads"
          value={number(data.metrics.activeAmbassadorLeads)}
        />
        <DataHealthTile
          label="Archived"
          value={number(data.metrics.archivedAmbassadorLeads)}
        />
        <DataHealthTile
          label="Guru Applicants"
          value={number(data.metrics.activeGuruApplicants)}
        />
        <DataHealthTile
          label="Pending Review"
          value={number(
            data.metrics.pendingGuruApplicants +
              data.metrics.pendingBackgroundChecks,
          )}
        />
        <DataHealthTile
          label="Approved"
          value={number(
            data.metrics.approvedGuruApplicants +
              data.metrics.approvedBackgroundChecks,
          )}
        />
        <DataHealthTile
          label="Recent 14 Days"
          value={number(data.metrics.recentApplicants)}
        />
      </section>

      <section className="grid w-full min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <HrFeatureCard
          href={adminRoutes.ambassadorLeads}
          icon={<HeartHandshake size={22} />}
          title="Ambassador Leads"
          value={number(data.metrics.activeAmbassadorLeads)}
          detail="Track active Indeed, PA CareerLink, social, referral, event, and website ambassador applicants."
          action="Open Ambassador Leads"
          tone="green"
        />

        <HrFeatureCard
          href={adminRoutes.ambassadors}
          icon={<ClipboardCheck size={22} />}
          title="Ambassador Dashboards"
          value={number(data.metrics.activeAmbassadorLeads)}
          detail="Open Student Ambassador dashboard records, referral codes, referral links, and early referral tracking."
          action="Open Dashboards"
          tone="emerald"
        />

        <HrFeatureCard
          href={adminRoutes.gurus}
          icon={<PawPrint size={22} />}
          title="Guru Applicants"
          value={number(data.metrics.activeGuruApplicants)}
          detail="Review Pet Guru applicants, onboarding progress, and approval readiness."
          action="Open Gurus"
          tone="emerald"
        />

        <HrFeatureCard
          href={adminRoutes.backgroundChecks}
          icon={<ShieldCheck size={22} />}
          title="Trust & Safety Checks"
          value={number(data.metrics.pendingBackgroundChecks)}
          detail="Monitor pending trust and safety checks before Guru activation."
          action="Open Checks"
          tone="blue"
        />

        <HrFeatureCard
          href={adminRoutes.ambassadorLeads}
          icon={<Archive size={22} />}
          title="Archived Records"
          value={number(data.metrics.archivedAmbassadorLeads)}
          detail="Retain declined or closed applicant records without keeping them in the active pipeline."
          action="Review Archived"
          tone="amber"
        />
      </section>

      <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-5">
          <DashboardCard>
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Ambassador Program Pipeline
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Active order: Student Hire, Community Hire, Military Hire.
                  Archived applicants stay retained but are not treated as active.
                </p>
              </div>

              <Link
                href={adminRoutes.ambassadorLeads}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2.5 text-sm font-black text-green-900 transition hover:bg-green-50 sm:shrink-0"
              >
                View All
                <ExternalLink size={14} />
              </Link>
            </div>

            <div className="grid gap-3">
              <ProgramRow
                icon={<GraduationCap size={19} />}
                title="Student Hire"
                detail="Campus, student, school, and peer-network ambassador recruiting."
                value={number(data.metrics.activeStudentHire)}
                subvalue={`${number(data.metrics.studentHire)} total`}
              />
              <ProgramRow
                icon={<Users size={19} />}
                title="Community Hire"
                detail="Neighborhood, local events, community groups, and pet-friendly outreach."
                value={number(data.metrics.activeCommunityHire)}
                subvalue={`${number(data.metrics.communityHire)} total`}
              />
              <ProgramRow
                icon={<ShieldCheck size={19} />}
                title="Military Hire"
                detail="Veterans, military spouses, service families, Guard, Reserve, and supporters."
                value={number(data.metrics.activeMilitaryHire)}
                subvalue={`${number(data.metrics.militaryHire)} total`}
              />
              <ProgramRow
                icon={<Archive size={19} />}
                title="Archived Applicants"
                detail="Declined, closed, or retained applicant files that should not continue onboarding."
                value={number(data.metrics.archivedAmbassadorLeads)}
                subvalue="retained"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 shrink-0 text-green-800" size={20} />
                <div>
                  <p className="text-sm font-black text-green-950">
                    Status buttons are now wired
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-green-900/75">
                    Use the Ambassador Leads page to move applicants to
                    Contacted, Interested, Not Moving, Archived, or Restored
                    without running SQL each time.
                  </p>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-7">
          <DashboardCard>
            <TableHeader
              title="Recent Active Ambassador Leads"
              subtitle="Latest non-archived ambassador leads from Indeed, PA CareerLink, and other recruiting sources."
              href={adminRoutes.ambassadorLeads}
            />

            <MobileLeadList
              leads={data.recentAmbassadorLeads}
              emptyTitle="No active ambassador leads yet"
              emptyDetail="Active ambassador applicants will show here once added or restored."
              type="ambassador"
            />

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#edf3ee] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <th className="pb-3">Lead</th>
                    <th className="pb-3">Program</th>
                    <th className="pb-3">Source</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAmbassadorLeads.length ? (
                    data.recentAmbassadorLeads.map((lead, index) => (
                      <tr
                        key={`${lead.name}-${lead.email}-${lead.date}-${index}`}
                        className="border-b border-[#f1f5f2] last:border-0"
                      >
                        <td className="py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={lead.name} />
                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-950">
                                {lead.name}
                              </p>
                              <p className="truncate text-xs font-bold text-slate-500">
                                {lead.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <ProgramBadge program={lead.program} />
                        </td>
                        <td className="py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                            {lead.source}
                          </span>
                        </td>
                        <td className="py-4">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="py-4 font-bold text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={13} />
                            {lead.location}
                          </span>
                        </td>
                        <td className="py-4 font-bold text-slate-600">
                          {formatDate(lead.date)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow
                      colSpan={6}
                      title="No active ambassador leads yet"
                      detail="Active ambassador applicants will show here once added or restored."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>
      </section>

      <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <DashboardCard>
            <TableHeader
              title="Recent Guru Applicants"
              subtitle="Pet Guru applicant and onboarding activity."
              href={adminRoutes.gurus}
            />

            <MobileLeadList
              leads={data.recentGuruApplicants}
              emptyTitle="No Guru applicants yet"
              emptyDetail="Guru applications and onboarding activity will appear here."
              type="guru"
            />

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#edf3ee] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <th className="pb-3">Applicant</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentGuruApplicants.length ? (
                    data.recentGuruApplicants.map((applicant, index) => (
                      <tr
                        key={`${applicant.name}-${applicant.email}-${applicant.date}-${index}`}
                        className="border-b border-[#f1f5f2] last:border-0"
                      >
                        <td className="py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={applicant.name} />
                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-950">
                                {applicant.name}
                              </p>
                              <p className="truncate text-xs font-bold text-slate-500">
                                {applicant.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <StatusBadge status={applicant.status} />
                        </td>
                        <td className="py-4 font-bold text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={13} />
                            {applicant.location}
                          </span>
                        </td>
                        <td className="py-4 font-bold text-slate-600">
                          {formatDate(applicant.date)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow
                      colSpan={4}
                      title="No Guru applicants yet"
                      detail="Guru applications and onboarding activity will appear here."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-5">
          <DashboardCard>
            <TableHeader
              title="Trust & Safety Watchlist"
              subtitle="Pending checks and onboarding review items."
              href={adminRoutes.backgroundChecks}
            />

            <div className="grid gap-3">
              {data.pendingBackgroundChecks.length ? (
                data.pendingBackgroundChecks.map((check, index) => (
                  <div
                    key={`${check.name}-${check.email}-${check.date}-${index}`}
                    className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-950">
                          {check.name}
                        </p>
                        <p className="truncate text-xs font-bold text-slate-500">
                          {check.email}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <StatusBadge status={check.status} />
                          <span className="text-xs font-bold text-slate-500">
                            {formatDate(check.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No pending checks"
                  detail="Pending Guru trust and safety checks will show here."
                />
              )}
            </div>
          </DashboardCard>
        </div>
      </section>

      <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <DashboardCard>
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-950">
                Hiring Command Notes
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Use HR as the main command center for applicant intake,
                ambassador recruiting, contractor readiness, Guru onboarding,
                and retained records.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile
                icon={<ClipboardList size={18} />}
                title="Ambassador intake"
                detail="Use Ambassador Leads for applications and use Ambassador Dashboards for referral codes, tracking, and individual dashboard access."
              />
              <InfoTile
                icon={<BriefcaseBusiness size={18} />}
                title="Contractor records"
                detail="Keep early referral candidates separate from fully approved active Ambassadors until terms and training are complete."
              />
              <InfoTile
                icon={<ShieldCheck size={18} />}
                title="Trust & Safety"
                detail="Screening and compliance records should stay visible here before any Guru activation."
              />
              <InfoTile
                icon={<Archive size={18} />}
                title="Retention"
                detail="Use archive for declined or closed applicants so records are retained without cluttering active recruiting."
              />
            </div>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-5">
          <DashboardCard>
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-950">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Jump to the most common HR and onboarding workflows directly
                from this Human Resources area.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <QuickAction
                href={adminRoutes.ambassadorLeads}
                icon={<UserPlus size={18} />}
                title="Add or review ambassador leads"
                detail="Indeed, PA CareerLink, Student Hire, Community Hire, and Military Hire."
              />
              <QuickAction
                href={adminRoutes.ambassadors}
                icon={<ClipboardCheck size={18} />}
                title="Open Student Ambassador dashboards"
                detail="View referral codes, dashboard records, signup links, and early referral tracking."
              />
              <QuickAction
                href={adminRoutes.ambassadorLeads}
                icon={<Archive size={18} />}
                title="Archive or restore applicants"
                detail="Use wired buttons instead of SQL for declined or reopened candidates."
              />
              <QuickAction
                href={adminRoutes.gurus}
                icon={<PawPrint size={18} />}
                title="Review Guru applicants"
                detail="Applicant records, onboarding, and approval readiness."
              />
              <QuickAction
                href={adminRoutes.backgroundChecks}
                icon={<BadgeCheck size={18} />}
                title="Trust and safety checks"
                detail="Track checks before Gurus are fully activated."
              />
              <QuickAction
                href={adminRoutes.messages}
                icon={<MessageCircle size={18} />}
                title="Message applicants"
                detail="Follow up with candidates and onboarding contacts."
              />
              <QuickAction
                href={adminRoutes.exports}
                icon={<FileText size={18} />}
                title="Export records"
                detail="Prepare applicant, lead, and contractor tracking exports."
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

function DataHealthTile({ label, value }: { label: string; value: string }) {
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

function HrFeatureCard({
  href,
  icon,
  title,
  value,
  detail,
  action,
  tone,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  action: string;
  tone: "green" | "emerald" | "blue" | "amber";
}) {
  const toneClasses = {
    green: "bg-green-50 text-green-800 border-green-100",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-100",
    blue: "bg-blue-50 text-blue-800 border-blue-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
  };

  return (
    <Link
      href={href}
      className="group rounded-[24px] border border-[#e3ece5] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg sm:rounded-[28px] sm:p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${toneClasses[tone]}`}
        >
          {icon}
        </div>

        <span className="text-3xl font-black text-green-950">{value}</span>
      </div>

      <h2 className="text-2xl font-black tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {detail}
      </p>
      <p className="mt-3 text-sm font-black text-green-900 group-hover:text-green-700">
        {action} →
      </p>
    </Link>
  );
}

function ProgramRow({
  icon,
  title,
  detail,
  value,
  subvalue,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  value: string;
  subvalue: string;
}) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-950">{title}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {detail}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-black text-green-950">{value}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            {subvalue}
          </p>
        </div>
      </div>
    </div>
  );
}

function TableHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
          {subtitle}
        </p>
      </div>

      <Link
        href={href}
        className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-green-200 bg-white px-4 py-2 text-sm font-black text-green-800 transition hover:bg-green-50 sm:shrink-0"
      >
        View all →
      </Link>
    </div>
  );
}

function MobileLeadList({
  leads,
  emptyTitle,
  emptyDetail,
  type,
}: {
  leads: {
    name: string;
    email: string;
    status: string;
    location: string;
    date: string | null;
    program?: string;
    source?: string;
  }[];
  emptyTitle: string;
  emptyDetail: string;
  type: "ambassador" | "guru";
}) {
  if (!leads.length) {
    return (
      <div className="md:hidden">
        <EmptyState title={emptyTitle} detail={emptyDetail} />
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:hidden">
      {leads.map((lead, index) => (
        <article
          key={`${lead.name}-${lead.email}-${lead.date}-${index}`}
          className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4"
        >
          <div className="flex min-w-0 items-start gap-3">
            <Avatar name={lead.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-950">
                {lead.name}
              </p>
              <p className="truncate text-xs font-bold text-slate-500">
                {lead.email}
              </p>
            </div>
            <StatusBadge status={lead.status} />
          </div>

          <div className="mt-4 grid gap-2">
            {type === "ambassador" && lead.program ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Program
                </span>
                <ProgramBadge program={lead.program} />
              </div>
            ) : null}

            {type === "ambassador" && lead.source ? (
              <MobileMetaRow label="Source" value={lead.source} />
            ) : null}

            <MobileMetaRow label="Location" value={lead.location} />
            <MobileMetaRow label="Date" value={formatDate(lead.date)} />
          </div>
        </article>
      ))}
    </div>
  );
}

function MobileMetaRow({ label, value }: { label: string; value: string }) {
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

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Approved"
      ? "bg-green-100 text-green-800"
      : status === "Signed Up"
        ? "bg-emerald-100 text-emerald-800"
        : status === "Contacted"
          ? "bg-blue-100 text-blue-800"
          : status === "Interested"
            ? "bg-amber-100 text-amber-800"
            : status === "Not Moving Forward"
              ? "bg-slate-100 text-slate-600"
              : status === "Archived"
                ? "bg-red-100 text-red-700"
                : "bg-orange-100 text-orange-800";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles}`}
    >
      {status}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-black text-green-800">
      {initials || "SG"}
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
      <td colSpan={colSpan} className="py-8">
        <EmptyState title={title} detail={detail} />
      </td>
    </tr>
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

function InfoTile({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="font-black text-slate-950">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function QuickAction({
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
      className="group rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 transition hover:border-green-200 hover:bg-green-50"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-green-800 shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-black text-slate-950 group-hover:text-green-950">
            {title}
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {detail}
          </p>
        </div>
      </div>
    </Link>
  );
}