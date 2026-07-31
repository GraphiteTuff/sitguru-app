// lib/messaging/admin-handoff-alert.ts
/**
 * Instant Admin panel alert when AI hands off to a human CSR / ambassador manager.
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendWebPushToUser } from "@/lib/services/webPush";

async function listAdminUserIds() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(200);

  if (error) {
    console.warn("[messaging-handoff] list admins failed:", error.message);
    return [] as string[];
  }

  return (data || [])
    .map((row) => String((row as { id?: string }).id || "").trim())
    .filter(Boolean);
}

export async function dispatchAiHandoffAdminAlert(params: {
  conversationId: string;
  reason: string;
  preview: string;
  bookingId?: string | null;
}) {
  const adminIds = await listAdminUserIds();
  if (!adminIds.length) return { notified: 0 };

  const href = `/admin/messages/${encodeURIComponent(params.conversationId)}`;
  const title = "SitGuru AI handoff — human needed";
  const body = `${params.reason} Preview: ${params.preview.slice(0, 160)}`;
  const now = new Date().toISOString();

  const rows = adminIds.map((userId) => ({
    user_id: userId,
    title,
    body,
    type: "messaging_ai_handoff",
    href,
    link: href,
    is_read: false,
    created_at: now,
    updated_at: now,
    metadata: {
      conversation_id: params.conversationId,
      booking_id: params.bookingId || null,
      reason: params.reason,
    },
  }));

  const { error } = await supabaseAdmin.from("notifications").insert(rows);
  if (error) {
    // Retry without metadata for older schemas
    const slim = rows.map(({ metadata: _m, ...rest }) => rest);
    const { error: retryError } = await supabaseAdmin
      .from("notifications")
      .insert(slim);
    if (retryError) {
      console.warn("[messaging-handoff] notify insert failed:", retryError.message);
    }
  }

  await Promise.allSettled(
    adminIds.map((userId) =>
      sendWebPushToUser({
        userId,
        title,
        body,
        url: href,
        tag: `ai-handoff-${params.conversationId}`,
      }),
    ),
  );

  return { notified: adminIds.length };
}
