import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  FileText,
  GraduationCap,
  HeartHandshake,
  KeyRound,
  Mail,
  Megaphone,
  PawPrint,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import WorkforceDirectory, { type DirectoryPerson } from "@/components/admin/hr/WorkforceDirectory";
import { getHrDashboardData } from "@/lib/admin/hr/dashboard";
import { staffAccessPath } from "@/lib/admin/hr/staff-access";
import { listGrowthHires } from "@/lib/admin/growth/hire";
import { listInterns } from "@/lib/internship/queries";
import { excludeFromInternPortalList, rosterStatusLabel } from "@/lib/internship/team-roster";
import { supabaseAdmin } from "@/lib/supabase/admin";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function countOf(result: { count: number | null; error: { message?: string } | null }) {
  if (result.error) return null;
  return result.count ?? 0;
}

function mailboxReady(value: string) {
  const normalized = value.toLowerCase();
  return ["ready", "provisioned", "licensed", "active", "connected", "created"].includes(normalized);
}

function mailboxLabel(value: string) {
  const normalized = value.toLowerCase();
  if (!normalized || normalized === "not_created" || normalized === "needs_access") return "Not created";
  if (mailboxReady(normalized)) return "Ready";
  if (normalized.includes("provision")) return "Provisioning";
  return normalized.replaceAll("_", " ");
}

function statusTone(status: string): DirectoryPerson["statusTone"] {
  const value = status.toLowerCase();
  if (value === "active" || value === "approved" || value === "accepted" || value === "completed" || value === "clear") {
    return "emerald";
  }
  if (value === "prospective") return "violet";
  if (value.includes("pending") || value.includes("onboard") || value.includes("review")) return "amber";
  return "slate";
}

function trainingLabel(status: string, percent: number | null) {
  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "complete" || percent === 100) return "Up to date";
  if (normalized.includes("progress") || (percent != null && percent > 0)) return percent == null ? "In progress" : `${percent}%`;
  if (!normalized && percent == null) return "Not recorded";
  return "Not started";
}

function ago(value: string | null) {
  if (!value) return "";
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value.slice(0, 10);
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function Ring({ percent, caption }: { percent: number; caption: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const filled = (safe / 100) * circumference;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 96 96" className="h-24 w-24 shrink-0" role="img" aria-label={`${safe}% ${caption}`}>
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#e7f6ee" strokeWidth="10" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#0D5C3A"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform="rotate(-90 48 48)"
        />
        <text x="48" y="46" textAnchor="middle" fill="#0f172a" fontSize="18" fontWeight="800">{safe}%</text>
        <text x="48" y="62" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="700">{caption}</text>
      </svg>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  helper,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  helper: string;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">{icon}</span>
      <p className="mt-2 text-xl font-black leading-none text-slate-950 sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs font-black text-slate-800">{label}</p>
      <p className="text-[11px] font-semibold leading-4 text-emerald-700">{helper}</p>
    </article>
  );
}

function SectionLink({ href, children }: { href: string; children: string }) {
  return <Link href={href} className="shrink-0 text-xs font-black text-[#0D5C3A]">{children}</Link>;
}

export default async function HumanResourcesDashboard({
  notice = "",
  noticeError = "",
}: {
  notice?: string;
  noticeError?: string;
}) {
  const [hr, hires, interns, accessRequests, events, audits, universities, partners, partnerCount, trainingTotal, trainingCompleted, trainingProgress, steps, progress, mailboxes, readiness] = await Promise.all([
    getHrDashboardData(),
    listGrowthHires(),
    listInterns(),
    supabaseAdmin.from("staff_access_requests").select("id", { count: "exact", head: true }).in("status", ["pending_ceo_review", "pending_university_approval", "pending"]),
    supabaseAdmin.from("internship_assignment_events").select("id,summary,created_at").order("created_at", { ascending: false }).limit(8),
    supabaseAdmin.from("admin_audit_logs").select("id,action,created_at,area").eq("area", "hr").order("created_at", { ascending: false }).limit(8),
    supabaseAdmin.from("internship_universities").select("id,name"),
    supabaseAdmin.from("partners").select("id,business_name,contact_name,city,status").neq("status", "archived").order("created_at", { ascending: false }).limit(12),
    supabaseAdmin.from("partners").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabaseAdmin.from("ambassadors").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("ambassadors").select("id", { count: "exact", head: true }).ilike("training_status", "completed"),
    supabaseAdmin.from("ambassadors").select("id", { count: "exact", head: true }).ilike("training_status", "in progress"),
    supabaseAdmin.from("ambassador_training_steps").select("id,title,is_active").eq("is_active", true).order("step_number", { ascending: true }).limit(6),
    supabaseAdmin.from("ambassador_training_progress").select("training_step_id,status,ambassador_id").limit(4000),
    supabaseAdmin.from("microsoft_user_links").select("user_id,status,entra_object_id").limit(1000),
    supabaseAdmin.from("internship_interns").select("id,microsoft_readiness,user_id"),
  ]);

  const activeHires = hires.filter((hire) => hire.status === "active" && hire.userId);
  const hireIds = activeHires.map((hire) => hire.userId);
  const [{ data: profiles }, { data: ambassadorTraining }] = await Promise.all([
    hireIds.length
      ? supabaseAdmin.from("profiles").select("id,full_name,avatar_url,profile_photo_url").in("id", hireIds)
      : Promise.resolve({ data: [] as { id: string; full_name?: string | null; avatar_url?: string | null; profile_photo_url?: string | null }[] }),
    activeHires.length
      ? supabaseAdmin.from("ambassadors").select("email,training_status,training_percent").in("email", activeHires.map((hire) => hire.email))
      : Promise.resolve({ data: [] as { email?: string | null; training_status?: string | null; training_percent?: number | null }[] }),
  ]);

  const profileById = new Map((profiles || []).map((row) => [text(row.id), row]));
  const trainingByEmail = new Map((ambassadorTraining || []).map((row) => [text(row.email).toLowerCase(), row]));
  const ava = activeHires.find((hire) => hire.email.toLowerCase() === "ava@sitguru.com") || activeHires[0] || null;
  const avaProfile = ava ? profileById.get(ava.userId) : undefined;
  const avaName = text(avaProfile?.full_name) || (ava ? "Ava Venezia" : "No manager login");
  const avaAvatar = text(avaProfile?.avatar_url) || text(avaProfile?.profile_photo_url);
  const school = new Map((universities.data || []).map((row) => [text(row.id), text(row.name)]));
  const visibleInterns = interns.filter((intern) => !excludeFromInternPortalList(intern));
  const readinessById = new Map((readiness.data || []).map((row) => [text(row.id), text(row.microsoft_readiness)]));
  const mailboxByUser = new Map(
    (mailboxes.data || [])
      .filter((row) => text(row.user_id))
      .map((row) => [text(row.user_id), text(row.entra_object_id) ? text(row.status) || "connected" : "needs_access"]),
  );

  function microsoftFor(userId: string | null | undefined, readinessValue: string) {
    const linked = userId ? mailboxByUser.get(userId) || "" : "";
    return mailboxLabel(readinessValue || linked);
  }

  const microsoftReadyPeople = [
    ...activeHires.filter((hire) => mailboxReady(mailboxByUser.get(hire.userId) || "")),
    ...visibleInterns.filter((intern) => mailboxReady(readinessById.get(intern.id) || mailboxByUser.get(intern.userId || "") || "")),
  ].length;
  const microsoftDenom = activeHires.length + visibleInterns.length;
  const microsoftPercent = microsoftDenom ? Math.round((microsoftReadyPeople / microsoftDenom) * 100) : 0;
  const activePartners = countOf(partnerCount);
  const ambassadorTotal = countOf(trainingTotal);
  const ambassadorCompleted = countOf(trainingCompleted);
  const ambassadorInProgress = countOf(trainingProgress);
  const trainingKnown = ambassadorTotal != null && ambassadorCompleted != null && ambassadorInProgress != null;
  const trainingNotStarted = trainingKnown ? Math.max(0, ambassadorTotal - ambassadorCompleted - ambassadorInProgress) : 0;
  const trainingPercent = trainingKnown && ambassadorTotal > 0 ? Math.round((ambassadorCompleted / ambassadorTotal) * 100) : 0;
  const openRequests = countOf(accessRequests) ?? 0;
  const pendingApprovals =
    hr.metrics.pendingGuruApplicants +
    hr.metrics.pendingBackgroundChecks +
    hr.metrics.needsReviewBackgroundChecks +
    openRequests;
  const peopleTotal =
    activeHires.length +
    hr.metrics.activeGuruApplicants +
    hr.metrics.activeAmbassadorDashboards +
    visibleInterns.length +
    (activePartners ?? 0);

  const stepRows = steps.error ? [] : steps.data || [];
  const progressRows = progress.error ? [] : progress.data || [];
  const programs = stepRows.map((step) => {
    const id = text(step.id);
    const rows = progressRows.filter((row) => text(row.training_step_id) === id);
    const people = new Set(rows.map((row) => text(row.ambassador_id)).filter(Boolean));
    const done = new Set(
      rows
        .filter((row) => ["completed", "complete"].includes(text(row.status).toLowerCase()))
        .map((row) => text(row.ambassador_id))
        .filter(Boolean),
    );
    const base = ambassadorTotal && ambassadorTotal > 0 ? ambassadorTotal : people.size;
    const percent = base ? Math.round((done.size / base) * 100) : 0;
    return { id, title: text(step.title) || "Training step", percent };
  });

  const directory: DirectoryPerson[] = [
    ...activeHires.map((hire) => {
      const profile = profileById.get(hire.userId);
      const training = trainingByEmail.get(hire.email.toLowerCase());
      const percent = typeof training?.training_percent === "number" ? training.training_percent : null;
      return {
        id: hire.userId,
        name: text(profile?.full_name) || (hire.email.toLowerCase() === "ava@sitguru.com" ? "Ava Venezia" : hire.email),
        avatarUrl: text(profile?.avatar_url) || text(profile?.profile_photo_url),
        group: "staff" as const,
        groupLabel: "Staff",
        role: "Manager",
        organization: "Marketing & Community",
        status: "Active",
        statusTone: "emerald" as const,
        onboarding: "Active login",
        training: trainingLabel(text(training?.training_status), percent),
        microsoft: microsoftFor(hire.userId, ""),
        href: staffAccessPath(hire.userId),
      };
    }),
    ...visibleInterns.map((intern) => ({
      id: intern.id,
      name: intern.preferredName || intern.fullName,
      avatarUrl: intern.avatarUrl || "",
      group: "intern" as const,
      groupLabel: "Interns",
      role: "Intern",
      organization: school.get(intern.universityId) || "University pending",
      status: rosterStatusLabel(String(intern.status)),
      statusTone: statusTone(String(intern.status)),
      onboarding: intern.portalEnabled ? "Complete" : String(intern.status) === "onboarding" ? "Onboarding" : "Not started",
      training: "Not started",
      microsoft: microsoftFor(intern.userId, readinessById.get(intern.id) || ""),
      href: `/admin/internship/interns/${intern.id}`,
    })),
    ...hr.recentGuruApplicants.map((person) => ({
      id: person.id,
      name: person.name,
      group: "guru" as const,
      groupLabel: "Gurus",
      role: "Guru",
      organization: person.location || "SitGuru",
      status: person.status,
      statusTone: statusTone(person.status),
      onboarding: "In progress",
      training: "Not started",
      microsoft: "n/a",
      href: person.href || "/admin/gurus",
    })),
    ...hr.recentAmbassadorLeads.map((person) => ({
      id: person.id,
      name: person.name,
      group: "ambassador" as const,
      groupLabel: "Ambassadors",
      role: "Ambassador",
      organization: person.program || "Community",
      status: person.status,
      statusTone: statusTone(person.status),
      onboarding: "In progress",
      training: "Not started",
      microsoft: "n/a",
      href: person.href || "/admin/ambassadors",
    })),
    ...(partners.error ? [] : partners.data || []).map((partner) => ({
      id: text(partner.id),
      name: text(partner.business_name) || text(partner.contact_name) || "Community partner",
      group: "partner" as const,
      groupLabel: "Community Partners",
      role: "Community Partner",
      organization: text(partner.city) || "Partner organization",
      status: text(partner.status) || "Active",
      statusTone: statusTone(text(partner.status) || "active"),
      onboarding: text(partner.status) === "active" ? "Complete" : "In progress",
      training: "n/a",
      microsoft: "n/a",
      href: "/admin/partners/active",
    })),
  ];

  const actions = [
    { href: "/admin/users", title: "Add Person", detail: "Add a staff member, guru, intern, ambassador, or partner.", icon: UserPlus },
    { href: "/admin/hr/onboarding", title: "Start Onboarding", detail: "Begin onboarding for a new person.", icon: Mail },
    { href: "/admin/ambassador-training", title: "Assign Training", detail: "Assign required training and view progress.", icon: GraduationCap },
    { href: "/admin/hr/access-requests", title: "Review Approvals", detail: "Handle pending people, access, and approval requests.", icon: BadgeCheck },
    { href: ava ? staffAccessPath(ava.userId) : "/admin/users", title: "Manage Access & Roles", detail: "Set roles, permissions, and Microsoft 365 access.", icon: KeyRound },
    { href: "/admin/internship", title: "Open Internship Program", detail: "Manage internship terms, onboarding, and placement.", icon: GraduationCap },
    { href: "/admin/guru-approvals", title: "Review Guru Applications", detail: "Review and approve new Guru applicants.", icon: PawPrint },
    { href: "/admin/partners", title: "Manage Community Partners", detail: "Add, update, and oversee partner organizations.", icon: Building2 },
  ];

  const pipeline = [
    { label: "Invite Sent", value: visibleInterns.filter((intern) => !intern.userId).length, icon: Mail },
    { label: "Account Setup", value: visibleInterns.filter((intern) => intern.userId && !intern.portalEnabled).length, icon: UserPlus },
    { label: "Documents", value: visibleInterns.filter((intern) => !["verified", "approved"].includes((intern.universityVerificationStatus || "").toLowerCase())).length, icon: FileText },
    { label: "Role Access", value: visibleInterns.filter((intern) => intern.portalEnabled).length, icon: KeyRound },
    { label: "Training", value: ambassadorInProgress ?? 0, icon: GraduationCap },
    { label: "Ready", value: visibleInterns.filter((intern) => String(intern.status) === "active" && intern.portalEnabled).length, icon: BadgeCheck },
  ];

  const activity = [
    ...(events.error ? [] : events.data || []).map((row) => ({
      id: text(row.id),
      title: text(row.summary) || "Internship assignment updated",
      when: text(row.created_at),
    })),
    ...(audits.error ? [] : audits.data || []).map((row) => ({
      id: text(row.id),
      title: text(row.action).replaceAll("_", " ") || "HR update",
      when: text(row.created_at),
    })),
    ...hr.recentGuruApplicants.slice(0, 3).map((person) => ({
      id: `guru-${person.id}`,
      title: `Guru record updated: ${person.name}`,
      when: person.date || "",
    })),
    ...hr.recentAmbassadorLeads.slice(0, 3).map((person) => ({
      id: `ambassador-${person.id}`,
      title: `Ambassador record updated: ${person.name}`,
      when: person.date || "",
    })),
  ]
    .sort((a, b) => Date.parse(b.when || "") - Date.parse(a.when || ""))
    .slice(0, 6);

  const groups = [
    { label: "Staff / Employees", value: activeHires.length, href: "/admin/users", icon: BriefcaseBusiness },
    { label: "Managers", value: activeHires.length, href: ava ? staffAccessPath(ava.userId) : "/admin/hr/team-access", icon: Users },
    { label: "Gurus", value: hr.metrics.activeGuruApplicants, href: "/admin/gurus", icon: PawPrint },
    { label: "Ambassadors", value: hr.metrics.activeAmbassadorDashboards, href: "/admin/ambassadors", icon: Megaphone },
    { label: "Interns", value: visibleInterns.length, href: "/admin/internship", icon: GraduationCap },
    { label: "Community Partners", value: activePartners ?? 0, href: "/admin/partners", icon: Building2 },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-[96rem] space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          <HeartHandshake className="h-7 w-7 shrink-0 text-emerald-700" /> Human Resources
        </h1>
        <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-600">
          Manage people, access, onboarding, training, and workforce operations across SitGuru.
        </p>
      </div>
      {notice ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{notice}</p> : null}
      {noticeError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{noticeError}</p> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-11">
        <Stat icon={<Users className="h-4 w-4" />} value={String(peopleTotal)} label="Total People" helper="Group records" />
        <Stat icon={<BriefcaseBusiness className="h-4 w-4" />} value={String(activeHires.length)} label="Active Staff" helper="Manager logins" />
        <Stat icon={<PawPrint className="h-4 w-4" />} value={String(hr.metrics.activeGuruApplicants)} label="Gurus" helper="Guru records" />
        <Stat icon={<Megaphone className="h-4 w-4" />} value={String(hr.metrics.activeAmbassadorDashboards)} label="Ambassadors" helper="Live dashboards" />
        <Stat icon={<GraduationCap className="h-4 w-4" />} value={String(visibleInterns.length)} label="Interns" helper="Internship records" />
        <Stat icon={<Building2 className="h-4 w-4" />} value={String(activePartners ?? 0)} label="Community Partners" helper={activePartners == null ? "Count unavailable" : "Active organizations"} />
        <Stat icon={<BadgeCheck className="h-4 w-4" />} value={String(pendingApprovals)} label="Pending Approvals" helper="Need action" />
        <Stat icon={<GraduationCap className="h-4 w-4" />} value={String(trainingNotStarted)} label="Training Due" helper={trainingKnown ? "Not started" : "Not available"} />
        <Stat icon={<UserPlus className="h-4 w-4" />} value={String(visibleInterns.filter((intern) => !intern.portalEnabled).length)} label="Onboarding" helper="Portal not open" />
        <Stat icon={<ShieldCheck className="h-4 w-4" />} value={`${microsoftPercent}%`} label="Microsoft 365 Ready" helper={`${microsoftReadyPeople} of ${microsoftDenom} ready`} />
        <Stat icon={<KeyRound className="h-4 w-4" />} value={String(openRequests)} label="Open Access Requests" helper="Review requests" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr_0.95fr]">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <Users className="h-5 w-5 text-emerald-700" /> Team Manager
          </h2>
          {ava ? (
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                  {avaAvatar ? (
                    <img src={avaAvatar} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-emerald-50 text-base font-black text-[#0D5C3A]">
                      {avaName.split(" ").slice(0, 2).map((part) => part.charAt(0)).join("")}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-slate-950">{avaName}</p>
                  <p className="text-sm font-semibold text-slate-600">Social Media & Community Growth Manager</p>
                  <p className="text-xs font-bold text-emerald-700">Active</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <Link href="/manager" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">Open Manager Portal</Link>
                <Link href={staffAccessPath(ava.userId)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-800">Manage Access & Roles</Link>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold text-slate-600">No active manager login is linked yet.</p>
          )}
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">People Groups Overview</h2>
            <SectionLink href="/admin/users">View All People</SectionLink>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {groups.map((group) => (
              <Link key={group.label} href={group.href} className="rounded-2xl bg-slate-50 p-3 hover:bg-emerald-50">
                <group.icon className="h-4 w-4 text-emerald-700" />
                <p className="mt-2 text-xl font-black text-slate-950">{group.value}</p>
                <p className="text-xs font-bold text-slate-600">{group.label}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Quick Actions</h2>
          <ul className="mt-3 space-y-1">
            {actions.map((action) => (
              <li key={action.title}>
                <Link href={action.href} className="flex min-h-11 items-start gap-3 rounded-xl px-2 py-2 hover:bg-emerald-50">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <action.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-slate-950">{action.title}</span>
                    <span className="block text-xs font-semibold text-slate-500">{action.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
        <WorkforceDirectory
          people={directory}
          totals={{
            all: peopleTotal,
            staff: activeHires.length,
            guru: hr.metrics.activeGuruApplicants,
            ambassador: hr.metrics.activeAmbassadorDashboards,
            intern: visibleInterns.length,
            partner: activePartners ?? directory.filter((person) => person.group === "partner").length,
          }}
        />
        <div className="grid gap-4">
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
                <UserPlus className="h-5 w-5 text-emerald-700" /> Onboarding Pipeline
              </h2>
              <SectionLink href="/admin/hr/onboarding">View Pipeline</SectionLink>
            </div>
            <ul className="mt-3 space-y-2">
              {pipeline.map((step, index) => (
                <li key={step.label} className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${index < 4 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      <step.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate">{step.label}</span>
                  </span>
                  <span className="font-black text-slate-950">{step.value}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
                <FileText className="h-5 w-5 text-emerald-700" /> Compliance / Documents
              </h2>
              <SectionLink href="/admin/background-checks">View All</SectionLink>
            </div>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              <li>
                <Link href="/admin/background-checks" className="flex items-center justify-between gap-3 text-slate-700">
                  <span>Background Checks</span>
                  <span>{hr.metrics.approvedBackgroundChecks} verified · {hr.metrics.pendingBackgroundChecks} pending</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/hr/onboarding" className="flex items-center justify-between gap-3 text-slate-700">
                  <span>Policies & Acknowledgments</span>
                  <span>{visibleInterns.filter((intern) => !intern.portalEnabled).length} open</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/guru-approvals" className="flex items-center justify-between gap-3 text-slate-700">
                  <span>Certifications</span>
                  <span>{hr.metrics.approvedGuruApplicants} approved · {hr.metrics.pendingGuruApplicants} pending</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/background-checks" className="flex items-center justify-between gap-3 text-slate-700">
                  <span>Renewals</span>
                  <span>{hr.metrics.needsReviewBackgroundChecks} need review</span>
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
              <GraduationCap className="h-5 w-5 text-emerald-700" /> Training & Learning
            </h2>
            <SectionLink href="/admin/ambassador-training">View Training</SectionLink>
          </div>
          {trainingKnown ? (
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Ring percent={trainingPercent} caption="Training" />
              <ul className="space-y-1 text-sm font-semibold text-slate-700">
                <li className="flex justify-between gap-4"><span>Completed</span><span>{ambassadorCompleted}</span></li>
                <li className="flex justify-between gap-4"><span>In progress</span><span>{ambassadorInProgress}</span></li>
                <li className="flex justify-between gap-4"><span>Not started</span><span>{trainingNotStarted}</span></li>
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-slate-600">Ambassador training totals are not available right now.</p>
          )}
          <ul className="mt-4 space-y-2">
            {programs.length ? programs.map((program) => (
              <li key={program.id} className="text-sm font-semibold text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{program.title}</span>
                  <span>{program.percent}%</span>
                </div>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-[#0D5C3A]" style={{ width: `${program.percent}%` }} />
                </span>
              </li>
            )) : (
              <li className="text-sm font-semibold text-slate-500">Open SitGuru University to assign modules. Counts above use ambassador training records.</li>
            )}
          </ul>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Access & Roles / Microsoft 365</h2>
            <SectionLink href="/admin/hr/microsoft">View Access</SectionLink>
          </div>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Ring percent={microsoftPercent} caption="M365" />
            <ul className="space-y-1 text-sm font-semibold text-slate-700">
              <li className="flex justify-between gap-4"><span>Mailboxes ready</span><span>{microsoftReadyPeople}</span></li>
              <li className="flex justify-between gap-4"><span>Staff logins</span><span>{activeHires.length}</span></li>
              <li className="flex justify-between gap-4"><span>Intern portals open</span><span>{visibleInterns.filter((intern) => intern.portalEnabled).length}</span></li>
            </ul>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            {microsoftReadyPeople} of {microsoftDenom} staff and intern records have a Microsoft mailbox marked ready ({microsoftPercent}%).
          </p>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Recent HR Activity</h2>
            <SectionLink href="/admin/audit-trail">View All</SectionLink>
          </div>
          <ul className="mt-3 space-y-3">
            {activity.length ? activity.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm font-semibold text-slate-700">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-slate-950">{item.title}</span>
                  <span className="text-xs text-slate-500">{ago(item.when)}</span>
                </span>
              </li>
            )) : <li className="text-sm font-semibold text-slate-500">No recent HR activity is recorded yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
