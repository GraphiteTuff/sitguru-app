// lib/messaging/outfall.ts
/**
 * Omnichannel outfall — if recipient is offline, deliver SMS fallback via Twilio.
 */

import { sendSms } from "@/lib/services/twilio";
import { isUserOnline } from "@/lib/messaging/presence";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { buildHelpUrl, getAppOrigin } from "@/lib/config/site";

function normalizeE164(phone: string) {
  const trimmed = String(phone || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed.replace(/[^\d+]/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

async function resolveRecipientPhone(userId: string, fallback?: string | null) {
  const fromFallback = normalizeE164(String(fallback || ""));
  if (fromFallback) return fromFallback;

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("phone,phone_number,mobile_phone,cell_phone")
    .eq("id", userId)
    .maybeSingle();

  const row = (data || {}) as Record<string, unknown>;
  for (const key of ["phone", "phone_number", "mobile_phone", "cell_phone"]) {
    const normalized = normalizeE164(String(row[key] || ""));
    if (normalized) return normalized;
  }
  return "";
}

export type OutfallResult = {
  online: boolean;
  smsSent: boolean;
  phone?: string;
  sid?: string | null;
  skippedReason?: string;
};

/**
 * Route a saved message to SMS when the human recipient is offline.
 */
export async function routeMessageOutfall(params: {
  conversationId: string;
  recipientUserId: string;
  senderName: string;
  messagePreview: string;
  recipientPhone?: string | null;
}): Promise<OutfallResult> {
  const online = await isUserOnline(params.recipientUserId);
  if (online) {
    return { online: true, smsSent: false, skippedReason: "Recipient is online in-app." };
  }

  const phone = await resolveRecipientPhone(
    params.recipientUserId,
    params.recipientPhone,
  );
  if (!phone) {
    return {
      online: false,
      smsSent: false,
      skippedReason: "No phone number on file for offline SMS.",
    };
  }

  const openUrl = `${getAppOrigin()}/messages/${params.conversationId}`;
  const body = [
    `SitGuru: New message from ${params.senderName || "SitGuru"}.`,
    params.messagePreview.slice(0, 220),
    `Reply in the app or text back to continue. ${openUrl}`,
  ].join("\n");

  const result = await sendSms(phone, body);

  if (result.ok) {
    const now = new Date().toISOString();
    await supabaseAdmin.from("messaging_sms_links").upsert(
      {
        phone_e164: phone,
        user_id: params.recipientUserId,
        conversation_id: params.conversationId,
        last_outbound_at: now,
        updated_at: now,
      },
      { onConflict: "phone_e164" },
    );

    await supabaseAdmin
      .from("conversations")
      .update({ sms_phone_e164: phone, updated_at: now })
      .eq("id", params.conversationId);
  }

  return {
    online: false,
    smsSent: Boolean(result.ok),
    phone,
    sid: result.sid,
    skippedReason: result.ok ? undefined : result.error || "SMS failed",
  };
}

/** Public landing / AI funnel helper link */
export function publicAiConciergeHelpUrl() {
  return buildHelpUrl("/help");
}
