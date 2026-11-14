import { GROWTH_TEAMS_CHANNELS, routeAssignmentCategory, sharePointFolderName } from "@/lib/admin/growth/work-routing";
import { graphRequest, readMicrosoftGraphConfig } from "@/lib/microsoft/graph";
import { plannerConfigurationReady, plannerCreateBody, plannerManagerAssignment, plannerAssignmentDescription, safePlannerAssignee } from "@/lib/microsoft/planner-automation";
import { ensureInternAssignmentSharePointFolder, expectedInternAssignmentFolder } from "@/lib/microsoft/assignment-sharepoint";
import {
  planTeamsChannel,
  resolveTeamsNotificationMode,
  delegatedTeamsCredentialAvailable,
} from "@/lib/microsoft/teams-notify";
import {
  listAssignmentIntegrations,
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
  managerUserId?: string;
  sitguruUrl: string;
}) {
  const route = routeAssignmentCategory(input.category);
  const config = readMicrosoftGraphConfig();
  const channel = GROWTH_TEAMS_CHANNELS[route.channelKey];
  const existing = await listAssignmentIntegrations([input.assignmentId]);
  const current = (provider: string) => existing.find((row) => row.provider === provider);
  const folderUrlFallback = expectedInternAssignmentFolder(input.internName, input.title).url;
  const channelUrlFallback = publicUrl(channel.urlEnv) ||
    (route.channelKey === "analytics-results"
      ? "https://teams.cloud.microsoft/l/channel/19%3A6a3c6f8904244ca8b62e4f3a8bbbe042%40thread.tacv2/Analytics%20and%20Results?groupId=e338678f-1008-4dd8-8705-0669b1e76ef8&tenantId=6942aff2-2055-4354-a6de-38bfc2d65548&allowXTenantAccess=False"
      : "");
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

  // Interns do not need a Microsoft 365 account to work inside SitGuru.
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

  // Fail closed until Graph application consent, a specific plan/bucket and
  // an explicit automation switch have been configured in Production.
  const plannerReady = plannerConfigurationReady({
    graphConfigured: config.configured,
    enabled: config.plannerAutomationEnabled,
    planId: config.planId,
    bucketId: config.readyBucketId,
  });
  const existingPlanner = current("planner");
  const manuallyLinked = existingPlanner?.status === "linked_manually";
  let plannerId = existingPlanner?.externalId || "";
  let plannerUrl = existingPlanner?.externalUrl || plannerUrlFallback;
  let plannerStatus = manuallyLinked
    ? "linked_manually"
    : existingPlanner?.status === "connected" && plannerId
      ? "connected" : "not_configured";
  let plannerError = "";
  let managerAssigned = Boolean(existingPlanner?.metadata?.managerAssigned);
  let detailAdded = Boolean(existingPlanner?.metadata?.detailsSaved);

  if (manuallyLinked || plannerStatus === "connected") {
    // Never generate a second Planner task if this assignment has one already.
  } else if (!plannerReady) {
    plannerStatus = "not_configured";
  } else if (plannerId) {
    // A partially recorded external task needs investigation, not a duplicate POST.
    plannerStatus = "error";
    plannerError = "This assignment already references a Planner task, but synchronization could not be confirmed.";
  } else {
    // Resolve a verified Microsoft 365 manager BEFORE creating the task.
    // The intern may use a SitGuru-only email and must not be given an
    // invented Microsoft assignee identity.
    let managerEntraId = safePlannerAssignee(config.defaultPlannerManagerEntraId);
    if (input.managerUserId) {
      const { data: linked } = await (await import("@/lib/supabase/admin")).supabaseAdmin
        .from("microsoft_user_links")
        .select("status,entra_object_id")
        .eq("user_id", input.managerUserId)
        .maybeSingle();
      const linkedId = safePlannerAssignee(String(linked?.entra_object_id || ""));
      if (linkedId && linked?.status === "connected") managerEntraId = linkedId;
    }
    if (!managerEntraId) {
      plannerStatus = "needs_access";
      plannerError = "Link a Microsoft 365 manager before creating Planner tasks.";
    } else {
    const task = await graphRequest<{ id?: string; "@odata.etag"?: string }>({
      method: "POST",
      path: "/planner/tasks",
      body: {
        ...plannerCreateBody({
          title: input.title,
          dueOn: input.dueOn,
          planId: config.planId,
          bucketId: config.readyBucketId,
        }),
        ...plannerManagerAssignment(managerEntraId),
      },
      config,
    });
    if (!task.ok) {
      plannerStatus = task.code === "needs_access" ? "needs_access" :
        task.code === "not_configured" ? "not_configured" : "error";
      plannerError = task.message;
    } else if (!task.data.id) {
      plannerStatus = "error";
      plannerError = "Planner did not return a task ID.";
    } else {
      plannerId = task.data.id;
      plannerUrl = `https://planner.cloud.microsoft/webui/plan/${encodeURIComponent(config.planId)}/task/${encodeURIComponent(plannerId)}`;
      plannerStatus = "connected";
      managerAssigned = true;
      // Record the remote ID BEFORE additional Graph calls. If assignment
      // or description updates fail, a retry can safely reuse this task.
      await upsertAssignmentIntegration({
        assignmentId: input.assignmentId,
        provider: "planner",
        externalId: plannerId,
        externalParentId: config.planId,
        externalUrl: plannerUrl,
        status: "connected",
        metadata: { planId: config.planId, bucketId: config.readyBucketId, createdWith: "microsoft_graph_application" },
      });

      // Include the work instructions in Planner for Ava; the intern's
      // editable work remains exclusively in their SharePoint folder.
      const detail = await graphRequest<{ "@odata.etag"?: string }>({
        method: "GET",
        path: `/planner/tasks/${encodeURIComponent(plannerId)}/details`,
        config,
      });
      if (detail.ok) {
        const detailEtag = detail.etag || detail.data["@odata.etag"] || "";
        if (detailEtag) {
          const savedDetails = await graphRequest({
            method: "PATCH",
            path: `/planner/tasks/${encodeURIComponent(plannerId)}/details`,
            etag: detailEtag,
            body: {
              description: plannerAssignmentDescription({
                assignmentId: input.assignmentId,
                internName: input.internName,
                description: input.description,
                deliverables: input.deliverables,
                sharePointUrl: linkedFolder.url,
              }),
            },
            config,
          });
          detailAdded = savedDetails.ok;
        }
      }
    }
    } // Manager must have verified Microsoft 365 identity.
  }
  await upsertAssignmentIntegration({
    assignmentId: input.assignmentId,
    provider: "planner",
    externalId: plannerId,
    externalParentId: config.planId,
    externalUrl: plannerUrl,
    status: plannerStatus,
    lastError: plannerError,
    metadata: {
      ...(manuallyLinked ? existingPlanner?.metadata || {} : {}),
      planId: config.planId,
      bucketId: config.readyBucketId,
      bucket: "Ready to Start",
      priority: input.priority,
      managerAssigned,
      detailsSaved: detailAdded,
      automationEnabled: config.plannerAutomationEnabled,
      createdWith: plannerId && !manuallyLinked ? "microsoft_graph_application" : "manual",
    },
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
