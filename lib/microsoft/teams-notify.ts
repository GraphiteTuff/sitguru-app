/**
 * Teams notifications.
 * ChannelMessage.Send is a delegated permission. The SitGuru app credential
 * must not post channel messages and must not use Teamwork.Migrate.All.
 */

export type TeamsNotificationMode = "link_only" | "delegated" | "workflow_webhook";

export type TeamsChannelPlan = {
  channelStatus: "connected" | "not_configured";
  notificationMode: TeamsNotificationMode;
  notificationStatus: "not_requested" | "pending" | "posted" | "error";
  recordStatus: "connected" | "not_configured";
  postWithApplicationGraph: false;
};

export function delegatedTeamsCredentialAvailable() {
  // A future delegated OAuth connection can flip this. A raw token is not stored here.
  return false;
}

export function resolveTeamsNotificationMode(input: {
  requested?: string | null;
  hasDelegatedCredential?: boolean;
  hasWorkflowWebhook?: boolean;
}): TeamsNotificationMode {
  const requested = String(input.requested || "channel_link_only").trim().toLowerCase();
  if (requested === "delegated_posting" && input.hasDelegatedCredential) return "delegated";
  if (requested === "workflow_webhook" && input.hasWorkflowWebhook) return "workflow_webhook";
  return "link_only";
}

/** Application Graph may create Planner tasks and SharePoint folders. It may not post channel messages. */
export function appOnlyGraphMayCall(path: string) {
  const value = path.toLowerCase();
  if (value.includes("/channels/") && value.includes("/messages")) return false;
  if (value.includes("teamwork") && value.includes("migrate")) return false;
  return true;
}

export function planTeamsChannel(input: {
  channelId: string;
  channelUrl: string;
  mode: TeamsNotificationMode;
  alreadyPosted?: boolean;
}): TeamsChannelPlan {
  const channelStatus = input.channelId || input.channelUrl ? "connected" : "not_configured";
  if (input.mode === "link_only") {
    return {
      channelStatus,
      notificationMode: "link_only",
      notificationStatus: "not_requested",
      recordStatus: channelStatus,
      postWithApplicationGraph: false,
    };
  }
  return {
    channelStatus,
    notificationMode: input.mode,
    notificationStatus: input.alreadyPosted ? "posted" : "pending",
    recordStatus: channelStatus,
    postWithApplicationGraph: false,
  };
}
