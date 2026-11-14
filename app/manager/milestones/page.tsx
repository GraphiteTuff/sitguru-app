import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerDeskBundle } from "@/lib/admin/growth/manager-desk-data";
import { getActiveCohort, listCohortMilestones, listInterns } from "@/lib/internship/queries";
import { buildManagerMilestones } from "@/lib/internship/manager-milestones";
import ManagerMilestonesHome from "@/components/manager/ManagerMilestonesHome";

export const dynamic = "force-dynamic";

export default async function ManagerMilestonesPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const [desk, cohort] = await Promise.all([
    loadManagerDeskBundle(),
    getActiveCohort(),
  ]);
  if (!desk) {
    return (
      <section role="alert" className="mx-auto max-w-xl rounded-[1.75rem] border border-rose-200 bg-white p-6">
        <h1 className="text-xl font-black text-[#0F2744]">Milestones unavailable</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">The assigned team could not be loaded. The page does not display substitute progress.</p>
        <Link href="/manager/team" className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-[#2563EB]">Open My Team</Link>
      </section>
    );
  }
  const [milestones, interns] = await Promise.all([
    cohort ? listCohortMilestones(cohort.id) : Promise.resolve([]),
    cohort ? listInterns(cohort.id) : Promise.resolve([]),
  ]);
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/New_York" });
  const summary = buildManagerMilestones({
    milestones,
    interns,
    assignedInternIds: desk.cards.map(card => card.id),
    cohortId: cohort?.id,
    today,
  });
  return (
    <ManagerMilestonesHome
      summary={summary}
      cohortLabel={cohort?.name || "Current internship cohort"}
      canManageProgram={access.actor.isSuperUser}
    />
  );
}
