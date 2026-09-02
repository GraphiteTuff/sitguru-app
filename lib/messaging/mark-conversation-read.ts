import { supabaseAdmin } from "@/lib/supabase/admin";

export async function markConversationReadForUser(
  conversationId: string,
  userId: string,
) {
  const now = new Date().toISOString();

  const { error: participantError } = await supabaseAdmin
    .from("conversation_participants")
    .update({
      last_read_at: now,
      updated_at: now,
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (participantError) {
    throw new Error(participantError.message || "Unable to mark conversation as read.");
  }

  const { error: messageError } = await supabaseAdmin
    .from("messages")
    .update({
      is_read: true,
      read_at: now,
    })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);

  if (messageError) {
    console.warn("SitGuru marked the thread read, but message rows did not update", messageError);
  }

  return { lastReadAt: now };
}
