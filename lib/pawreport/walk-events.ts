// lib/pawreport/walk-events.ts
/**
 * Canonical PawReport realtime event contract (Guru phone → Pet Parent phone).
 * Enforce this payload shape on SSE `/api/walk/stream/[bookingId]` and
 * action responses from `/api/walk/[bookingId]/actions`.
 */

/** Strict event type enum for the live walk pipeline */
export type PawReportLiveEventType =
  | "WALK_START"
  | "GPS_PING"
  | "BREAK_START"
  | "BREAK_END"
  | "POTTY_PEE"
  | "POTTY_POOP"
  | "WALK_END"
  /** Connection bootstrap + keep-alive (not user actions) */
  | "SNAPSHOT"
  | "HEARTBEAT";

export interface PawReportLiveEventMetrics {
  distanceMiles: number;
  durationMinutes: number;
}

export interface PawReportLiveEventData {
  latitude?: number;
  longitude?: number;
  timestamp: string;
  message?: string;
  currentMetrics?: PawReportLiveEventMetrics;
  /** Optional accuracy from device GPS */
  accuracy?: number | null;
  /** Walk track row id when a session is active */
  walkTrackId?: string | null;
  /** Pet display name for snackbars / notifications */
  petName?: string;
}

/**
 * Solid realtime payload — every walk state change uses this shape.
 */
export interface PawReportLiveEvent {
  bookingId: string;
  eventType: PawReportLiveEventType;
  data: PawReportLiveEventData;
}

/** Derived UI tracking state (computed from eventType stream) */
export type WalkTrackingState = "idle" | "active" | "on_break" | "ended";

export type WalkMapMarkerKind =
  | "start"
  | "break"
  | "break_end"
  | "potty_pee"
  | "potty_poop"
  | "end";

export type WalkMapMarker = {
  id: string;
  kind: WalkMapMarkerKind;
  lat: number;
  lng: number;
  label: string;
  createdAt: string;
};

export type WalkGeoPoint = {
  lat: number;
  lng: number;
  accuracy?: number | null;
  recordedAt: string;
};

/** Guru action names posted to /api/walk/[bookingId]/actions */
export type WalkActionName =
  | "start_walk"
  | "take_break"
  | "resume"
  | "potty_break"
  | "end_walk"
  | "ping_coordinate";

export function metersToMiles(meters: number) {
  const safe = Number.isFinite(meters) ? Math.max(0, meters) : 0;
  return Number((safe / 1609.344).toFixed(2));
}

export function secondsToMinutes(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return Number((safe / 60).toFixed(1));
}

export function buildLiveMetrics(
  distanceMeters: number,
  durationSeconds: number,
): PawReportLiveEventMetrics {
  return {
    distanceMiles: metersToMiles(distanceMeters),
    durationMinutes: secondsToMinutes(durationSeconds),
  };
}

export function trackingStateFromEventType(
  eventType: PawReportLiveEventType,
  previous: WalkTrackingState = "idle",
): WalkTrackingState {
  switch (eventType) {
    case "WALK_START":
    case "BREAK_END":
    case "GPS_PING":
      return "active";
    case "BREAK_START":
      return "on_break";
    case "WALK_END":
      return "ended";
    case "POTTY_PEE":
    case "POTTY_POOP":
      return previous === "idle" ? "active" : previous;
    case "SNAPSHOT":
    case "HEARTBEAT":
    default:
      return previous;
  }
}

export function snackbarFromLiveEvent(event: PawReportLiveEvent): {
  tone: "info" | "success" | "potty" | "break";
  title: string;
  body: string;
} | null {
  const pet = event.data.petName || "Scout";
  const body = event.data.message;

  switch (event.eventType) {
    case "WALK_START":
      return {
        tone: "success",
        title: "Walk started",
        body: body || `${pet}'s walk is live — follow the route.`,
      };
    case "BREAK_START":
      return {
        tone: "break",
        title: "On a break",
        body: body || `${pet} and Guru are pausing — GPS drift ignored.`,
      };
    case "BREAK_END":
      return {
        tone: "info",
        title: "Walk resumed",
        body: body || `${pet} is on the move again.`,
      };
    case "POTTY_PEE":
    case "POTTY_POOP":
      return {
        tone: "potty",
        title: "Potty update",
        body: body || `${pet} just went potty.`,
      };
    case "WALK_END":
      return {
        tone: "success",
        title: "Walk complete",
        body: body || `${pet} is back — PawReport is ready.`,
      };
    default:
      return null;
  }
}

/** @deprecated Use PawReportLiveEvent — kept as alias during migration */
export type WalkStreamEvent = PawReportLiveEvent;
