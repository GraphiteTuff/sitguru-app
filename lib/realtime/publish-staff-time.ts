import {
  SITGURU_DOMAIN_EVENTS,
  type SitGuruDomainEvent,
} from "@/lib/realtime/events";
import {
  publishLiveSignals,
  stableEventId,
} from "@/lib/realtime/publish-live-signal";
import { WORKSPACE_REFRESH_PATHS } from "@/lib/realtime/query-keys";
import { listGrowthOversightRecipientIds } from "@/lib/realtime/recipients";
import { uniqueUserIds } from "@/lib/realtime/pure";
import type { StaffEngagement } from "@/lib/staff-time/types";

const STAFF_TIME_PATHS = [
  "/admin/growth",
  "/admin/growth/my-time",
  "/admin/growth/payments",
  "/admin/hr/people",
  "/admin/hr/people/payments",
  "/admin/hr",
  WORKSPACE_REFRESH_PATHS.adminPayments,
];

async function staffRecipients(
  engagement: StaffEngagement,
  actorUserId?: string | null,
) {
  const oversight = await listGrowthOversightRecipientIds();
  return uniqueUserIds([engagement.userId, actorUserId, ...oversight]);
}

export async function publishStaffTimeEvent(input: {
  engagement: StaffEngagement;
  eventType: SitGuruDomainEvent | string;
  resourceType: string;
  resourceId: string;
  scope?: "timekeeper" | "payments";
  actorUserId?: string | null;
  actorLabel?: string;
  notify?: boolean;
  notifyTitle?: string;
  notifyBody?: string;
  notifyHref?: string;
}) {
  return publishLiveSignals({
    eventType: input.eventType,
    eventId: stableEventId([
      input.eventType,
      input.resourceId,
      input.actorUserId,
      input.resourceType,
    ]),
    recipientUserIds: await staffRecipients(input.engagement, input.actorUserId),
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    scope: input.scope || "timekeeper",
    paths: STAFF_TIME_PATHS,
    actorUserId: input.actorUserId,
    actorLabel: input.actorLabel || "",
    revalidatePaths: STAFF_TIME_PATHS,
    notify: input.notify,
    notifyTitle: input.notifyTitle,
    notifyBody: input.notifyBody,
    notifyHref: input.notifyHref || "/admin/growth/my-time",
  });
}

export { SITGURU_DOMAIN_EVENTS };
