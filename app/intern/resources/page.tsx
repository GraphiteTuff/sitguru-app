import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import ResourcesBoard from "@/components/portal/ResourcesBoard";
import SharedTeamToolkitAssets from "@/components/portal/SharedTeamToolkitAssets";
import { resolveBrandActor, listBrandAssets } from "@/lib/manager/brand-kit-store";

export const dynamic = "force-dynamic";

export default async function InternResourcesPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const actor = await resolveBrandActor();
  const approved = actor?.capabilities.viewApproved
    ? await listBrandAssets({ actor, status: "approved", pageSize: 6 })
    : { assets: [], total: 0, error: "Complete onboarding to access the shared brand library." };
  return (
    <div className="space-y-5">
      <SharedTeamToolkitAssets role="intern" assets={approved.assets} total={approved.total} error={approved.error} />
      <ResourcesBoard audience="intern" />
    </div>
  );
}
