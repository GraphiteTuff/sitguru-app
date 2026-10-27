import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import TrainingBoard from "@/components/portal/TrainingBoard";

export const dynamic = "force-dynamic";

export default async function InternTrainingPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <TrainingBoard audience="intern" />;
}
