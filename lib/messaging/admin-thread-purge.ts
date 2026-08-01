/**
 * Hard-delete helpers for the Admin Message Center.
 * Removes conversation rows and related messaging artifacts permanently.
 * Falls back to soft-delete when hard delete is blocked by constraints.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function deleteRelatedNotifications(conversationIds: string[]) {
  if (!conversationIds.length) return;

  for (const conversationId of conversationIds) {
    await supabaseAdmin
      .from("notifications")
      .delete()
      .ilike("href", `%${conversationId}%`);

    await supabaseAdmin
      .from("notifications")
      .delete()
      .ilike("link", `%${conversationId}%`);
  }
}

async function deleteOptionalMessagingLinks(conversationIds: string[]) {
  if (!conversationIds.length) return;

  const { error } = await supabaseAdmin
    .from("messaging_sms_links")
    .delete()
    .in("conversation_id", conversationIds);

  if (error && !/does not exist|Could not find/i.test(error.message || "")) {
    console.warn("messaging_sms_links cleanup:", error.message);
  }
}

async function softDeleteConversation(conversationId: string) {
  const now = new Date().toISOString();

  const { error: conversationError } = await supabaseAdmin
    .from("conversations")
    .update({
      status: "deleted",
      updated_at: now,
    })
    .eq("id", conversationId);

  const { error: messagesError } = await supabaseAdmin
    .from("messages")
    .update({
      is_deleted: true,
      status: "deleted",
      updated_at: now,
    })
    .eq("conversation_id", conversationId);

  if (conversationError) {
    return {
      ok: false as const,
      error: conversationError.message,
      mode: "soft" as const,
    };
  }

  if (messagesError) {
    console.warn("soft delete messages warning:", messagesError.message);
  }

  return { ok: true as const, mode: "soft" as const };
}

async function softDeleteOrphanMessage(messageId: string) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("messages")
    .update({
      is_deleted: true,
      status: "deleted",
      updated_at: now,
    })
    .eq("id", messageId);

  if (error) {
    return { ok: false as const, error: error.message, mode: "soft" as const };
  }

  return { ok: true as const, mode: "soft" as const };
}

/**
 * Permanently delete a queue thread.
 * Accepts a real conversation UUID or synthetic `direct-message-{messageId}` keys.
 */
export async function hardDeleteConversation(conversationId: string) {
  const id = asString(conversationId);
  if (!id) {
    return { ok: false as const, error: "missing_conversation" };
  }

  const orphanMatch = id.match(/^direct-message-(.+)$/i);
  if (orphanMatch?.[1]) {
    const messageId = orphanMatch[1];
    const { error } = await supabaseAdmin.from("messages").delete().eq("id", messageId);

    if (error) {
      return softDeleteOrphanMessage(messageId);
    }

    const { data: still } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("id", messageId)
      .maybeSingle();

    if (still?.id) {
      return softDeleteOrphanMessage(messageId);
    }

    return { ok: true as const, mode: "hard" as const };
  }

  await deleteRelatedNotifications([id]);
  await deleteOptionalMessagingLinks([id]);

  const { error: messagesError } = await supabaseAdmin
    .from("messages")
    .delete()
    .eq("conversation_id", id);

  if (messagesError) {
    console.warn("messages hard delete failed, trying soft delete:", messagesError.message);
    return softDeleteConversation(id);
  }

  const { error: participantsError } = await supabaseAdmin
    .from("conversation_participants")
    .delete()
    .eq("conversation_id", id);

  if (participantsError) {
    console.warn(
      "conversation_participants delete warning:",
      participantsError.message,
    );
  }

  const { error: conversationError } = await supabaseAdmin
    .from("conversations")
    .delete()
    .eq("id", id);

  if (conversationError) {
    console.warn(
      "conversations hard delete failed, trying soft delete:",
      conversationError.message,
    );
    return softDeleteConversation(id);
  }

  const { data: still } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (still?.id) {
    return softDeleteConversation(id);
  }

  // Belt-and-suspenders for any leftover message rows.
  await supabaseAdmin
    .from("messages")
    .update({ is_deleted: true, status: "deleted" })
    .eq("conversation_id", id);

  return { ok: true as const, mode: "hard" as const };
}

export type ClearAdminMessageCenterResult = {
  ok: boolean;
  conversationsDeleted: number;
  messagesDeleted: number;
  orphanMessagesDeleted: number;
  error?: string;
};

/**
 * Permanently wipe Admin Message Center data so KPIs and queues start empty.
 */
export async function clearAdminMessageCenter(): Promise<ClearAdminMessageCenterResult> {
  const conversationsResult = await supabaseAdmin
    .from("conversations")
    .select("id");

  if (conversationsResult.error) {
    return {
      ok: false,
      conversationsDeleted: 0,
      messagesDeleted: 0,
      orphanMessagesDeleted: 0,
      error: conversationsResult.error.message,
    };
  }

  const conversationIds = ((conversationsResult.data || []) as Array<{ id?: string }>)
    .map((row) => asString(row.id))
    .filter(Boolean);

  const messagesCountResult = await supabaseAdmin
    .from("messages")
    .select("id", { count: "exact", head: true });

  const messagesDeleted = messagesCountResult.count || 0;

  if (conversationIds.length) {
    await deleteRelatedNotifications(conversationIds);
    await deleteOptionalMessagingLinks(conversationIds);

    const { error: messagesError } = await supabaseAdmin
      .from("messages")
      .delete()
      .in("conversation_id", conversationIds);

    if (messagesError) {
      return {
        ok: false,
        conversationsDeleted: 0,
        messagesDeleted: 0,
        orphanMessagesDeleted: 0,
        error: messagesError.message,
      };
    }

    await supabaseAdmin
      .from("conversation_participants")
      .delete()
      .in("conversation_id", conversationIds);

    const { error: conversationsError } = await supabaseAdmin
      .from("conversations")
      .delete()
      .in("id", conversationIds);

    if (conversationsError) {
      return {
        ok: false,
        conversationsDeleted: 0,
        messagesDeleted,
        orphanMessagesDeleted: 0,
        error: conversationsError.message,
      };
    }
  }

  const { data: leftoverMessages, error: leftoverError } = await supabaseAdmin
    .from("messages")
    .select("id")
    .limit(10000);

  if (leftoverError) {
    return {
      ok: false,
      conversationsDeleted: conversationIds.length,
      messagesDeleted,
      orphanMessagesDeleted: 0,
      error: leftoverError.message,
    };
  }

  const leftoverIds = ((leftoverMessages || []) as Array<{ id?: string }>)
    .map((row) => asString(row.id))
    .filter(Boolean);

  let orphanMessagesDeleted = 0;

  if (leftoverIds.length) {
    const { error: orphanDeleteError } = await supabaseAdmin
      .from("messages")
      .delete()
      .in("id", leftoverIds);

    if (orphanDeleteError) {
      return {
        ok: false,
        conversationsDeleted: conversationIds.length,
        messagesDeleted,
        orphanMessagesDeleted: 0,
        error: orphanDeleteError.message,
      };
    }

    orphanMessagesDeleted = leftoverIds.length;
  }

  await supabaseAdmin.from("notifications").delete().eq("type", "message");

  return {
    ok: true,
    conversationsDeleted: conversationIds.length,
    messagesDeleted,
    orphanMessagesDeleted,
  };
}
