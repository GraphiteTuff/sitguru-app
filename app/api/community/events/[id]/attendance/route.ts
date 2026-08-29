import { NextRequest, NextResponse } from "next/server";
import {
  getEventAttendanceCounts,
  getGuestEventAttendance,
  getUserEventAttendance,
  isValidGuestKey,
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

function readGuestKey(req: NextRequest, body?: Record<string, unknown>) {
  const fromBody = body?.guestKey ?? body?.guest_key;
  if (isValidGuestKey(fromBody)) return String(fromBody).trim();
  const header = req.headers.get("x-sitguru-guest-key");
  if (isValidGuestKey(header)) return header!.trim();
  return null;
}

type ListedEvent = {
  id: string;
  title: string;
  slug: string;
  partner_id: string | null;
  kind: "partner" | "discovery";
};

/** Accept partner community_events OR discovery listings shown on cards. */
async function resolveListedEvent(id: string): Promise<ListedEvent | null> {
  const { data: event } = await supabaseAdmin
    .from("community_events")
    .select("id, title, slug, partner_id, status, cancelled_at")
    .eq("id", id)
    .maybeSingle();

  if (event?.id) {
    if (event.cancelled_at || event.status === "cancelled") {
      return null;
    }
    return {
      id: String(event.id),
      title: String(event.title || "Event"),
      slug: String(event.slug || ""),
      partner_id: event.partner_id ? String(event.partner_id) : null,
      kind: "partner",
    };
  }

  const { data: discovery } = await supabaseAdmin
    .from("community_event_discoveries")
    .select("id, title, external_id")
    .eq("id", id)
    .maybeSingle();

  if (discovery?.id) {
    const external = String(discovery.external_id || discovery.id);
    return {
      id: String(discovery.id),
      title: String(discovery.title || "Pet Event"),
      slug: `google-${external.slice(0, 48)}`,
      partner_id: null,
      kind: "discovery",
    };
  }

  return null;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const counts = await getEventAttendanceCounts(id);
  const resolved = await resolveRequestUser(req);
  const guestKey = readGuestKey(req);

  let mine = null;
  if (resolved?.user.id) {
    mine = await getUserEventAttendance(id, resolved.user.id);
  } else if (guestKey) {
    mine = await getGuestEventAttendance(id, guestKey);
  }

  return NextResponse.json(
    {
      counts,
      mine,
      authenticated: Boolean(resolved?.user.id),
      guest: Boolean(!resolved?.user.id && guestKey),
    },
    { headers: mobileCorsHeaders(req) },
  );
}

export async function POST(req: NextRequest, context: RouteContext) {
  const resolved = await resolveRequestUser(req);
  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const status = String(body.status || "going") as AttendanceStatus;
  const guestKey = readGuestKey(req, body);

  if (!["going", "interested", "cancelled"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status." },
      { status: 400, headers: mobileCorsHeaders(req) },
    );
  }

  if (!resolved?.user.id && !guestKey) {
    return NextResponse.json(
      { error: "Guest key required when not signed in." },
      { status: 400, headers: mobileCorsHeaders(req) },
    );
  }

  const event = await resolveListedEvent(id);
  if (!event) {
    return NextResponse.json(
      { error: "Event not found." },
      { status: 404, headers: mobileCorsHeaders(req) },
    );
  }

  const result = await setEventAttendance({
    eventId: event.id,
    userId: resolved?.user.id || null,
    guestKey: resolved?.user.id ? null : guestKey,
    status,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: mobileCorsHeaders(req) },
    );
  }

  if (status === "going" && resolved?.user.id && event.partner_id) {
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

  const counts = await getEventAttendanceCounts(event.id);

  return NextResponse.json(
    {
      ok: true,
      attendance: result.attendance,
      counts,
      authenticated: Boolean(resolved?.user.id),
    },
    { headers: mobileCorsHeaders(req) },
  );
}
