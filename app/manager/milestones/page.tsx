import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerDeskBundle } from "@/lib/admin/growth/manager-desk-data";
import ManagerMilestonesHome from "@/components/manager/ManagerMilestonesHome";

export const dynamic = "force-dynamic";

export default async function ManagerMilestonesPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const desk = await loadManagerDeskBundle();
  if (!desk) {
    return (
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Milestones unavailable</h1>
      </div>
    );
  }

  const rows = desk.cards.map((card) => ({
    id: card.id,
    title: card.milestone || `${card.name} progress`,
    intern: card.name,
    avatarUrl: card.avatarUrl || "",
    category: card.phase || "Growth",
    due: card.nextDeadline || "Soon",
    status:
      card.paceTone === "behind"
        ? "Overdue"
        : card.paceTone === "done"
          ? "Complete"
          : "In Progress",
    progress: Math.min(100, Math.round(card.summary.progressPercent || 40)),
  }));

  return <ManagerMilestonesHome rows={rows} />;
}
