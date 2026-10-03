/**
 * Pure fail-closed auth gates for Resend / Svix webhooks.
 * Server-only secret; never expose to the client.
 */

import { Resend } from "resend";

export type WebhookAuthFailure = {
  ok: false;
  status: 400 | 503;
  error: string;
};

export type WebhookAuthSuccess = {
  ok: true;
  payload: string;
  svixId: string;
  event: unknown;
};

export function readResendWebhookSecret(
  envSecret: string | undefined = process.env.RESEND_WEBHOOK_SECRET,
): string {
  return String(envSecret || "").trim();
}

export function gateResendWebhookSecret(
  secret: string,
): WebhookAuthFailure | { ok: true; secret: string } {
  if (!secret) {
    return { ok: false, status: 503, error: "Webhook not configured." };
  }
  return { ok: true, secret };
}

export function gateSvixSignatureHeaders(headers: {
  id?: string | null;
  timestamp?: string | null;
  signature?: string | null;
}): WebhookAuthFailure | { ok: true; id: string; timestamp: string; signature: string } {
  const id = String(headers.id || "").trim();
  const timestamp = String(headers.timestamp || "").trim();
  const signature = String(headers.signature || "").trim();
  if (!id || !timestamp || !signature) {
    return { ok: false, status: 400, error: "Missing signature headers." };
  }
  return { ok: true, id, timestamp, signature };
}

/**
 * Verify raw body + Svix headers using Resend's verifier.
 * Throws / returns failure on invalid signatures — never proceeds.
 */
export function verifyResendWebhookOrFail(params: {
  secret: string;
  payload: string;
  id: string;
  timestamp: string;
  signature: string;
  /** Optional; unused for verify but Resend client constructor requires a string. */
  apiKey?: string;
}): WebhookAuthSuccess | WebhookAuthFailure {
  try {
    const resend = new Resend(params.apiKey || process.env.RESEND_API_KEY || "webhook_verify_only");
    const event = resend.webhooks.verify({
      payload: params.payload,
      headers: {
        id: params.id,
        timestamp: params.timestamp,
        signature: params.signature,
      },
      webhookSecret: params.secret,
    });
    return {
      ok: true,
      payload: params.payload,
      svixId: params.id,
      event,
    };
  } catch {
    return { ok: false, status: 400, error: "Invalid signature." };
  }
}
