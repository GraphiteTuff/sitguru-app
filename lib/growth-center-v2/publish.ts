import { revalidatePath } from "next/cache";
import { publishLiveSignals } from "@/lib/realtime/publish-live-signal";
import { pathsForGrowthWorkspace } from "@/lib/realtime/query-keys";

const GROWTH_INSIGHT_PATHS = [
  "/manager/insights",
  "/manager/metrics",
  "/manager/results",
  "/intern/insights",
  "/intern/metrics",
  "/admin/growth/insights",
  "/admin/growth/analytics",
];

/** Revalidate Growth Center routes and optionally notify staff sessions. */
export async function publishGrowthCenterUpdate(input: {
  actorUserId?: string | null;
  recipientUserIds?: Array<string | null | undefined>;
  eventType?: string;
  entityId?: string | null;
}) {
  const paths = [...pathsForGrowthWorkspace(), ...GROWTH_INSIGHT_PATHS];
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // ignore outside request scope
    }
  }

  const recipients = (input.recipientUserIds || []).filter(Boolean);
  if (!recipients.length && input.actorUserId) {
    recipients.push(input.actorUserId);
  }
  if (!recipients.length) return;

  try {
    await publishLiveSignals({
      eventType: input.eventType || "growth_center_refresh",
      recipientUserIds: recipients,
      scope: "growth",
      paths,
      actorUserId: input.actorUserId || null,
      resourceType: "growth_center",
      resourceId: input.entityId || "v2",
      revalidatePaths: paths,
    });
  } catch (error) {
    console.warn("Growth Center live signal skipped:", error);
  }
}
