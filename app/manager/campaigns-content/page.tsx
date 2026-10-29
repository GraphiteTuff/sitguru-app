import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { CampaignPanel, GrowthFrame } from "@/components/manager/GrowthWorkPanels";
import { loadCampaignDesk } from "@/lib/manager-growth/data";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function CampaignsContentPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const desk = await loadCampaignDesk(access.actor.id);
  return (
    <GrowthFrame title="Campaigns & Content" subtitle="Create organic campaigns and keep the caption, the link, and the lesson." notice={first(params.ok)}>
      <CampaignPanel campaigns={desk.campaigns} content={desk.content} />
    </GrowthFrame>
  );
}
