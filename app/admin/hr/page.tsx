import type { ReactNode } from "react";
import Link from "next/link";
import {
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

function isPendingStatus(row: AnyRow) {
  const status = getStatus(row);

  return (
    status === "new" ||
    status === "pending" ||
    status === "submitted" ||
    status === "review" ||
    status === "in_review" ||
    status === "contacted" ||
    status === "interested" ||
    status === "applied"
  );
}

function isApprovedStatus(row: AnyRow) {
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
  if (text.includes("facebook") || text.includes("meta")) return "Facebook";
  if (text.includes("instagram") || text.includes("insta")) return "Instagram";
  if (text.includes("tiktok")) return "TikTok";
  if (text.includes("x.com") || text.includes("twitter")) return "X";
  if (text.includes("event")) return "Event";
  if (text.includes("referral")) return "Referral";
  if (text.includes("website") || text.includes("site")) return "Website";

  return source || "Manual / Other";
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

  return (
    role.includes("guru") ||
    role.includes("sitter") ||
    role.includes("provider") ||
    text.includes("guru") ||
    text.includes("pet care") ||
    text.includes("sitter") ||
    text.includes("walker") ||
    text.includes("boarding") ||
    text.includes("drop-in") ||
    text.includes("training")
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

async function getHumanResourcesData() {
  const [
    ambassadorLeadsResult,
    ambassadorsResult,
    partnerApplicationsResult,
    networkPartnerLeadsResult,
    networkParticipantsResult,
    launchSignupsResult,
    launchWaitlistResult,
    programApplicationsResult,
    gurusResult,
    profilesResult,
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
        .from("gurus")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "gurus",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "profiles",
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

  const ambassadorLeads = ((ambassadorLeadsResult.data || []) as AnyRow[]).filter(Boolean);
  const ambassadors = ((ambassadorsResult.data || []) as AnyRow[]).filter(Boolean);
  const partnerApplications = ((partnerApplicationsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkPartnerLeads = ((networkPartnerLeadsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkParticipants = ((networkParticipantsResult.data || []) as AnyRow[]).filter(Boolean);
  const launchSignups = ((launchSignupsResult.data || []) as AnyRow[]).filter(Boolean);
  const launchWaitlist = ((launchWaitlistResult.data || []) as AnyRow[]).filter(Boolean);
  const programApplications = ((programApplicationsResult.data || []) as AnyRow[]).filter(Boolean);
  const gurus = ((gurusResult.data || []) as AnyRow[]).filter(Boolean);
  const profiles = ((profilesResult.data || []) as AnyRow[]).filter(Boolean);
  const backgroundChecks = ((backgroundChecksResult.data || []) as AnyRow[]).filter(Boolean);

  const ambassadorRows = mergeRows(
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

  const guruProfileRows = profiles.filter(isGuruApplicant);

  const guruApplicantRows = mergeRows(
    gurus,
    guruProfileRows,
    programApplications.filter(isGuruApplicant),
    launchSignups.filter(isGuruApplicant),
    launchWaitlist.filter(isGuruApplicant),
  ).sort((a, b) => {
    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const recentAmbassadorLeads = ambassadorRows.slice(0, 5).map((lead) => ({
    name: getDisplayName(lead, "Ambassador Lead"),
    email: getEmail(lead),
    program: getProgramLabel(lead),
    source: getSourceLabel(lead),
    status: getStatus(lead),
    location: getLocation(lead),
    date: getDate(lead),
  }));

  const recentGuruApplicants = guruApplicantRows.slice(0, 5).map((applicant) => ({
    name: getDisplayName(applicant, "Guru Applicant"),
    email: getEmail(applicant),
    status: getStatus(applicant),
    location: getLocation(applicant),
    date: getDate(applicant),
  }));

  const pendingBackgroundChecks = backgroundChecks.filter(isPendingStatus);
  const approvedBackgroundChecks = backgroundChecks.filter(isApprovedStatus);

  return {
    ambassadorRows,
    guruApplicantRows,
    backgroundChecks,
    recentAmbassadorLeads,
    recentGuruApplicants,
    metrics: {
      ambassadorLeads: ambassadorRows.length,
      careerLinkLeads: ambassadorRows.filter(
        (lead) => getSourceLabel(lead) === "PA CareerLink",
      ).length,
      studentHire: ambassadorRows.filter(
        (lead) => getProgramLabel(lead) === "Student Hire",
      ).length,
      communityHire: ambassadorRows.filter(
        (lead) => getProgramLabel(lead) === "Community Hire",
      ).length,
      militaryHire: ambassadorRows.filter(
        (lead) => getProgramLabel(lead) === "Military Hire",
      ).length,
      guruApplicants: guruApplicantRows.length,
      pendingGuruApplicants: guruApplicantRows.filter(isPendingStatus).length,
      approvedGuruApplicants: guruApplicantRows.filter(isApprovedStatus).length,
      recentApplicants:
        ambassadorRows.filter((lead) => isWithinLastDays(getDate(lead), 14)).length +
        guruApplicantRows.filter((lead) => isWithinLastDays(getDate(lead), 14)).length,
      pendingBackgroundChecks: pendingBackgroundChecks.length,
      approvedBackgroundChecks: approvedBackgroundChecks.length,
    },
  };
}

export default async function HumanResourcesPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const data = await getHumanResourcesData();

  return (
    <main className="w-full min-w-0 space-y-4 sm:space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-green-100 bg-gradient-to-br from-[#f7fbf4] via-white to-[#eef8ef] p-4 shadow-sm sm:p-6 lg:p-7">
        <div className="flex min-w-0 flex-col justify-between gap-5 xl:flex-row xl:items-end">
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
              Manage SitGuru hiring, ambassador recruiting, PA CareerLink leads,
              Guru applicants, onboarding, trust and safety checks, and future
              contractor documentation in one mobile-friendly workspace.
            </p>
          </div>

          <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto">
            <Link
              href={adminRoutes.ambassadorLeads}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <UserPlus size={17} />
              Add Lead
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

      <section className="grid w-full min-w-0 gap-3 rounded-[28px] border border-green-100 bg-white p-3 shadow-sm sm:grid-cols-2 sm:p-4 lg:grid-cols-3 2xl:grid-cols-6">
        <DataHealthTile
          label="Ambassador Leads"
          value={number(data.metrics.ambassadorLeads)}
        />
        <DataHealthTile
          label="PA CareerLink"
          value={number(data.metrics.careerLinkLeads)}
        />
        <DataHealthTile
          label="Guru Applicants"
          value={number(data.metrics.guruApplicants)}
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

      <section className="grid w-full min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <HrFeatureCard
          href={adminRoutes.ambassadorLeads}
          icon={<HeartHandshake size={22} />}
          title="Ambassador Leads"
          value={number(data.metrics.ambassadorLeads)}
          detail="Track PA CareerLink, social, referral, event, and website ambassador applicants."
          action="Open Ambassador Leads"
          tone="green"
        />

        <HrFeatureCard
          href={adminRoutes.gurus}
          icon={<PawPrint size={22} />}
          title="Guru Applicants"
          value={number(data.metrics.guruApplicants)}
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
          href={adminRoutes.programs}
          icon={<ClipboardList size={22} />}
          title="Hiring Programs"
          value={number(
            data.metrics.studentHire +
              data.metrics.communityHire +
              data.metrics.militaryHire,
          )}
          detail="Manage Student Hire, Community Hire, Military Hire, and program operations."
          action="Open Programs"
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
                  Required order: Student Hire, Community Hire, Military Hire.
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
                value={number(data.metrics.studentHire)}
              />
              <ProgramRow
                icon={<Users size={19} />}
                title="Community Hire"
                detail="Neighborhood, local events, community groups, and pet-friendly outreach."
                value={number(data.metrics.communityHire)}
              />
              <ProgramRow
                icon={<ShieldCheck size={19} />}
                title="Military Hire"
                detail="Veterans, military spouses, service families, Guard, Reserve, and supporters."
                value={number(data.metrics.militaryHire)}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 shrink-0 text-green-800" size={20} />
                <div>
                  <p className="text-sm font-black text-green-950">
                    PA CareerLink workflow
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-green-900/75">
                    Add applicants from your Student, Community, and Military
                    Ambassador postings to Ambassador Leads so you can track
                    contact status and next steps inside SitGuru.
                  </p>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-7">
          <DashboardCard>
            <TableHeader
              title="Recent Ambassador Leads"
              subtitle="Latest ambassador leads from PA CareerLink and other recruiting sources."
              href={adminRoutes.ambassadorLeads}
            />

            <MobileLeadList
              leads={data.recentAmbassadorLeads}
              emptyTitle="No ambassador leads yet"
              emptyDetail="PA CareerLink and ambassador applicants will show here once added."
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
                      title="No ambassador leads yet"
                      detail="PA CareerLink and ambassador applicants will show here once added."
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
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-950">
                HR Quick Actions
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Keep hiring-related work out of the main dashboard and manage it
                from this Human Resources area.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <QuickAction
                href={adminRoutes.ambassadorLeads}
                icon={<UserPlus size={18} />}
                title="Add or review ambassador leads"
                detail="PA CareerLink, Student Hire, Community Hire, and Military Hire."
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

      <h2 className="text-base font-black text-slate-950 sm:text-lg">
        {title}
      </h2>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
        {detail}
      </p>

      <p className="mt-4 text-sm font-black text-green-800">
        {action} <span className="transition group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}

function ProgramRow({
  icon,
  title,
  detail,
  value,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950">{title}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            {detail}
          </p>
        </div>
      </div>

      <span className="shrink-0 text-xl font-black text-green-950">
        {value}
      </span>
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
  const value = status.toLowerCase();

  const label =
    value === "approved" || value === "active"
      ? "Approved"
      : value === "converted" || value === "signed_up" || value === "signup"
        ? "Signed Up"
        : value === "contacted"
          ? "Contacted"
          : value === "interested"
            ? "Interested"
            : value === "declined" ||
                value === "rejected" ||
                value === "not_moving_forward"
              ? "Not Moving"
              : "New";

  const styles =
    label === "Approved"
      ? "bg-green-100 text-green-800"
      : label === "Signed Up"
        ? "bg-emerald-100 text-emerald-800"
        : label === "Contacted"
          ? "bg-blue-100 text-blue-800"
          : label === "Interested"
            ? "bg-amber-100 text-amber-800"
            : label === "Not Moving"
              ? "bg-slate-100 text-slate-600"
              : "bg-orange-100 text-orange-800";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles}`}>
      {label}
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
      <td colSpan={colSpan} className="py-10">
        <EmptyState title={title} detail={detail} />
      </td>
    </tr>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-green-200 bg-green-50/60 p-6 text-center sm:p-8">
      <ClipboardCheck className="mx-auto mb-3 text-green-700" size={32} />
      <h3 className="text-lg font-black text-green-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-green-900/70">
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
      className="group flex min-w-0 items-start gap-3 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
          {detail}
        </p>
      </div>
    </Link>
  );
}
