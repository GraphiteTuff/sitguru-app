import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadLiveResults } from "@/lib/admin/growth/live-results";
import LiveResultsBoard from "@/components/portal/LiveResultsBoard";

export const dynamic = "force-dynamic";

const TIKTOK_NOTICES: Record<string, string> = {
  connected: "TikTok account connected. Follower data is shown only when the production account has been verified.",
  cancelled: "TikTok authorization was cancelled. You can reconnect when ready.",
  invalid_state: "TikTok sign-in could not be verified. Start the connection again.",
  invalid_code: "TikTok did not return a valid authorization code.",
  connection_failed: "TikTok connection failed. Check TikTok app approval, granted scopes, callback URI, and account settings.",
};

const X_NOTICES: Record<string, string> = {
  connected: "X authorized for SitGuru. The account and follower count were verified by X; staging snapshots do not count toward production metrics.",
  cancelled: "X authorization was cancelled. No account was connected.",
  invalid_state: "X sign-in could not be verified. Start the connection again.",
  invalid_code: "X did not return an authorization code.",
  connection_failed: "X connection was not completed. Verify the official account, callback address and API credit balance.",
  synced: "X followers were refreshed from the official API.",
  too_soon: "X follower data was checked recently. No extra paid X API request was made.",
  not_connected: "Connect the verified SitGuru X account before refreshing follower metrics.",
  not_confirmed: "X API refresh was not approved. No request was made.",
  not_authorized: "Founder authorization is required. No X request was made.",
  sync_failed: "X follower refresh did not complete. Check API credits, authentication and server diagnostics.",
};

export default async function ManagerResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ tiktok?: string; x?: string }>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const [data, params] = await Promise.all([loadLiveResults(), searchParams]);
  const tiktokMode = process.env.TIKTOK_OAUTH_MODE;
  const canConnectTikTok =
    access.actor.isSuperUser &&
    process.env.TIKTOK_SOCIAL_SYNC_ENABLED === "true" &&
    (tiktokMode === "sandbox" ||
      (tiktokMode === "production" &&
        process.env.SITGURU_ISOLATED_STAGING !== "true" &&
        Boolean(process.env.TIKTOK_EXPECTED_OPEN_ID?.trim())));
  const canConnectX =
    access.actor.isSuperUser &&
    process.env.X_SOCIAL_SYNC_ENABLED === "true" &&
    (process.env.X_OAUTH_MODE === "staging"
      ? process.env.SITGURU_ISOLATED_STAGING === "true"
      : process.env.X_OAUTH_MODE === "production" &&
        process.env.SITGURU_ISOLATED_STAGING !== "true");
  const xIsStaging = process.env.X_OAUTH_MODE === "staging";

  return (
    <LiveResultsBoard
      audience="manager"
      data={data}
      canSyncSocials={access.actor.isSuperUser}
      canConnectTikTok={canConnectTikTok}
      tiktokIsProduction={tiktokMode === "production"}
      canConnectX={canConnectX}
      xIsStaging={xIsStaging}
      xNotice={access.actor.isSuperUser ? X_NOTICES[params?.x || ""] || "" : ""}
      tiktokNotice={access.actor.isSuperUser ? TIKTOK_NOTICES[params?.tiktok || ""] || "" : ""}
    />
  );
}