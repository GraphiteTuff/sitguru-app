import EventConversationPanel from "@/components/community/EventConversationPanel";
import { fetchEventConversationPreview } from "@/lib/messaging/event-conversation-queries";
import { requirePartnerAccount } from "@/lib/community/partner-access";

export default async function PartnerEventMessagePanel({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const access = await requirePartnerAccount();
  const preview = access.userId
    ? await fetchEventConversationPreview(eventId, access.userId)
    : null;

  return (
    <EventConversationPanel
      eventId={eventId}
      eventTitle={eventTitle}
      mode="partner"
      preview={preview}
    />
  );
}
