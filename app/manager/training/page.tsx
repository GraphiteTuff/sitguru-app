import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import TrainingBoard from "@/components/portal/TrainingBoard";

export const dynamic = "force-dynamic";

export default async function ManagerTrainingPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  return <TrainingBoard audience="manager" />;
}
