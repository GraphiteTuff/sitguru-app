import Link from "next/link";
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

  return <div className="space-y-4"><Link prefetch={false} href="/manager/outlook?view=calendar" className="inline-flex min-h-11 items-center rounded-xl border border-emerald-900 bg-white px-3 text-sm font-semibold text-emerald-950">Outlook &amp; SitGuru calendars</Link><DeskCalendar audience="manager" events={desk.schedule} /></div>;
}
