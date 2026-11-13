import { GROWTH_TEAMS_CHANNELS, routeAssignmentCategory } from "@/lib/admin/growth/work-routing";
import { graphRequest, readMicrosoftGraphConfig } from "@/lib/microsoft/graph";
import { ensureInternAssignmentSharePointFolder, expectedInternAssignmentFolder } from "@/lib/microsoft/assignment-sharepoint";
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
  const folderUrlFallback = expectedInternAssignmentFolder(input.internName, input.title).url;
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
  // The canonical SharePoint location is Intern Projects / <intern> / <assignment>.
  // Reuse existing folders (including Lola's verified folder); never make a flat
  // "Lola - Assignment" folder in a different library.
  const linkedFolder = await ensureInternAssignmentSharePointFolder({
    assignmentId: input.assignmentId,
    internName: input.internName,
    title: input.title,
  });
  if (linkedFolder.status !== "connected") {
    await upsertAssignmentIntegration({
      assignmentId: input.assignmentId,
      provider: "sharepoint",
      externalUrl: linkedFolder.url,
      status: linkedFolder.status,
      lastError: linkedFolder.message,
      metadata: {
        internFolder: linkedFolder.internFolder,
        assignmentFolder: linkedFolder.assignmentFolder,
        statusMessage: linkedFolder.message,
      },
    });
  }

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
