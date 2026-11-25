import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import InternshipFinalProjectBoard from "@/components/internship/InternshipFinalProjectBoard";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";

export const dynamic = "force-dynamic";

export default async function InternFinalProjectPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const data = await loadInternSectionWorkspace();
  if (!data) return <p className="rounded-2xl bg-white p-5">The final project requires a linked intern account.</p>;

  return <InternshipFinalProjectBoard data={data.workspace} weekNumber={data.hourSummary.weekNumber} mode="intern" />;
}
