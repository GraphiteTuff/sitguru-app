import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const webhookSecret = process.env.CAL_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error("Missing CAL_WEBHOOK_SECRET");
}

function verifySignature(rawBody: string, signature: string | null) {
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

function mapStatus(triggerEvent: string): string {
  switch (triggerEvent) {
    case "BOOKING_CREATED":
      return "accepted";
    case "BOOKING_REQUESTED":
      return "requested";
    case "BOOKING_RESCHEDULED":
      return "rescheduled";
    case "BOOKING_CANCELLED":
      return "cancelled";
    case "BOOKING_REJECTED":
      return "rejected";
    default:
      return "updated";
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-cal-signature-256");

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody) as {
      triggerEvent: string;
      payload?: {
        uid?: string;
        id?: number;
        startTime?: string;
        endTime?: string;
        rescheduleUid?: string;
        metadata?: Record<string, unknown>;
        attendees?: Array<{
          name?: string;
          email?: string;
          phoneNumber?: string;
          timezone?: string;
        }>;
      };
      uid?: string;
      id?: number;
      startTime?: string;
      endTime?: string;
      rescheduleUid?: string;
      metadata?: Record<string, unknown>;
      attendees?: Array<{
        name?: string;
        email?: string;
        phoneNumber?: string;
        timezone?: string;
      }>;
    };

    const triggerEvent = body.triggerEvent;
    const payload = body.payload ?? body;

    const bookingUid = payload.uid;

    if (!bookingUid) {
      return NextResponse.json({ ok: true });
    }

    const attendee = payload.attendees?.[0];
    const metadata = payload.metadata ?? {};

    await supabaseAdmin.from("customer_bookings").upsert(
      {
        booking_uid: bookingUid,
        guru_slug:
          typeof metadata.sitguruGuruSlug === "string"
            ? metadata.sitguruGuruSlug
            : "unknown-guru",
        guru_name:
          typeof metadata.sitguruGuruName === "string"
            ? metadata.sitguruGuruName
            : null,
        customer_name: attendee?.name ?? "Unknown Customer",
        customer_email: attendee?.email ?? "unknown@example.com",
        customer_phone: attendee?.phoneNumber ?? null,
        pet_name:
          typeof metadata.petName === "string" ? metadata.petName : null,
        notes: typeof metadata.notes === "string" ? metadata.notes : null,
        start_at: payload.startTime ?? null,
        end_at: payload.endTime ?? null,
        timezone: attendee?.timezone ?? "America/New_York",
        status: mapStatus(triggerEvent),
        cal_booking_id: payload.id ?? null,
        cal_reschedule_uid: payload.rescheduleUid ?? null,
        raw_cal_payload: body,
      },
      {
        onConflict: "booking_uid",
      }
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Cal webhook failed:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}