// lib/notificationDispatcher.ts
/**
 * Central PawReport multi-channel notification engine.
 *
 * dispatchPawReportEvent(bookingId, eventType, petName, trackingData)
 *
 * Routing:
 *   WALK_START  → Web Push + Twilio SMS (https://sitguru.com{bookingId})
 *   POTTY_BREAK → Web Push only
 *   WALK_BREAK  → Web Push only
 *   WALK_END    → Web Push + Twilio SMS + Resend email
 *
 * Channels run via Promise.allSettled so one slow/failing provider
 * never blocks realtime GPS synchronization.
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendFinalReportEmail } from "@/lib/services/resend";
import { sendSms } from "@/lib/services/twilio";
import { sendWebPushToUser } from "@/lib/services/webPush";
import { evaluateStaleGpsSafetyAlerts } from "@/lib/pawreport/admin-alerts";
import { GPS_STALE_ALERT_MS } from "@/lib/pawreport/admin-types";
import {
  buildParentWalkUrl,
  buildSmsTrackableUrl,
} from "@/lib/config/site";

/** Re-export for coordination-layer callers / admin scanners */
export { evaluateStaleGpsSafetyAlerts, GPS_STALE_ALERT_MS };

export type PawReportDispatchEventType =
  | "WALK_START"
  | "POTTY_BREAK"
  | "WALK_BREAK"
  | "WALK_END";

export type PawReportTrackingData = {
  petParentUserId?: string;
  phone?: string | null;
  email?: string | null;
  guruName?: string;
  message?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  distanceMiles?: number;
  durationMinutes?: number;
  photoCount?: number;
  photoUrls?: string[];
  pottyEvents?: Array<{ label: string; at: string }>;
  liveUrl?: string;
  [key: string]: unknown;
};

export type DispatchPawReportEventResult = {
  ok: boolean;
  settled: Array<{
    channel: "webPush" | "sms" | "email" | "inApp";
    status: "fulfilled" | "rejected";
    value?: unknown;
    reason?: string;
  }>;
};

/** Trackable live-map URL for emails / push deep links */
export function buildTrackableLiveUrl(bookingId: string) {
  return buildParentWalkUrl(bookingId);
}

function smsLiveLink(bookingId: string) {
  return buildSmsTrackableUrl(bookingId);
}

function resolvePetParentUserId(booking: Record<string, unknown>) {
  return (
    String(booking.pet_owner_id || "").trim() ||
    String(booking.customer_id || "").trim() ||
    String(booking.user_id || "").trim() ||
    ""
  );
}

function resolvePhone(booking: Record<string, unknown>, fallback?: string | null) {
  return (
    String(fallback || "").trim() ||
    String(booking.customer_phone || "").trim() ||
    String(booking.phone || "").trim() ||
    String(booking.pet_owner_phone || "").trim() ||
    ""
  );
}

function resolveEmail(booking: Record<string, unknown>, fallback?: string | null) {
  return (
    String(fallback || "").trim().toLowerCase() ||
    String(booking.customer_email || "").trim().toLowerCase() ||
    String(booking.email || "").trim().toLowerCase() ||
    ""
  );
}

async function insertInAppNotification(params: {
  userId: string;
  title: string;
  body: string;
  type: string;
  href: string;
}) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: params.userId,
    title: params.title,
    body: params.body,
    type: params.type,
    href: params.href,
    link: params.href,
    is_read: false,
    created_at: now,
    updated_at: now,
  });

  if (error) throw new Error(error.message);
}

async function loadWalkSummaryExtras(bookingId: string) {
  const [{ data: updates }, { data: walk }] = await Promise.all([
    supabaseAdmin
      .from("booking_visit_updates")
      .select("update_type,note,photo_url,created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("booking_walk_tracks")
      .select(
        "total_distance_meters,total_duration_seconds,started_at,ended_at",
      )
      .eq("booking_id", bookingId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const rows = (updates || []) as Array<{
    update_type: string | null;
    note: string | null;
    photo_url: string | null;
    created_at: string | null;
  }>;

  const formatClock = (value: string | null | undefined) => {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return String(value);
    }
  };

  const pottyEvents = rows
    .filter((row) =>
      ["pee", "poop"].includes(String(row.update_type || "").toLowerCase()),
    )
    .map((row) => ({
      label: String(row.update_type).toLowerCase() === "poop" ? "Poop" : "Pee",
      at: formatClock(row.created_at),
    }));

  const timelineEvents: Array<{
    at: string;
    label: string;
    icon: "start" | "potty" | "break" | "home" | "note";
  }> = [];

  const startedAt = walk?.started_at
    ? formatClock(String(walk.started_at))
    : null;
  if (startedAt) {
    timelineEvents.push({
      at: startedAt,
      label: "Walk Started",
      icon: "start",
    });
  }

  for (const row of rows) {
    const type = String(row.update_type || "").toLowerCase();
    const note = String(row.note || "").toLowerCase();
    const at = formatClock(row.created_at);

    if (type === "pee" || type === "poop" || note.includes("potty")) {
      timelineEvents.push({
        at,
        label:
          type === "poop" || note.includes("poop")
            ? "Potty Break (Poop)"
            : "Potty Break (Pee)",
        icon: "potty",
      });
      continue;
    }

    if (
      note.includes("walk_break") ||
      note.includes("water break") ||
      note.includes("taking a") ||
      (note.includes("break") && !note.includes("ended"))
    ) {
      timelineEvents.push({
        at,
        label: "Rest Break",
        icon: "break",
      });
    }
  }

  const endedAtClock = walk?.ended_at
    ? formatClock(String(walk.ended_at))
    : formatClock(new Date().toISOString());
  timelineEvents.push({
    at: endedAtClock,
    label: "Arrived Safely Home",
    icon: "home",
  });

  const photoUrls = rows
    .map((row) => String(row.photo_url || "").trim())
    .filter(Boolean);

  const distanceMeters = Number(walk?.total_distance_meters || 0);
  const durationSeconds = Number(walk?.total_duration_seconds || 0);

  return {
    pottyEvents,
    timelineEvents,
    photoUrls,
    photoCount: photoUrls.length,
    distanceMiles: Number.isFinite(distanceMeters)
      ? distanceMeters / 1609.344
      : 0,
    durationMinutes: Number.isFinite(durationSeconds)
      ? durationSeconds / 60
      : 0,
    startedAt: startedAt || undefined,
    endedAt: walk?.ended_at
      ? new Date(String(walk.ended_at)).toLocaleString()
      : new Date().toLocaleString(),
  };
}

function copyForEvent(eventType: PawReportDispatchEventType, petName: string) {
  switch (eventType) {
    case "WALK_START":
      return {
        title: "Walk started",
        body: `🎒 ${petName}'s walk has started! Tap to follow their route live.`,
        type: "pawreport_walk_started",
      };
    case "POTTY_BREAK":
      return {
        title: "Potty update",
        body: `💩 ${petName} just went potty!`,
        type: "pawreport_potty_break",
      };
    case "WALK_BREAK":
      return {
        title: "Quick break",
        body: `🌳 ${petName} is taking a quick water break.`,
        type: "pawreport_walk_break",
      };
    case "WALK_END":
      return {
        title: "Walk complete",
        body: `🏡 ${petName} is home safe! Your full PawReport is ready.`,
        type: "pawreport_walk_ended",
      };
  }
}

/**
 * Unified async dispatcher for PawReport realtime events.
 */
export async function dispatchPawReportEvent(
  bookingId: string,
  eventType: PawReportDispatchEventType,
  petName: string,
  trackingData: PawReportTrackingData = {},
): Promise<DispatchPawReportEventResult> {
  const id = String(bookingId || "").trim();
  const name = String(petName || "Scout").trim() || "Scout";

  if (!id) {
    return {
      ok: false,
      settled: [
        {
          channel: "inApp",
          status: "rejected",
          reason: "Missing bookingId",
        },
      ],
    };
  }

  try {
    let booking: Record<string, unknown> = {};
    if (
      !trackingData.petParentUserId ||
      !trackingData.phone ||
      !trackingData.email
    ) {
      const { data } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      booking = (data as Record<string, unknown>) || {};
    }

    const petParentUserId =
      String(trackingData.petParentUserId || "").trim() ||
      resolvePetParentUserId(booking);
    const phone = resolvePhone(booking, trackingData.phone);
    const email = resolveEmail(booking, trackingData.email);
    const deepLink = buildTrackableLiveUrl(id);
    const smsLink = smsLiveLink(id);
    const copy = copyForEvent(eventType, name);

    const jobs: Array<{
      channel: "webPush" | "sms" | "email" | "inApp";
      run: () => Promise<unknown>;
    }> = [];

    if (petParentUserId) {
      jobs.push({
        channel: "inApp",
        run: () =>
          insertInAppNotification({
            userId: petParentUserId,
            title: copy.title,
            body: trackingData.message || copy.body,
            type: copy.type,
            href: deepLink,
          }),
      });

      // Web Push for all four event types
      jobs.push({
        channel: "webPush",
        run: () =>
          sendWebPushToUser({
            userId: petParentUserId,
            title: copy.title,
            body: trackingData.message || copy.body,
            url: deepLink,
            tag: `pawreport-${eventType.toLowerCase()}`,
            data: {
              bookingId: id,
              eventType,
              petName: name,
            },
          }),
      });
    }

    if (eventType === "WALK_START") {
      jobs.push({
        channel: "sms",
        run: () =>
          sendSms(
            phone,
            `SitGuru: ${name}'s walk has started! Follow live: ${smsLink}`,
          ),
      });
    }

    if (eventType === "WALK_END") {
      jobs.push({
        channel: "sms",
        run: () =>
          sendSms(
            phone,
            `SitGuru: ${name} is home safe! View PawReport: ${smsLink}`,
          ),
      });

      jobs.push({
        channel: "email",
        run: async () => {
          const extras = await loadWalkSummaryExtras(id);
          return sendFinalReportEmail(email, {
            petName: name,
            guruName: String(trackingData.guruName || "Your Guru"),
            bookingId: id,
            distanceMiles:
              trackingData.distanceMiles ?? extras.distanceMiles,
            durationMinutes:
              trackingData.durationMinutes ?? extras.durationMinutes,
            photoCount: trackingData.photoCount ?? extras.photoCount,
            photoUrls: trackingData.photoUrls ?? extras.photoUrls,
            pottyEvents: trackingData.pottyEvents ?? extras.pottyEvents,
            timelineEvents: extras.timelineEvents,
            startedAt: extras.startedAt,
            // Product CTA format: https://sitguru.com/{bookingId}
            liveUrl: smsLink,
            endedAt: extras.endedAt,
          });
        },
      });
    }

    // Fan-out every channel independently.
    // A rejected Resend/VAPID promise cannot cancel Twilio (or any sibling job).
    const simulate = process.env.SIMULATE_WALK === "1";
    if (simulate) {
      console.log("[SIMULATE_WALK] dispatch jobs", {
        bookingId: id,
        eventType,
        petName: name,
        phone: phone || null,
        email: email || null,
        smsLink,
        deepLink,
        channels: jobs.map((job) => job.channel),
      });
    }

    // Fan-out every channel independently.
    // A rejected Resend/VAPID promise cannot cancel Twilio (or any sibling job).
    const settledRaw = await Promise.allSettled(jobs.map((job) => job.run()));

    const settled = settledRaw.map((result, index) => {
      const channel = jobs[index].channel;
      if (result.status === "fulfilled") {
        if (simulate) {
          console.log(`[SIMULATE_WALK] allSettled ✓ ${channel}`, result.value);
        }
        return {
          channel,
          status: "fulfilled" as const,
          value: result.value,
        };
      }

      console.warn(
        `[dispatchPawReportEvent] ${channel} rejected (non-fatal):`,
        result.reason,
      );

      if (simulate) {
        console.warn(`[SIMULATE_WALK] allSettled ✗ ${channel}`, result.reason);
      }

      return {
        channel,
        status: "rejected" as const,
        reason:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason || "Channel failed"),
      };
    });

    // Always return ok:true for channel-level failures — GPS/SSE must continue
    // Opportunistic platform safety scan (non-blocking): ACTIVE_TRACKING with
    // no GPS for >15m → FLAGGED_ALERT + admin console notifications.
    if (eventType === "WALK_START" || eventType === "WALK_END" || eventType === "WALK_BREAK") {
      void evaluateStaleGpsSafetyAlerts().catch((scanError) => {
        console.warn(
          "[dispatchPawReportEvent] stale GPS scan non-fatal:",
          scanError,
        );
      });
    }

    return { ok: true, settled };
  } catch (error) {
    console.error("[dispatchPawReportEvent] unexpected non-fatal:", error);
    return {
      ok: false,
      settled: [
        {
          channel: "inApp",
          status: "rejected",
          reason:
            error instanceof Error ? error.message : "Dispatch failed",
        },
      ],
    };
  }
}

/** Backward-compatible alias used by earlier walk-action wiring */
export async function sendPawReportNotification(
  bookingId: string,
  eventType: string,
  payload: PawReportTrackingData & { petName?: string } = {},
) {
  const normalized = String(eventType || "")
    .trim()
    .toUpperCase()
    .replace("BREAK_START", "WALK_BREAK")
    .replace("POTTY_PEE", "POTTY_BREAK")
    .replace("POTTY_POOP", "POTTY_BREAK") as PawReportDispatchEventType;

  return dispatchPawReportEvent(
    bookingId,
    normalized,
    String(payload.petName || "Scout"),
    payload,
  );
}
