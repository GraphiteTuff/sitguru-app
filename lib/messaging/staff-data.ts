import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";
import { messageNeedsAttention } from "@/lib/messaging/mark-conversation-read";

function text(value: unknown) {
  return String(value || "").trim();
}

function firstFrom(value: string) {
  return value.split(/\s+/).filter(Boolean)[0] || "";
}

export async function loadStaffInbox(userId: string, founder: boolean, audience: StaffActor = founder ? "founder" : "growth") {
  const actor: StaffActor = audience;
  const { data: memberships } = await supabaseAdmin
    .from("conversation_participants")
    .select("conversation_id,user_id")
    .eq("user_id", userId)
    .limit(80);
  const memberIds = ((memberships || []) as Record<string, unknown>[]).map((row) => text(row.conversation_id)).filter(Boolean);
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("id,subject,conversation_type,workflow_status,last_message_preview,assigned_user_id,started_by_user_id,updated_at")
    .neq("conversation_type", "marketplace")
    .order("updated_at", { ascending: false })
    .limit(80);
  if (error) return { conversations: [] as InboxConversation[], me: { firstName: "You", avatarUrl: "" } };
  const rows = ((data || []) as Record<string, unknown>[]).filter((row) => {
    const id = text(row.id);
    if (founder && actor !== "intern") return true;
    const involved = text(row.started_by_user_id) === userId || text(row.assigned_user_id) === userId || memberIds.includes(id);
    if (!involved) return false;
    return canAccessConversation({
      actor,
      actorId: userId,
      type: (text(row.conversation_type) || "internal_direct") as "internal_direct",
      participantIds: memberIds.includes(id) || text(row.started_by_user_id) === userId ? [userId] : [],
      assignedUserId: text(row.assigned_user_id),
    });
  }).slice(0, 40);
  const ids = rows.map((row) => text(row.id)).filter(Boolean);
  const { data: participants } = ids.length
    ? await supabaseAdmin.from("conversation_participants").select("conversation_id,user_id").in("conversation_id", ids)
    : { data: [] };
  const { data: messages } = ids.length
    ? await supabaseAdmin
        .from("messages")
        .select("id,conversation_id,sender_id,body,content,visibility,sender_name_snapshot,deleted_at,media_urls,media_mime_types,created_at,is_read,read_at,status")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true })
        .limit(200)
    : { data: [] };
  const senderIds = [
    ...new Set(
      ((messages || []) as Record<string, unknown>[])
        .map((row) => text(row.sender_id))
        .concat(((participants || []) as Record<string, unknown>[]).map((row) => text(row.user_id)))
        .concat(userId)
        .filter(Boolean),
    ),
  ];
  const { data: profiles } = senderIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("id,first_name,full_name,avatar_url,profile_photo_url,photo_url,image_url")
        .in("id", senderIds)
    : { data: [] };
  const people = new Map(
    ((profiles || []) as Record<string, unknown>[]).map((row) => [
      text(row.id),
      {
        firstName: text(row.first_name) || firstFrom(text(row.full_name)) || "SitGuru",
        avatarUrl: resolvePetParentAvatarUrl(row),
      },
    ]),
  );
  const peers = new Map<string, string[]>();
  for (const row of (participants || []) as Record<string, unknown>[]) {
    const conversationId = text(row.conversation_id);
    const personId = text(row.user_id);
    if (!conversationId || !personId || personId === userId) continue;
    peers.set(conversationId, [...(peers.get(conversationId) || []), personId]);
  }
  const me = people.get(userId) || { firstName: "You", avatarUrl: "" };
  return {
    me,
    conversations: rows.map((row) => {
      const id = text(row.id);
      const type = text(row.conversation_type) || "internal_direct";
      const peer = people.get(peers.get(id)?.[0] || "");
      const subjectName = peer?.firstName || firstFrom(text(row.subject)) || "Conversation";
      return {
        id,
        subject: subjectName,
        peerName: subjectName,
        peerAvatar: peer?.avatarUrl || "",
        fullSubject: text(row.subject) || "Conversation",
        typeLabel: type.replaceAll("_", " "),
        statusLabel: text(row.workflow_status) || "open",
        preview: text(row.last_message_preview),
        updatedAt: text(row.updated_at),
        unreadCount: ((messages || []) as Record<string, unknown>[])
          .filter((message) => text(message.conversation_id) === id)
          .filter((message) => messageNeedsAttention({
            id: text(message.id),
            sender_id: text(message.sender_id),
            is_read: message.is_read === true,
            read_at: text(message.read_at) || null,
            status: text(message.status),
            is_deleted: Boolean(message.deleted_at),
          }, userId))
          .length,
        messages: ((messages || []) as Record<string, unknown>[])
          .filter((message) => text(message.conversation_id) === id)
          .filter((message) =>
            visibleMessage({
              visibility: text(message.visibility) === "internal_note" ? "internal_note" : "participant",
              actor,
            }),
          )
          .map((message) => {
            const person = people.get(text(message.sender_id));
            const urls = Array.isArray(message.media_urls) ? message.media_urls : [];
            const types = Array.isArray(message.media_mime_types) ? message.media_mime_types : [];
            return {
              id: text(message.id),
              internal: text(message.visibility) === "internal_note",
              author: person?.firstName || firstFrom(text(message.sender_name_snapshot)) || "SitGuru",
              avatarUrl: person?.avatarUrl || "",
              body: message.deleted_at ? "Message removed" : text(message.body || message.content),
              createdAt: text(message.created_at),
              attachments: urls.map((url, index) => ({
                url: String(url),
                mimeType: String(types[index] || ""),
                name: "Attachment",
              })),
            };
          }),
      };
    }),
  };
}

export async function loadModerationQueue() {
  const { data, error } = await supabaseAdmin
    .from("message_reports")
    .select("id,reason,status,route_to,created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) return [];
  return ((data || []) as Record<string, unknown>[]).map((row) => ({
    id: text(row.id),
    reason: text(row.reason),
    status: text(row.status),
    route: text(row.route_to),
    at: text(row.created_at),
  }));
}

type InboxConversation = {
  id: string;
  subject: string;
  peerName: string;
  peerAvatar: string;
  fullSubject: string;
  typeLabel: string;
  statusLabel: string;
  preview: string;
  updatedAt?: string;
  unreadCount?: number;
  messages: {
    id: string;
    internal: boolean;
    author: string;
    avatarUrl: string;
    body: string;
    createdAt?: string;
    attachments: { url: string; mimeType: string; name: string }[];
  }[];
};
