import { supabaseAdmin } from "@/lib/supabase/admin";
import { visibleMessage, type StaffActor } from "@/lib/messaging/staff-policy";

function text(value: unknown) {
  return String(value || "").trim();
}

export async function loadStaffInbox(userId: string, founder: boolean) {
  const actor: StaffActor = founder ? "founder" : "growth";
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("id,subject,conversation_type,workflow_status,last_message_preview,assigned_user_id")
    .neq("conversation_type", "marketplace")
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error) return { conversations: [] as InboxConversation[] };
  const conversations = (data || []) as Record<string, unknown>[];
  const ids = conversations.map((row) => text(row.id)).filter(Boolean);
  const { data: messages } = ids.length
    ? await supabaseAdmin
        .from("messages")
        .select("id,conversation_id,body,content,visibility,sender_name_snapshot,deleted_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true })
        .limit(200)
    : { data: [] };
  return {
    conversations: conversations.map((row) => {
      const id = text(row.id);
      const type = text(row.conversation_type) || "internal_direct";
      return {
        id,
        subject: text(row.subject) || "Conversation",
        typeLabel: type.replaceAll("_", " "),
        statusLabel: text(row.workflow_status) || "open",
        preview: text(row.last_message_preview),
        messages: ((messages || []) as Record<string, unknown>[])
          .filter((message) => text(message.conversation_id) === id)
          .filter((message) =>
            visibleMessage({
              visibility: text(message.visibility) === "internal_note" ? "internal_note" : "participant",
              actor,
            }),
          )
          .map((message) => ({
            id: text(message.id),
            internal: text(message.visibility) === "internal_note",
            author: text(message.sender_name_snapshot) || "SitGuru",
            body: message.deleted_at ? "Message removed" : text(message.body || message.content),
          })),
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
  typeLabel: string;
  statusLabel: string;
  preview: string;
  messages: { id: string; internal: boolean; author: string; body: string }[];
};
