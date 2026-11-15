import {
  SITGURU_DOMAIN_EVENTS,
  type SitGuruDomainEvent,
} from "@/lib/realtime/events";
import {
  publishLiveSignals,
  stableEventId,
} from "@/lib/realtime/publish-live-signal";
import { WORKSPACE_REFRESH_PATHS } from "@/lib/realtime/query-keys";
import { listContractorHoursApproverIds, listGrowthOversightRecipientIds } from "@/lib/realtime/recipients";
import { uniqueUserIds } from "@/lib/realtime/pure";
import type { StaffEngagement } from "@/lib/staff-time/types";

const STAFF_TIME_PATHS = [
  "/admin/growth",
  "/admin/growth/my-time",
  "/admin/growth/payments",
  "/admin/hr/people",
  "/admin/hr/people/payments",
  "/admin/financials/contractor-hours",
  "/admin/financials/contractor-payments",
  "/manager/my-time",
  "/manager/payments",
  "/admin/hr",
  WORKSPACE_REFRESH_PATHS.adminPayments,
];

function isContractorFinanceEvent(eventType: string) {
  return [
    SITGURU_DOMAIN_EVENTS.TIME_PERIOD_SUBMITTED,
    SITGURU_DOMAIN_EVENTS.TIME_PERIOD_RETURNED,
    SITGURU_DOMAIN_EVENTS.TIME_PERIOD_APPROVED,
    SITGURU_DOMAIN_EVENTS.PAYMENT_READY,
    SITGURU_DOMAIN_EVENTS.PAYMENT_PAID,
  ].includes(eventType as (typeof SITGURU_DOMAIN_EVENTS)[keyof typeof SITGURU_DOMAIN_EVENTS]);
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
  resourceVersion?: string;
}) {
  const financeEvent = isContractorFinanceEvent(input.eventType);
  const [oversight, approvers] = await Promise.all([
    listGrowthOversightRecipientIds(),
    financeEvent ? listContractorHoursApproverIds() : Promise.resolve([] as string[]),
  ]);
  const recipientIds = uniqueUserIds([
    input.engagement.userId, input.actorUserId, ...oversight, ...approvers,
  ]);
  const notifyRecipientUserIds =
    input.eventType === SITGURU_DOMAIN_EVENTS.TIME_PERIOD_SUBMITTED
      ? approvers
      : financeEvent
        ? [input.engagement.userId]
        : recipientIds;
  return publishLiveSignals({
    eventType: input.eventType,
    eventId: stableEventId([
      input.eventType,
      input.resourceId,
      input.actorUserId,
      input.resourceType,
      input.resourceVersion,
    ]),
    recipientUserIds: recipientIds,
    notifyRecipientUserIds,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    resourceVersion: input.resourceVersion,
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
