import EventConversationPanel from "@/components/community/EventConversationPanel";
import { fetchEventConversationPreview } from "@/lib/messaging/event-conversation-queries";
import { getAdminIdentity } from "@/lib/admin/access";

export default async function AdminEventMessagePanel({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const admin = await getAdminIdentity();
  const preview = await fetchEventConversationPreview(eventId, admin?.id);

  return (
    <EventConversationPanel
      eventId={eventId}
      eventTitle={eventTitle}
      mode="admin"
      preview={preview}
    />
  );
}
