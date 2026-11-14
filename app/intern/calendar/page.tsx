import { redirect } from "next/navigation";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { getAdminIdentity } from "@/lib/admin/access";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
import { buildInternAssignmentCalendar } from "@/lib/internship/intern-calendar";
import DeskCalendar from "@/components/portal/DeskCalendar";

export const dynamic = "force-dynamic";

/**
 * The assignment's existing due_on is the only calendar source of truth.
 * New work appears immediately after Ava publishes it; edits move the
 * calendar entry automatically without creating separate event records.
 */
export default async function InternCalendarPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const data = await loadInternSectionWorkspace();
  if (!data) {
    const admin = await getAdminIdentity();
    if (admin?.canAccessAdmin) redirect("/admin/internship/portal");
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        <h1 className="text-xl font-black text-slate-950">No intern calendar connected</h1>
        <p className="mt-2">Sign in with the SitGuru account linked to your internship to view your deadlines.</p>
      </div>
    );
  }
  const events = buildInternAssignmentCalendar({
    internId: data.workspace.intern.id,
    tasks: data.workspace.tasks,
  });
  return <DeskCalendar audience="intern" events={events} />;
}
