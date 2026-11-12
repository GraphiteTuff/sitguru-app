"use server";

import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  clearAdminMessageCenter,
  hardDeleteConversation,
} from "@/lib/messaging/admin-thread-purge";

async function requireSuperAdminUser() {
  const identity = await getAdminIdentity();
  if (!identity) {
    return { ok: false as const, error: "Not signed in as admin." };
  }
  if (!identity.isSuperUser) {
    return { ok: false as const, error: "Super Admin only." };
  }
  return { ok: true as const, user: { id: identity.id, email: identity.email } };
}

export async function deleteAdminConversationAction(conversationId: string) {
  const auth = await requireSuperAdminUser();
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
  const auth = await requireSuperAdminUser();
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
  const auth = await requireSuperAdminUser();
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
  return result;
}
