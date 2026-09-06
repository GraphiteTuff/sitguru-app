import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthPromoteScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function GrowthEventsPage() {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  return <GrowthPromoteScreen workplace={access} kind="event" />;
}
