import { NextRequest, NextResponse } from "next/server";
import { CAL_SLOTS_VERSION, calGet } from "@/lib/cal";
import { supabaseAdmin } from "@/lib/supabase/admin";

type GuruCalendarRow = {
  guru_slug: string;
  guru_name: string;
  cal_username: string;
  cal_event_type_slug: string;
  active: boolean;
};

type CalSlotsResponse = {
  status: string;
  data: Record<
    string,
    Array<{
      start: string;
      end?: string;
    }>
  >;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const slug = searchParams.get("slug");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const timeZone =
      searchParams.get("timeZone") ?? "America/New_York";

    if (!slug || !start || !end) {
      return NextResponse.json(
        { error: "Missing slug, start, or end query parameter." },
        { status: 400 }
      );
    }

    const { data: guru, error } = await supabaseAdmin
      .from("guru_calendar_settings")
      .select("guru_slug,guru_name,cal_username,cal_event_type_slug,active")
      .eq("guru_slug", slug)
      .eq("active", true)
      .single<GuruCalendarRow>();

    if (error || !guru) {
      return NextResponse.json(
        { error: "Active guru calendar settings not found." },
        { status: 404 }
      );
    }

    const params = new URLSearchParams({
      eventTypeSlug: guru.cal_event_type_slug,
      username: guru.cal_username,
      start,
      end,
      timeZone,
      format: "range",
    });

    const cal = await calGet<CalSlotsResponse>(
      `/slots?${params.toString()}`,
      CAL_SLOTS_VERSION
    );

    const slots = Object.entries(cal.data ?? {}).flatMap(([date, daySlots]) =>
      daySlots.map((slot) => ({
        date,
        start: slot.start,
        end: slot.end ?? null,
      }))
    );

    return NextResponse.json({
      guru: {
        slug: guru.guru_slug,
        name: guru.guru_name,
      },
      slots,
    });
  } catch (error) {
    console.error("GET /api/cal/slots failed:", error);

    return NextResponse.json(
      { error: "Failed to load available slots." },
      { status: 500 }
    );
  }
}