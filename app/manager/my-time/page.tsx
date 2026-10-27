import { getAdminIdentity } from "@/lib/admin/access";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { listGrowthInitiatives } from "@/lib/admin/growth/outcomes";
import { resolveManagerEngagement } from "@/lib/staff-time/engagement";
import { loadMyTimeDashboard } from "@/lib/staff-time/queries";
import MyTimeDesk from "@/components/staff-time/MyTimeDesk";
import { DESK_UI } from "@/lib/portal/desk-ui";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ManagerMyTimePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const actor = await getAdminIdentity();

  const engagement = await resolveManagerEngagement({
    userId: access.actor.id,
    email: access.actor.email,
    role: actor?.role,
    isSuperUser: access.actor.isSuperUser,
  });

  if (!engagement) {
    return (
      <div className={`${DESK_UI.card} p-6`}>
        <h1 className="text-2xl font-black text-[#0F2744]">My Time</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">My Time opens once your Growth Manager engagement is active.</p>
      </div>
    );
  }

  const params = searchParams ? await searchParams : {};
  const [data, initiatives] = await Promise.all([
    loadMyTimeDashboard(engagement),
    listGrowthInitiatives(20),
  ]);

  return (
    <MyTimeDesk
      data={data}
      initiatives={initiatives.map((item) => ({ id: item.id, name: item.name }))}
      notice={
        first(params.ok)
          ? { kind: "ok", message: first(params.ok) }
          : first(params.error)
            ? { kind: "error", message: first(params.error) }
            : null
      }
    />
  );
}
