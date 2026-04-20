import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  status?: string | null;
};

type ConversationParticipantRow = {
  conversation_id: string;
  user_id: string;
  role?: string | null;
  last_read_at?: string | null;
  updated_at?: string | null;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMessageBody(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);

    const conversationId = safeString(payload?.conversationId);
    const senderId = safeString(payload?.senderId);
    const requestedRecipientId = safeString(payload?.recipientId);
    const messageText = normalizeMessageBody(safeString(payload?.body));

    if (!conversationId || !senderId || !messageText) {
      return NextResponse.json(
        { error: "Missing required message fields." },
        { status: 400 }
      );
    }

    if (senderId !== user.id) {
      return NextResponse.json({ error: "Sender mismatch." }, { status: 403 });
    }

    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from("conversations")
      .select("id, customer_id, guru_id, status")
      .eq("id", conversationId)
      .maybeSingle<ConversationRow>();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const { data: participantRows, error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id, user_id, role, last_read_at, updated_at")
      .eq("conversation_id", conversationId)
      .returns<ConversationParticipantRow[]>();

    if (participantError) {
      console.error("Conversation participants lookup error:", participantError.message);

      return NextResponse.json(
        { error: "Unable to validate conversation participants." },
        { status: 500 }
      );
    }

    const participants = (participantRows ?? []) as ConversationParticipantRow[];
    const isParticipant = participants.some((row) => row.user_id === user.id);

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Not allowed to send to this conversation." },
        { status: 403 }
      );
    }

    const otherParticipantIds = participants
      .map((row) => row.user_id)
      .filter((participantUserId) => participantUserId !== user.id);

    const recipientUserId =
      (requestedRecipientId &&
      otherParticipantIds.includes(requestedRecipientId)
        ? requestedRecipientId
        : otherParticipantIds[0]) || null;

    if (!recipientUserId) {
      return NextResponse.json(
        { error: "No valid recipient found for this conversation." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    const { data: insertedMessage, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: recipientUserId,
        content: messageText,
        body: messageText,
        message_type: "text",
        is_deleted: false,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Send message insert error:", insertError.message);

      return NextResponse.json(
        { error: insertError.message || "Unable to send message." },
        { status: 500 }
      );
    }

    const { error: conversationUpdateError } = await supabaseAdmin
      .from("conversations")
      .update({
        last_message_at: nowIso,
        last_message_preview: messageText.slice(0, 180),
        updated_at: nowIso,
      })
      .eq("id", conversationId);

    if (conversationUpdateError) {
      console.error("Conversation update error:", conversationUpdateError.message);
    }

    const { error: senderParticipantUpdateError } = await supabaseAdmin
      .from("conversation_participants")
      .update({
        last_read_at: nowIso,
        updated_at: nowIso,
      })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    if (senderParticipantUpdateError) {
      console.error(
        "Sender participant update error:",
        senderParticipantUpdateError.message
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: insertedMessage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send message route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send message.",
      },
      { status: 500 }
    );
  }
}