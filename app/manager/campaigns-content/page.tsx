import { ContentStudioBoard } from "@/components/manager/ContentStudioBoard";
import { CampaignPanel, GrowthFrame } from "@/components/manager/GrowthWorkPanels";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerContentStudio } from "@/lib/internship/content-studio-actions";
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
  const [desk, studio] = await Promise.all([
    loadCampaignDesk(access.actor.id),
    loadManagerContentStudio(access.actor.id, access.actor.isSuperUser),
  ]);
  return (
    <GrowthFrame title="Content Studio" subtitle="Review intern content, then keep your own campaigns beside it." notice={first(params.ok)}>
      <ContentStudioBoard
        items={studio.items}
        summary={studio.summary}
        isSuperUser={access.actor.isSuperUser}
        error={first(params.error)}
      />
      <CampaignPanel campaigns={desk.campaigns} content={desk.content} />
    </GrowthFrame>
  );
}
