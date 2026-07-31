// app/api/pawreports/[bookingId]/route.ts
/**
 * GET /api/pawreports/[bookingId]
 * -----------------------------------------------------------------------
 * Pet Parent + assigned Guru (and admin) read access to the live PawReport
 * stream: walk metrics, photos, status logs, recent notes.
 *
 * Frontend hook: hooks/usePawReportLive.ts → polls this endpoint.
 */

import { NextResponse } from "next/server";
import { resolvePawReportAccess } from "@/lib/pawreport/access";
import { buildPawReportLivePayload } from "@/lib/pawreport/service";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { bookingId: rawBookingId } = await context.params;
  const bookingId = String(rawBookingId || "").trim();

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

  const access = await resolvePawReportAccess({
    bookingId,
    userId: user.id,
    email: user.email,
  });

  if (!access?.canRead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await buildPawReportLivePayload({ bookingId, access });

  return NextResponse.json({
    ok: true,
    report: payload,
  });
}
