import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import DeskCalendar from "@/components/portal/DeskCalendar";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { loadManagerDashboard } from "@/lib/internship/manager-data";
import { getAdminIdentity } from "@/lib/admin/access";

export const dynamic = "force-dynamic";

export default async function ManagerCalendarPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const actor = await getAdminIdentity();
  const kind = internshipActorKind({ role: actor?.role, isSuperUser: actor?.isSuperUser });
  const desk = await loadManagerDashboard({
    actorUserId: access.actor.id,
    actorKind: kind === "supervisor" ? "supervisor" : "manager",
  });

  return <DeskCalendar audience="manager" events={desk.schedule} />;
}
