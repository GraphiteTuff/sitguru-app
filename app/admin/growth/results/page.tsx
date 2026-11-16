import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadLiveResults } from "@/lib/admin/growth/live-results";
import LiveResultsBoard from "@/components/portal/LiveResultsBoard";

export const dynamic = "force-dynamic";

/** Same verified social source and responsive cards as the Manager/Intern
 * Live Results pages, scoped to authenticated Admin Growth access.
 */
export default async function AdminGrowthLiveResultsPage() {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  const data = await loadLiveResults();
  return (
    <LiveResultsBoard
      audience="admin"
      data={data}
      canSyncMeta={access.actor.isSuperUser}
      canConnectTikTok={
        access.actor.isSuperUser &&
        process.env.TIKTOK_SOCIAL_SYNC_ENABLED === "true" &&
        process.env.TIKTOK_OAUTH_MODE === "sandbox"
      }
    />
  );
}