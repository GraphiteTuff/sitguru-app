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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DBEAFE] bg-gradient-to-r from-[#EFF6FF] via-[#F0FDF4] to-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)]">
        <div>
          <p className="text-sm font-black text-[#0F2744]">Your content, measured</p>
          <p className="text-xs font-semibold text-slate-600">After publishing, compare watched, clicked, shared and SitGuru growth results.</p>
        </div>
        <Link href="/manager/metrics?view=social-intelligence" className="inline-flex min-h-11 items-center rounded-xl bg-[#2563EB] px-4 text-sm font-black text-white shadow-sm hover:bg-[#1D4ED8]">View Content Analytics</Link>
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
