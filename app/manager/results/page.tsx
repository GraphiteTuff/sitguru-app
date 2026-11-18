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

const X_NOTICES: Record<string, string> = {
  connected: "SitGuru's X account was authorized. Staging snapshots are not production follower metrics.",
  cancelled: "X authorization was cancelled. No account was connected.",
  invalid_state: "X sign-in could not be verified. Start the connection again.",
  invalid_code: "X did not return a usable authorization code.",
  connection_failed: "X connection did not complete. Check the authorized account, OAuth callback, credits, and staging configuration.",
};

export default async function ManagerResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ tiktok?: string; x?: string }>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const [data, params] = await Promise.all([loadLiveResults(), searchParams]);
  const canConnectTikTok =
    access.actor.isSuperUser &&
    process.env.TIKTOK_SOCIAL_SYNC_ENABLED === "true" &&
    process.env.TIKTOK_OAUTH_MODE === "sandbox";
  const canConnectX =
    access.actor.isSuperUser &&
    process.env.X_SOCIAL_SYNC_ENABLED === "true" &&
    process.env.X_OAUTH_MODE === "staging" &&
    process.env.SITGURU_ISOLATED_STAGING === "true";

  return (
    <LiveResultsBoard
      audience="manager"
      data={data}
      canSyncMeta={access.actor.isSuperUser}
      canConnectTikTok={canConnectTikTok}
      canConnectX={canConnectX}
      xNotice={access.actor.isSuperUser ? X_NOTICES[params?.x || ""] || "" : ""}
      tiktokNotice={access.actor.isSuperUser ? TIKTOK_NOTICES[params?.tiktok || ""] || "" : ""}
    />
  );
}