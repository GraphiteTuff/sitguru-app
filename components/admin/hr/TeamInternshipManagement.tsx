import Link from "next/link";
import type { ReactNode } from "react";
import { saveRyanManiboCandidate } from "@/lib/internship/onboarding-assign-actions";
import { GROWTH_HIRE_TITLE, listGrowthHires } from "@/lib/admin/growth/hire";
import { internPortalPreviewPath } from "@/lib/internship/constants";
import { SPRING_2027_MANAGER_EMAIL } from "@/lib/internship/onboarding-authority";
import { SPRING_2027_CANDIDATE_PLANS } from "@/lib/internship/spring2027-candidates";
import { listInterns } from "@/lib/internship/queries";
import {
  buildSpringRoster,
  describeManagerAccess,
  legacyInternshipReviews,
  optionalStoredNumber,
  type RosterAccountHint,
  type RosterInternRecord,
} from "@/lib/internship/team-roster";
import SpringInternTable, { type InternTableRow } from "@/components/admin/hr/SpringInternTable";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { GraduationCap, Mail, ShieldCheck, UserRound, Users } from "lucide-react";

const primaryAction =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white";
const secondaryAction =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800";

const tools = [
  { href: "/admin/internship/interns", title: "Intern Records", detail: "Create and update intern profiles, academic plans, and status.", icon: "people" },
  { href: "/admin/hr/microsoft", title: "Microsoft 365 Readiness", detail: "Track mailbox creation and first-login verification.", icon: "mail" },
  { href: "/admin/hr/access-requests", title: "Approvals", detail: "Manage CEO and university approvals and documentation.", icon: "shield" },
  { href: "/admin/hr/onboarding", title: "Onboarding", detail: "Assign and review required documents and tasks.", icon: "doc" },
  { href: "/admin/internship/interns", title: "Invitations & Email", detail: "Send and track registration invitations and notifications.", icon: "invite" },
  { href: "/admin/hr/team-access", title: "Automation Settings", detail: "Assignment desk, reminders, and approval notifications.", icon: "auto" },
] as const;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function microsoftLabel(value: string) {
  const normalized = value.toLowerCase();
  if (!normalized || normalized === "not_created") return "Not created";
  return normalized.replaceAll("_", " ");
}

function statusTone(label: string): InternTableRow["statusTone"] {
  if (label.toLowerCase().includes("prospective")) return "violet";
  if (label.toLowerCase().includes("active") || label.toLowerCase().includes("approved")) return "emerald";
  if (label.toLowerCase().includes("pending") || label.toLowerCase().includes("missing")) return "amber";
  return "slate";
}

function formatWhen(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function TeamInternshipManagement({
  canAdminister,
  notice = "",
  noticeError = "",
}: {
  canAdminister: boolean;
  notice?: string;
  noticeError?: string;
}) {
  const [interns, hires, academic, universities, accounts, activity] = await Promise.all([
    listInterns(),
    listGrowthHires(),
    supabaseAdmin
      .from("internship_interns")
      .select("id,credits,requested_credits,planned_total_hours,planned_weekly_hours,internship_weeks,university_verification_status,microsoft_readiness,offer_status"),
    supabaseAdmin.from("internship_universities").select("id,name"),
    supabaseAdmin
      .from("profiles")
      .select("id,email,full_name")
      .or("full_name.ilike.%Manibo%,full_name.ilike.%Uhl%,full_name.ilike.%Dhital%,email.ilike.%manibo%,email.ilike.%uh15%,email.ilike.%dhital%"),
    supabaseAdmin
      .from("internship_assignment_events")
      .select("id,summary,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const academicById = new Map((academic.data || []).map((row) => [text(row.id), row]));
  const universityName = new Map((universities.data || []).map((row) => [text(row.id), text(row.name)]));
  const records: RosterInternRecord[] = interns.map((intern) => {
    const raw = academicById.get(intern.id);
    return {
      id: intern.id,
      fullName: intern.fullName,
      preferredName: intern.preferredName,
      email: intern.email,
      userId: intern.userId,
      status: intern.status,
      portalEnabled: intern.portalEnabled,
      universityName: universityName.get(intern.universityId) || "",
      credits: optionalStoredNumber(raw?.credits),
      requestedCredits: optionalStoredNumber(raw?.requested_credits),
      plannedTotalHours: optionalStoredNumber(raw?.planned_total_hours),
      plannedWeeklyHours: optionalStoredNumber(raw?.planned_weekly_hours),
      internshipWeeks: optionalStoredNumber(raw?.internship_weeks),
    };
  });
  const accountHints: RosterAccountHint[] = (accounts.data || []).map((row) => ({
    userId: text(row.id),
    email: text(row.email).toLowerCase(),
    fullName: text(row.full_name),
  }));
  const roster = buildSpringRoster({ interns: records, accounts: accountHints });
  const legacy = legacyInternshipReviews(records);
  const verifiedCount = roster.filter((person) => {
    const raw = person.recordId ? academicById.get(person.recordId) : null;
    const status = text(raw?.university_verification_status).toLowerCase();
    return status === "verified" || status === "confirmed" || status === "university_verified";
  }).length;
  const activeCount = roster.filter((person) => person.workspaceAction === "active").length;

  const avaHire = hires.find((hire) => hire.email.toLowerCase() === SPRING_2027_MANAGER_EMAIL) || null;
  const eligibility = avaHire?.userId
    ? await supabaseAdmin
        .from("internship_staff_eligibility")
        .select("can_manage_interns,job_title")
        .eq("user_id", avaHire.userId)
        .maybeSingle()
    : { data: null, error: null };
  const profile = avaHire?.userId
    ? await supabaseAdmin.from("profiles").select("full_name,email").eq("id", avaHire.userId).maybeSingle()
    : { data: null };
  const managerName = text(profile.data?.full_name) || "Ava Venezia";
  const managerEmail = text(profile.data?.email).toLowerCase() || avaHire?.email || SPRING_2027_MANAGER_EMAIL;
  const managerRole = text(eligibility.data?.job_title) || GROWTH_HIRE_TITLE;
  const managerAccess = describeManagerAccess({
    email: SPRING_2027_MANAGER_EMAIL,
    userId: avaHire?.userId || null,
    accessActive: avaHire?.status === "active",
    canManageInterns: eligibility.error ? null : eligibility.data?.can_manage_interns === true,
  });
  const managerActive = managerAccess.label === "Manager access active";

  const rows: InternTableRow[] = roster.map((person) => {
    const raw = person.recordId ? academicById.get(person.recordId) : null;
    const plan = SPRING_2027_CANDIDATE_PLANS.find((item) => item.key === person.key);
    return {
      key: person.key,
      name: person.fullName,
      program: plan?.academicProgram || "Program pending",
      university: person.universityLabel,
      creditLine: person.creditLabel,
      hoursLine: person.hoursLabel,
      weeklyLine: `${person.weeklyLabel} · ${person.weeksLabel}`,
      status: person.recordId ? person.statusLabel : person.accountLabel,
      statusTone: statusTone(person.recordId ? person.statusLabel : person.accountLabel),
      microsoft: person.recordId ? microsoftLabel(text(raw?.microsoft_readiness)) : "Not created",
      portal: person.workspaceAction === "active" ? "Active" : person.recordId ? "Inactive" : "No record",
      recordId: person.recordId,
      canCreate: person.canCreatePendingRecord,
    };
  });

  const ryan = roster.find((person) => person.canCreatePendingRecord);
  const events = (activity.data || []).filter((row) => text(row.summary));

  return (
    <section aria-labelledby="team-internship-heading" className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Admin HQ / Hiring & People</p>
          <h2 id="team-internship-heading" className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            Team & Internship Management
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-600">
            Manage your team manager, interns, onboarding, university approvals, and access from one place.
          </p>
        </div>
        <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          Cohort
          <select className="mt-1 min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800" defaultValue="spring-2027" aria-label="Internship cohort">
            <option value="spring-2027">Spring 2027</option>
          </select>
        </label>
      </div>

      {notice ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{notice}</p> : null}
      {noticeError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{noticeError}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Users className="h-5 w-5" />} tint="bg-emerald-50 text-emerald-700" value={managerActive ? "1" : "0"} label="Team Manager" helper={managerActive ? "Active manager" : "Manager access not active"} />
        <Stat icon={<GraduationCap className="h-5 w-5" />} tint="bg-sky-50 text-sky-700" value={String(roster.length)} label="Planned Interns" helper="Spring 2027 cohort" />
        <Stat icon={<ShieldCheck className="h-5 w-5" />} tint="bg-amber-50 text-amber-700" value={`${verifiedCount} / ${roster.length}`} label="University Approvals" helper="Verified" />
        <Stat icon={<UserRound className="h-5 w-5" />} tint="bg-violet-50 text-violet-700" value={String(activeCount)} label="Active Interns" helper="Currently active" />
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-black text-slate-950">Team Manager</h3>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-base font-black text-[#0D5C3A]">AV</span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-lg font-black text-slate-950">
                {managerName}
                {managerActive ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">Active</span> : null}
              </p>
              <p className="text-sm font-semibold text-slate-600">{managerRole}</p>
              <p className="text-sm font-semibold text-slate-500">{managerEmail}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {managerActive ? <Pill>Manager Portal Access</Pill> : <Pill>Manager access not active</Pill>}
                {eligibility.data?.can_manage_interns === true ? <Pill>Eligible for Intern Management</Pill> : null}
              </div>
            </div>
          </div>
          {canAdminister ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/manager" className={primaryAction}>Open Manager Portal</Link>
              <Link href="/admin/hr/growth-hire" className={secondaryAction}>Manage Access & Roles</Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">Spring 2027 Interns</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">Create, update, and manage intern records, academic requirements, and onboarding.</p>
          </div>
        </div>
        <div className="mt-3">
          <SpringInternTable rows={rows} canAdminister={canAdminister} />
        </div>
        {canAdminister && ryan ? (
          <form action={saveRyanManiboCandidate} className="mt-4 grid gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <input type="hidden" name="returnTo" value="/admin/hr" />
            <label className="text-sm font-bold text-amber-950">
              Ryan still needs a verified contact email
              <input name="email" type="email" required placeholder="School or personal email" className="mt-1 min-h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm font-semibold" />
            </label>
            <button type="submit" className={primaryAction}>Create pending record</button>
          </form>
        ) : null}
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">Assign Manager & Supervisor</p>
            <p className="text-sm font-semibold text-slate-500">Assign Ava Venezia as the internship manager and Jason Graff as the official supervisor for one or more interns.</p>
          </div>
          {canAdminister ? <Link href="/admin/hr/team-access" className={primaryAction}>Open Assignment Tool</Link> : null}
        </div>
      </section>

      {canAdminister ? (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="text-lg font-black text-slate-950">Administrative Tools</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Quick access to key onboarding and management functions.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => (
              <Link key={tool.title} href={tool.href} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-emerald-50">
                <span className="flex items-center gap-2 text-sm font-black text-slate-950">
                  {tool.icon === "mail" || tool.icon === "invite" ? <Mail className="h-4 w-4 text-[#0D5C3A]" /> : <ShieldCheck className="h-4 w-4 text-[#0D5C3A]" />}
                  {tool.title}
                </span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{tool.detail}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="text-lg font-black text-slate-950">Spring 2027 Program Timeline</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Planned dates for the 15-week program. Each school still confirms its own academic calendar.</p>
          <ol className="mt-4 space-y-3">
            {[
              ["Jan 11, 2027", "Program start (Week 1)"],
              ["Jan–Apr 2027", "15-week internship program"],
              ["Apr 19, 2027", "Program end (Week 15)"],
            ].map(([when, label]) => (
              <li key={label} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0D5C3A]" />
                <span>
                  <span className="block text-xs font-black uppercase tracking-[0.08em] text-slate-400">{when}</span>
                  <span className="text-sm font-bold text-slate-800">{label}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-slate-950">Recent Activity</h3>
            <Link href="/admin/audit-trail" className="text-xs font-black text-[#0D5C3A]">View all activity</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {events.length ? events.map((row) => (
              <li key={text(row.id)} className="text-sm font-semibold text-slate-700">
                <span className="block font-bold text-slate-950">{text(row.summary)}</span>
                <span className="text-xs text-slate-500">{formatWhen(text(row.created_at))}</span>
              </li>
            )) : (
              <li className="text-sm font-semibold text-slate-500">No internship assignment activity is recorded yet.</li>
            )}
          </ul>
          {legacy.length ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-black text-amber-950">Record review</p>
              {legacy.map((row) => (
                <p key={row.id} className="mt-2 text-sm font-semibold leading-6 text-amber-950">
                  {row.recommendation}{" "}
                  <Link href={`/admin/internship/interns/${row.id}#profile`} className="font-black text-[#0D5C3A]">Review record</Link>
                </p>
              ))}
            </div>
          ) : null}
          {roster.some((person) => person.recordId && person.workspaceAction !== "active") ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {roster.filter((person) => person.recordId && person.workspaceAction === "preview").map((person) => (
                <Link key={person.key} href={internPortalPreviewPath(person.recordId || "")} className={secondaryAction}>
                  Preview {person.fullName}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}

function Stat({
  icon,
  tint,
  value,
  label,
  helper,
}: {
  icon: ReactNode;
  tint: string;
  value: string;
  label: string;
  helper: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="text-sm font-black text-slate-800">{label}</p>
      <p className="text-xs font-semibold text-slate-500">{helper}</p>
    </article>
  );
}

function Pill({ children }: { children: string }) {
  return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">{children}</span>;
}
