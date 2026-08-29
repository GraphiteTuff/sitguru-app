import { supabaseAdmin } from "@/lib/supabase/admin";

export type EventConversationPreview = {
  conversationId: string;
  subject: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
    senderName: string;
    senderRole: string;
    senderAvatar: string;
    isAdmin: boolean;
  }>;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function profileAvatar(profile: Record<string, unknown> | null | undefined) {
  if (!profile) return "";
  return (
    safeString(profile.avatar_url) ||
    safeString(profile.profile_photo_url) ||
    safeString(profile.profile_picture_url) ||
    safeString(profile.profile_image_url) ||
    safeString(profile.photo_url) ||
    safeString(profile.picture) ||
    safeString(profile.headshot_url) ||
    safeString(profile.image_url)
  );
}

function profileName(profile: Record<string, unknown> | null | undefined) {
  if (!profile) return "";
  return (
    safeString(profile.full_name) ||
    safeString(profile.display_name) ||
    safeString(profile.name) ||
    [safeString(profile.first_name), safeString(profile.last_name)].filter(Boolean).join(" ")
  );
}

export async function fetchEventConversationId(eventId: string) {
  const { data } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("community_event_id", eventId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return safeString(data?.id) || null;
}

export async function fetchEventConversationPreview(
  eventId: string,
  viewerUserId?: string,
): Promise<EventConversationPreview | null> {
  const conversationId = await fetchEventConversationId(eventId);
  if (!conversationId) return null;

  const [{ data: conversation }, { data: messages }] = await Promise.all([
    supabaseAdmin
      .from("conversations")
      .select("id, subject, last_message_preview, last_message_at")
      .eq("id", conversationId)
      .maybeSingle(),
    supabaseAdmin
      .from("messages")
      .select(
        "id, content, body, created_at, sender_id, sender_role, sender_role_snapshot, sender_name_snapshot, is_read",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (!conversation) return null;

  const rows = (messages || []) as Array<Record<string, unknown>>;
  const senderIds = Array.from(
    new Set(rows.map((row) => safeString(row.sender_id)).filter(Boolean)),
  );

  const { data: profiles } = senderIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select(
          "id, full_name, display_name, name, first_name, last_name, avatar_url, profile_photo_url, profile_picture_url, profile_image_url, photo_url, picture, headshot_url, image_url, role",
        )
        .in("id", senderIds)
    : { data: [] };

  const profileMap = new Map(
    ((profiles || []) as Array<Record<string, unknown>>).map((profile) => [
      safeString(profile.id),
      profile,
    ]),
  );

  const defaultAdminAvatar = "/images/sitguru-message-avatar.jpg";

  const formattedMessages = rows.reverse().map((row) => {
    const senderId = safeString(row.sender_id);
    const profile = profileMap.get(senderId);
    const senderRole = safeString(row.sender_role_snapshot || row.sender_role).toLowerCase();
    const isAdmin = senderRole.includes("admin");

    return {
      id: safeString(row.id),
      body: safeString(row.body) || safeString(row.content),
      createdAt: safeString(row.created_at),
      senderName: profileName(profile) || safeString(row.sender_name_snapshot) || "SitGuru",
      senderRole,
      senderAvatar: isAdmin
        ? defaultAdminAvatar
        : profileAvatar(profile) || defaultAdminAvatar,
      isAdmin,
    };
  });

  const unreadCount = rows.filter((row) => {
    const senderId = safeString(row.sender_id);
    if (viewerUserId && senderId === viewerUserId) return false;
    return row.is_read === false;
  }).length;

  return {
    conversationId,
    subject: safeString(conversation.subject) || "Pet Event",
    lastMessagePreview: safeString(conversation.last_message_preview) || null,
    lastMessageAt: safeString(conversation.last_message_at) || null,
    unreadCount,
    messages: formattedMessages,
  };
}

export async function countUnreadEventThreadsForAdmin() {
  const { data } = await supabaseAdmin
    .from("conversations")
    .select("id, last_message_preview")
    .eq("topic", "community_event")
    .not("community_event_id", "is", null)
    .neq("status", "archived")
    .limit(200);

  if (!data?.length) return 0;

  const ids = data.map((row) => safeString((row as { id?: string }).id)).filter(Boolean);
  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("conversation_id, is_read, sender_role, sender_role_snapshot")
    .in("conversation_id", ids)
    .eq("is_read", false)
    .limit(1000);

  return (messages || []).filter((row) => {
    const role = safeString(
      (row as { sender_role_snapshot?: string; sender_role?: string }).sender_role_snapshot ||
        (row as { sender_role?: string }).sender_role,
    ).toLowerCase();
    return !role.includes("admin");
  }).length;
}
