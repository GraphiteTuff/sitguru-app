import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadLiveResults } from "@/lib/admin/growth/live-results";
import LiveResultsBoard from "@/components/portal/LiveResultsBoard";

export const dynamic = "force-dynamic";

const TIKTOK_NOTICES: Record<string, string> = {
  connected: "TikTok sandbox connected. Test snapshots are isolated from production follower totals.",
  cancelled: "TikTok authorization was cancelled. You can reconnect when ready.",
  invalid_state: "TikTok sign-in could not be verified. Start the connection again.",
  invalid_code: "TikTok did not return a valid authorization code.",
  connection_failed: "TikTok connection failed. Check the sandbox app, granted scopes, and server configuration.",
};

export default async function ManagerResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ tiktok?: string }>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const [data, params] = await Promise.all([loadLiveResults(), searchParams]);
  const canConnectTikTok =
    access.actor.isSuperUser &&
    process.env.TIKTOK_SOCIAL_SYNC_ENABLED === "true" &&
    process.env.TIKTOK_OAUTH_MODE === "sandbox";

  return (
    <LiveResultsBoard
      audience="manager"
      data={data}
      canSyncMeta={access.actor.isSuperUser}
      canConnectTikTok={canConnectTikTok}
      tiktokNotice={access.actor.isSuperUser ? TIKTOK_NOTICES[params?.tiktok || ""] || "" : ""}
    />
  );
}