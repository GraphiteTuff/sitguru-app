import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  ClipboardList,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getUniversityDashboardData,
  type UniversityRecentItem,
} from "@/lib/admin/university/dashboard";

export const dynamic = "force-dynamic";

const routes = {
  dashboard: "/admin",
  hr: "/admin/hr",
  university: "/admin/ambassador-training",
  manage: "/admin/ambassador-training/manage",
  assignments: "/admin/university-assignments",
  progress: "/admin/university-progress",
  ambassadors: "/admin/ambassadors",
  ambassadorLeads: "/admin/ambassador-leads",
  previewPetParent: "/customer/dashboard/university",
  previewGuru: "/guru/dashboard/university",
  previewAmbassador: "/ambassador/training",
};

type ModuleCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  wiring: "live" | "next";
  value?: string;
  icon: ReactNode;
  external?: boolean;
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
  const className =
    "group flex h-full flex-col rounded-[1.6rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md";

  const body = (
    <>
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
        <ExternalLink
          size={14}
          className="transition group-hover:translate-x-0.5"
        />
      </span>
    </>
  );

  if (card.external) {
    return (
      <a href={card.href} target="_blank" rel="noreferrer" className={className}>
        {body}
      </a>
    );
  }

  return (
    <Link href={card.href} className={className}>
      {body}
    </Link>
  );
}

function RecentList({
  title,
  subtitle,
  href,
  items,
  emptyTitle,
  emptyDetail,
}: {
  title: string;
  subtitle: string;
  href: string;
  items: UniversityRecentItem[];
  emptyTitle: string;
  emptyDetail: string;
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
          Open
        </Link>
      </div>

      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                    {item.subtitle}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                  {item.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                <span>{item.academy}</span>
                <span>·</span>
                <span>{formatDate(item.date)}</span>
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
    </section>
  );
}

export default async function AdminSitGuruUniversityHubPage() {
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
            Sign in with an authorized SitGuru admin account to open SitGuru
            University.
          </p>
        </div>
      </div>
    );
  }

  const data = await getUniversityDashboardData();

  const modules: ModuleCard[] = [
    {
      eyebrow: "Curriculum",
      title: "Training Manager",
      description:
        "Create and update Pet Parent, Guru, and Ambassador orientation steps and materials.",
      href: routes.manage,
      wiring: "live",
      value: number(data.metrics.activeSteps),
      icon: <BookOpenCheck size={20} />,
    },
    {
      eyebrow: "Assignments",
      title: "Academy Assignments",
      description:
        "Assign academies one by one to Pet Parents, Gurus, and Ambassadors.",
      href: routes.assignments,
      wiring: "live",
      value: number(data.metrics.activeAssignments),
      icon: <ClipboardList size={20} />,
    },
    {
      eyebrow: "Progress",
      title: "Progress Tracker",
      description:
        "See academy completion, cleanup issues, and last activity by person.",
      href: routes.progress,
      wiring: "live",
      value: number(
        data.metrics.academyProgressRows + data.metrics.ambassadorProgressRows,
      ),
      icon: <GraduationCap size={20} />,
    },
    {
      eyebrow: "Credentials",
      title: "Certifications",
      description:
        "Issued academy certifications and badge readiness across learner roles.",
      href: routes.progress,
      wiring: "live",
      value: number(data.metrics.certifications),
      icon: <BadgeCheck size={20} />,
    },
    {
      eyebrow: "Preview",
      title: "Pet Parent University",
      description: "Open the learner Pet Parent academy experience.",
      href: routes.previewPetParent,
      wiring: "live",
      icon: <Users size={20} />,
      external: true,
    },
    {
      eyebrow: "Preview",
      title: "Guru University",
      description: "Open the learner Guru academy experience.",
      href: routes.previewGuru,
      wiring: "live",
      icon: <PawPrint size={20} />,
      external: true,
    },
    {
      eyebrow: "Preview",
      title: "Ambassador Training",
      description: "Open the learner Ambassador training experience.",
      href: routes.previewAmbassador,
      wiring: "live",
      icon: <HeartHandshake size={20} />,
      external: true,
    },
    {
      eyebrow: "Recruiting",
      title: "Ambassador Leads",
      description:
        "Move leads into onboarding and academy assignment from the hiring pipeline.",
      href: routes.ambassadorLeads,
      wiring: "live",
      icon: <Sparkles size={20} />,
    },
    {
      eyebrow: "People Ops",
      title: "Back to HR",
      description:
        "Hiring & People Ops hub for leads, approvals, Trust & Safety, and HQ access.",
      href: routes.hr,
      wiring: "live",
      icon: <ShieldCheck size={20} />,
    },
    {
      eyebrow: "Assessments",
      title: "Quiz Engine",
      description:
        "Quiz content types exist on steps, but a full assessment engine is Next.",
      href: routes.manage,
      wiring: "next",
      icon: <BookOpenCheck size={20} />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(13,92,58,0.12),transparent_34%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_55%,#f8fafc_100%)] p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <Link
                href={routes.hr}
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                <ArrowLeft size={16} />
                Back to HR
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl xl:text-5xl">
                  SitGuru University
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Training Command Center
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
                Manage Pet Parent, Guru, and Ambassador academies from one hub —
                curriculum, assignments, progress, certifications, and learner
                previews. Keep CRUD in Training Manager.
              </p>

              <p className="mt-3 text-xs font-bold text-slate-500">
                Signed in as {actor.email} · Role {actor.role}
              </p>
            </div>

            <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
              <Link
                href={routes.manage}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
              >
                <BookOpenCheck size={17} />
                Manage Curriculum
              </Link>
              <Link
                href={routes.assignments}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <ClipboardList size={17} />
                Assignments
              </Link>
              <Link
                href={routes.progress}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <GraduationCap size={17} />
                Progress
              </Link>
              <Link
                href={routes.ambassadors}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100"
              >
                <HeartHandshake size={17} />
                Ambassadors
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <MetricTile
            label="Active Steps"
            value={number(data.metrics.activeSteps)}
            helper={`${number(data.metrics.steps)} total`}
          />
          <MetricTile
            label="Materials"
            value={number(data.metrics.activeMaterials)}
            helper={`${number(data.metrics.requiredMaterials)} required`}
          />
          <MetricTile
            label="Assignments"
            value={number(data.metrics.activeAssignments)}
            helper={`${number(data.metrics.assignments)} total`}
          />
          <MetricTile
            label="Certifications"
            value={number(data.metrics.certifications)}
            helper="Issued badges / certificates"
          />
          <MetricTile
            label="Pet Parent Steps"
            value={number(data.metrics.petParentSteps)}
            helper="Active curriculum"
          />
          <MetricTile
            label="Guru Steps"
            value={number(data.metrics.guruSteps)}
            helper="Active curriculum"
          />
          <MetricTile
            label="Ambassador Steps"
            value={number(data.metrics.ambassadorSteps)}
            helper="Active curriculum"
          />
          <MetricTile
            label="Progress Rows"
            value={number(
              data.metrics.academyProgressRows +
                data.metrics.ambassadorProgressRows,
            )}
            helper="Academy + Ambassador progress"
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Manage University from live modules
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Training command center
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Live = wired ops · Next = quiz / assessment engine
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {modules.map((card) => (
              <ModuleLinkCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <RecentList
            title="Recent curriculum"
            subtitle="Latest orientation steps across academies."
            href={routes.manage}
            items={data.recentSteps}
            emptyTitle="No curriculum steps yet"
            emptyDetail="Create Pet Parent, Guru, or Ambassador orientation records in Training Manager."
          />
          <RecentList
            title="Recent assignments"
            subtitle="Who was assigned which academy."
            href={routes.assignments}
            items={data.recentAssignments}
            emptyTitle="No assignments yet"
            emptyDetail="Assign academies from Academy Assignment Manager."
          />
          <RecentList
            title="Recent certifications"
            subtitle="Issued academy credentials."
            href={routes.progress}
            items={data.recentCertifications}
            emptyTitle="No certifications yet"
            emptyDetail="Certifications appear when learners complete academy requirements."
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">Source health</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              University hub reads live curriculum, assignment, progress, and
              certification tables.
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
              How to manage University
            </h2>
            <ul className="mt-3 space-y-3 text-sm font-semibold leading-6 text-slate-600">
              <li>
                Use this hub for KPIs and routing. Edit curriculum in Training
                Manager.
              </li>
              <li>
                Assign academies in Assignment Manager, then track completion in
                Progress Tracker.
              </li>
              <li>
                Preview the three learner experiences before publishing new
                materials.
              </li>
              <li>
                Hiring still starts in HR / Ambassador Leads — University owns
                training after assignment.
              </li>
            </ul>
          </section>
        </section>
      </div>
    </main>
  );
}
