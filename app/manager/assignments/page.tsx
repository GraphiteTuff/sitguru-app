import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerDeskBundle } from "@/lib/admin/growth/manager-desk-data";
import ManagerAssignmentsHome from "@/components/manager/ManagerAssignmentsHome";

export const dynamic = "force-dynamic";

export default async function ManagerAssignmentsPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const desk = await loadManagerDeskBundle();
  if (!desk) {
    return (
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Assignments unavailable</h1>
      </div>
    );
  }

  const rows = desk.reviews
    .filter((item) => item.targetType === "task" || item.targetType === "content")
    .map((item) => ({
      id: item.id,
      title: item.title,
      intern: item.internName,
      category: item.targetType === "content" ? "Content" : "Campaign",
      due: item.weekLabel || "Soon",
      status: item.statusLabel,
      progress: /approv|complete/i.test(item.statusLabel) ? 100 : 55,
    }));

  return <ManagerAssignmentsHome rows={rows} />;
}
