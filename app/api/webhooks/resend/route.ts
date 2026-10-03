/**
 * Resend delivery webhooks → marketing suppressions.
 *
 * Production URL (enable only after deploy validation):
 *   https://www.sitguru.com/api/webhooks/resend
 * Events: email.bounced, email.complained, email.suppressed
 * Signing secret → RESEND_WEBHOOK_SECRET (server env only)
 *
 * Does NOT alter auth/security mail behavior.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  gateResendWebhookSecret,
  gateSvixSignatureHeaders,
  readResendWebhookSecret,
  verifyResendWebhookOrFail,
} from "@/lib/email/resend-webhook-auth";
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
  const secretGate = gateResendWebhookSecret(readResendWebhookSecret());
  if (!secretGate.ok) {
    console.error("Resend webhook rejected: RESEND_WEBHOOK_SECRET missing.");
    return NextResponse.json(
      { ok: false, error: secretGate.error },
      { status: secretGate.status },
    );
  }

  const payload = await req.text();
  const headerGate = gateSvixSignatureHeaders({
    id: req.headers.get("svix-id"),
    timestamp: req.headers.get("svix-timestamp"),
    signature: req.headers.get("svix-signature"),
  });
  if (!headerGate.ok) {
    return NextResponse.json(
      { ok: false, error: headerGate.error },
      { status: headerGate.status },
    );
  }

  const verified = verifyResendWebhookOrFail({
    secret: secretGate.secret,
    payload,
    id: headerGate.id,
    timestamp: headerGate.timestamp,
    signature: headerGate.signature,
  });
  if (!verified.ok) {
    console.warn("Resend webhook signature verification failed.");
    return NextResponse.json(
      { ok: false, error: verified.error },
      { status: verified.status },
    );
  }

  const event = verified.event as {
    type?: string;
    created_at?: string;
    data?: ResendWebhookData;
  };
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
      providerEventId: verified.svixId || null,
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
