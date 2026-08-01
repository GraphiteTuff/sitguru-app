"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  clearAdminMessageCenter,
  hardDeleteConversation,
} from "@/lib/messaging/admin-thread-purge";

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, error: "Not signed in as admin." };
  }

  return { ok: true as const, user };
}

export async function deleteAdminConversationAction(conversationId: string) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth;

  const id = String(conversationId || "").trim();
  if (!id) {
    return { ok: false as const, error: "Missing conversation id." };
  }

  const result = await hardDeleteConversation(id);

  if (!result.ok) {
    console.error("Admin conversation delete failed:", result.error);
    return {
      ok: false as const,
      error: result.error || "Delete failed.",
    };
  }

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${id}`);

  return { ok: true as const, mode: result.mode };
}

export async function archiveAdminConversationAction(conversationId: string) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth;

  const id = String(conversationId || "").trim();
  if (!id) {
    return { ok: false as const, error: "Missing conversation id." };
  }

  const now = new Date().toISOString();

  await supabaseAdmin
    .from("conversations")
    .update({
      status: "archived",
      updated_at: now,
    })
    .eq("id", id);

  await supabaseAdmin
    .from("messages")
    .update({
      status: "archived",
    })
    .eq("conversation_id", id)
    .neq("is_deleted", true);

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${id}`);

  return { ok: true as const };
}

export async function clearAllAdminMessageCenterAction(confirmation: string) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth;

  if (String(confirmation || "").trim() !== "CLEAR ALL") {
    return {
      ok: false as const,
      error: 'Type CLEAR ALL exactly to wipe the Message Center.',
    };
  }

  const result = await clearAdminMessageCenter();
  if (!result.ok) {
    return {
      ok: false as const,
      error: result.error || "Clear failed.",
    };
  }

  revalidatePath("/admin/messages");
  return { ok: true as const, ...result };
}
