import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthFrame } from "@/components/manager/GrowthWorkPanels";
import { OutreachCRMPanel } from "@/components/manager/OutreachCRMPanel";
import { loadOutreach } from "@/lib/manager-growth/data";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function OutreachPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const desk = await loadOutreach(access.actor.id);
  const filter = first(params.filter) || "all";
  return (
    <GrowthFrame title="Community Outreach" subtitle="Relationships that help SitGuru and the partner. Formal commitments wait for leadership." notice={first(params.ok)}>
      <OutreachCRMPanel list={desk.list} activity={desk.activity} staff={desk.staff} ownerId={desk.ownerId} followUps={desk.followUps} overdue={desk.overdue} filter={filter} />
    </GrowthFrame>
  );
}
