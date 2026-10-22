/**
 * Persistent companion conversations — ownership enforced server-side.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CompanionId, CompanionMessageRole } from "@/lib/companions/types";

export type CompanionConversationRow = {
  id: string;
  user_id: string;
  companion_id: CompanionId;
  title: string | null;
  workspace_role: string | null;
  client_key: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type CompanionMessageRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  companion_id: CompanionId;
  role: CompanionMessageRole;
  content: string;
  client_message_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function isMissingTable(error: { message?: string } | null | undefined) {
  return Boolean(
    error?.message && /does not exist|schema cache/i.test(error.message),
  );
}

/** Soft kill-switch — disables writes without dropping stored data. */
export function isCompanionPersistenceEnabled() {
  const raw = String(process.env.COMPANION_PERSISTENCE_ENABLED || "true")
    .trim()
    .toLowerCase();
  return raw !== "0" && raw !== "false" && raw !== "off";
}

export async function ensureCompanionConversation(opts: {
  userId: string;
  companionId: CompanionId;
  workspaceRole?: string | null;
  title?: string | null;
}): Promise<CompanionConversationRow | null> {
  if (!isCompanionPersistenceEnabled()) {
    return null;
  }

  const { data: existing, error: readError } = await supabaseAdmin
    .from("companion_conversations")
    .select("*")
    .eq("user_id", opts.userId)
    .eq("companion_id", opts.companionId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (isMissingTable(readError)) return null;
  if (readError) {
    console.warn(
      "[companion-conversations] read soft-failed:",
      readError.message,
    );
  }
  if (existing?.id) {
    return existing as CompanionConversationRow;
  }

  const { data, error } = await supabaseAdmin
    .from("companion_conversations")
    .insert({
      user_id: opts.userId,
      companion_id: opts.companionId,
      workspace_role: opts.workspaceRole || null,
      title: opts.title || `${opts.companionId} chat`,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (isMissingTable(error)) return null;
  if (error) {
    console.warn(
      "[companion-conversations] insert soft-failed:",
      error.message,
    );
    return null;
  }
  return data as CompanionConversationRow;
}

export async function getOwnedConversation(opts: {
  conversationId: string;
  userId: string;
}): Promise<CompanionConversationRow | null> {
  const { data, error } = await supabaseAdmin
    .from("companion_conversations")
    .select("*")
    .eq("id", opts.conversationId)
    .eq("user_id", opts.userId)
    .maybeSingle();

  if (isMissingTable(error)) return null;
  if (error) {
    console.warn(
      "[companion-conversations] ownership read soft-failed:",
      error.message,
    );
    return null;
  }
  return (data as CompanionConversationRow) || null;
}

export async function listOwnedConversations(opts: {
  userId: string;
  companionId?: CompanionId | null;
  limit?: number;
}): Promise<CompanionConversationRow[]> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  let query = supabaseAdmin
    .from("companion_conversations")
    .select("*")
    .eq("user_id", opts.userId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (opts.companionId) {
    query = query.eq("companion_id", opts.companionId);
  }

  const { data, error } = await query;
  if (isMissingTable(error)) return [];
  if (error) throw new Error(error.message);
  return (data as CompanionConversationRow[]) || [];
}

export async function listOwnedMessages(opts: {
  conversationId: string;
  userId: string;
  limit?: number;
}): Promise<CompanionMessageRow[]> {
  const owned = await getOwnedConversation({
    conversationId: opts.conversationId,
    userId: opts.userId,
  });
  if (!owned) return [];

  const limit = Math.min(Math.max(opts.limit ?? 80, 1), 200);
  const { data, error } = await supabaseAdmin
    .from("companion_messages")
    .select("*")
    .eq("conversation_id", opts.conversationId)
    .eq("user_id", opts.userId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (isMissingTable(error)) return [];
  if (error) throw new Error(error.message);
  return (data as CompanionMessageRow[]) || [];
}

export async function appendCompanionMessage(opts: {
  conversationId: string;
  userId: string;
  companionId: CompanionId;
  role: CompanionMessageRole;
  content: string;
  clientMessageId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<CompanionMessageRow | null> {
  if (!isCompanionPersistenceEnabled()) {
    return null;
  }

  const content = String(opts.content || "").trim().slice(0, 12000);
  if (!content) return null;

  const owned = await getOwnedConversation({
    conversationId: opts.conversationId,
    userId: opts.userId,
  });
  if (!owned) {
    throw new Error("Conversation not found or access denied.");
  }
  if (owned.companion_id !== opts.companionId) {
    throw new Error("Companion mismatch for conversation.");
  }

  if (opts.clientMessageId) {
    const { data: existing } = await supabaseAdmin
      .from("companion_messages")
      .select("*")
      .eq("conversation_id", opts.conversationId)
      .eq("client_message_id", opts.clientMessageId)
      .maybeSingle();
    if (existing?.id) return existing as CompanionMessageRow;
  }

  const { data, error } = await supabaseAdmin
    .from("companion_messages")
    .insert({
      conversation_id: opts.conversationId,
      user_id: opts.userId,
      companion_id: opts.companionId,
      role: opts.role,
      content,
      client_message_id: opts.clientMessageId || null,
      metadata: opts.metadata || {},
    })
    .select("*")
    .single();

  if (isMissingTable(error)) return null;
  if (error) {
    // Unique violation on retry — return the existing row.
    if (/duplicate|unique/i.test(error.message) && opts.clientMessageId) {
      const { data: again } = await supabaseAdmin
        .from("companion_messages")
        .select("*")
        .eq("conversation_id", opts.conversationId)
        .eq("client_message_id", opts.clientMessageId)
        .maybeSingle();
      return (again as CompanionMessageRow) || null;
    }
    throw new Error(error.message);
  }

  const now = new Date().toISOString();
  void supabaseAdmin
    .from("companion_conversations")
    .update({
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", opts.conversationId)
    .eq("user_id", opts.userId);

  return data as CompanionMessageRow;
}

export async function archiveCompanionConversation(opts: {
  conversationId: string;
  userId: string;
}): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from("companion_conversations")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.conversationId)
    .eq("user_id", opts.userId)
    .is("archived_at", null);

  if (isMissingTable(error)) return false;
  if (error) throw new Error(error.message);
  return (count ?? 1) > 0;
}
