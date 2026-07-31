// lib/notifications.ts
/**
 * SitGuru notification dispatch utility
 * -----------------------------------------------------------------------
 * Used by PawReport walk state handlers to notify Pet Parents instantly.
 *
 * Delivery adapters are stubbed for:
 *   - In-app notifications table (live today)
 *   - Expo / FCM push (native)
 *   - Twilio SMS (optional)
 *
 * Swap adapter implementations without changing call sites.
 */

import { supabaseAdmin } from "@/utils/supabase/admin";

export type NotificationChannel = "in_app" | "push" | "sms";

export type NotificationPayload = {
  userId: string;
  title: string;
  body: string;
  type: string;
  href?: string;
  metadata?: Record<string, unknown>;
  channels?: NotificationChannel[];
  /** E.164 phone when SMS channel is enabled */
  phone?: string | null;
  /** Expo / FCM device token when push channel is enabled */
  pushToken?: string | null;
};

export type NotificationDispatchResult = {
  ok: boolean;
  delivered: NotificationChannel[];
  errors: string[];
};

export type NotificationDeliveryAdapter = {
  channel: NotificationChannel;
  send: (payload: NotificationPayload) => Promise<void>;
};

/** PawReport walk → Pet Parent copy templates */
export const PAWREPORT_WALK_NOTIFICATIONS = {
  start_walk: (petName: string) => ({
    title: "Walk started",
    body: `🎒 ${petName}'s walk has started! Tap to follow their route live.`,
    type: "pawreport_walk_started",
  }),
  take_break: (petName: string) => ({
    title: "Quick break",
    body: `🌳 ${petName} and their Guru are taking a quick water break.`,
    type: "pawreport_walk_break",
  }),
  potty_break: (petName: string) => ({
    title: "Potty update",
    body: `💩 Quick update! ${petName} just went potty.`,
    type: "pawreport_potty_break",
  }),
  end_walk: (petName: string) => ({
    title: "Walk complete",
    body: `🏡 ${petName} is back home safe and sound! Your full PawReport is ready to view.`,
    type: "pawreport_walk_ended",
  }),
} as const;

async function sendInAppNotification(payload: NotificationPayload) {
  const now = new Date().toISOString();
  const href = payload.href || "/customer/dashboard/bookings";

  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: payload.userId,
    title: payload.title,
    body: payload.body,
    type: payload.type,
    href,
    link: href,
    is_read: false,
    created_at: now,
    updated_at: now,
    metadata: payload.metadata ?? null,
  });

  if (error) {
    // metadata column may not exist on older schemas — retry without it
    const { error: retryError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: payload.userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        href,
        link: href,
        is_read: false,
        created_at: now,
        updated_at: now,
      });

    if (retryError) {
      throw new Error(retryError.message || "In-app notification failed");
    }
  }
}

/**
 * Expo / FCM stub — wire EXPO_ACCESS_TOKEN or FCM server key later.
 * Logs intent in development so mobile teams can verify payloads.
 */
async function sendPushNotificationStub(payload: NotificationPayload) {
  if (!payload.pushToken) {
    console.info("[notifications:push] skipped — no pushToken", {
      userId: payload.userId,
      type: payload.type,
    });
    return;
  }

  // Example Expo call (disabled until credentials exist):
  // await fetch("https://exp.host/--/api/v2/push/send", { ... })
  console.info("[notifications:push] stub dispatch", {
    to: payload.pushToken,
    title: payload.title,
    body: payload.body,
    data: payload.metadata,
  });
}

/**
 * Twilio SMS stub — wire TWILIO_ACCOUNT_SID / AUTH_TOKEN / FROM later.
 */
async function sendSmsNotificationStub(payload: NotificationPayload) {
  if (!payload.phone) {
    console.info("[notifications:sms] skipped — no phone", {
      userId: payload.userId,
      type: payload.type,
    });
    return;
  }

  console.info("[notifications:sms] stub dispatch", {
    to: payload.phone,
    body: `${payload.title}: ${payload.body}`,
  });
}

const defaultAdapters: NotificationDeliveryAdapter[] = [
  { channel: "in_app", send: sendInAppNotification },
  { channel: "push", send: sendPushNotificationStub },
  { channel: "sms", send: sendSmsNotificationStub },
];

let registeredAdapters = [...defaultAdapters];

/** Tests / custom providers can replace adapters */
export function setNotificationAdapters(
  adapters: NotificationDeliveryAdapter[],
) {
  registeredAdapters = adapters;
}

export function resetNotificationAdapters() {
  registeredAdapters = [...defaultAdapters];
}

/**
 * Dispatch a notification across requested channels (default: in_app + push).
 */
export async function dispatchNotification(
  payload: NotificationPayload,
): Promise<NotificationDispatchResult> {
  const channels = payload.channels?.length
    ? payload.channels
    : (["in_app", "push"] as NotificationChannel[]);

  const delivered: NotificationChannel[] = [];
  const errors: string[] = [];

  for (const channel of channels) {
    const adapter = registeredAdapters.find((item) => item.channel === channel);
    if (!adapter) {
      errors.push(`No adapter registered for channel: ${channel}`);
      continue;
    }

    try {
      await adapter.send(payload);
      delivered.push(channel);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed channel ${channel}`;
      console.error("[notifications] dispatch error:", message);
      errors.push(message);
    }
  }

  return {
    ok: errors.length === 0,
    delivered,
    errors,
  };
}

/**
 * Convenience helper for PawReport walk lifecycle → Pet Parent.
 */
export async function notifyPetParentWalkEvent(params: {
  petParentUserId: string;
  bookingId: string;
  petName: string;
  event: keyof typeof PAWREPORT_WALK_NOTIFICATIONS;
  phone?: string | null;
  pushToken?: string | null;
}) {
  const template = PAWREPORT_WALK_NOTIFICATIONS[params.event](params.petName);
  const href = `/customer/dashboard/bookings/${params.bookingId}/visit-updates`;

  return dispatchNotification({
    userId: params.petParentUserId,
    title: template.title,
    body: template.body,
    type: template.type,
    href,
    phone: params.phone,
    pushToken: params.pushToken,
    metadata: {
      bookingId: params.bookingId,
      event: params.event,
      source: "pawreport_walk",
    },
    channels: ["in_app", "push"],
  });
}
