import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { ManagerSimpleToolsPage } from "@/components/manager/ManagerSharedPages";

export const dynamic = "force-dynamic";

export default async function ManagerCalendarPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  return <ManagerSimpleToolsPage kind="calendar" />;
}
