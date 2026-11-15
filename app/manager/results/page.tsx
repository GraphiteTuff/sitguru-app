import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadLiveResults } from "@/lib/admin/growth/live-results";
import LiveResultsBoard from "@/components/portal/LiveResultsBoard";
import VerifiedMetaFollowers from "@/components/growth-center-v2/VerifiedMetaFollowers";
import { loadSocialConnectorStatus } from "@/lib/growth-center-v2/social-connectors";

export const dynamic = "force-dynamic";

export default async function ManagerResultsPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const [data, social] = await Promise.all([
    loadLiveResults(),
    loadSocialConnectorStatus(),
  ]);
  return (
    <div className="space-y-5">
      <VerifiedMetaFollowers social={social} />
      <LiveResultsBoard audience="manager" data={data} />
    </div>
  );
}
