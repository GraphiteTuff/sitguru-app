import Link from "next/link";
import { saveRyanManiboCandidate } from "@/lib/internship/onboarding-assign-actions";
import { GROWTH_HIRE_TITLE, listGrowthHires } from "@/lib/admin/growth/hire";
import { GrowthCard } from "@/components/admin/growth/GrowthPageFrame";
import { internPortalPreviewPath } from "@/lib/internship/constants";
import { SPRING_2027_MANAGER_EMAIL } from "@/lib/internship/onboarding-authority";
import { listInterns } from "@/lib/internship/queries";
import {
  buildSpringRoster,
  describeManagerAccess,
  legacyInternshipReviews,
  optionalStoredNumber,
  type RosterAccountHint,
  type RosterInternRecord,
} from "@/lib/internship/team-roster";
import { supabaseAdmin } from "@/lib/supabase/admin";

const primaryAction =
  "inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white";
const secondaryAction =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-950";
const quietAction =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-800 hover:border-emerald-200 hover:bg-emerald-50";

const tools = [
  {
    href: "/admin/hr/staff-requests",
    title: "Staff Access & Onboarding",
    detail: "Review who is asking for a staff login",
  },
  {
    href: "/admin/hr/microsoft",
    title: "Microsoft 365 Readiness",
    detail: "Work email and directory connection",
  },
  {
    href: "/admin/internship/interns",
    title: "Registration Invitations",
    detail: "Send a login only when you check invite",
  },
  {
    href: "/admin/hr/access-requests",
    title: "CEO and University Approvals",
    detail: "Approve access and verify the school",
  },
  {
    href: "/admin/hr/team-access",
    title: "Internship Assignments",
    detail: "Assign the manager on the existing desk",
  },
  {
    href: "/admin/email-updates",
    title: "Email Notifications",
    detail: "Outbound SitGuru email",
  },
  {
    href: "/admin/hr/onboarding",
    title: "Onboarding Documents",
    detail: "Agreements, signatures, and people",
  },
  {
    href: "/admin/audit-trail",
    title: "Audit History",
    detail: "Admin changes and review history",
  },
] as const;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function StatusChip({ children, tone }: { children: string; tone: "amber" | "slate" | "emerald" }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${toneClass}`}>
      {children}
    </span>
  );
}

function DisabledAction({ children }: { children: string }) {
  return (
                    <button
      type="button"
      disabled
      title="Available after the internship record exists."
      className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-400"
    >
      {children}
    </button>
  );
}

function chipTone(label: string): "amber" | "slate" | "emerald" {
  if (label === "Account linked" || label === "Manager access active" || label === "Active" || label === "Approved") {
    return "emerald";
  }
  if (label === "Record Missing" || label === "Needs Registration" || label === "Multiple records") return "amber";
  return "slate";
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
  const [interns, hires, academic, universities, accounts] = await Promise.all([
    listInterns(),
    listGrowthHires(),
    supabaseAdmin
      .from("internship_interns")
      .select("id,credits,requested_credits,planned_total_hours,planned_weekly_hours,internship_weeks"),
    supabaseAdmin.from("internship_universities").select("id,name"),
    supabaseAdmin
      .from("profiles")
      .select("id,email,full_name")
      .or("full_name.ilike.%Manibo%,full_name.ilike.%Uhl%,full_name.ilike.%Dhital%,email.ilike.%manibo%,email.ilike.%uh15%,email.ilike.%dhital%"),
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

  const avaHire = hires.find((hire) => hire.email.toLowerCase() === SPRING_2027_MANAGER_EMAIL) || null;
  const eligibility = avaHire?.userId
    ? await supabaseAdmin
        .from("internship_staff_eligibility")
        .select("can_manage_interns,job_title")
        .eq("user_id", avaHire.userId)
        .maybeSingle()
    : { data: null, error: null };
  const profile = avaHire?.userId
    ? await supabaseAdmin
        .from("profiles")
        .select("full_name,email")
        .eq("id", avaHire.userId)
        .maybeSingle()
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
  const previews = roster.filter((person) => person.recordId && person.workspaceAction !== "none");

  return (
    <section aria-labelledby="team-internship-heading" className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
            Hiring & People
          </p>
          <h2 id="team-internship-heading" className="text-xl font-black text-slate-950 sm:text-2xl">
            Team & Internship Management
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            One roster for the Spring 2027 team. Super Admin controls registration, school approval, and portal activation. Ava works assigned interns only after they are active.
          </p>
        </div>
        {canAdminister ? (
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/internship/interns" className={primaryAction}>
              Manage Interns
            </Link>
            <Link href="/admin/hr/team-access" className={secondaryAction}>
              Assign Manager
            </Link>
          </div>
        ) : null}
      </div>

      {notice ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{notice}</p>
      ) : null}
      {noticeError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{noticeError}</p>
      ) : null}

      <GrowthCard>
        <h3 className="text-lg font-black text-slate-950">Team Manager</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-base font-black text-slate-950">{managerName}</p>
            <p className="text-sm font-semibold text-slate-700">{managerRole}</p>
            <p className="text-sm font-semibold text-slate-500">{managerEmail}</p>
            <div className="mt-2">
              <StatusChip tone={chipTone(managerAccess.label)}>{managerAccess.label}</StatusChip>
            </div>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">{managerAccess.detail}</p>
          </div>
          {canAdminister ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/hr/growth-hire" className={quietAction}>
                Manage Manager Access
              </Link>
              <Link href="/manager" className={quietAction}>
                View Manager Portal
              </Link>
              <Link
                href={
                  avaHire?.userId
                    ? `/admin/growth/onboarding?user=${encodeURIComponent(avaHire.userId)}`
                    : "/admin/growth/onboarding"
                }
                className={quietAction}
              >
                Review Manager Onboarding
              </Link>
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-600">Super Admin manages this login.</p>
          )}
        </div>
      </GrowthCard>

      <div className="min-w-0">
        <div className="mb-3">
          <h3 className="text-lg font-black text-slate-950">Spring 2027 Interns</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Proposed 15-week program. A missing row stays missing until Super Admin saves it. Pending students do not have an active portal.
          </p>
        </div>
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roster.map((person) => {
            const profileHref = person.recordId ? `/admin/internship/interns/${person.recordId}#profile` : "";
            const planHref = person.recordId ? `/admin/internship/interns#plan-${person.recordId}` : "";
            const approvalHref = person.recordId ? `/admin/internship/interns#approval-${person.recordId}` : "";
            const onboardingHref = person.recordId ? `/admin/internship/interns/${person.recordId}#onboarding` : "";
            const hoursHref = person.recordId ? `/intern/time?view=${encodeURIComponent(person.recordId)}` : "";
            return (
              <GrowthCard key={person.key}>
                <h4 className="text-base font-black text-slate-950">{person.fullName}</h4>
                <p className="text-sm font-semibold text-slate-700">{person.universityLabel}</p>
                <p className="text-sm font-semibold text-slate-500">{person.emailLabel}</p>
                <ul className="mt-3 space-y-1 text-sm font-semibold text-slate-700">
                  <li>{person.creditLabel}</li>
                  <li>{person.hoursLabel}</li>
                  <li>{person.weeklyLabel}</li>
                  <li>{person.weeksLabel}</li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusChip tone={chipTone(person.statusLabel)}>{person.statusLabel}</StatusChip>
                  <StatusChip tone={chipTone(person.accountLabel)}>{person.accountLabel}</StatusChip>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {person.recordId ? (
                    <>
                      <Link href={profileHref} className={quietAction}>View Profile</Link>
                      <Link href={planHref} className={quietAction}>Edit Academic Plan</Link>
                      <Link href={onboardingHref} className={quietAction}>View Onboarding</Link>
                      <Link href={approvalHref} className={quietAction}>Review Approval</Link>
                      <Link href={hoursHref} className={quietAction}>View Hours</Link>
                    </>
                  ) : (
                    <>
                      <DisabledAction>View Profile</DisabledAction>
                      <DisabledAction>Edit Academic Plan</DisabledAction>
                      <DisabledAction>View Onboarding</DisabledAction>
                      <DisabledAction>Review Approval</DisabledAction>
                      <DisabledAction>View Hours</DisabledAction>
                    </>
                  )}
                </div>
                {canAdminister && person.canCreatePendingRecord ? (
                  <form action={saveRyanManiboCandidate} className="mt-3 grid gap-2">
                    <input type="hidden" name="returnTo" value="/admin/hr" />
                    <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500" htmlFor={`email-${person.key}`}>
                      Verified contact email
                    </label>
                    <input
                      id={`email-${person.key}`}
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="School or personal email"
                      className="min-h-11 w-full rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-slate-950"
                    />
                    <button type="submit" className={primaryAction}>
                      Create pending record
                    </button>
                    <p className="text-xs font-semibold leading-5 text-slate-500">
                      Saves the Spring 2027 row only. No invitation is sent and the portal stays off.
                    </p>
                  </form>
                ) : null}
              </GrowthCard>
            );
          })}
        </div>
      </div>

      {canAdminister ? (
        <GrowthCard>
          <h3 className="text-lg font-black text-slate-950">Administrative Tools</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Super Admin only. These open the pages that already handle access, approval, and assignment.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span className="block text-sm font-black text-slate-950">{tool.title}</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-500">{tool.detail}</span>
              </Link>
            ))}
          </div>
          {previews.length ? (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <h4 className="text-sm font-black text-slate-950">Workspace previews</h4>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                A preview does not mean the account is active or that the student can sign in.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {previews.map((person) => (
                  <Link
                    key={person.key}
                    href={internPortalPreviewPath(person.recordId || "")}
                    className={person.workspaceAction === "active" ? primaryAction : quietAction}
                  >
                    {person.workspaceAction === "active"
                      ? `Open ${person.fullName} active portal`
                      : `Preview ${person.fullName} workspace`}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {legacy.length ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <h4 className="text-sm font-black text-amber-950">Record review</h4>
              <div className="mt-2 grid gap-3">
                {legacy.map((row) => (
                  <div key={row.id}>
                    <p className="text-sm font-semibold leading-6 text-amber-950">{row.recommendation}</p>
                    <Link href={`/admin/internship/interns/${row.id}#profile`} className={`${quietAction} mt-2`}>
                      Review legacy record
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </GrowthCard>
      ) : (
        <GrowthCard>
          <h3 className="text-lg font-black text-slate-950">Administrative Tools</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Super Admin manages registration, Microsoft readiness, university verification, invitations, academic requirements, onboarding, portal activation, and manager assignment.
          </p>
        </GrowthCard>
      )}
    </section>
  );
}
