import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type GuruCalendarRow = {
  guru_slug: string;
  guru_name: string;
  cal_username: string;
  cal_event_type_slug: string;
  active: boolean;
};

type BookingBody = {
  slug: string;
  start: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  petName?: string;
  notes?: string;
  timeZone?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingBody;

    const slug = body.slug?.trim();
    const start = body.start?.trim();
    const customerName = body.customerName?.trim();
    const customerEmail = body.customerEmail?.trim().toLowerCase();
    const customerPhone = body.customerPhone?.trim() || null;
    const petName = body.petName?.trim() || null;
    const notes = body.notes?.trim() || null;
    const timeZone = body.timeZone?.trim() || "America/New_York";

    if (!slug || !start || !customerName || !customerEmail) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: slug, start, customerName, customerEmail.",
        },
        { status: 400 }
      );
    }

    const { data: guru, error: guruError } = await supabaseAdmin
      .from("guru_calendar_settings")
      .select("guru_slug,guru_name,cal_username,cal_event_type_slug,active")
      .eq("guru_slug", slug)
      .eq("active", true)
      .single<GuruCalendarRow>();

    if (guruError || !guru) {
      console.error("Guru lookup failed:", guruError);
      return NextResponse.json(
        { error: "Guru calendar settings not found." },
        { status: 404 }
      );
    }

    const calApiKey = process.env.CAL_API_KEY;
    const calApiVersion =
      process.env.CAL_API_VERSION_BOOKINGS || "2026-02-25";

    if (!calApiKey) {
      return NextResponse.json(
        { error: "Missing CAL_API_KEY in server environment." },
        { status: 500 }
      );
    }

    const calPayload = {
      start,
      attendee: {
        name: customerName,
        email: customerEmail,
        timeZone,
        ...(customerPhone ? { phoneNumber: customerPhone } : {}),
      },
      eventTypeSlug: guru.cal_event_type_slug,
      username: guru.cal_username,
      metadata: {
        sitguruGuruSlug: guru.guru_slug,
        sitguruGuruName: guru.guru_name,
        petName: petName ?? "",
        notes: notes ?? "",
        source: "SitGuru",
      },
    };

    const calResponse = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${calApiKey}`,
        "cal-api-version": calApiVersion,
      },
      body: JSON.stringify(calPayload),
      cache: "no-store",
    });

    const responseText = await calResponse.text();

    let calData: any = null;

    try {
      calData = responseText ? JSON.parse(responseText) : null;
    } catch {
      calData = { raw: responseText };
    }

    if (!calResponse.ok) {
      console.error("Cal.com booking failed:", calData);
      return NextResponse.json(
        {
          error:
            calData?.message ||
            calData?.error ||
            "Cal.com booking request failed.",
          details: calData,
        },
        { status: calResponse.status }
      );
    }

    const booking = calData?.data ?? calData;

    return NextResponse.json({
      success: true,
      booking: {
        uid: booking?.uid ?? null,
        status: booking?.status ?? null,
        start: booking?.start ?? start,
        end: booking?.end ?? null,
        guruName: guru.guru_name,
      },
      raw: calData,
    });
  } catch (error) {
    console.error("POST /api/cal/book failed:", error);

    return NextResponse.json(
      { error: "Server error while creating booking." },
      { status: 500 }
    );
  }
}