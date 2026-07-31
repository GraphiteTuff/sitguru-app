// lib/services/webPush.ts
/**
 * Web Push (VAPID) connector for Pet Parent browser / mobile web.
 * Env: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
 */

import webpush from "web-push";
import { supabaseAdmin } from "@/utils/supabase/admin";

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
};

export type DevicePushResult = {
  ok: boolean;
  statusCode?: number | null;
  error?: string;
  expired?: boolean;
};

export type WebPushBatchResult = {
  ok: boolean;
  sent: number;
  removed: number;
  errors: string[];
};

function getVapidConfig() {
  const publicKey =
    String(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").trim() ||
    String(process.env.VAPID_PUBLIC_KEY || "").trim();
  const privateKey = String(process.env.VAPID_PRIVATE_KEY || "").trim();
  const subject =
    String(process.env.VAPID_SUBJECT || "").trim() ||
    "mailto:support@sitguru.com";

  return { publicKey, privateKey, subject };
}

export function isWebPushConfigured() {
  const config = getVapidConfig();
  return Boolean(config.publicKey && config.privateKey);
}

export function getWebPushPublicKey() {
  return getVapidConfig().publicKey;
}

function ensureVapidConfigured() {
  const config = getVapidConfig();
  if (!config.publicKey || !config.privateKey) return false;

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return true;
}

export async function savePushSubscription(params: {
  userId: string;
  subscription: PushSubscriptionJSON;
  userAgent?: string | null;
}) {
  const endpoint = String(params.subscription.endpoint || "").trim();
  const p256dh = String(params.subscription.keys?.p256dh || "").trim();
  const auth = String(params.subscription.keys?.auth || "").trim();

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Invalid push subscription payload.");
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      user_id: params.userId,
      endpoint,
      p256dh,
      auth,
      user_agent: params.userAgent || null,
      updated_at: now,
      created_at: now,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    throw new Error(error.message || "Could not save push subscription.");
  }
}

export async function deletePushSubscriptionByEndpoint(endpoint: string) {
  const clean = String(endpoint || "").trim();
  if (!clean) return;

  await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", clean);
}

/**
 * Low-level push to a single browser subscription.
 * Expired subs (404/410) return expired:true so callers can prune.
 */
export async function sendDevicePushNotification(
  subscription: PushSubscriptionJSON | Record<string, unknown>,
  payload: string,
): Promise<DevicePushResult> {
  try {
    if (!ensureVapidConfigured()) {
      return {
        ok: false,
        error: "VAPID keys are not configured.",
      };
    }

    const endpoint = String(
      (subscription as PushSubscriptionJSON).endpoint || "",
    ).trim();
    const keys = (subscription as PushSubscriptionJSON).keys;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return { ok: false, error: "Invalid push subscription object." };
    }

    await webpush.sendNotification(
      {
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      },
      payload,
    );

    return { ok: true, statusCode: 201 };
  } catch (error) {
    const statusCode =
      typeof error === "object" &&
      error &&
      "statusCode" in error &&
      typeof (error as { statusCode?: number }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : null;

    if (statusCode === 404 || statusCode === 410) {
      return {
        ok: false,
        statusCode,
        expired: true,
        error: "Push subscription expired.",
      };
    }

    const message =
      error instanceof Error ? error.message : "Web push send failed.";
    console.warn("[web-push] sendDevicePushNotification non-fatal:", message);
    return { ok: false, statusCode, error: message };
  }
}

/**
 * Fan-out helper — loads all stored subscriptions for a Pet Parent.
 * Uses Promise.allSettled so one bad device never blocks others.
 */
export async function sendWebPushToUser(params: {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}): Promise<WebPushBatchResult> {
  if (process.env.SIMULATE_WALK === "1") {
    console.log("[SIMULATE_WALK][web-push] payload", {
      userId: params.userId,
      title: params.title,
      body: params.body,
      url: params.url,
      tag: params.tag,
    });
  }

  if (!isWebPushConfigured()) {
    console.info("[web-push] skipped — VAPID keys not configured");
    return { ok: false, sent: 0, removed: 0, errors: ["VAPID not configured"] };
  }

  const { data: rows, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth")
    .eq("user_id", params.userId);

  if (error) {
    console.error("[web-push] load subscriptions failed:", error.message);
    return { ok: false, sent: 0, removed: 0, errors: [error.message] };
  }

  const subscriptions = (rows || []) as Array<{
    endpoint: string;
    p256dh: string;
    auth: string;
  }>;

  if (!subscriptions.length) {
    return { ok: true, sent: 0, removed: 0, errors: [] };
  }

  const payload = JSON.stringify({
    title: params.title,
    body: params.body,
    url: params.url || "/customer/dashboard/bookings",
    tag: params.tag || "pawreport",
    data: params.data || {},
  });

  const settled = await Promise.allSettled(
    subscriptions.map(async (row) => {
      const result = await sendDevicePushNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        payload,
      );

      if (result.expired) {
        await deletePushSubscriptionByEndpoint(row.endpoint);
        return { sent: false, removed: true, error: result.error };
      }

      if (!result.ok) {
        return { sent: false, removed: false, error: result.error };
      }

      return { sent: true, removed: false, error: undefined };
    }),
  );

  let sent = 0;
  let removed = 0;
  const errors: string[] = [];

  for (const item of settled) {
    if (item.status === "rejected") {
      errors.push(
        item.reason instanceof Error
          ? item.reason.message
          : "Push fan-out failed",
      );
      continue;
    }

    if (item.value.sent) sent += 1;
    if (item.value.removed) removed += 1;
    if (item.value.error && !item.value.removed) {
      errors.push(item.value.error);
    }
  }

  return {
    ok: errors.length === 0,
    sent,
    removed,
    errors,
  };
}
