// app/api/webhooks/twilio-sms/route.ts
/**
 * Inbound Twilio SMS → active conversation messages (omnichannel texting).
 * Configure Twilio Messaging webhook to POST here.
 */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { runAiAssistIfEnabled } from "@/lib/messaging/conversation-ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeE164(phone: string) {
  const trimmed = String(phone || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed.replace(/[^\d+]/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

function twiml(message: string) {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}

function validateTwilioSignature(params: {
  signature: string;
  url: string;
  body: Record<string, string>;
}) {
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || "").trim();
  if (!authToken) return false;
  if (process.env.TWILIO_SKIP_SIGNATURE_VALIDATION === "1") return true;

  const sorted = Object.keys(params.body)
    .sort()
    .reduce((acc, key) => acc + key + params.body[key], params.url);

  const digest = createHmac("sha1", authToken).update(sorted).digest("base64");
  try {
    const a = Buffer.from(digest);
    const b = Buffer.from(params.signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function resolveInboundConversation(phone: string) {
  const { data: link } = await supabaseAdmin
    .from("messaging_sms_links")
    .select("conversation_id,user_id")
    .eq("phone_e164", phone)
    .maybeSingle();

  if (link && (link as { conversation_id?: string }).conversation_id) {
    return {
      conversationId: String((link as { conversation_id: string }).conversation_id),
      userId: String((link as { user_id?: string }).user_id || "") || null,
    };
  }

  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id,customer_id,guru_id")
    .eq("sms_phone_e164", phone)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (conv) {
    const row = conv as {
      id: string;
      customer_id?: string;
      guru_id?: string;
    };
    return {
      conversationId: row.id,
      userId: row.customer_id || row.guru_id || null,
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const params = Object.fromEntries(new URLSearchParams(raw)) as Record<
      string,
      string
    >;

    const signature = req.headers.get("x-twilio-signature") || "";
    const webhookUrl =
      String(process.env.TWILIO_SMS_WEBHOOK_URL || "").trim() ||
      `${String(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")}/api/webhooks/twilio-sms`;

    const valid = validateTwilioSignature({
      signature,
      url: webhookUrl,
      body: params,
    });

    if (!valid) {
      console.warn("[twilio-sms] invalid signature");
      return new NextResponse("Forbidden", { status: 403 });
    }

    const from = normalizeE164(params.From || "");
    const body = String(params.Body || "").trim();
    const sid = String(params.MessageSid || params.SmsSid || "").trim();

    if (!from || !body) {
      return new NextResponse(twiml("SitGuru received an empty message."), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Idempotency
    if (sid) {
      const { data: existing } = await supabaseAdmin
        .from("messages")
        .select("id")
        .eq("external_sms_sid", sid)
        .maybeSingle();
      if (existing) {
        return new NextResponse(twiml("Got it — already saved in SitGuru."), {
          status: 200,
          headers: { "Content-Type": "text/xml" },
        });
      }
    }

    const resolved = await resolveInboundConversation(from);
    if (!resolved?.conversationId) {
      return new NextResponse(
        twiml(
          "SitGuru here! We couldn't match this number to an open chat. Open sitguru.com/help or reply after messaging in the app.",
        ),
        { status: 200, headers: { "Content-Type": "text/xml" } },
      );
    }

    const now = new Date().toISOString();
    const messageId = randomUUID();

    const insertPayload: Record<string, unknown> = {
      id: messageId,
      conversation_id: resolved.conversationId,
      sender_id: resolved.userId,
      content: body,
      body,
      channel: "sms",
      external_sms_sid: sid || null,
      is_ai: false,
      status: "unread",
      message_type: "sms_inbound",
      topic: "sms",
      sender_phone_snapshot: from,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabaseAdmin.from("messages").insert(insertPayload);
    if (error) {
      // Schema-tolerant fallback
      await supabaseAdmin.from("messages").insert({
        id: messageId,
        conversation_id: resolved.conversationId,
        sender_id: resolved.userId,
        content: body,
        body,
        status: "unread",
        created_at: now,
      });
    }

    await supabaseAdmin
      .from("conversations")
      .update({
        last_message_at: now,
        last_message_preview: body.slice(0, 140),
        sms_phone_e164: from,
        updated_at: now,
      })
      .eq("id", resolved.conversationId);

    await supabaseAdmin.from("messaging_sms_links").upsert(
      {
        phone_e164: from,
        user_id: resolved.userId,
        conversation_id: resolved.conversationId,
        last_inbound_at: now,
        updated_at: now,
      },
      { onConflict: "phone_e164" },
    );

    // AI assist on SMS rooms when enabled
    if (resolved.userId) {
      await runAiAssistIfEnabled({
        conversationId: resolved.conversationId,
        userMessage: body,
        recipientUserId: resolved.userId,
        audienceHint: "sms texter",
      });
    }

    return new NextResponse(
      twiml("SitGuru got your text — we'll continue the conversation here and in the app."),
      { status: 200, headers: { "Content-Type": "text/xml" } },
    );
  } catch (error) {
    console.error("[twilio-sms]", error);
    return new NextResponse(twiml("SitGuru hit a snag saving that text. Please try again."), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
