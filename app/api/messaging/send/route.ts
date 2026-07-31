// app/api/messaging/send/route.ts
/**
 * Unified messaging send — persist message, optional AI assist, offline SMS outfall.
 */

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { runAiAssistIfEnabled } from "@/lib/messaging/conversation-ai";
import { routeMessageOutfall } from "@/lib/messaging/outfall";
import { touchUserPresence } from "@/lib/messaging/presence";
import { recordGlobalChatInsightAsync } from "@/lib/chat/insights";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

type MediaInput = { url: string; mimeType?: string; name?: string };

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    const conversationId = safeString(body?.conversationId);
    const messageText = safeString(body?.message || body?.body || body?.content);
    const recipientId = safeString(body?.recipientId);
    const media = Array.isArray(body?.media)
      ? (body?.media as MediaInput[]).filter((m) => safeString(m?.url))
      : [];

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: "conversationId is required." },
        { status: 400 },
      );
    }

    if (!messageText && media.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Message text or media is required." },
        { status: 400 },
      );
    }

    if (messageText.length > 5000) {
      return NextResponse.json(
        { ok: false, error: "Keep messages under 5,000 characters." },
        { status: 400 },
      );
    }

    // Membership check
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select(
        "id,customer_id,guru_id,started_by_user_id,ai_assist_enabled,booking_id,sms_phone_e164",
      )
      .eq("id", conversationId)
      .maybeSingle();

    if (!conv) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found." },
        { status: 404 },
      );
    }

    const convRow = conv as Record<string, unknown>;
    const { data: participant } = await supabaseAdmin
      .from("conversation_participants")
      .select("user_id,role")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    const memberIds = [
      String(convRow.customer_id || ""),
      String(convRow.guru_id || ""),
      String(convRow.started_by_user_id || ""),
    ];
    const isMember = Boolean(participant) || memberIds.includes(user.id);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id,role,full_name,first_name,last_name,email,phone,phone_number")
      .eq("id", user.id)
      .maybeSingle();

    const role = String(
      (profile as { role?: string } | null)?.role || "",
    ).toLowerCase();

    if (!isMember && role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Resolve recipient
    let resolvedRecipient = recipientId;
    if (!resolvedRecipient) {
      const { data: parts } = await supabaseAdmin
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId);

      const candidates = [
        ...(parts || []).map((p) => String((p as { user_id?: string }).user_id || "")),
        ...memberIds,
      ].filter((id) => id && id !== user.id);

      resolvedRecipient = candidates[0] || "";
    }

    const senderName =
      safeString((profile as { full_name?: string })?.full_name) ||
      [safeString((profile as { first_name?: string })?.first_name), safeString((profile as { last_name?: string })?.last_name)]
        .filter(Boolean)
        .join(" ") ||
      "SitGuru User";

    const now = new Date().toISOString();
    const messageId = randomUUID();
    const mediaUrls = media.map((m) => safeString(m.url));
    const mediaMimes = media.map((m) => safeString(m.mimeType) || "application/octet-stream");
    const displayBody =
      messageText ||
      (media.length ? `[Shared ${media.length} attachment${media.length > 1 ? "s" : ""}]` : "");

    const insertPayload: Record<string, unknown> = {
      id: messageId,
      conversation_id: conversationId,
      sender_id: user.id,
      recipient_id: resolvedRecipient || null,
      content: displayBody,
      body: displayBody,
      is_ai: false,
      channel: "in_app",
      media_urls: mediaUrls,
      media_mime_types: mediaMimes,
      status: "unread",
      sender_name_snapshot: senderName,
      sender_role_snapshot: role || "user",
      topic: "direct_message",
      message_type: "direct_message",
      created_at: now,
      updated_at: now,
      client_message_key: safeString(body?.clientMessageKey) || null,
    };

    let messageRow: Record<string, unknown> | null = null;
    let messageError: { message?: string } | null = null;

    {
      const inserted = await supabaseAdmin
        .from("messages")
        .insert(insertPayload)
        .select(
          "id,conversation_id,sender_id,recipient_id,content,body,created_at,is_ai,channel,media_urls",
        )
        .maybeSingle();
      messageRow = (inserted.data as Record<string, unknown> | null) || null;
      messageError = inserted.error;
    }

    if (messageError || !messageRow) {
      const fallback = {
        id: messageId,
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: resolvedRecipient || null,
        content: displayBody,
        body: displayBody,
        status: "unread",
        created_at: now,
      };
      const retry = await supabaseAdmin
        .from("messages")
        .insert(fallback)
        .select("id,conversation_id,sender_id,recipient_id,content,body,created_at")
        .maybeSingle();
      messageRow = (retry.data as Record<string, unknown> | null) || null;
      messageError = retry.error;
    }

    if (messageError || !messageRow) {
      return NextResponse.json(
        { ok: false, error: messageError?.message || "Failed to save message." },
        { status: 500 },
      );
    }

    // Omnichannel intelligence — ACTIVE_WALK ledger (non-blocking)
    if (messageText) {
      recordGlobalChatInsightAsync({
        text: messageText,
        channel: "ACTIVE_WALK",
      });
    }

    await supabaseAdmin
      .from("conversations")
      .update({
        last_message_at: now,
        last_message_preview: displayBody.slice(0, 140),
        updated_at: now,
      })
      .eq("id", conversationId);

    await touchUserPresence({ userId: user.id, isOnline: true });

    let outfall = null;
    if (resolvedRecipient) {
      outfall = await routeMessageOutfall({
        conversationId,
        recipientUserId: resolvedRecipient,
        senderName,
        messagePreview: displayBody,
        recipientPhone: safeString(convRow.sms_phone_e164) || null,
      });
    }

    let ai = null;
    if (Boolean(convRow.ai_assist_enabled)) {
      ai = await runAiAssistIfEnabled({
        conversationId,
        userMessage: displayBody,
        recipientUserId: user.id,
        audienceHint: role || "member",
      });
    }

    return NextResponse.json({
      ok: true,
      message: messageRow,
      outfall,
      ai,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Messaging send failed.";
    console.error("[api/messaging/send]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
