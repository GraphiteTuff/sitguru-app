import { dispatchNotification } from "@/lib/notifications";
import { getPartnerByIdAdmin } from "@/lib/community/partner-access";
import { getEventAttendeeUserIds } from "@/lib/community/attendance";
import { getPublicEventPath } from "@/lib/community/slug";

type EventNotifyInput = {
  id: string;
  title: string;
  slug: string;
  partner_id: string;
  moderation_note?: string | null;
};

export async function notifyPartnerEventPublished(event: EventNotifyInput) {
  const partner = await getPartnerByIdAdmin(event.partner_id);
  if (!partner?.owner_user_id) return;

  await dispatchNotification({
    userId: partner.owner_user_id,
    title: "Your event is live",
    body: `${event.title} is now published on SitGuru Community.`,
    type: "community_event_published",
    href: getPublicEventPath(event.slug),
    metadata: { eventId: event.id, slug: event.slug },
    channels: ["in_app"],
  });
}

export async function notifyPartnerChangesRequested(event: EventNotifyInput) {
  const partner = await getPartnerByIdAdmin(event.partner_id);
  if (!partner?.owner_user_id) return;

  await dispatchNotification({
    userId: partner.owner_user_id,
    title: "Changes requested for your event",
    body:
      event.moderation_note?.trim() ||
      `Please update ${event.title} and resubmit for review.`,
    type: "community_event_changes_requested",
    href: `/partners/dashboard/community/events/${event.id}/edit`,
    metadata: { eventId: event.id, slug: event.slug },
    channels: ["in_app"],
  });
}

export async function notifyPartnerSomeoneIsGoing(input: {
  event: EventNotifyInput;
  attendeeRole: string;
}) {
  const partner = await getPartnerByIdAdmin(input.event.partner_id);
  if (!partner?.owner_user_id) return;

  const roleLabel =
    input.attendeeRole === "guru"
      ? "A Guru"
      : input.attendeeRole === "ambassador"
        ? "An Ambassador"
        : "A Pet Parent";

  await dispatchNotification({
    userId: partner.owner_user_id,
    title: "Someone is going to your event",
    body: `${roleLabel} marked I'm Going for ${input.event.title}.`,
    type: "community_event_rsvp",
    href: `/partners/dashboard/community/events/${input.event.id}/promote`,
    metadata: {
      eventId: input.event.id,
      slug: input.event.slug,
      role: input.attendeeRole,
    },
    channels: ["in_app"],
  });
}

export async function notifyAttendeesEventCancelled(event: EventNotifyInput) {
  const userIds = await getEventAttendeeUserIds(event.id);

  await Promise.all(
    userIds.map((userId) =>
      dispatchNotification({
        userId,
        title: "Event cancelled",
        body: `${event.title} has been cancelled.`,
        type: "community_event_cancelled",
        href: "/community",
        metadata: { eventId: event.id, slug: event.slug },
        channels: ["in_app"],
      }),
    ),
  );
}
