import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthFrame, WeeklyWorkPanel } from "@/components/manager/GrowthWorkPanels";
import { loadWeeklyWork } from "@/lib/manager-growth/data";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function WeeklyWorkPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const work = await loadWeeklyWork(access.actor.id);
  return (
    <GrowthFrame title="My Weekly Work" subtitle="Your workspace for initiatives and learning. Not a clock on every hour." notice={first(params.ok)}>
      <WeeklyWorkPanel {...work} />
    </GrowthFrame>
  );
}
