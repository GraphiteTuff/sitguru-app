import { GROWTH_TEAMS_CHANNELS, routeAssignmentCategory, sharePointFolderName } from "@/lib/admin/growth/work-routing";
import { graphRequest, readMicrosoftGraphConfig } from "@/lib/microsoft/graph";
import {
  planTeamsChannel,
  resolveTeamsNotificationMode,
  delegatedTeamsCredentialAvailable,
} from "@/lib/microsoft/teams-notify";
import {
  listAssignmentIntegrations,
  microsoftIdentityStatus,
  upsertAssignmentIntegration,
} from "@/lib/microsoft/assignment-integrations";

function publicUrl(name: string) {
  const value = String(process.env[name] || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function canvaUrl(resources: string[]) {
  return resources.find((link) => /canva\.com/i.test(link)) || "";
}

export async function syncPublishedAssignment(input: {
  assignmentId: string;
  title: string;
  description: string;
  category: string;
  dueOn: string;
  priority: string;
  freedom: string;
  review: string;
  deliverables: string[];
  resources: string[];
  internUserId: string;
  internName: string;
  managerName: string;
  sitguruUrl: string;
}) {
  const route = routeAssignmentCategory(input.category);
  const config = readMicrosoftGraphConfig();
  const channel = GROWTH_TEAMS_CHANNELS[route.channelKey];
  const existing = await listAssignmentIntegrations([input.assignmentId]);
  const current = (provider: string) => existing.find((row) => row.provider === provider);
  const folderUrlFallback = publicUrl("NEXT_PUBLIC_SITGURU_SHAREPOINT_GROWTH_URL");
  const channelUrlFallback = publicUrl(channel.urlEnv);
  const plannerUrlFallback = publicUrl("NEXT_PUBLIC_SITGURU_PLANNER_GROWTH_URL");
  const canva = canvaUrl(input.resources);

  if (!config.configured) {
    await upsertAssignmentIntegration({
      assignmentId: input.assignmentId,
      provider: "sharepoint",
      externalUrl: folderUrlFallback,
      status: "not_configured",
      metadata: { section: route.sharePointSection, folder: sharePointFolderName(input.title) },
    });
    await upsertAssignmentIntegration({
      assignmentId: input.assignmentId,
      provider: "planner",
      externalUrl: plannerUrlFallback,
      status: "not_configured",
      metadata: { plan: route.plannerPlan },
    });
  const teamsPlan = planTeamsChannel({
    channelId: config.channelIds[route.channelKey] || "",
    channelUrl: channelUrlFallback,
    mode: resolveTeamsNotificationMode({
      requested: process.env.SITGURU_TEAMS_NOTIFICATION_MODE,
      hasDelegatedCredential: delegatedTeamsCredentialAvailable(),
      hasWorkflowWebhook: Boolean(String(process.env.SITGURU_TEAMS_WORKFLOW_WEBHOOK_URL || "").trim()),
    }),
    alreadyPosted: Boolean(current("teams")?.metadata?.notificationStatus === "posted"),
  });
  await upsertAssignmentIntegration({
    assignmentId: input.assignmentId,
    provider: "teams",
    externalId: "",
    externalParentId: config.channelIds[route.channelKey] || "",
    externalUrl: channelUrlFallback,
    status: teamsPlan.recordStatus,
    metadata: {
      channelKey: route.channelKey,
      channelLabel: route.channelLabel,
      channelStatus: teamsPlan.channelStatus,
      notificationMode: teamsPlan.notificationMode,
      notificationStatus: teamsPlan.notificationStatus,
    },
  });
    if (canva || route.canva) {
      await upsertAssignmentIntegration({
        assignmentId: input.assignmentId,
        provider: "canva",
        externalUrl: canva,
        status: canva ? "connected" : "not_configured",
      });
    }
    return;
  }

  const identity = await microsoftIdentityStatus(input.internUserId);
  const internFolder = sharePointFolderName(input.internName);
  const assignmentFolder = sharePointFolderName(input.title);
  let shareUrl = current("sharepoint")?.externalUrl || folderUrlFallback;
  let shareStatus = "pending";
  let shareId = current("sharepoint")?.externalId || "";
  if (config.siteId && config.driveId && config.internsRootId && !shareId) {
    const created = await graphRequest<{ id?: string; webUrl?: string }>({
      method: "POST",
      path: `/sites/${config.siteId}/drives/${config.driveId}/items/${config.internsRootId}/children`,
      body: {
        name: `${internFolder} - ${assignmentFolder}`,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail",
      },
      config,
    });
    if (created.ok) {
      shareId = String(created.data.id || "");
      shareUrl = String(created.data.webUrl || shareUrl);
      shareStatus = "connected";
    } else if (created.code === "needs_access") {
      shareStatus = "needs_access";
    } else {
      shareStatus = created.code === "not_configured" ? "not_configured" : "error";
    }
  } else if (shareId) {
    shareStatus = "connected";
  } else {
    shareStatus = "not_configured";
  }
  await upsertAssignmentIntegration({
    assignmentId: input.assignmentId,
    provider: "sharepoint",
    externalId: shareId,
    externalParentId: config.internsRootId,
    externalUrl: shareUrl,
    status: shareStatus,
    metadata: { internFolder, assignmentFolder },
  });

  let plannerId = current("planner")?.externalId || "";
  let plannerUrl = current("planner")?.externalUrl || plannerUrlFallback;
  let plannerStatus = plannerId ? "connected" : "pending";
  if (!plannerId && config.planId && identity === "connected") {
    const task = await graphRequest<{ id?: string }>({
      method: "POST",
      path: "/planner/tasks",
      body: {
        planId: config.planId,
        bucketId: config.readyBucketId || undefined,
        title: input.title,
        dueDateTime: input.dueOn ? `${input.dueOn}T23:59:59Z` : undefined,
      },
      config,
    });
    if (task.ok && task.data.id) {
      plannerId = task.data.id;
      plannerUrl = `https://planner.cloud.microsoft/webui/plan/${config.planId}/task/${plannerId}`;
      plannerStatus = "connected";
    } else {
      plannerStatus = task.ok ? "error" : task.code === "needs_access" ? "needs_access" : "error";
    }
  } else if (identity !== "connected") {
    plannerStatus = "needs_access";
  } else if (!config.planId) {
    plannerStatus = "not_configured";
  }
  await upsertAssignmentIntegration({
    assignmentId: input.assignmentId,
    provider: "planner",
    externalId: plannerId,
    externalUrl: plannerUrl,
    status: plannerStatus,
    metadata: { bucket: "Ready to Start", priority: input.priority },
  });

  const teamsPlan = planTeamsChannel({
    channelId: config.channelIds[route.channelKey] || "",
    channelUrl: channelUrlFallback,
    mode: resolveTeamsNotificationMode({
      requested: process.env.SITGURU_TEAMS_NOTIFICATION_MODE,
      hasDelegatedCredential: delegatedTeamsCredentialAvailable(),
      hasWorkflowWebhook: Boolean(String(process.env.SITGURU_TEAMS_WORKFLOW_WEBHOOK_URL || "").trim()),
    }),
    alreadyPosted: Boolean(current("teams")?.metadata?.notificationStatus === "posted"),
  });
  await upsertAssignmentIntegration({
    assignmentId: input.assignmentId,
    provider: "teams",
    externalId: teamsPlan.notificationStatus === "posted" ? current("teams")?.externalId || "" : "",
    externalParentId: config.channelIds[route.channelKey] || "",
    externalUrl: channelUrlFallback,
    status: teamsPlan.recordStatus,
    metadata: {
      channelKey: route.channelKey,
      channelLabel: route.channelLabel,
      channelStatus: teamsPlan.channelStatus,
      notificationMode: teamsPlan.notificationMode,
      notificationStatus: teamsPlan.notificationStatus,
    },
  });

  if (canva || route.canva) {
    await upsertAssignmentIntegration({
      assignmentId: input.assignmentId,
      provider: "canva",
      externalUrl: canva,
      status: canva ? "connected" : "not_configured",
    });
  }
}
