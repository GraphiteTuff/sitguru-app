import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  AdminWorkplaceActions,
  AdminWorkplaceDenied,
  AdminWorkplaceHealth,
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";
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
    <GrowthCard className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
        <Link href={href} className="text-sm font-black text-emerald-800">
          Open →
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-black text-slate-950">{item.title}</p>
                <StatusPill value={item.status} />
              </div>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                {item.subtitle} · {item.academy} · {formatDate(item.date)}
              </p>
            </Link>
          ))
        ) : (
          <div className="min-w-0 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="font-black text-slate-950">{emptyTitle}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {emptyDetail}
            </p>
          </div>
        )}
      </div>
    </GrowthCard>
  );
}

export default async function AdminSitGuruUniversityHubPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied
        detail="Sign in with an authorized SitGuru admin account to open SitGuru University."
      />
    );
  }

  const data = await getUniversityDashboardData();
  const progressRows =
    data.metrics.academyProgressRows + data.metrics.ambassadorProgressRows;

  const tiles = [
    {
      label: "Active steps",
      value: number(data.metrics.activeSteps),
      helper: `${number(data.metrics.steps)} total`,
      tone: "emerald" as const,
      icon: <BookOpenCheck size={18} />,
    },
    {
      label: "Materials",
      value: number(data.metrics.activeMaterials),
      helper: `${number(data.metrics.requiredMaterials)} required`,
      tone: "sky" as const,
      icon: <BookOpen size={18} />,
    },
    {
      label: "Assignments",
      value: number(data.metrics.activeAssignments),
      helper: `${number(data.metrics.assignments)} total`,
      tone: "amber" as const,
      icon: <ClipboardList size={18} />,
    },
    {
      label: "Certifications",
      value: number(data.metrics.certifications),
      helper: "Issued badges / certificates",
      tone: "violet" as const,
      icon: <BadgeCheck size={18} />,
    },
    {
      label: "Pet Parent steps",
      value: number(data.metrics.petParentSteps),
      helper: "Active curriculum",
      tone: "sky" as const,
      icon: <Users size={18} />,
    },
    {
      label: "Guru steps",
      value: number(data.metrics.guruSteps),
      helper: "Active curriculum",
      tone: "emerald" as const,
      icon: <PawPrint size={18} />,
    },
    {
      label: "Ambassador steps",
      value: number(data.metrics.ambassadorSteps),
      helper: "Active curriculum",
      tone: "rose" as const,
      icon: <HeartHandshake size={18} />,
    },
    {
      label: "Progress rows",
      value: number(progressRows),
      helper: "Academy + Ambassador progress",
      tone: "slate" as const,
      icon: <GraduationCap size={18} />,
    },
  ];

  const actions = [
    {
      href: routes.manage,
      label: "Training manager",
      detail: `${number(data.metrics.activeSteps)} live steps`,
      icon: BookOpenCheck,
      primary: true,
    },
    {
      href: routes.assignments,
      label: "Assignments",
      detail: `${number(data.metrics.activeAssignments)} active`,
      icon: ClipboardList,
    },
    {
      href: routes.progress,
      label: "Progress",
      detail: `${number(progressRows)} learner rows`,
      icon: GraduationCap,
    },
    {
      href: routes.progress,
      label: "Certifications",
      detail: `${number(data.metrics.certifications)} issued`,
      icon: BadgeCheck,
    },
    {
      href: routes.previewPetParent,
      label: "Pet Parent preview",
      detail: "Open the learner academy",
      icon: Users,
      external: true,
    },
    {
      href: routes.previewGuru,
      label: "Guru preview",
      detail: "Open the learner academy",
      icon: PawPrint,
      external: true,
    },
    {
      href: routes.previewAmbassador,
      label: "Ambassador preview",
      detail: "Open learner training",
      icon: HeartHandshake,
      external: true,
    },
    {
      href: routes.ambassadorLeads,
      label: "Ambassador leads",
      detail: "Hiring pipeline into academies",
      icon: Sparkles,
    },
    {
      href: routes.hr,
      label: "HR",
      detail: "People Ops and onboarding",
      icon: ShieldCheck,
    },
  ];

  return (
    <GrowthPageFrame
      kicker="SitGuru University Workplace"
      title="Assign academies and watch people finish."
      detail="Curriculum, assignments, progress, and certifications live here. Edit steps in Training Manager, then preview each learner academy."
      action={
        <Link
          href={routes.manage}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          <BookOpenCheck size={17} />
          Manage curriculum
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href={routes.dashboard}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          Admin HQ
        </Link>
        <Link
          href={routes.hr}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          HR
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

      <section className="grid min-w-0 gap-4 xl:grid-cols-3">
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

      {data.sourceHealth?.length ? (
        <AdminWorkplaceHealth
          sources={data.sourceHealth}
          helper={
            data.isLive
              ? "Live curriculum, assignment, progress, and certification tables."
              : "Preview sources — some University tables are still pending."
          }
          links={
            <>
              <Link
                href={routes.ambassadors}
                className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900"
              >
                Ambassadors
              </Link>
              <Link
                href={routes.hr}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
              >
                HR
              </Link>
            </>
          }
        />
      ) : null}
    </GrowthPageFrame>
  );
}
