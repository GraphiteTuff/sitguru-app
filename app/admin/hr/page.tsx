import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  MapPin,
  MessageCircle,
  PawPrint,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  AdminWorkplaceActions,
  AdminWorkplaceDenied,
  AdminWorkplaceHealth,
  GrowthCard,
  GrowthPageFrame,
} from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getHrDashboardData,
  type HrLeadRecord,
} from "@/lib/admin/hr/dashboard";
import { getGrowthHirePipelineSummary } from "@/lib/admin/growth/pipeline";
import { countCareerJobs } from "@/lib/careers/jobs";
import { getActiveCohort, listCohortMilestones } from "@/lib/internship/queries";
import InternshipTimelineBoard from "@/components/internship/InternshipTimelineBoard";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

export const dynamic = "force-dynamic";

const routes = {
  dashboard: "/admin",
  hr: "/admin/hr",
  ambassadors: "/admin/ambassadors",
  ambassadorLeads: "/admin/ambassador-leads",
  ambassadorLeadsArchived: "/admin/ambassador-leads?status=archived",
  ambassadorTraining: "/admin/ambassador-training",
  ambassadorTrainingManage: "/admin/ambassador-training/manage",
  universityAssignments: "/admin/university-assignments",
  universityProgress: "/admin/university-progress",
  programs: "/admin/programs",
  gurus: "/admin/gurus",
  newGuru: "/admin/gurus/new",
  guruApprovals: "/admin/guru-approvals",
  backgroundChecks: "/admin/background-checks",
  settings: "/admin/settings",
  growthHire: "/admin/hr/growth-hire",
  careers: "/admin/hr/careers",
  internship: "/admin/internship",
  growthPortal: "/admin/growth",
  users: "/admin/users",
  messages: "/admin/messages",
  exports: "/admin/exports",
  payroll: "/admin/financials/payroll",
  payouts: "/admin/payouts",
};

const VETERANS_PROGRAM_LABEL = VETERANS_MILITARY_FAMILIES_PROGRAM.shortName;

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

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-xs font-black text-[#0D5C3A] shadow-sm">
      {initials || "SG"}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes("approved") ||
    normalized.includes("clear") ||
    normalized.includes("signed")
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : normalized.includes("review") ||
          normalized.includes("blocked") ||
          normalized.includes("not moving")
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : normalized.includes("contact") || normalized.includes("interest")
          ? "border-sky-200 bg-sky-50 text-sky-800"
          : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${tone}`}
    >
      {status}
    </span>
  );
}

function LeadTable({
  title,
  subtitle,
  href,
  leads,
  emptyTitle,
  emptyDetail,
  showProgram = false,
}: {
  title: string;
  subtitle: string;
  href: string;
  leads: HrLeadRecord[];
  emptyTitle: string;
  emptyDetail: string;
  showProgram?: boolean;
}) {
  return (
    <GrowthCard className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
        >
          View all
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {leads.length ? (
          leads.map((lead) => (
            <Link
              key={`${lead.id}-${lead.email}`}
              href={lead.href}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
            >
              <div className="flex items-start gap-3">
                <Avatar name={lead.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-slate-950">{lead.name}</p>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {lead.email}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={lead.status} />
                    {showProgram ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                        {lead.program}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <p className="font-black text-slate-950">{emptyTitle}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {emptyDetail}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              <th className="pb-3 pr-3">Person</th>
              {showProgram ? <th className="pb-3 pr-3">Program</th> : null}
              <th className="pb-3 pr-3">Status</th>
              <th className="pb-3 pr-3">Location</th>
              <th className="pb-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {leads.length ? (
              leads.map((lead) => (
                <tr
                  key={`${lead.id}-${lead.email}`}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="py-3 pr-3">
                    <Link
                      href={lead.href}
                      className="flex min-w-0 items-center gap-3 transition hover:opacity-90"
                    >
                      <Avatar name={lead.name} />
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">
                          {lead.name}
                        </p>
                        <p className="truncate text-xs font-semibold text-slate-500">
                          {lead.email}
                        </p>
                      </div>
                    </Link>
                  </td>
                  {showProgram ? (
                    <td className="py-3 pr-3 font-semibold text-slate-600">
                      {lead.program}
                    </td>
                  ) : null}
                  <td className="py-3 pr-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="py-3 pr-3 font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} />
                      {lead.location}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-slate-600">
                    {formatDate(lead.date)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={showProgram ? 5 : 4}
                  className="py-8 text-center"
                >
                  <p className="font-black text-slate-950">{emptyTitle}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {emptyDetail}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GrowthCard>
  );
}

export default async function AdminHrPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied
        detail="Sign in with an authorized SitGuru admin or HR account to open Hiring & People."
      />
    );
  }

  const [data, growthHire, careerCounts, internshipCohort] = await Promise.all([
    getHrDashboardData(),
    getGrowthHirePipelineSummary(),
    countCareerJobs(),
    getActiveCohort(),
  ]);
  const internshipMilestones = internshipCohort
    ? await listCohortMilestones(internshipCohort.id)
    : [];

  const pendingReview =
    data.metrics.pendingGuruApplicants +
    data.metrics.pendingBackgroundChecks +
    data.metrics.needsReviewBackgroundChecks;
  const healthy = data.sourceHealth.filter((source) => source.ok).length;

  const tiles = [
    {
      label: "Active leads",
      value: number(data.metrics.activeAmbassadorLeads),
      helper: "Ambassador pipeline",
      tone: "emerald" as const,
      icon: <HeartHandshake size={18} />,
    },
    {
      label: "Dashboards",
      value: number(data.metrics.activeAmbassadorDashboards),
      helper: "Enabled ambassadors",
      tone: "sky" as const,
      icon: <ClipboardCheck size={18} />,
    },
    {
      label: "Guru applicants",
      value: number(data.metrics.activeGuruApplicants),
      helper: "Active applicant records",
      tone: "violet" as const,
      icon: <PawPrint size={18} />,
    },
    {
      label: "Pending review",
      value: number(pendingReview),
      helper: "Approvals + Trust & Safety",
      tone: "amber" as const,
      icon: <BadgeCheck size={18} />,
    },
    {
      label: "Approved / clear",
      value: number(
        data.metrics.approvedGuruApplicants +
          data.metrics.approvedBackgroundChecks,
      ),
      helper: "Ready for next step",
      tone: "emerald" as const,
      icon: <ShieldCheck size={18} />,
    },
    {
      label: "Student Hire",
      value: number(data.metrics.activeStudentHire),
      helper: "Active student pathway",
      tone: "sky" as const,
      icon: <GraduationCap size={18} />,
    },
    {
      label: "Community / Vets",
      value: number(
        data.metrics.activeCommunityHire + data.metrics.activeMilitaryHire,
      ),
      helper: `${VETERANS_PROGRAM_LABEL} included`,
      tone: "violet" as const,
      icon: <Users size={18} />,
    },
    {
      label: "Recent 14 days",
      value: number(data.metrics.recentApplicants),
      helper: "New leads + applicants",
      tone: "slate" as const,
      icon: <Sparkles size={18} />,
    },
  ];

  const actions = [
    {
      href: routes.ambassadorLeads,
      label: "Ambassador leads",
      detail: `${number(data.metrics.activeAmbassadorLeads)} in the pipeline`,
      icon: HeartHandshake,
    },
    {
      href: routes.guruApprovals,
      label: "Guru approvals",
      detail: `${number(data.metrics.pendingGuruApplicants)} waiting`,
      icon: BadgeCheck,
      primary: pendingReview > 0,
    },
    {
      href: routes.backgroundChecks,
      label: "Background checks",
      detail: `${number(
        data.metrics.pendingBackgroundChecks +
          data.metrics.needsReviewBackgroundChecks,
      )} on the watchlist`,
      icon: ShieldCheck,
    },
    {
      href: routes.programs,
      label: "Hire programs",
      detail: `Student, Community, and ${VETERANS_PROGRAM_LABEL}`,
      icon: BriefcaseBusiness,
    },
    {
      href: routes.careers,
      label: "Careers job board",
      detail: `${careerCounts.published} published roles`,
      icon: ClipboardList,
    },
    {
      href: routes.internship,
      label: "Internship Program",
      detail: "College intern workspace and employer review",
      icon: GraduationCap,
    },
    {
      href: `${routes.growthHire}#schools`,
      label: "Growth hire",
      detail: `${growthHire.approvedSchools} of ${growthHire.schools} schools approved`,
      icon: Sparkles,
    },
    {
      href: routes.ambassadorTraining,
      label: "University",
      detail: "Modules, assignments, and progress",
      icon: GraduationCap,
    },
    {
      href: routes.users,
      label: "User directory",
      detail: "Parents, Gurus, Ambassadors, HQ",
      icon: Users,
    },
    {
      href: routes.ambassadors,
      label: "Ambassador dashboards",
      detail: `${number(data.metrics.activeAmbassadorDashboards)} live accounts`,
      icon: ClipboardCheck,
    },
  ];

  return (
    <GrowthPageFrame
      kicker="Hiring & People Workplace"
      title="Move leads to Gurus, Ambassadors, and HQ hires."
      detail="Work the ambassador pipeline, clear Guru approvals and Checkr, then send people into programs, University, or the job board."
      action={
        pendingReview > 0 ? (
          <Link
            href={routes.guruApprovals}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black !text-green-950"
          >
            <BadgeCheck size={17} />
            Guru Approvals
          </Link>
        ) : (
          <Link
            href={routes.ambassadorLeads}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black !text-green-950"
          >
            <Plus size={17} />
            Add lead
          </Link>
        )
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href={routes.dashboard}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          Admin HQ
        </Link>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          {actor.email}
        </span>
      </div>

      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => (
          <AdminThemeCard
            key={tile.label}
            label={tile.label}
            value={tile.value}
            helper={tile.helper}
            tone={tile.tone}
            icon={tile.icon}
          />
        ))}
      </section>

      <AdminWorkplaceActions actions={actions} />

      {internshipMilestones.length ? (
        <GrowthCard className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Internship Program timeline
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Spring 2027 employer execution. Intern portal and Employer HQ
                share the same milestones, SMART goals, and verified metrics.
              </p>
            </div>
            <Link
              href="/admin/internship/timeline"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900"
            >
              Open timeline
            </Link>
          </div>
          <InternshipTimelineBoard milestones={internshipMilestones.slice(0, 6)} compact />
        </GrowthCard>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <LeadTable
            title="Recent Ambassador Leads"
            subtitle="Active recruiting pipeline across Student, Community, and Veterans pathways."
            href={routes.ambassadorLeads}
            leads={data.recentAmbassadorLeads}
            emptyTitle="No active ambassador leads yet"
            emptyDetail="Add Indeed, PA CareerLink, campus, or referral leads to start the pipeline."
            showProgram
          />
        </div>

        <div className="min-w-0 space-y-4 xl:col-span-5">
          <GrowthCard className="min-w-0">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-950">
                  Program mix
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Active ambassador leads by pathway.
                </p>
              </div>
              <Link
                href={routes.programs}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
              >
                Programs
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                ["Student Hire", data.metrics.activeStudentHire],
                ["Community Hire", data.metrics.activeCommunityHire],
                [VETERANS_PROGRAM_LABEL, data.metrics.activeMilitaryHire],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <p className="font-black text-slate-900">{label}</p>
                  <p className="text-lg font-black text-[#0D5C3A]">
                    {number(Number(value))}
                  </p>
                </div>
              ))}
            </div>
          </GrowthCard>

          <GrowthCard className="min-w-0">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-950">
                University tools
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Training, assignments, and progress.
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                [
                  "SitGuru University Hub",
                  routes.ambassadorTraining,
                  <GraduationCap key="t" size={16} />,
                ],
                [
                  "Training Manager",
                  routes.ambassadorTrainingManage,
                  <BookOpenCheck key="m" size={16} />,
                ],
                [
                  "Academy Assignments",
                  routes.universityAssignments,
                  <ClipboardList key="a" size={16} />,
                ],
                [
                  "Progress Tracker",
                  routes.universityProgress,
                  <ClipboardCheck key="p" size={16} />,
                ],
                [
                  "Move leads into onboarding",
                  routes.ambassadorLeads,
                  <UserPlus key="l" size={16} />,
                ],
              ].map(([label, href, icon]) => (
                <Link
                  key={String(href)}
                  href={String(href)}
                  className="inline-flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-black text-slate-900 transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <span className="text-emerald-800">{icon as ReactNode}</span>
                  {label as string}
                </Link>
              ))}
            </div>
          </GrowthCard>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <LeadTable
            title="Recent Guru Applicants"
            subtitle="Applications and onboarding activity feeding Guru Approvals."
            href={routes.gurus}
            leads={data.recentGuruApplicants}
            emptyTitle="No Guru applicants yet"
            emptyDetail="Guru applications and onboarding activity will appear here."
          />
        </div>

        <div className="min-w-0 xl:col-span-5">
          <GrowthCard className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-950">
                  Trust &amp; Safety watchlist
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Pending and needs-review background checks.
                </p>
              </div>
              <Link
                href={routes.backgroundChecks}
                className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-black text-sky-900 transition hover:bg-sky-100"
              >
                Open Checks
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {data.pendingBackgroundChecks.length ? (
                data.pendingBackgroundChecks.map((check) => (
                  <Link
                    key={`${check.id}-${check.email}`}
                    href={check.href}
                    className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-800">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-950">{check.name}</p>
                        <p className="truncate text-xs font-semibold text-slate-500">
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
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                  <p className="font-black text-slate-950">No pending checks</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Pending Guru trust and safety checks will show here.
                  </p>
                </div>
              )}
            </div>
          </GrowthCard>
        </div>
      </section>

      <AdminWorkplaceHealth
        sources={data.sourceHealth}
        helper={`${healthy} of ${data.sourceHealth.length} live${
          data.isLive ? "" : " · preview sources"
        }`}
        links={
          <>
            <Link
              href={routes.payroll}
              className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900"
            >
              <WalletCards size={13} className="mr-1 inline" />
              Payroll
            </Link>
            <Link
              href={routes.messages}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              <MessageCircle size={13} className="mr-1 inline" />
              Messages
            </Link>
            <Link
              href={routes.settings}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              <Settings2 size={13} className="mr-1 inline" />
              Settings
            </Link>
          </>
        }
      />
    </GrowthPageFrame>
  );
}
