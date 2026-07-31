// app/api/walk/[bookingId]/actions/route.ts
/**
 * Guru phone walk action endpoint
 * -----------------------------------------------------------------------
 * POST /api/walk/[bookingId]/actions
 * Body: { action, lat?, lng?, accuracy?, pottyKind?, note? }
 *
 * Actions: start_walk | take_break | resume | potty_break | end_walk | ping_coordinate
 * Broadcasts SSE via walk-event-bus and triggers Pet Parent notifications.
 */

import { NextResponse } from "next/server";
import { executeWalkAction } from "@/lib/pawreport/walk-actions";
import type { WalkActionName } from "@/lib/pawreport/walk-events";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

const ALLOWED_ACTIONS = new Set<WalkActionName>([
  "start_walk",
  "take_break",
  "resume",
  "potty_break",
  "end_walk",
  "ping_coordinate",
]);

export async function POST(request: Request, context: RouteContext) {
  const { bookingId: raw } = await context.params;
  const bookingId = String(raw || "").trim();

  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking ID." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    lat?: number | null;
    lng?: number | null;
    accuracy?: number | null;
    pottyKind?: "pee" | "poop";
    note?: string;
  };

  const action = String(body.action || "").trim() as WalkActionName;
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Invalid walk action." }, { status: 400 });
  }

  const result = await executeWalkAction({
    bookingId,
    userId: user.id,
    email: user.email,
    action,
    lat: body.lat,
    lng: body.lng,
    accuracy: body.accuracy,
    pottyKind: body.pottyKind,
    note: body.note,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, event: result.event });
}
