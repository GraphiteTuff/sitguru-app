/**
 * Minimal, fail-closed Microsoft Planner automation for SitGuru assignments.
 *
 * Microsoft Tasks.ReadWrite.All is application-wide; API calls here are bounded
 * to ONE explicitly configured internship plan and its Ready bucket.
 * Interns do not need a Microsoft account: Manager assignments are handled
 * separately from SitGuru intern submission and SharePoint storage.
 */

export type PlannerTaskInput = {
  title: string;
  dueOn: string;
  planId: string;
  bucketId: string;
  managerEntraId?: string;
};

const ODATA_PLANNER_ASSIGNMENT = "#microsoft.graph.plannerAssignment";

export function isPlannerObjectId(value: string) {
  return /^[a-z0-9_-]{8,150}$/i.test(value);
}

export function safePlannerAssignee(value: string) {
  const raw = String(value || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)
    ? raw : "";
}

export function plannerConfigurationReady(input: {
  graphConfigured: boolean;
  planId: string;
  bucketId: string;
  enabled: boolean;
}) {
  return Boolean(input.graphConfigured && input.enabled &&
    isPlannerObjectId(input.planId) && isPlannerObjectId(input.bucketId));
}

export function plannerCreateBody(input: PlannerTaskInput) {
  if (!isPlannerObjectId(input.planId) || !isPlannerObjectId(input.bucketId)) {
    throw new Error("Planner plan and bucket must be configured before creating a task.");
  }
  const due = /^\d{4}-\d{2}-\d{2}$/.test(input.dueOn) ? input.dueOn : "";
  if (due && Number.isNaN(Date.parse(`${due}T23:59:59Z`))) {
    throw new Error("Invalid Planner task due date.");
  }
  return {
    planId: input.planId,
    bucketId: input.bucketId,
    title: String(input.title || "").trim().slice(0, 255),
    ...(due ? { dueDateTime: `${due}T23:59:59Z` } : {}),
  };
}

export function plannerManagerAssignment(managerEntraId: string) {
  const id = safePlannerAssignee(managerEntraId);
  return id ? {
    assignments: {
      [id]: {
        "@odata.type": ODATA_PLANNER_ASSIGNMENT,
        orderHint: " !",
      },
    },
  } : null;
}

export function plannerAssignmentDescription(input: {
  assignmentId: string;
  internName: string;
  description: string;
  deliverables: string[];
  sharePointUrl?: string;
}) {
  const detail = [
    `SitGuru assignment for ${input.internName}`,
    String(input.description || "").trim(),
    ...input.deliverables.map((text, i) => `${i + 1}. ${text}`),
    `Manage in SitGuru: https://www.sitguru.com/manager/assignments/${encodeURIComponent(input.assignmentId)}`,
    input.sharePointUrl ? `SharePoint: ${input.sharePointUrl}` : "",
  ].filter(Boolean).join("\n\n");
  return detail.slice(0, 32000);
}
