import { Clock3 } from "lucide-react";
import { redirect } from "next/navigation";
import InternHeroBanner from "@/components/internship/InternHeroBanner";
import InternHoursHome from "@/components/internship/InternHoursHome";
import { createClient } from "@/lib/supabase/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { requirementIsPending } from "@/lib/internship/hours";
import { findInternByAccount, findInternById } from "@/lib/internship/queries";
import { canPreviewInternPortal, internshipActorKind } from "@/lib/internship/manager-access";
import { internshipWeekNumber } from "@/lib/internship/process";
import { loadCategories, loadInternTime, loadOwnEntries } from "@/lib/timekeeper/data";
import { buildInternHoursDashboard } from "@/lib/timekeeper/hours-dashboard";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternTimePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intern/login?next=/intern/time");
  const params = searchParams ? await searchParams : {};
  const admin = await getAdminIdentity();
  const ownIntern = await findInternByAccount({ userId: user.id, email: user.email });
  const kind = internshipActorKind({
    role: admin?.role,
    isSuperUser: admin?.isSuperUser,
    isIntern: Boolean(ownIntern),
  });
  const viewId = first(params.view);
  let intern = ownIntern;
  let preview = false;
  if (viewId) {
    const target = await findInternById(viewId);
    if (
      target &&
      target.id !== ownIntern?.id &&
      canPreviewInternPortal({
        actor: kind,
        canAccessAdmin: admin?.canAccessAdmin,
        growthOnly: Boolean(admin && isGrowthOnlyRole(admin.role) && !admin.isSuperUser),
        actorUserId: user.id,
        actorInternId: ownIntern?.id,
        targetInternId: target.id,
        managerUserId: target.managerUserId,
      })
    ) {
      intern = target;
      preview = true;
    }
  }
  if (!intern) {
    if (admin?.canAccessAdmin) redirect("/admin/internship/portal");
    redirect("/intern");
  }
  const notice = first(params.ok) || first(params.error);
  const error = Boolean(first(params.error));
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [year, month, day] = todayKey.split("-").map(Number);
  const today = new Date(year, month - 1, day);
  const week = internshipWeekNumber(intern.academicStartDate, today, intern.status);
  const required = Number(intern.requiredHours || 0);
  const weeks = Number(intern.internshipWeeks || 15);
  const target = Number(intern.plannedWeeklyHours || 10);
  const [categories, record, running] = await Promise.all([
    loadCategories("intern"),
    loadInternTime({ internId: intern.id, requiredHours: required, weeks, weeklyTarget: target, currentWeek: week }),
    loadOwnEntries(intern.userId || user.id),
  ]);
  const names = new Map(categories.map((category) => [category.slug, category.name]));
  const entries = (record?.entries || []).map((entry) => ({
    id: entry.id,
    workedOn: entry.workedOn,
    hours: entry.hours,
    status: entry.status,
    categorySlug: entry.category,
    categoryName: names.get(entry.category) || "Other",
    description: entry.description,
    weekNumber: entry.weekNumber || null,
  }));
  const dashboard = buildInternHoursDashboard({
    entries,
    requiredHours: required,
    weeks,
    weeklyTarget: target,
    currentWeek: week,
    startDate: intern.academicStartDate,
    requirementPending: requirementIsPending({
      requirementStatus: intern.requirementStatus,
      requiredHours: intern.requiredHours,
    }),
    today,
  });
  const timer = running.find((entry) => entry.timerActive) || record?.entries.find((entry) => entry.timerActive);

  return (
    <div className="space-y-4 pb-28 xl:pb-6">
      <InternHeroBanner
        title="My Hours"
        subtitle="Track your internship hours, stay on pace, and meet your program requirements."
        icon={<Clock3 size={22} />}
      />
      {preview ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          Read-only time for {intern.preferredName || intern.fullName}. Their timer and weekly submit stay on their login.
        </p>
      ) : null}
      {notice ? <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-900"}`}>{notice}</p> : null}
      <InternHoursHome
        dashboard={dashboard}
        categories={categories}
        preview={preview}
        timerActive={Boolean(timer)}
        weekNumber={week}
        overage={record?.overage.exceeds ? record.overage.message : ""}
      />
    </div>
  );
}
