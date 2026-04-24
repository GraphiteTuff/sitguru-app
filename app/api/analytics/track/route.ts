import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type TrackBody = {
  eventName?: string;
  eventType?: string;
  role?: string;
  source?: string;
  pagePath?: string;
  guruId?: string;
  bookingId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as TrackBody | null;

    const eventName = safeString(body?.eventName);
    const eventType = safeString(body?.eventType);
    const role = safeString(body?.role);
    const source = safeString(body?.source);
    const pagePath = safeString(body?.pagePath);
    const guruId = safeString(body?.guruId);
    const bookingId = safeString(body?.bookingId);
    const sessionId = safeString(body?.sessionId);

    if (!eventName) {
      return NextResponse.json(
        { error: "Missing eventName." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabaseAdmin.from("analytics_events").insert({
      user_id: user?.id || null,
      session_id: sessionId || null,
      event_name: eventName,
      event_type: eventType || null,
      role: role || null,
      source: source || null,
      page_path: pagePath || null,
      guru_id: guruId || null,
      booking_id: bookingId || null,
      metadata: safeMetadata(body?.metadata),
    });

    if (error) {
      console.error("Analytics tracking error:", error);

      return NextResponse.json(
        { error: "Unable to track analytics event." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics route error:", error);

    return NextResponse.json(
      { error: "Unexpected analytics error." },
      { status: 500 }
    );
  }
}