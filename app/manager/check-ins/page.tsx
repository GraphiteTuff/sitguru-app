import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerDeskBundle } from "@/lib/admin/growth/manager-desk-data";
import ManagerCheckInsHome from "@/components/manager/ManagerCheckInsHome";

export const dynamic = "force-dynamic";

export default async function ManagerCheckInsPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const desk = await loadManagerDeskBundle();
  if (!desk) {
    return (
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Check-Ins unavailable</h1>
      </div>
    );
  }

  const rows = desk.reviews
    .filter((item) => item.targetType === "weekly")
    .map((item) => ({
      id: item.id,
      week: item.weekLabel || "This week",
      intern: item.internName,
      avatarUrl: desk.cards.find((card) => card.id === item.internId)?.avatarUrl || "",
      focus: "Growth work",
      submitted: item.submittedAt || "Recently",
      status: item.statusLabel,
      feedback: item.evidence || "Pending manager feedback",
    }));

  return <ManagerCheckInsHome rows={rows} />;
}
