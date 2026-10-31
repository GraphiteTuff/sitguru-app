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
import TeamInternshipManagement from "@/components/admin/hr/TeamInternshipManagement";
import { canAdministerInternshipOnboarding } from "@/lib/internship/manager-access";

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
  people: "/admin/hr/people",
  teamPayments: "/admin/hr/people/payments",
  myTime: "/admin/growth/my-time",
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

export default async function AdminHrPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  const params = searchParams ? await searchParams : {};
  const notice = Array.isArray(params.ok) ? params.ok[0] : params.ok || "";
  const noticeError = Array.isArray(params.error) ? params.error[0] : params.error || "";

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
    <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:px-6">
      <TeamInternshipManagement
        canAdminister={canAdministerInternshipOnboarding(actor)}
        notice={notice}
        noticeError={noticeError}
      />
    </div>
  );
}
