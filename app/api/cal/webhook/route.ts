import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (isRecord(value)) {
    if ("value" in value) {
      const nested = asString(value.value);
      if (nested) return nested;
    }

    if ("label" in value) {
      const nested = asString(value.label);
      if (nested) return nested;
    }

    if ("name" in value) {
      const nested = asString(value.name);
      if (nested) return nested;
    }

    if ("email" in value) {
      const nested = asString(value.email);
      if (nested) return nested;
    }
  }

  return null;
}

function getFromRecord(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }

  return null;
}

function getNestedRecord(
  record: UnknownRecord,
  keys: string[],
): UnknownRecord | null {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }

  return null;
}

function getFirstArrayRecord(
  record: UnknownRecord,
  keys: string[],
): UnknownRecord | null {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value) && value.length > 0 && isRecord(value[0])) {
      return value[0];
    }
  }

  return null;
}

type GuruCalendarSettingRow = {
  guru_slug: string;
  guru_name: string;
  cal_username: string;
  cal_event_type_slug: string | null;
  active: boolean;
};

type GuruRow = {
  id: string;
  slug: string;
};

type ExistingBookingRow = {
  id: string;
  cal_booking_id: string;
  guru_slug: string | null;
  status: string | null;
};

export async function GET() {
  return NextResponse.json({ message: "Webhook route is live" });
}

export async function POST(req: Request) {
  try {
    const rawBody = (await req.json()) as unknown;

    console.log("CAL WEBHOOK RAW BODY:", JSON.stringify(rawBody, null, 2));

    if (!isRecord(rawBody)) {
      return NextResponse.json(
        { error: "Webhook body is not an object" },
        { status: 400 },
      );
    }

    const triggerEvent =
      getFromRecord(rawBody, ["triggerEvent", "event", "type"]) ?? "";

    const normalizedTrigger = triggerEvent.toLowerCase();

    const isBookingCreated =
      normalizedTrigger === "booking_created" ||
      normalizedTrigger === "booking.created" ||
      normalizedTrigger === "booking created" ||
      normalizedTrigger === "bookingcreated";

    if (!isBookingCreated) {
      return NextResponse.json({
        received: true,
        ignored: true,
        triggerEvent,
      });
    }

    const booking = getNestedRecord(rawBody, ["payload", "data"]) ?? rawBody;

    const responses =
      getNestedRecord(booking, ["responses", "formResponses", "form_responses"]) ??
      {};

    const eventTypeRecord =
      getNestedRecord(booking, ["eventType", "event_type"]) ?? {};

    const userRecord =
      getNestedRecord(booking, ["user", "organizer", "host"]) ?? {};

    const firstAttendee =
      getFirstArrayRecord(booking, ["attendees", "guests", "participants"]) ?? {};

    const metadata =
      getNestedRecord(booking, ["metadata"]) ?? {};

    const calBookingId =
      getFromRecord(booking, ["bookingId", "booking_id", "id", "uid"]);

    const startTime =
      getFromRecord(booking, ["startTime", "start", "start_time"]) ??
      getFromRecord(rawBody, ["startTime", "start", "start_time"]);

    const endTime =
      getFromRecord(booking, ["endTime", "end", "end_time"]) ??
      getFromRecord(rawBody, ["endTime", "end", "end_time"]);

    const eventType =
      getFromRecord(eventTypeRecord, ["slug"]) ??
      getFromRecord(booking, [
        "type",
        "eventTypeSlug",
        "event_type_slug",
        "eventTitle",
      ]) ??
      "pet-care";

    const username =
      getFromRecord(userRecord, ["username", "name"]) ??
      getFromRecord(booking, ["username", "cal_username"]) ??
      getFromRecord(rawBody, ["username", "cal_username"]);

    const customerEmail =
      getFromRecord(responses, [
        "email",
        "Email",
        "email_address",
        "emailAddress",
      ]) ?? getFromRecord(firstAttendee, ["email"]);

    const customerName =
      getFromRecord(responses, [
        "name",
        "Name",
        "full_name",
        "fullName",
        "customer_name",
        "customerName",
      ]) ??
      getFromRecord(firstAttendee, ["name", "firstName"]) ??
      "New Customer";

    const petName =
      getFromRecord(responses, [
        "pet_name",
        "petName",
        "Pet Name",
        "pet name",
        "pet",
        "dog_name",
        "dogName",
        "cat_name",
        "catName",
      ]) ??
      getFromRecord(metadata, [
        "pet_name",
        "petName",
        "pet",
      ]) ??
      "Pet booking";

    const bookingDate = startTime ? startTime.split("T")[0] : null;

    console.log("CAL WEBHOOK NORMALIZED:", {
      triggerEvent,
      calBookingId,
      startTime,
      endTime,
      eventType,
      username,
      customerEmail,
      customerName,
      petName,
      bookingDate,
    });

    if (
      !calBookingId ||
      !startTime ||
      !endTime ||
      !eventType ||
      !username ||
      !bookingDate
    ) {
      return NextResponse.json(
        {
          error: "Missing required booking fields",
          details: {
            triggerEvent,
            calBookingId,
            startTime,
            endTime,
            eventType,
            username,
            bookingDate,
          },
        },
        { status: 400 },
      );
    }

    const { data: existingBooking, error: existingBookingError } =
      await supabaseAdmin
        .from("bookings")
        .select("id, cal_booking_id, guru_slug, status")
        .eq("cal_booking_id", calBookingId)
        .maybeSingle<ExistingBookingRow>();

    if (existingBookingError) {
      console.error("Existing booking lookup error:", existingBookingError);
      return NextResponse.json(
        {
          error: `Existing booking lookup failed: ${existingBookingError.message}`,
        },
        { status: 500 },
      );
    }

    if (existingBooking) {
      return NextResponse.json({
        success: true,
        already_exists: true,
        message: "Booking already exists",
        booking: {
          cal_booking_id: existingBooking.cal_booking_id,
          guru_slug: existingBooking.guru_slug,
          status: existingBooking.status,
        },
      });
    }

    const { data: guruSettings, error: guruSettingsError } = await supabaseAdmin
      .from("guru_calendar_settings")
      .select(
        "guru_slug, guru_name, cal_username, cal_event_type_slug, active",
      )
      .eq("cal_username", username)
      .eq("active", true)
      .order("guru_name", { ascending: true });

    if (guruSettingsError) {
      console.error("Guru settings lookup error:", guruSettingsError);
      return NextResponse.json(
        { error: `Guru settings lookup failed: ${guruSettingsError.message}` },
        { status: 500 },
      );
    }

    const guruRows = (guruSettings ?? []) as GuruCalendarSettingRow[];

    if (guruRows.length === 0) {
      return NextResponse.json(
        {
          error: `Guru not found for cal_username: ${username}`,
          details: { username, eventType },
        },
        { status: 404 },
      );
    }

    const matchingGuruSetting =
      guruRows.find((g) => g.cal_event_type_slug === eventType) ?? guruRows[0];

    console.log("MATCHED GURU SETTING:", matchingGuruSetting);

    const { data: guruRecord, error: guruError } = await supabaseAdmin
      .from("gurus")
      .select("id, slug")
      .eq("slug", matchingGuruSetting.guru_slug)
      .single<GuruRow>();

    if (guruError || !guruRecord) {
      console.error("Guru lookup failed:", guruError);
      return NextResponse.json(
        {
          error: `Guru record not found for slug: ${matchingGuruSetting.guru_slug}`,
        },
        { status: 500 },
      );
    }

    const bookingInsert = {
      sitter_id: guruRecord.id,
      guru_slug: matchingGuruSetting.guru_slug,
      guru_name: matchingGuruSetting.guru_name,
      pet_name: petName,
      booking_date: bookingDate,
      booking_start: startTime,
      booking_end: endTime,
      service: matchingGuruSetting.cal_event_type_slug || eventType,
      status: "pending",
      cal_booking_id: calBookingId,
      cal_event_type_slug: matchingGuruSetting.cal_event_type_slug || eventType,
      cal_username: username,
      customer_email: customerEmail,
      customer_name: customerName,
      source: "cal.com",
    };

    console.log(
      "BOOKING INSERT PAYLOAD:",
      JSON.stringify(bookingInsert, null, 2),
    );

    const { error: insertError } = await supabaseAdmin
      .from("bookings")
      .insert(bookingInsert);

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: `Insert failed: ${insertError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking inserted successfully",
      guru_used: matchingGuruSetting.guru_slug,
      sitter_id: guruRecord.id,
      booking: {
        cal_booking_id: calBookingId,
        cal_username: username,
        customer_email: customerEmail,
        customer_name: customerName,
        pet_name: petName,
        booking_date: bookingDate,
      },
    });
  } catch (err) {
    console.error("Webhook error:", err);

    const message =
      err instanceof Error ? err.message : JSON.stringify(err);

    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 },
    );
  }
}