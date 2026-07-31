// app/api/guru/walk/ping/route.ts
/**
 * Lightweight Guru GPS ping endpoint (battery-friendly batches).
 * POST /api/guru/walk/ping
 * Body: { bookingId, lat, lng, accuracy? }
 *
 * Delegates to executeWalkAction("ping_coordinate") so SSE + DB stay in sync.
 */

import { NextResponse } from "next/server";
import { executeWalkAction } from "@/lib/pawreport/walk-actions";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    bookingId?: string;
    lat?: number | null;
    lng?: number | null;
    accuracy?: number | null;
  } | null;

  const bookingId = String(body?.bookingId || "").trim();
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId." }, { status: 400 });
  }

  if (body?.lat == null || body?.lng == null) {
    return NextResponse.json(
      { error: "lat and lng are required for GPS pings." },
      { status: 400 },
    );
  }

  const result = await executeWalkAction({
    bookingId,
    userId: user.id,
    email: user.email,
    action: "ping_coordinate",
    lat: Number(body.lat),
    lng: Number(body.lng),
    accuracy: body.accuracy == null ? null : Number(body.accuracy),
  });

  if (!result.ok) {
    // 409 while on break is expected — do not treat as hard failure for the harness
    return NextResponse.json(
      { ok: false, error: result.error, status: result.status },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    event: result.event,
    metrics: result.event.data.currentMetrics ?? null,
  });
}
