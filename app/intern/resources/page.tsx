import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import ResourcesBoard from "@/components/portal/ResourcesBoard";

export const dynamic = "force-dynamic";

export default async function InternResourcesPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <ResourcesBoard audience="intern" />;
}
