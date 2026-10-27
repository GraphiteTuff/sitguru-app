import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import LiveResultsBoard from "@/components/portal/LiveResultsBoard";

export const dynamic = "force-dynamic";

export default async function ManagerResultsPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  return <LiveResultsBoard audience="manager" />;
}
