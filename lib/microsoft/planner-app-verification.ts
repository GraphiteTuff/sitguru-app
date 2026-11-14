/**
 * Explicit, admin-triggered app-only Planner integration test.
 * This is not a background job. It creates one clearly marked temporary task
 * in SitGuru's configured bucket and deletes it with its returned ETag.
 * The production automation feature flag is NOT required and is not changed.
 */
import { graphRequest, readMicrosoftGraphConfig } from "@/lib/microsoft/graph";
import { isPlannerObjectId } from "@/lib/microsoft/planner-automation";

export type PlannerAppVerification = {
  passed: boolean;
  stage: "configuration" | "create" | "delete" | "complete";
  message: string;
  taskId?: string;
};

export async function verifyPlannerApplicationConnection(): Promise<PlannerAppVerification> {
  const config = readMicrosoftGraphConfig();
  if (!config.configured || !isPlannerObjectId(config.planId) || !isPlannerObjectId(config.readyBucketId)) {
    return {
      passed: false,
      stage: "configuration",
      message: "The Microsoft Graph application or internship plan and bucket are not configured.",
    };
  }
  const created = await graphRequest<{ id?: string; "@odata.etag"?: string }>({
    method: "POST",
    path: "/planner/tasks",
    config,
    body: {
      planId: config.planId,
      bucketId: config.readyBucketId,
      title: "SitGuru connection check - temporary task (safe to delete)",
    },
  });
  if (!created.ok) return {
    passed: false,
    stage: "create",
    message: created.code === "needs_access"
      ? "App-only task creation was denied. Check Microsoft Graph Tasks.ReadWrite.All application consent."
      : "App-only Planner task creation failed. The automatic integration remains disabled.",
  };

  const taskId = String(created.data.id || "");
  if (!isPlannerObjectId(taskId)) return {
    passed: false,
    stage: "create",
    message: "Planner created a task but did not return a valid task ID. Review the target bucket before retrying.",
  };

  const etag = created.etag || String(created.data["@odata.etag"] || "");
  if (!etag) return {
    passed: false,
    stage: "delete",
    taskId,
    message: "Created a Planner test task, but cleanup needs its missing ETag. Delete it manually from the Ready to Start bucket.",
  };

  const deleted = await graphRequest<unknown>({
    method: "DELETE",
    path: `/planner/tasks/${encodeURIComponent(taskId)}`,
    etag,
    config,
  });
  if (!deleted.ok) return {
    passed: false,
    stage: "delete",
    taskId,
    message: "App-only creation succeeded but automatic cleanup failed. Delete the temporary task manually before retrying.",
  };

  return {
    passed: true,
    stage: "complete",
    message: "App-only Planner task created successfully and removed. Ready for controlled activation.",
  };
}
