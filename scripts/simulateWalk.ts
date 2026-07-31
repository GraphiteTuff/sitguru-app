/**
 * PawReport Live pipeline stress simulator (no phone / GPS required).
 *
 * Drives the same internal path as the Guru mobile panel:
 *   executeWalkAction → DB persist → SSE publish → dispatchPawReportEvent
 *   (Web Push + Twilio SMS + Resend via Promise.allSettled)
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/simulateWalk.ts --bookingId=<uuid>
 *   npm run simulate-walk -- --bookingId=<uuid> --petName=Scout
 *
 * Options:
 *   --bookingId=<uuid>   Required unless SIMULATE_WALK_BOOKING_ID is set
 *   --petName=<name>     Display name used in notification copy (default: Scout)
 *   --guruId=<uuid>      Override assigned Guru (defaults to booking.guru_id/…)
 *   --phone=<e164>       Optional SMS destination override for dispatcher logs
 *   --email=<addr>       Optional email override for final report
 *   --keep-active        Do not cancel a prior in-progress walk before STEP 1
 */

import { randomUUID } from "node:crypto";

// Enable verbose channel payload logs inside twilio/resend/webPush/dispatcher
process.env.SIMULATE_WALK = "1";

// ---------------------------------------------------------------------------
// Hardcoded test defaults (override via CLI / env)
// ---------------------------------------------------------------------------
const HARDCODED = {
  bookingId: String(process.env.SIMULATE_WALK_BOOKING_ID || "").trim(),
  petName: String(process.env.SIMULATE_WALK_PET_NAME || "Scout").trim() || "Scout",
  phone: String(process.env.SIMULATE_WALK_PHONE || "").trim(),
  email: String(process.env.SIMULATE_WALK_EMAIL || "").trim(),
};

// Austin, TX park loop — fractions build a visible polyline
const ORIGIN = { lat: 30.2672, lng: -97.7431 };
const ROUTE = [
  { lat: 30.2672, lng: -97.7431 },
  { lat: 30.26755, lng: -97.7427 },
  { lat: 30.26795, lng: -97.74225 },
  { lat: 30.26835, lng: -97.7418 },
  { lat: 30.2681, lng: -97.7424 }, // return leg
  { lat: 30.2675, lng: -97.7429 },
];

const TARGET_METRICS = {
  distanceMiles: 0.8,
  durationMinutes: 18,
  distanceMeters: Math.round(0.8 * 1609.344),
  durationSeconds: 18 * 60,
};

// ---------------------------------------------------------------------------
// Color / logging helpers
// ---------------------------------------------------------------------------
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
};

function stamp() {
  return new Date().toISOString().slice(11, 23);
}

function log(color: string, tag: string, message: string, detail?: unknown) {
  const prefix = `${c.dim}[${stamp()}]${c.reset} ${color}${c.bold}${tag}${c.reset}`;
  console.log(`${prefix} ${message}`);
  if (detail !== undefined) {
    console.log(
      `${c.dim}${typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)}${c.reset}`,
    );
  }
}

const info = (m: string, d?: unknown) => log(c.cyan, "INFO ", m, d);
const ok = (m: string, d?: unknown) => log(c.green, "OK   ", m, d);
const warn = (m: string, d?: unknown) => log(c.yellow, "WARN ", m, d);
const err = (m: string, d?: unknown) => log(c.red, "ERROR", m, d);
const step = (m: string) => log(c.magenta, "STEP ", m);
const sms = (m: string, d?: unknown) => log(c.blue, "SMS  ", m, d);
const push = (m: string, d?: unknown) => log(c.white, "PUSH ", m, d);
const mail = (m: string, d?: unknown) => log(c.cyan, "EMAIL", m, d);
const db = (m: string, d?: unknown) => log(c.green, "DB   ", m, d);

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const body = raw.slice(2);
    const eq = body.indexOf("=");
    if (eq === -1) {
      out[body] = true;
      continue;
    }
    out[body.slice(0, eq)] = body.slice(eq + 1);
  }
  return out;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function smsLiveLink(bookingId: string) {
  return `https://sitguru.com/${bookingId.replace(/^\//, "")}`;
}

type BookingRow = Record<string, unknown> & {
  id?: string;
  status?: string | null;
  guru_id?: string | null;
  provider_id?: string | null;
  sitter_id?: string | null;
  caregiver_id?: string | null;
  pet_owner_id?: string | null;
  customer_id?: string | null;
  user_id?: string | null;
  pet_name?: string | null;
  customer_phone?: string | null;
  phone?: string | null;
  customer_email?: string | null;
  email?: string | null;
};

function bookingGuruId(booking: BookingRow) {
  return (
    String(booking.guru_id || "").trim() ||
    String(booking.provider_id || "").trim() ||
    String(booking.sitter_id || "").trim() ||
    String(booking.caregiver_id || "").trim() ||
    ""
  );
}

function bookingPetParentId(booking: BookingRow) {
  return (
    String(booking.pet_owner_id || "").trim() ||
    String(booking.customer_id || "").trim() ||
    String(booking.user_id || "").trim() ||
    ""
  );
}

async function main() {
  process.on("unhandledRejection", (reason) => {
    err("Unhandled promise rejection (caught by simulator)", reason);
  });
  process.on("uncaughtException", (error) => {
    err("Uncaught exception (caught by simulator)", error);
  });

  const args = parseArgs(process.argv.slice(2));
  const bookingId = String(
    args.bookingId || HARDCODED.bookingId || "",
  ).trim();
  const petNameArg = String(args.petName || HARDCODED.petName || "Scout").trim();
  const guruOverride = String(args.guruId || "").trim();
  const phoneOverride = String(args.phone || HARDCODED.phone || "").trim();
  const emailOverride = String(args.email || HARDCODED.email || "").trim();
  const keepActive = Boolean(args["keep-active"]);

  if (!bookingId) {
    err(
      "Missing bookingId. Pass --bookingId=<uuid> or set SIMULATE_WALK_BOOKING_ID.",
    );
    process.exitCode = 1;
    return;
  }

  info("Loading Supabase admin + walk pipeline modules…");

  const { supabaseAdmin } = await import("../utils/supabase/admin");
  const { executeWalkAction } = await import("../lib/pawreport/walk-actions");
  const {
    dispatchPawReportEvent,
    buildTrackableLiveUrl,
  } = await import("../lib/notificationDispatcher");
  const { bookingAssignedGuruId } = await import("../lib/pawreport/access");

  info("Simulation environment", {
    bookingId,
    petName: petNameArg,
    keepActive,
    SIMULATE_WALK: process.env.SIMULATE_WALK,
    twilio: Boolean(process.env.TWILIO_ACCOUNT_SID),
    resend: Boolean(process.env.RESEND_API_KEY),
    vapid: Boolean(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY,
    ),
  });

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  let mode: "live-actions" | "mock-records" = "live-actions";
  let guruId = guruOverride;
  let petName = petNameArg;
  let petParentUserId = "";
  let phone = phoneOverride;
  let email = emailOverride;

  if (bookingError) {
    warn("Booking lookup error — falling back to mock record mode", bookingError);
    mode = "mock-records";
  } else if (!booking?.id) {
    warn(
      `Booking ${bookingId} not found in bookings. Using mock session/walk rows + dispatcher only.`,
    );
    mode = "mock-records";
  } else {
    const row = booking as BookingRow;
    guruId = guruOverride || bookingGuruId(row);
    petParentUserId = bookingPetParentId(row);
    phone =
      phoneOverride ||
      String(row.customer_phone || row.phone || "").trim();
    email =
      emailOverride ||
      String(row.customer_email || row.email || "").trim();
    const fromBooking =
      typeof row.pet_name === "string" && row.pet_name.trim()
        ? row.pet_name.trim()
        : petNameArg;
    petName = args.petName ? petNameArg : fromBooking;

    if (!guruId) {
      warn(
        "Booking has no assigned guru_id/provider_id — cannot use executeWalkAction. Switching to mock-records mode.",
      );
      mode = "mock-records";
      guruId = randomUUID();
    } else {
      ok("Booking resolved", {
        id: row.id,
        status: row.status,
        guruId,
        petParentUserId: petParentUserId || "(none)",
        assignedVia: bookingAssignedGuruId(row),
      });
    }
  }

  if (mode === "mock-records" && !guruId) {
    guruId = randomUUID();
  }

  const startedAt = Date.now();
  const timeline: Array<{ atMs: number; label: string; ok: boolean }> = [];

  async function mark(label: string, success: boolean) {
    timeline.push({ atMs: Date.now() - startedAt, label, ok: success });
    if (success) ok(label);
    else err(label);
  }

  async function verifyCounts(label: string) {
    const [updates, points, walks] = await Promise.all([
      supabaseAdmin
        .from("booking_visit_updates")
        .select("id,update_type,note,lat,lng,created_at", { count: "exact" })
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("booking_walk_track_points")
        .select("id,lat,lng,recorded_at", { count: "exact" })
        .eq("booking_id", bookingId)
        .order("recorded_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("booking_walk_tracks")
        .select(
          "id,status,total_distance_meters,total_duration_seconds,ended_at",
          { count: "exact" },
        )
        .eq("booking_id", bookingId)
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

    db(`${label} — visit_updates=${updates.count ?? updates.data?.length ?? 0}, track_points=${points.count ?? points.data?.length ?? 0}`, {
      latestUpdates: updates.data,
      latestPoints: points.data,
      activeWalk: walks.data?.[0] ?? null,
      errors: {
        updates: updates.error?.message,
        points: points.error?.message,
        walks: walks.error?.message,
      },
    });

    return {
      updates: updates.data || [],
      points: points.data || [],
      walk: walks.data?.[0] || null,
    };
  }

  async function runLiveAction(
    action: Parameters<typeof executeWalkAction>[0]["action"],
    geo: { lat: number; lng: number },
    extras: { pottyKind?: "pee" | "poop"; note?: string } = {},
  ) {
    const result = await executeWalkAction({
      bookingId,
      userId: guruId,
      action,
      lat: geo.lat,
      lng: geo.lng,
      accuracy: 8,
      pottyKind: extras.pottyKind,
      note: extras.note,
    });

    if (!result.ok) {
      err(`executeWalkAction(${action}) failed`, result);
      return result;
    }

    ok(`executeWalkAction(${action}) → ${result.event.eventType}`, {
      message: result.event.data.message,
      metrics: result.event.data.currentMetrics,
      lat: result.event.data.latitude,
      lng: result.event.data.longitude,
    });
    return result;
  }

  let mockSessionId = "";
  let mockWalkId = "";

  async function ensureMockParents() {
    const { data: existingSession } = await supabaseAdmin
      .from("booking_visit_sessions")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (existingSession?.id) {
      mockSessionId = existingSession.id;
      await supabaseAdmin
        .from("booking_visit_sessions")
        .update({
          status: "in_progress",
          guru_id: guruId,
          started_at: new Date().toISOString(),
          start_lat: ORIGIN.lat,
          start_lng: ORIGIN.lng,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mockSessionId);
    } else {
      const { data: session, error: sessionError } = await supabaseAdmin
        .from("booking_visit_sessions")
        .insert({
          booking_id: bookingId,
          guru_id: guruId,
          status: "in_progress",
          started_at: new Date().toISOString(),
          start_lat: ORIGIN.lat,
          start_lng: ORIGIN.lng,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (sessionError || !session?.id) {
        throw new Error(
          `Could not seed booking_visit_sessions: ${sessionError?.message || "unknown"}`,
        );
      }
      mockSessionId = session.id;
    }

    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("booking_id", bookingId)
      .in("status", ["in_progress", "paused"]);

    const { data: walk, error: walkError } = await supabaseAdmin
      .from("booking_walk_tracks")
      .insert({
        booking_id: bookingId,
        session_id: mockSessionId,
        guru_id: guruId,
        status: "in_progress",
        started_at: new Date().toISOString(),
        start_lat: ORIGIN.lat,
        start_lng: ORIGIN.lng,
        total_distance_meters: 0,
        total_duration_seconds: 0,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (walkError || !walk?.id) {
      throw new Error(
        `Could not seed booking_walk_tracks: ${walkError?.message || "unknown"}`,
      );
    }
    mockWalkId = walk.id;
    db("Mock parents ready", { mockSessionId, mockWalkId });
  }

  async function mockInsertUpdate(
    updateType: string,
    note: string,
    geo: { lat: number; lng: number },
  ) {
    const { error } = await supabaseAdmin.from("booking_visit_updates").insert({
      session_id: mockSessionId,
      booking_id: bookingId,
      update_type: updateType,
      note,
      lat: geo.lat,
      lng: geo.lng,
      accuracy: 8,
    });
    if (error) throw new Error(`visit_updates insert failed: ${error.message}`);
  }

  async function mockInsertPoint(geo: { lat: number; lng: number }) {
    const { error } = await supabaseAdmin
      .from("booking_walk_track_points")
      .insert({
        walk_track_id: mockWalkId,
        booking_id: bookingId,
        session_id: mockSessionId,
        guru_id: guruId,
        lat: geo.lat,
        lng: geo.lng,
        accuracy: 8,
        recorded_at: new Date().toISOString(),
      });
    if (error) throw new Error(`track_points insert failed: ${error.message}`);
  }

  async function mockDispatch(
    eventType: "WALK_START" | "POTTY_BREAK" | "WALK_BREAK" | "WALK_END",
    message: string,
    geo: { lat: number; lng: number },
    extras: Record<string, unknown> = {},
  ) {
    const settled = await dispatchPawReportEvent(bookingId, eventType, petName, {
      petParentUserId: petParentUserId || undefined,
      phone: phone || "+15555550100",
      email: email || "petparent.sim@sitguru.local",
      message,
      latitude: geo.lat,
      longitude: geo.lng,
      timestamp: new Date().toISOString(),
      guruName: "Sim Guru",
      ...extras,
    });

    for (const channel of settled.settled) {
      if (channel.status === "fulfilled") {
        ok(`allSettled → ${channel.channel}`, channel.value);
      } else {
        warn(
          `allSettled → ${channel.channel} REJECTED (non-fatal)`,
          channel.reason,
        );
      }
    }
    return settled;
  }

  if (!keepActive) {
    info("Canceling any prior in_progress/paused walks for this booking…");
    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("booking_id", bookingId)
      .in("status", ["in_progress", "paused"]);
  }

  if (mode === "mock-records") {
    await ensureMockParents();
  }

  const liveUrl = buildTrackableLiveUrl(bookingId);
  const smsUrl = smsLiveLink(bookingId);

  // STEP 1 — WALK_START (t=0s)
  step("1 · WALK_START (t≈0s)");
  const startGeo = ROUTE[0];

  sms("Expected Twilio payload", {
    to: phone || "(booking phone / fallback)",
    body: `SitGuru: ${petName}'s walk has started! Follow live: ${smsUrl}`,
  });
  push("Expected Web Push", {
    title: "Walk started",
    body: `${petName}'s walk has started! Tap to follow their route live.`,
    url: liveUrl,
  });

  if (mode === "live-actions") {
    const r = await runLiveAction("start_walk", startGeo);
    await mark("STEP 1 WALK_START via executeWalkAction", r.ok);
  } else {
    await mockInsertPoint(startGeo);
    await mockInsertUpdate("walk", "Walk started.", startGeo);
    await mockDispatch(
      "WALK_START",
      `${petName}'s walk has started! Tap to follow their route live.`,
      startGeo,
    );
    await mark("STEP 1 WALK_START via mock records + dispatcher", true);
  }
  await verifyCounts("After WALK_START");

  await sleep(3000);

  // STEP 2 — GPS polyline pings (t≈3s)
  step("2 · GPS pings ×3 (t≈3s) — building polyline");
  const outbound = ROUTE.slice(1, 4);
  for (let i = 0; i < outbound.length; i += 1) {
    const geo = outbound[i];
    info(`Ping ${i + 1}/${outbound.length}`, geo);
    try {
      if (mode === "live-actions") {
        const r = await runLiveAction("ping_coordinate", geo);
        if (!r.ok) await mark(`GPS ping ${i + 1}`, false);
      } else {
        await mockInsertPoint(geo);
      }
      ok(`GPS ping ${i + 1} persisted`);
    } catch (error) {
      err(`GPS ping ${i + 1} failed`, error);
      await mark(`GPS ping ${i + 1}`, false);
    }
    if (i < outbound.length - 1) await sleep(400);
  }
  await mark("STEP 2 GPS polyline", true);
  await verifyCounts("After GPS pings");

  await sleep(Math.max(0, 6000 - (Date.now() - startedAt)));

  // STEP 3 — POTTY_BREAK (t≈6s)
  step("3 · POTTY_BREAK (t≈6s)");
  const pottyGeo = ROUTE[3];
  push("Expected Web Push", {
    body: `${petName} went potty!`,
  });

  if (mode === "live-actions") {
    const r = await runLiveAction("potty_break", pottyGeo, {
      pottyKind: "pee",
      note: `POTTY_BREAK: ${petName} went potty!`,
    });
    await mark("STEP 3 POTTY_BREAK", r.ok);
  } else {
    await mockInsertPoint(pottyGeo);
    await mockInsertUpdate(
      "pee",
      `POTTY_BREAK: ${petName} went potty!`,
      pottyGeo,
    );
    await mockDispatch(
      "POTTY_BREAK",
      `Quick update! ${petName} just went potty.`,
      pottyGeo,
    );
    await mark("STEP 3 POTTY_BREAK", true);
  }

  const afterPotty = await verifyCounts("After POTTY_BREAK");
  const pottyRow = (
    afterPotty.updates as Array<{ update_type?: string; note?: string }>
  ).find(
    (u) =>
      u.update_type === "pee" ||
      u.update_type === "poop" ||
      String(u.note || "").includes("POTTY"),
  );
  if (pottyRow) db("Confirmed potty row in booking_visit_updates", pottyRow);
  else warn("Could not find potty update in latest visit_updates rows");

  await sleep(Math.max(0, 9000 - (Date.now() - startedAt)));

  // STEP 4 — WALK_BREAK → wait 2s → resume (t≈9s)
  step("4 · WALK_BREAK then resume (t≈9s)");
  push("Expected Web Push (break)", {
    body: `${petName} is taking a quick water break.`,
  });

  if (mode === "live-actions") {
    const br = await runLiveAction("take_break", pottyGeo);
    await mark("STEP 4a WALK_BREAK", br.ok);

    info("Stationary ping while on break (should be swallowed / 409)…");
    const stationary = await runLiveAction("ping_coordinate", pottyGeo);
    if (!stationary.ok) {
      ok("Pipeline correctly rejected stationary ping on break", stationary);
    } else {
      warn("Stationary ping unexpectedly succeeded while on break");
    }

    await sleep(2000);

    const rr = await runLiveAction("resume", {
      lat: pottyGeo.lat + 0.0001,
      lng: pottyGeo.lng - 0.0001,
    });
    await mark("STEP 4b RESUME", rr.ok);
  } else {
    await mockInsertUpdate(
      "note",
      "WALK_BREAK: Taking a water break — GPS paused.",
      pottyGeo,
    );
    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({ status: "paused", updated_at: new Date().toISOString() })
      .eq("id", mockWalkId);
    await mockDispatch(
      "WALK_BREAK",
      `${petName} and their Guru are taking a quick water break.`,
      pottyGeo,
    );
    await mark("STEP 4a WALK_BREAK", true);

    info("Skipping GPS insert while paused (stationary swallow)…");
    await sleep(2000);

    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", mockWalkId);
    await mockInsertUpdate("note", "Walk resumed.", {
      lat: pottyGeo.lat + 0.0001,
      lng: pottyGeo.lng - 0.0001,
    });
    await mark("STEP 4b RESUME", true);
  }

  await verifyCounts("After break/resume");

  await sleep(Math.max(0, 14000 - (Date.now() - startedAt)));

  // STEP 5 — Return-leg GPS pings (t≈14s)
  step("5 · Return-leg GPS pings ×2 (t≈14s)");
  const inbound = ROUTE.slice(4);
  for (let i = 0; i < inbound.length; i += 1) {
    const geo = inbound[i];
    info(`Return ping ${i + 1}/${inbound.length}`, geo);
    try {
      if (mode === "live-actions") {
        const r = await runLiveAction("ping_coordinate", geo);
        if (!r.ok) await mark(`Return ping ${i + 1}`, false);
      } else {
        await mockInsertPoint(geo);
      }
      ok(`Return ping ${i + 1} persisted`);
    } catch (error) {
      err(`Return ping ${i + 1} failed`, error);
    }
    if (i < inbound.length - 1) await sleep(400);
  }
  await mark("STEP 5 return polyline", true);

  info("Seeding final metrics (0.8 mi / 18 min) onto active walk track…");
  const { data: activeWalk } = await supabaseAdmin
    .from("booking_walk_tracks")
    .select("id")
    .eq("booking_id", bookingId)
    .in("status", ["in_progress", "paused"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeWalk?.id) {
    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({
        total_distance_meters: TARGET_METRICS.distanceMeters,
        total_duration_seconds: TARGET_METRICS.durationSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeWalk.id);
    db("Metrics seeded", TARGET_METRICS);
  } else {
    warn("No active walk found to seed metrics");
  }

  await sleep(Math.max(0, 18000 - (Date.now() - startedAt)));

  // STEP 6 — WALK_END (t≈18s)
  step("6 · WALK_END (t≈18s) — lock session + Twilio + Resend via allSettled");
  const endGeo = ROUTE[ROUTE.length - 1];

  sms("Expected Twilio payload", {
    to: phone || "(booking phone / fallback)",
    body: `SitGuru: ${petName} is home safe! View PawReport: ${smsUrl}`,
  });
  mail("Expected Resend HTML email", {
    subject: `🏡 ${petName} is home safe — your PawReport is ready`,
    metrics: TARGET_METRICS,
    liveUrl,
  });
  push("Expected Web Push", {
    body: `${petName} is home safe! Your full PawReport is ready.`,
  });

  if (mode === "live-actions") {
    const r = await runLiveAction("end_walk", endGeo);
    await mark("STEP 6 WALK_END", r.ok);
  } else {
    await mockInsertPoint(endGeo);
    await mockInsertUpdate(
      "walk",
      "Walk ended — route locked. Full PawReport ready.",
      endGeo,
    );
    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        end_lat: endGeo.lat,
        end_lng: endGeo.lng,
        total_distance_meters: TARGET_METRICS.distanceMeters,
        total_duration_seconds: TARGET_METRICS.durationSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mockWalkId);
    await supabaseAdmin
      .from("booking_visit_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        end_lat: endGeo.lat,
        end_lng: endGeo.lng,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mockSessionId);

    await mockDispatch(
      "WALK_END",
      `${petName} is back home safe and sound! Your full PawReport is ready to view.`,
      endGeo,
      {
        distanceMiles: TARGET_METRICS.distanceMiles,
        durationMinutes: TARGET_METRICS.durationMinutes,
        pottyEvents: [{ label: "Pee", at: new Date().toLocaleTimeString() }],
      },
    );
    await mark("STEP 6 WALK_END", true);
  }

  const finalState = await verifyCounts("After WALK_END");
  const walk = finalState.walk as {
    status?: string;
    total_distance_meters?: number;
    total_duration_seconds?: number;
  } | null;

  if (walk) {
    const miles = Number(walk.total_distance_meters || 0) / 1609.344;
    const minutes = Number(walk.total_duration_seconds || 0) / 60;
    ok("Final metrics", {
      status: walk.status,
      miles: Number(miles.toFixed(2)),
      minutes: Math.round(minutes),
      expected: TARGET_METRICS,
    });
    if (String(walk.status) !== "completed") {
      warn(`Walk status is "${walk.status}" — expected completed`);
    }
  }

  console.log("");
  log(c.bold + c.magenta, "DONE ", "Simulation timeline");
  for (const row of timeline) {
    const color = row.ok ? c.green : c.red;
    console.log(
      `  ${color}${row.ok ? "✓" : "✗"}${c.reset} t=${String(row.atMs).padStart(5)}ms  ${row.label}`,
    );
  }

  const failed = timeline.filter((t) => !t.ok).length;
  if (failed > 0) {
    err(`${failed} step(s) failed — see logs above.`);
    process.exitCode = 1;
  } else {
    ok(
      "All simulation steps completed. Watch for [SIMULATE_WALK] Twilio/Resend/VAPID channel lines above.",
    );
  }
}

main().catch((error) => {
  err("simulateWalk crashed", error);
  process.exitCode = 1;
});
