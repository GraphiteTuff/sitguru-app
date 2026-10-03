/**
 * Marketing-oriented email suppression helpers.
 * Auth / security / OTP mail must NEVER consult this list to refuse delivery.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeEmailAddress } from "@/lib/email/headers";

export type SuppressionReason =
  | "hard_bounce"
  | "complaint"
  | "manual"
  | "provider_suppressed";

export function normalizeSuppressionEmail(email: string): string {
  return normalizeEmailAddress(email);
}

export async function isEmailSuppressedForMarketing(
  email: string,
): Promise<boolean> {
  const emailNormalized = normalizeSuppressionEmail(email);
  if (!emailNormalized) return false;

  const { data, error } = await supabaseAdmin
    .from("email_suppressions")
    .select("id")
    .eq("email_normalized", emailNormalized)
    .maybeSingle();

  if (error) {
    console.warn("email suppression lookup failed:", error.message || error);
    return false;
  }

  return Boolean(data?.id);
}

export async function upsertEmailSuppression(params: {
  email: string;
  reason: SuppressionReason;
  sourceEvent?: string | null;
  providerMessageId?: string | null;
  providerEventId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  const emailNormalized = normalizeSuppressionEmail(params.email);
  if (!emailNormalized) {
    return { ok: false, error: "Missing email." };
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("email_suppressions").upsert(
    {
      email_normalized: emailNormalized,
      reason: params.reason,
      source_event: params.sourceEvent || null,
      provider_message_id: params.providerMessageId || null,
      provider_event_id: params.providerEventId || null,
      metadata: params.metadata || {},
      updated_at: now,
    },
    { onConflict: "email_normalized" },
  );

  if (error) {
    console.error("email suppression upsert failed:", error.message || "unknown upsert error");
    return { ok: false, error: error.message };
  }

  // Keep marketing list in sync when present.
  // Best-effort only — email_suppressions is authoritative for marketing blocks.
  // Auth/security mail never consults this list.
  const { error: subscriberSyncError } = await supabaseAdmin
    .from("email_update_subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: now,
      updated_at: now,
    })
    .eq("email_normalized", emailNormalized)
    .eq("status", "subscribed");

  if (subscriberSyncError) {
    console.warn(
      "email_update_subscribers sync on suppress skipped:",
      subscriberSyncError.message || "unknown update error",
    );
  }

  return { ok: true };
}

/**
 * Classify Resend webhook event types into suppression actions.
 * Soft delays / delivered / opened never suppress.
 */
export function classifyResendSuppressionEvent(
  eventType: string,
): SuppressionReason | null {
  switch (eventType) {
    case "email.bounced":
      return "hard_bounce";
    case "email.complained":
      return "complaint";
    case "email.suppressed":
      return "provider_suppressed";
    default:
      return null;
  }
}
