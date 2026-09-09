import { supabaseAdmin } from "@/lib/supabase/admin";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

type MessageReadRow = {
  id?: string | null;
  sender_id?: string | null;
  is_read?: boolean | null;
  read_at?: string | null;
  status?: string | null;
  is_deleted?: boolean | null;
};

function isUnreadIncomingMessage(row: MessageReadRow, readerId: string) {
  if (row.is_deleted) return false;
  if (asString(row.sender_id) === readerId) return false;

  const status = asString(row.status).toLowerCase();
  if (status === "archived") return false;
  if (row.is_read === true && row.read_at) return false;
  if (status === "read" && row.is_read !== false) return false;

  return row.is_read === false || !row.read_at || status === "unread" || status === "new";
}

export async function markConversationReadForUser(
  conversationId: string,
  userId: string,
) {
  const id = asString(conversationId);
  const readerId = asString(userId);
  const now = new Date().toISOString();

  if (!id || !readerId) {
    return { lastReadAt: now, marked: 0 };
  }

  const { error: participantError } = await supabaseAdmin
    .from("conversation_participants")
    .update({
      last_read_at: now,
      updated_at: now,
    })
    .eq("conversation_id", id)
    .eq("user_id", readerId);

  if (participantError) {
    console.warn(
      "SitGuru could not update conversation last_read_at",
      participantError,
    );
  }

  const { data: rows, error: fetchError } = await supabaseAdmin
    .from("messages")
    .select("id, sender_id, is_read, read_at, status, is_deleted")
    .eq("conversation_id", id);

  let ids: string[] = [];

  if (fetchError) {
    const { error: messageError } = await supabaseAdmin
      .from("messages")
      .update({
        is_read: true,
        read_at: now,
        status: "read",
      })
      .eq("conversation_id", id)
      .or(`sender_id.is.null,sender_id.neq.${readerId}`);

    if (messageError) {
      console.warn(
        "SitGuru marked the thread read, but message rows did not update",
        messageError,
      );
    }
  } else {
    ids = ((rows || []) as MessageReadRow[])
      .filter((row) => isUnreadIncomingMessage(row, readerId))
      .map((row) => asString(row.id))
      .filter(Boolean);

    if (ids.length > 0) {
      const { error: messageError } = await supabaseAdmin
        .from("messages")
        .update({
          is_read: true,
          read_at: now,
          status: "read",
        })
        .in("id", ids);

      if (messageError) {
        const { error: fallbackError } = await supabaseAdmin
          .from("messages")
          .update({
            is_read: true,
            read_at: now,
          })
          .in("id", ids);

        if (fallbackError) {
          console.warn(
            "SitGuru marked the thread read, but message rows did not update",
            fallbackError,
          );
        }
      }
    }
  }

  const { error: conversationError } = await supabaseAdmin
    .from("conversations")
    .update({
      status: "open",
      updated_at: now,
    })
    .eq("id", id)
    .in("status", ["unread", "new", "Unread"]);

  if (conversationError) {
    console.warn(
      "SitGuru could not clear unread conversation status",
      conversationError,
    );
  }

  return { lastReadAt: now, marked: ids.length };
}
