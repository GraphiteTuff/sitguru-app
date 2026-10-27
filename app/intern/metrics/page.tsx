import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { InternSimpleToolsPage } from "@/components/internship/InternSectionPages";

export const dynamic = "force-dynamic";

export default async function InternMetricsPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <InternSimpleToolsPage kind="metrics" />;
}
