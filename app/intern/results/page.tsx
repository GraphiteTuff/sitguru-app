import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import LiveResultsBoard from "@/components/portal/LiveResultsBoard";

export const dynamic = "force-dynamic";

export default async function InternResultsPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <LiveResultsBoard audience="intern" />;
}
