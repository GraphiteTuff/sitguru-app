/**
 * Resend delivery webhooks → marketing suppressions.
 *
 * Configure in Resend dashboard:
 *   URL: https://www.sitguru.com/api/webhooks/resend
 *   Events: email.bounced, email.complained, email.suppressed
 *           (optional: email.delivered, email.delivery_delayed for logging only)
 *   Signing secret → RESEND_WEBHOOK_SECRET (server env only)
 *
 * Does NOT alter auth/security mail behavior.
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  classifyResendSuppressionEvent,
  normalizeSuppressionEmail,
  upsertEmailSuppression,
} from "@/lib/email/suppression";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ResendWebhookData = {
  email_id?: string;
  to?: string[] | string;
  from?: string;
  subject?: string;
  created_at?: string;
  bounce?: { message?: string; type?: string };
  failed?: { reason?: string };
  suppressed?: { message?: string };
};

function firstRecipient(to: string[] | string | undefined): string {
  if (Array.isArray(to)) return String(to[0] || "").trim();
  return String(to || "").trim();
}

async function logProviderEvent(params: {
  email: string;
  eventType: string;
  providerMessageId: string | null;
  status: string;
  metadata: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("email_events").insert({
      user_id: null,
      guru_id: null,
      email: params.email,
      event_type: params.eventType,
      provider_message_id: params.providerMessageId,
      stripe_session_id: null,
      status: params.status,
      metadata: params.metadata,
    });
  } catch (error) {
    console.warn("email_events webhook log skipped:", error);
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = String(process.env.RESEND_WEBHOOK_SECRET || "").trim();
  if (!webhookSecret) {
    console.error("Resend webhook rejected: RESEND_WEBHOOK_SECRET missing.");
    return NextResponse.json(
      { ok: false, error: "Webhook not configured." },
      { status: 503 },
    );
  }

  const payload = await req.text();
  const svixId = req.headers.get("svix-id") || "";
  const svixTimestamp = req.headers.get("svix-timestamp") || "";
  const svixSignature = req.headers.get("svix-signature") || "";

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ ok: false, error: "Missing signature headers." }, { status: 400 });
  }

  let event: { type?: string; created_at?: string; data?: ResendWebhookData };
  try {
    // API key is unused for verify; Resend client still requires a string.
    const resend = new Resend(process.env.RESEND_API_KEY || "webhook_verify_only");
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret,
    }) as typeof event;
  } catch (error) {
    console.warn("Resend webhook signature verification failed:", error);
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 400 });
  }

  const eventType = String(event?.type || "");
  const data = (event?.data || {}) as ResendWebhookData;
  const recipient = firstRecipient(data.to);
  const emailNormalized = normalizeSuppressionEmail(recipient) || "unknown@invalid";
  const providerMessageId = data.email_id ? String(data.email_id) : null;

  const metadata: Record<string, unknown> = {
    provider: "resend",
    event_type: eventType,
    from: data.from || null,
    subject: data.subject || null,
    bounce: data.bounce || null,
    // Never store full HTML bodies from webhooks.
  };

  await logProviderEvent({
    email: emailNormalized === "unknown@invalid" ? recipient || "unknown" : emailNormalized,
    eventType: `resend.${eventType || "unknown"}`,
    providerMessageId,
    status: eventType.replace(/^email\./, "") || "received",
    metadata,
  });

  const reason = classifyResendSuppressionEvent(eventType);
  if (reason && recipient) {
    const result = await upsertEmailSuppression({
      email: recipient,
      reason,
      sourceEvent: eventType,
      providerMessageId,
      providerEventId: svixId || null,
      metadata,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Suppression upsert failed." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, event: eventType, suppressed: Boolean(reason) });
}
