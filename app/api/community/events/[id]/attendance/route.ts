import { NextRequest, NextResponse } from "next/server";
import {
  getEventAttendanceCounts,
  getUserEventAttendance,
  setEventAttendance,
  type AttendanceStatus,
} from "@/lib/community/attendance";
import { notifyPartnerSomeoneIsGoing } from "@/lib/community/event-notifications";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const counts = await getEventAttendanceCounts(id);
  const resolved = await resolveRequestUser(req);
  const mine = resolved?.user.id
    ? await getUserEventAttendance(id, resolved.user.id)
    : null;

  return NextResponse.json(
    { counts, mine },
    { headers: mobileCorsHeaders(req) },
  );
}

export async function POST(req: NextRequest, context: RouteContext) {
  const resolved = await resolveRequestUser(req);
  if (!resolved?.user.id) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: mobileCorsHeaders(req) },
    );
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "going") as AttendanceStatus;

  if (!["going", "interested", "cancelled"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status." },
      { status: 400, headers: mobileCorsHeaders(req) },
    );
  }

  const { data: event } = await supabaseAdmin
    .from("community_events")
    .select("id, title, slug, partner_id, status, cancelled_at")
    .eq("id", id)
    .maybeSingle();

  if (!event || event.status !== "published" || event.cancelled_at) {
    return NextResponse.json(
      { error: "Published event required." },
      { status: 400, headers: mobileCorsHeaders(req) },
    );
  }

  const result = await setEventAttendance({
    eventId: id,
    userId: resolved.user.id,
    status,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: mobileCorsHeaders(req) },
    );
  }

  if (status === "going") {
    void notifyPartnerSomeoneIsGoing({
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        partner_id: event.partner_id,
      },
      attendeeRole: result.attendance.attendance_role,
    });
  }

  const counts = await getEventAttendanceCounts(id);

  return NextResponse.json(
    {
      ok: true,
      attendance: result.attendance,
      counts,
    },
    { headers: mobileCorsHeaders(req) },
  );
}
