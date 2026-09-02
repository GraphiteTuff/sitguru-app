import type { ReactNode } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
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
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getHrDashboardData,
  type HrLeadRecord,
} from "@/lib/admin/hr/dashboard";
import { getGrowthHirePipelineSummary } from "@/lib/admin/growth/pipeline";
import {
  VETERANS_MILITARY_FAMILIES_PROGRAM,
} from "@/lib/programs/veterans-military-families";

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
  growthPortal: "/admin/growth",
  users: "/admin/users",
  messages: "/admin/messages",
  exports: "/admin/exports",
  payroll: "/admin/financials/payroll",
  payouts: "/admin/payouts",
};

const VETERANS_PROGRAM_LABEL = VETERANS_MILITARY_FAMILIES_PROGRAM.shortName;

type ModuleCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  wiring: "live" | "next";
  value?: string;
  icon: ReactNode;
};

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

function MetricTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function ModuleLinkCard({ card }: { card: ModuleCard }) {
  return (
    <Link
      href={card.href}
      className="group flex h-full flex-col rounded-[1.6rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]">
          {card.icon}
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
            card.wiring === "live"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {card.wiring === "live" ? "Live" : "Next"}
        </span>
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {card.eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-black text-slate-950">{card.title}</h3>
      {card.value ? (
        <p className="mt-2 text-2xl font-black text-[#0D5C3A]">{card.value}</p>
      ) : null}
      <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-slate-600">
        {card.description}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
        Open
        <ExternalLink size={14} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
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
    <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
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
    </section>
  );
}

export default async function AdminHrPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Admin access required.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Sign in with an authorized SitGuru admin or HR account to open Hiring
            &amp; People Ops.
          </p>
        </div>
      </div>
    );
  }

  const [data, growthHire] = await Promise.all([
    getHrDashboardData(),
    getGrowthHirePipelineSummary(),
  ]);

  const liveModules: ModuleCard[] = [
    {
      eyebrow: "Recruiting",
      title: "Ambassador Leads",
      description:
        "Indeed, PA CareerLink, campus, referral, and website ambassador applicants.",
      href: routes.ambassadorLeads,
      wiring: "live",
      value: number(data.metrics.activeAmbassadorLeads),
      icon: <HeartHandshake size={20} />,
    },
    {
      eyebrow: "Dashboards",
      title: "Ambassador Dashboards",
      description:
        "Active ambassador records, referral codes, and early referral tracking.",
      href: routes.ambassadors,
      wiring: "live",
      value: number(data.metrics.activeAmbassadorDashboards),
      icon: <ClipboardCheck size={20} />,
    },
    {
      eyebrow: "Guru Hiring",
      title: "Guru Applicants",
      description:
        "Pet Guru applications, onboarding progress, and approval readiness.",
      href: routes.gurus,
      wiring: "live",
      value: number(data.metrics.activeGuruApplicants),
      icon: <PawPrint size={20} />,
    },
    {
      eyebrow: "Approvals",
      title: "Guru Approvals",
      description:
        "Final bookable review queue before Gurus go live on SitGuru.",
      href: routes.guruApprovals,
      wiring: "live",
      value: number(data.metrics.pendingGuruApplicants),
      icon: <BadgeCheck size={20} />,
    },
    {
      eyebrow: "Trust & Safety",
      title: "Background Checks",
      description:
        "Checkr / Trust & Safety watchlist for pending and needs-review Gurus.",
      href: routes.backgroundChecks,
      wiring: "live",
      value: number(
        data.metrics.pendingBackgroundChecks +
          data.metrics.needsReviewBackgroundChecks,
      ),
      icon: <ShieldCheck size={20} />,
    },
    {
      eyebrow: "Training",
      title: "SitGuru University",
      description:
        "Mass update onboarding modules, documents, videos, and certifications.",
      href: routes.ambassadorTraining,
      wiring: "live",
      icon: <GraduationCap size={20} />,
    },
    {
      eyebrow: "Programs",
      title: "Hire Programs",
      description: `Student Hire, Community Hire, and ${VETERANS_PROGRAM_LABEL} pathways.`,
      href: routes.programs,
      wiring: "live",
      value: number(
        data.metrics.activeStudentHire +
          data.metrics.activeCommunityHire +
          data.metrics.activeMilitaryHire,
      ),
      icon: <BriefcaseBusiness size={20} />,
    },
    {
      eyebrow: "Growth Hire",
      title: "Social & Community Manager",
      description: `${growthHire.approvedSchools} schools approved, ${growthHire.pendingSchools} pending on Handshake. ${growthHire.messaged} messaged, ${growthHire.notMessaged} still to contact.`,
      href: `${routes.growthHire}#schools`,
      wiring: "live",
      value: `${growthHire.approvedSchools} / ${growthHire.schools}`,
      icon: <Sparkles size={20} />,
    },
    {
      eyebrow: "HQ People",
      title: "Admin Access Control",
      description:
        "HR / People roles, password support, MFA visibility, and HQ department access.",
      href: routes.settings,
      wiring: "live",
      icon: <Settings2 size={20} />,
    },
    {
      eyebrow: "Directory",
      title: "User Directory",
      description:
        "Look up Pet Parents, Gurus, Ambassadors, and internal accounts.",
      href: routes.users,
      wiring: "live",
      icon: <Users size={20} />,
    },
    {
      eyebrow: "Archives",
      title: "Archived Leads",
      description:
        "Declined or closed ambassador applicant records retained for history.",
      href: routes.ambassadorLeadsArchived,
      wiring: "live",
      value: number(data.metrics.archivedAmbassadorLeads),
      icon: <Archive size={20} />,
    },
    {
      eyebrow: "Messaging",
      title: "Applicant Messages",
      description: "Follow up with leads, Gurus, and Ambassadors in Admin Messages.",
      href: routes.messages,
      wiring: "live",
      icon: <MessageCircle size={20} />,
    },
    {
      eyebrow: "Payroll",
      title: "Employee Payroll",
      description:
        "W-2 / employee payroll stays in Financials. Contractor payouts stay under Payouts.",
      href: routes.payroll,
      wiring: "next",
      icon: <WalletCards size={20} />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(13,92,58,0.12),transparent_34%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_55%,#f8fafc_100%)] p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <Link
                href={routes.dashboard}
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                <ArrowLeft size={16} />
                Back to Admin
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl xl:text-5xl">
                  Human Resources
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Hiring & People Ops
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                    data.isLive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {data.isLive ? "Live Sources" : "Preview Sources"}
                </span>
              </div>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                Manage SitGuru hiring as a hub over live ops modules — ambassador
                recruiting, Guru applicants/approvals, Trust &amp; Safety,
                SitGuru University, programs, and HQ people access. Employee
                payroll stays Next in Financials.
              </p>

              <p className="mt-3 text-xs font-bold text-slate-500">
                Signed in as {actor.email} · Role {actor.role}
                {actor.canManageUsers ? " · Can manage people access" : ""}
              </p>
            </div>

            <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
              <Link
                href={routes.ambassadorLeads}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <Plus size={17} />
                Add Lead
              </Link>
              <Link
                href={routes.guruApprovals}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <BadgeCheck size={17} />
                Guru Approvals
              </Link>
              <Link
                href={routes.ambassadorTraining}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100"
              >
                <GraduationCap size={17} />
                University
              </Link>
              <Link
                href={routes.growthHire}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
              >
                <Sparkles size={17} />
                Hire Social
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <MetricTile
            label="Active Leads"
            value={number(data.metrics.activeAmbassadorLeads)}
            helper="Ambassador pipeline"
          />
          <MetricTile
            label="Dashboards"
            value={number(data.metrics.activeAmbassadorDashboards)}
            helper="Enabled ambassadors"
          />
          <MetricTile
            label="Guru Applicants"
            value={number(data.metrics.activeGuruApplicants)}
            helper="Active applicant records"
          />
          <MetricTile
            label="Pending Review"
            value={number(
              data.metrics.pendingGuruApplicants +
                data.metrics.pendingBackgroundChecks +
                data.metrics.needsReviewBackgroundChecks,
            )}
            helper="Approvals + Trust & Safety"
          />
          <MetricTile
            label="Approved / Clear"
            value={number(
              data.metrics.approvedGuruApplicants +
                data.metrics.approvedBackgroundChecks,
            )}
            helper="Ready for next step"
          />
          <MetricTile
            label="Student Hire"
            value={number(data.metrics.activeStudentHire)}
            helper="Active student pathway"
          />
          <MetricTile
            label="Community / Vets"
            value={number(
              data.metrics.activeCommunityHire + data.metrics.activeMilitaryHire,
            )}
            helper={`${VETERANS_PROGRAM_LABEL} included`}
          />
          <MetricTile
            label="Recent 14 Days"
            value={number(data.metrics.recentApplicants)}
            helper="New leads + applicants"
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Manage HR from live modules
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Hiring command center
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Live = wired ops pages · Next = planned employee payroll
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {liveModules.map((card) => (
              <ModuleLinkCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
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

          <div className="space-y-4 xl:col-span-5">
            <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
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
            </section>

            <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    University tools
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Training, assignments, and progress.
                  </p>
                </div>
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
            </section>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <LeadTable
              title="Recent Guru Applicants"
              subtitle="Applications and onboarding activity feeding Guru Approvals."
              href={routes.gurus}
              leads={data.recentGuruApplicants}
              emptyTitle="No Guru applicants yet"
              emptyDetail="Guru applications and onboarding activity will appear here."
            />
          </div>

          <div className="xl:col-span-5">
            <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
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
                      Pending Guru trust and safety checks will show here once
                      `guru_background_checks` has live rows.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">Source health</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              HR hub reads live ops tables — it does not invent a separate employee
              database.
            </p>
            <div className="mt-4 grid gap-3">
              {data.sourceHealth.map((source) => (
                <div
                  key={source.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-slate-900">{source.label}</p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                        source.ok
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {source.ok ? "Connected" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {source.message}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    {number(source.rowCount)} rows
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]">
              <Sparkles size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-950">
              How to manage HR here
            </h2>
            <ul className="mt-3 space-y-3 text-sm font-semibold leading-6 text-slate-600">
              <li>
                Use this page as the hub. Keep CRUD on Ambassador Leads, Gurus,
                Approvals, Trust &amp; Safety, University, Programs, and Settings.
              </li>
              <li>
                Track Handshake requested schools and shortlisted candidates on
                Hire Social & Community. Grant portal access only when the
                contractor starts the 30-day trial.
              </li>
              <li>
                Other HQ people access (roles, passwords, MFA) still lives in
                Admin Settings.
              </li>
              <li>
                Contractor payouts stay in Payouts / Financials. Employee payroll
                is marked Next until W-2 tooling is real.
              </li>
              <li>
                Export applicant or roster CSVs from Exports when you need CPA /
                ops handoff packages.
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={routes.growthHire}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
              >
                Hire Social & Community
              </Link>
              <Link
                href={routes.growthPortal}
                className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-50"
              >
                Growth Portal
              </Link>
              <Link
                href={routes.settings}
                className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-50"
              >
                HQ People Access
              </Link>
              <Link
                href={routes.payouts}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-50"
              >
                Contractor Payouts
              </Link>
              <Link
                href={routes.exports}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-50"
              >
                Exports
              </Link>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
