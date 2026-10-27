import { getAdminIdentity } from "@/lib/admin/access";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { resolveManagerEngagement } from "@/lib/staff-time/engagement";
import { loadMyTimeDashboard } from "@/lib/staff-time/queries";
import PaymentsDesk from "@/components/staff-time/PaymentsDesk";
import { DESK_UI } from "@/lib/portal/desk-ui";

export const dynamic = "force-dynamic";

export default async function ManagerPaymentsPage() {
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
        <h1 className="text-2xl font-black text-[#0F2744]">My Payments</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">Payments open once your Growth Manager engagement is active.</p>
      </div>
    );
  }

  const data = await loadMyTimeDashboard(engagement);
  return <PaymentsDesk data={data} />;
}
