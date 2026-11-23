import Link from "next/link";
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div><p className="text-sm font-black text-emerald-950">Your content, measured</p><p className="text-xs font-semibold text-emerald-800">After approval and publication, explore post insights and SitGuru campaign results in Metrics.</p></div>
        <Link href="/manager/metrics?view=social-intelligence" className="inline-flex min-h-11 items-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black text-white">View Content Analytics</Link>
      </div>
      <ContentStudioBoard
        items={studio.items}
        summary={studio.summary}
        isSuperUser={access.actor.isSuperUser}
        error={first(params.error)}
        focusId={first(params.content)}
      />
      <CampaignPanel campaigns={desk.campaigns} content={desk.content} />
    </GrowthFrame>
  );
}
