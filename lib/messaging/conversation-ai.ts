// lib/messaging/conversation-ai.ts
/**
 * Apply AI enablement, handoff toggles, and persist AI replies into messages.
 */

import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { evaluateHandoffNeed } from "@/lib/messaging/handoff";
import { dispatchAiHandoffAdminAlert } from "@/lib/messaging/admin-handoff-alert";
import { completeSitGuruAiReply } from "@/lib/messaging/ai-engine";
import type { ConversationAiState } from "@/lib/messaging/types";

const AI_SENDER_ID =
  String(process.env.SITGURU_AI_USER_ID || "").trim() || null;

export async function loadConversationAiState(
  conversationId: string,
): Promise<ConversationAiState | null> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select(
      "id,ai_assist_enabled,ai_handoff_at,ai_handoff_reason,ai_handoff_flagged,booking_id,subject,sms_phone_e164",
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    aiAssistEnabled: Boolean(row.ai_assist_enabled),
    aiHandoffAt: (row.ai_handoff_at as string) || null,
    aiHandoffReason: (row.ai_handoff_reason as string) || null,
    aiHandoffFlagged: Boolean(row.ai_handoff_flagged),
    bookingId: (row.booking_id as string) || null,
    subject: (row.subject as string) || null,
    smsPhoneE164: (row.sms_phone_e164 as string) || null,
  };
}

export async function disableAiAssist(params: {
  conversationId: string;
  reason: string;
  preview: string;
  bookingId?: string | null;
}) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("conversations")
    .update({
      ai_assist_enabled: false,
      ai_handoff_at: now,
      ai_handoff_reason: params.reason,
      ai_handoff_flagged: true,
      updated_at: now,
    })
    .eq("id", params.conversationId);

  if (error) {
    console.warn("[conversation-ai] disable AI failed:", error.message);
    return { ok: false as const, error: error.message };
  }

  await dispatchAiHandoffAdminAlert({
    conversationId: params.conversationId,
    reason: params.reason,
    preview: params.preview,
    bookingId: params.bookingId,
  });

  return { ok: true as const };
}

export async function maybeHandoffFromUserMessage(params: {
  conversationId: string;
  messageText: string;
  bookingId?: string | null;
}) {
  const evaluation = evaluateHandoffNeed(params.messageText);
  if (!evaluation.shouldHandoff) {
    return { handedOff: false as const, evaluation };
  }

  await disableAiAssist({
    conversationId: params.conversationId,
    reason: evaluation.reason,
    preview: params.messageText,
    bookingId: params.bookingId,
  });

  return { handedOff: true as const, evaluation };
}

async function loadRecentHistory(conversationId: string) {
  const { data } = await supabaseAdmin
    .from("messages")
    .select("content,body,is_ai,sender_id,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(12);

  const rows = [...(data || [])].reverse();
  return rows.map((row) => {
    const r = row as {
      content?: string;
      body?: string;
      is_ai?: boolean;
    };
    const content = String(r.content || r.body || "").trim();
    return {
      role: (r.is_ai ? "assistant" : "user") as "assistant" | "user",
      content,
    };
  });
}

export async function insertAiMessage(params: {
  conversationId: string;
  recipientUserId: string;
  text: string;
}) {
  const now = new Date().toISOString();
  const id = randomUUID();
  const payload: Record<string, unknown> = {
    id,
    conversation_id: params.conversationId,
    sender_id: AI_SENDER_ID,
    recipient_id: params.recipientUserId,
    content: params.text,
    body: params.text,
    is_ai: true,
    channel: "ai",
    message_type: "ai_assist",
    status: "unread",
    sender_name_snapshot: "SitGuru AI",
    sender_role_snapshot: "ai",
    topic: "ai_assist",
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert(payload)
    .select("id,conversation_id,content,body,created_at,is_ai,channel")
    .maybeSingle();

  if (error) {
    // Retry without newer columns if schema not migrated yet
    const { data: retry, error: retryError } = await supabaseAdmin
      .from("messages")
      .insert({
        id,
        conversation_id: params.conversationId,
        sender_id: AI_SENDER_ID,
        recipient_id: params.recipientUserId,
        content: params.text,
        body: params.text,
        message_type: "ai_assist",
        status: "unread",
        created_at: now,
      })
      .select("id,conversation_id,content,body,created_at")
      .maybeSingle();

    if (retryError) {
      return { ok: false as const, error: retryError.message };
    }

    await supabaseAdmin
      .from("conversations")
      .update({
        last_message_at: now,
        last_message_preview: params.text.slice(0, 140),
        updated_at: now,
      })
      .eq("id", params.conversationId);

    return { ok: true as const, message: retry };
  }

  await supabaseAdmin
    .from("conversations")
    .update({
      last_message_at: now,
      last_message_preview: params.text.slice(0, 140),
      updated_at: now,
    })
    .eq("id", params.conversationId);

  return { ok: true as const, message: data };
}

/**
 * If AI is enabled and handoff did not fire, generate + persist a concierge reply.
 */
export async function runAiAssistIfEnabled(params: {
  conversationId: string;
  userMessage: string;
  recipientUserId: string;
  audienceHint?: string;
}) {
  const state = await loadConversationAiState(params.conversationId);
  if (!state?.aiAssistEnabled) {
    return { ran: false as const, reason: "AI_ASSIST_ENABLED is false" };
  }

  const handoff = await maybeHandoffFromUserMessage({
    conversationId: params.conversationId,
    messageText: params.userMessage,
    bookingId: state.bookingId,
  });

  if (handoff.handedOff) {
    const notice =
      "Thanks for flagging this — I'm connecting you with a real SitGuru teammate now. They'll take it from here.";
    await insertAiMessage({
      conversationId: params.conversationId,
      recipientUserId: params.recipientUserId,
      text: notice,
    });
    return {
      ran: true as const,
      handedOff: true as const,
      reply: notice,
    };
  }

  const history = await loadRecentHistory(params.conversationId);
  const completion = await completeSitGuruAiReply({
    userMessage: params.userMessage,
    history,
    audienceHint: params.audienceHint,
    bookingId: state.bookingId,
  });

  if (!completion.ok) {
    return { ran: false as const, reason: completion.error };
  }

  const inserted = await insertAiMessage({
    conversationId: params.conversationId,
    recipientUserId: params.recipientUserId,
    text: completion.text,
  });

  if (!inserted.ok) {
    return { ran: false as const, reason: inserted.error };
  }

  return {
    ran: true as const,
    handedOff: false as const,
    reply: completion.text,
    message: inserted.message,
  };
}
