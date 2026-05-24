import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
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

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type AmbassadorLeadsPageProps = {
  searchParams?: SearchParams;
};

const adminRoutes = {
  dashboard: "/admin",
  programs: "/admin/programs",
  referrals: "/admin/referrals",
  partners: "/admin/partners",
  ambassadorLeads: "/admin/ambassador-leads",
};

const programOrder = ["Student Hire", "Community Hire", "Military Hire"];

const statusOrder = [
  "New",
  "Contacted",
  "Interested",
  "Signed Up",
  "Approved",
  "Not Moving Forward",
];

const sourceOrder = [
  "PA CareerLink",
  "Website",
  "Facebook",
  "Instagram",
  "TikTok",
  "X",
  "Referral",
  "Event",
  "Manual / Other",
];

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
    ["status", "lead_status", "application_status", "approval_status"],
    "new",
  ).toLowerCase();
}

function getReadableStatus(row: AnyRow) {
  const status = getStatus(row);

  if (status === "new") return "New";
  if (status === "pending") return "New";
  if (status === "submitted") return "New";
  if (status === "review") return "New";
  if (status === "in_review") return "New";
  if (status === "contacted") return "Contacted";
  if (status === "interested") return "Interested";
  if (status === "signed_up") return "Signed Up";
  if (status === "signup") return "Signed Up";
  if (status === "converted") return "Signed Up";
  if (status === "approved") return "Approved";
  if (status === "active") return "Approved";
  if (status === "not_moving_forward") return "Not Moving Forward";
  if (status === "declined") return "Not Moving Forward";
  if (status === "rejected") return "Not Moving Forward";

  return (
    status
      .split("_")
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ") || "New"
  );
}

function normalizeStatus(status: string) {
  const value = status.toLowerCase();

  if (value === "new") return "new";
  if (value === "contacted") return "contacted";
  if (value === "interested") return "interested";
  if (value === "signed up") return "signed_up";
  if (value === "approved") return "approved";
  if (value === "not moving forward") return "not_moving_forward";

  return "new";
}

function getDisplayName(row: AnyRow, fallback = "Ambassador Lead") {
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

function getPhone(row: AnyRow) {
  return getText(
    row,
    ["phone", "phone_number", "mobile", "lead_phone", "applicant_phone"],
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

function getNotes(row: AnyRow) {
  return getText(
    row,
    ["notes", "message", "interest", "comments", "description"],
    "No notes yet.",
  );
}

function getCombinedText(row: AnyRow) {
  return [
    getText(row, ["program", "program_name", "program_type"]),
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

function getParticipantType(row: AnyRow) {
  return getText(
    row,
    ["participant_type", "partner_type", "program_type", "type", "role"],
    "",
  ).toLowerCase();
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
      console.warn(`Ambassador leads query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Ambassador leads query skipped for ${label}:`, error);
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

async function createAmbassadorLead(formData: FormData) {
  "use server";

  const fullName = asString(formData.get("full_name"));
  const email = asString(formData.get("email"));
  const phone = asString(formData.get("phone"));
  const program = asString(formData.get("program"));
  const source = asString(formData.get("source"));
  const status = normalizeStatus(asString(formData.get("status")));
  const location = asString(formData.get("location"));
  const notes = asString(formData.get("notes"));

  if (!fullName && !email && !phone) {
    redirect(`${adminRoutes.ambassadorLeads}?created=missing`);
  }

  const { error } = await supabaseAdmin.from("ambassador_leads").insert({
    full_name: fullName || null,
    email: email || null,
    phone: phone || null,
    program,
    source,
    status,
    location: location || null,
    notes: notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("Unable to create ambassador lead:", error);
    redirect(`${adminRoutes.ambassadorLeads}?created=error`);
  }

  redirect(`${adminRoutes.ambassadorLeads}?created=success`);
}

async function getAmbassadorLeadData() {
  const [
    ambassadorLeadsResult,
    ambassadorsResult,
    partnerApplicationsResult,
    networkPartnerLeadsResult,
    networkParticipantsResult,
    launchSignupsResult,
    launchWaitlistResult,
    programApplicationsResult,
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
  ]);

  const ambassadorLeads = ((ambassadorLeadsResult.data || []) as AnyRow[]).filter(Boolean);
  const ambassadors = ((ambassadorsResult.data || []) as AnyRow[]).filter(Boolean);
  const partnerApplications = ((partnerApplicationsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkPartnerLeads = ((networkPartnerLeadsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkParticipants = ((networkParticipantsResult.data || []) as AnyRow[]).filter(Boolean);
  const launchSignups = ((launchSignupsResult.data || []) as AnyRow[]).filter(Boolean);
  const launchWaitlist = ((launchWaitlistResult.data || []) as AnyRow[]).filter(Boolean);
  const programApplications = ((programApplicationsResult.data || []) as AnyRow[]).filter(Boolean);

  const allLeads = mergeRows(
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

  const normalizedLeads = allLeads.map((lead) => ({
    raw: lead,
    name: getDisplayName(lead),
    email: getEmail(lead),
    phone: getPhone(lead),
    program: getProgramLabel(lead),
    source: getSourceLabel(lead),
    status: getReadableStatus(lead),
    location: getLocation(lead),
    notes: getNotes(lead),
    date: getDate(lead),
    lastContacted:
      asString(lead.last_contacted_at) ||
      asString(lead.contacted_at) ||
      asString(lead.updated_at) ||
      null,
  }));

  const metrics = {
    total: normalizedLeads.length,
    careerLink: normalizedLeads.filter((lead) => lead.source === "PA CareerLink").length,
    student: normalizedLeads.filter((lead) => lead.program === "Student Hire").length,
    community: normalizedLeads.filter((lead) => lead.program === "Community Hire").length,
    military: normalizedLeads.filter((lead) => lead.program === "Military Hire").length,
    newCount: normalizedLeads.filter((lead) => lead.status === "New").length,
    contacted: normalizedLeads.filter((lead) => lead.status === "Contacted").length,
    interested: normalizedLeads.filter((lead) => lead.status === "Interested").length,
    signedUp: normalizedLeads.filter((lead) => lead.status === "Signed Up").length,
    approved: normalizedLeads.filter((lead) => lead.status === "Approved").length,
    notMovingForward: normalizedLeads.filter(
      (lead) => lead.status === "Not Moving Forward",
    ).length,
    recent: normalizedLeads.filter((lead) => isWithinLastDays(lead.date, 14)).length,
  };

  return {
    leads: normalizedLeads,
    metrics,
  };
}

function getNotice(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const created = searchParams?.created;

  if (created === "success") {
    return {
      title: "Lead added",
      message: "The ambassador lead was saved successfully.",
      tone: "success" as const,
    };
  }

  if (created === "missing") {
    return {
      title: "Lead not added",
      message: "Add at least a name, email, or phone number before saving.",
      tone: "warning" as const,
    };
  }

  if (created === "error") {
    return {
      title: "Lead not saved",
      message:
        "The page is ready, but the ambassador_leads table may not exist yet in Supabase.",
      tone: "warning" as const,
    };
  }

  return null;
}

export default async function AmbassadorLeadsPage({
  searchParams,
}: AmbassadorLeadsPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);
  const data = await getAmbassadorLeadData();

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="flex w-full min-w-0 flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <Link
            href={adminRoutes.dashboard}
            className="mb-3 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
          >
            <ArrowLeft size={16} />
            Back to Admin Dashboard
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl 2xl:text-[3.25rem] 2xl:leading-none">
              Ambassador Leads
            </h1>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-green-800">
              PA CareerLink Ready
            </span>
          </div>

          <p className="mt-2 max-w-4xl text-base font-semibold leading-7 text-slate-600">
            Track Student Hire, Community Hire, and Military Hire ambassador
            applicants from PA CareerLink, social media, referrals, events, and
            website interest forms.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Link
            href={adminRoutes.programs}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
          >
            <ClipboardList size={17} />
            Programs
          </Link>

          <Link
            href={adminRoutes.referrals}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-800 to-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:brightness-105"
          >
            <Sparkles size={17} />
            Referrals
          </Link>
        </div>
      </div>

      {notice ? (
        <NoticeCard
          title={notice.title}
          message={notice.message}
          tone={notice.tone}
        />
      ) : null}

      <section className="grid w-full min-w-0 gap-3 rounded-[28px] border border-green-100 bg-gradient-to-r from-[#f7fbf4] via-white to-[#f7fbf4] p-4 sm:grid-cols-2 xl:grid-cols-6">
        <DataHealthTile label="Total Leads" value={number(data.metrics.total)} />
        <DataHealthTile
          label="PA CareerLink"
          value={number(data.metrics.careerLink)}
        />
        <DataHealthTile
          label="Student Hire"
          value={number(data.metrics.student)}
        />
        <DataHealthTile
          label="Community Hire"
          value={number(data.metrics.community)}
        />
        <DataHealthTile
          label="Military Hire"
          value={number(data.metrics.military)}
        />
        <DataHealthTile
          label="Recent 14 Days"
          value={number(data.metrics.recent)}
        />
      </section>

      <section className="grid w-full min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          title="New"
          value={number(data.metrics.newCount)}
          detail="Needs first review"
          icon={<Plus size={20} />}
        />
        <MetricCard
          title="Contacted"
          value={number(data.metrics.contacted)}
          detail="Outreach started"
          icon={<MessageCircle size={20} />}
        />
        <MetricCard
          title="Interested"
          value={number(data.metrics.interested)}
          detail="Warm candidate"
          icon={<Star size={20} />}
        />
        <MetricCard
          title="Signed Up"
          value={number(data.metrics.signedUp)}
          detail="Created SitGuru interest"
          icon={<UserCheck size={20} />}
        />
        <MetricCard
          title="Approved"
          value={number(data.metrics.approved)}
          detail="Ready to activate"
          icon={<CheckCircle2 size={20} />}
        />
        <MetricCard
          title="Not Moving"
          value={number(data.metrics.notMovingForward)}
          detail="Closed or declined"
          icon={<FileText size={20} />}
        />
      </section>

      <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-4">
          <DashboardCard>
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-950">
                Add Ambassador Lead
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Add PA CareerLink applicants or manual leads from social media,
                events, referrals, and local outreach.
              </p>
            </div>

            <form action={createAmbassadorLead} className="space-y-4">
              <FormField label="Lead name">
                <input
                  name="full_name"
                  placeholder="Full name"
                  className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email">
                  <input
                    name="email"
                    type="email"
                    placeholder="name@email.com"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </FormField>

                <FormField label="Phone">
                  <input
                    name="phone"
                    placeholder="Phone number"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Program">
                  <select
                    name="program"
                    defaultValue="Student Hire"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  >
                    {programOrder.map((program) => (
                      <option key={program}>{program}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Source">
                  <select
                    name="source"
                    defaultValue="PA CareerLink"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  >
                    {sourceOrder.map((source) => (
                      <option key={source}>{source}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Status">
                  <select
                    name="status"
                    defaultValue="New"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  >
                    {statusOrder.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Location">
                  <input
                    name="location"
                    placeholder="City, state or school"
                    className="w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </FormField>
              </div>

              <FormField label="Notes">
                <textarea
                  name="notes"
                  placeholder="Example: Applied through PA CareerLink for Student Ambassador posting."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                <Plus size={18} />
                Save Lead
              </button>

              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
                Note: Saving requires a Supabase table named{" "}
                <span className="font-black">ambassador_leads</span>. The page
                still displays existing ambassador data even before that table is
                created.
              </p>
            </form>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-8">
          <DashboardCard>
            <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Lead Pipeline
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Current ambassador leads grouped by program, source, status,
                  and last known contact information.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill label="Student Hire" />
                <StatusPill label="Community Hire" />
                <StatusPill label="Military Hire" />
              </div>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <ProgramMiniCard
                title="Student Hire"
                detail="Campus, school, and student outreach."
                value={number(data.metrics.student)}
                icon={<GraduationCap size={18} />}
              />
              <ProgramMiniCard
                title="Community Hire"
                detail="Neighborhood and local outreach."
                value={number(data.metrics.community)}
                icon={<Users size={18} />}
              />
              <ProgramMiniCard
                title="Military Hire"
                detail="Veterans, spouses, and service families."
                value={number(data.metrics.military)}
                icon={<ShieldCheck size={18} />}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#edf3ee] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <th className="pb-3">Lead</th>
                    <th className="pb-3">Program</th>
                    <th className="pb-3">Source</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {data.leads.length ? (
                    data.leads.map((lead, index) => (
                      <tr
                        key={`${lead.name}-${lead.email}-${lead.date}-${index}`}
                        className="border-b border-[#f1f5f2] align-top last:border-0"
                      >
                        <td className="py-4">
                          <div className="flex items-start gap-3">
                            <Avatar name={lead.name} />
                            <div className="min-w-0">
                              <p className="font-black text-slate-950">
                                {lead.name}
                              </p>
                              <p className="mt-1 line-clamp-2 max-w-[260px] text-xs font-semibold leading-5 text-slate-500">
                                {lead.notes}
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
                          <LeadStatusBadge status={lead.status} />
                        </td>

                        <td className="py-4">
                          <div className="space-y-1.5">
                            <ContactLine icon={<Mail size={13} />} value={lead.email} />
                            <ContactLine icon={<Phone size={13} />} value={lead.phone} />
                          </div>
                        </td>

                        <td className="py-4 font-bold text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={13} />
                            {lead.location}
                          </span>
                        </td>

                        <td className="py-4 font-bold text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={13} />
                            {formatDate(lead.date)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10">
                        <div className="rounded-[24px] border border-dashed border-green-200 bg-green-50/60 p-8 text-center">
                          <Search className="mx-auto mb-3 text-green-700" size={32} />
                          <h3 className="text-lg font-black text-green-950">
                            No ambassador leads found yet
                          </h3>
                          <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-green-900/70">
                            Once PA CareerLink applicants, ambassador signups, or
                            manual leads are added, they will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>
      </section>

      <section className="grid w-full min-w-0 gap-4 lg:grid-cols-3">
        <DashboardCard>
          <ActionCard
            icon={<BriefcaseBusiness size={20} />}
            title="PA CareerLink Workflow"
            detail="Use this page to enter applicants after PA CareerLink referrals come in."
            href={adminRoutes.ambassadorLeads}
            action="Stay here"
          />
        </DashboardCard>

        <DashboardCard>
          <ActionCard
            icon={<ClipboardList size={20} />}
            title="Program Command Center"
            detail="Review Student Hire, Community Hire, Military Hire, PawPerks, referrals, and growth programs."
            href={adminRoutes.programs}
            action="Open Programs"
          />
        </DashboardCard>

        <DashboardCard>
          <ActionCard
            icon={<ExternalLink size={20} />}
            title="Partner & Referral Admin"
            detail="Track broader partners, affiliates, referrals, rewards, and campaigns."
            href={adminRoutes.partners}
            action="Open Partners"
          />
        </DashboardCard>
      </section>
    </div>
  );
}

function NoticeCard({
  title,
  message,
  tone,
}: {
  title: string;
  message: string;
  tone: "success" | "warning";
}) {
  return (
    <div
      className={`rounded-[24px] border p-4 ${
        tone === "success"
          ? "border-green-200 bg-green-50 text-green-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6">{message}</p>
    </div>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-w-0 rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function DataHealthTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-green-950">{value}</p>
    </div>
  );
}

function MetricCard({
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
    <div className="rounded-[24px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-bold text-slate-500">{detail}</p>
    </div>
  );
}

function ProgramMiniCard({
  title,
  detail,
  value,
  icon,
}: {
  title: string;
  detail: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-[#fbfcf9] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-800 text-white">
          {icon}
        </div>
        <span className="text-xl font-black text-green-950">{value}</span>
      </div>
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
      {label}
    </span>
  );
}

function ProgramBadge({ program }: { program: string }) {
  const styles =
    program === "Student Hire"
      ? "bg-blue-50 text-blue-800 border-blue-100"
      : program === "Military Hire"
        ? "bg-emerald-50 text-emerald-800 border-emerald-100"
        : "bg-green-50 text-green-800 border-green-100";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${styles}`}
    >
      {program}
    </span>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
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
              : "bg-orange-100 text-orange-800";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles}`}>
      {status}
    </span>
  );
}

function ContactLine({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
      {icon}
      <span className="max-w-[190px] truncate">{value}</span>
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

function ActionCard({
  icon,
  title,
  detail,
  href,
  action,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  href: string;
  action: string;
}) {
  return (
    <div>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {detail}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
      >
        {action}
        <span>→</span>
      </Link>
    </div>
  );
}