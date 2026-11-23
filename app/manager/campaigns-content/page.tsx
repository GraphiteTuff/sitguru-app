import { ContentStudioBoard } from "@/components/manager/ContentStudioBoard";
import { CampaignPanel } from "@/components/manager/GrowthWorkPanels";
import ManagerSectionScaffold from "@/components/manager/ManagerSectionScaffold";
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
  const requestedQueue = first(params.queue);
  const queue = requestedQueue === "review" || requestedQueue === "publish" ||
    requestedQueue === "published" || requestedQueue === "all" || requestedQueue === "action"
    ? requestedQueue : first(params.content) ? "all" : "action";

  return (
    <ManagerSectionScaffold
      title="Content Studio"
      subtitle="Create posts, review team drafts, approve content and track what gets published."
    >
      {first(params.ok) ? (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{first(params.ok)}</p>
      ) : null}
      <ContentStudioBoard
        items={studio.items}
        summary={studio.summary}
        isSuperUser={access.actor.isSuperUser}
        queue={queue}
        error={first(params.error)}
        focusId={first(params.content)}
      />
      <details id="campaign-tools" open={first(params.tool) === "create" ? true : undefined}
        className="scroll-mt-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-4 py-4 text-sm font-black text-[#0F2744] hover:bg-slate-50 sm:px-5">
          More tools · Plan an organic campaign or create your own post
        </summary>
        <div className="border-t border-slate-100 p-3 sm:p-5">
          <CampaignPanel campaigns={desk.campaigns} content={desk.content} />
        </div>
      </details>
    </ManagerSectionScaffold>
  );
}
