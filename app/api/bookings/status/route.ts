import { NextRequest, NextResponse } from "next/server";

import { sendExpoPushToUser } from "@/lib/notifications/expo-push";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const GURU_ID_FIELDS = [
  "guru_id",
  "provider_id",
  "sitter_id",
  "caregiver_id",
  "user_id",
] as const;

const PARENT_ID_FIELDS = [
  "pet_owner_id",
  "customer_id",
  "user_id",
  "pet_parent_id",
] as const;

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstId(row: Record<string, unknown>, fields: readonly string[]) {
  for (const field of fields) {
    const value = asText(row[field]);
    if (value) return value;
  }
  return "";
}

async function isAssignedGuru(
  booking: Record<string, unknown>,
  userId: string,
) {
  const assigned = firstId(booking, GURU_ID_FIELDS);
  if (assigned === userId) return true;

  const { data } = await supabaseAdmin
    .from("gurus")
    .select("id, user_id, profile_id")
    .or(`user_id.eq.${userId},id.eq.${userId},profile_id.eq.${userId}`)
    .limit(5);

  const ids = new Set(
    (data || []).flatMap((row) =>
      [row.id, row.user_id, row.profile_id].filter(Boolean).map(String),
    ),
  );

  return GURU_ID_FIELDS.some((field) => ids.has(asText(booking[field])));
}

export async function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

export async function POST(req: NextRequest) {
  const cors = mobileCorsHeaders(req);

  try {
    const resolved = await resolveRequestUser(req);
    const user = resolved?.user ?? null;

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401, headers: cors },
      );
    }

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    const bookingId = asText(body?.bookingId || body?.booking_id || body?.id);
    const status = asText(body?.status).toLowerCase();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId." },
        { status: 400, headers: cors },
      );
    }

    if (status !== "accepted" && status !== "declined") {
      return NextResponse.json(
        { error: "Status must be accepted or declined." },
        { status: 400, headers: cors },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Booking not found." },
        { status: 404, headers: cors },
      );
    }

    const booking = data as Record<string, unknown>;
    const allowed = await isAssignedGuru(booking, user.id);

    if (!allowed) {
      return NextResponse.json(
        { error: "Only the assigned Guru can update this request." },
        { status: 403, headers: cors },
      );
    }

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status,
      booking_status: status,
      request_status: status,
      updated_at: now,
    };

    if (status === "accepted") {
      updatePayload.accepted_at = now;
    } else {
      updatePayload.declined_at = now;
    }

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500, headers: cors },
      );
    }

    const parentUserId = firstId(booking, PARENT_ID_FIELDS);
    const petName = asText(booking.pet_name) || "your pet";
    const serviceName =
      asText(booking.service_type) ||
      asText(booking.service) ||
      "care";

    if (parentUserId && parentUserId !== user.id) {
      void sendExpoPushToUser({
        userId: parentUserId,
        title:
          status === "accepted"
            ? "Your Guru accepted"
            : "Booking request declined",
        body:
          status === "accepted"
            ? `Your ${serviceName} request for ${petName} was accepted. You can pay and message your Guru.`
            : `Your ${serviceName} request for ${petName} was declined.`,
        href:
          status === "accepted"
            ? `/payments?bookingId=${encodeURIComponent(bookingId)}`
            : `/bookings?bookingId=${encodeURIComponent(bookingId)}`,
        channelId: "sitguru-bookings",
        data: {
          type:
            status === "accepted" ? "booking_accepted" : "booking_declined",
          bookingId,
        },
      }).catch((pushError) => {
        console.error("Booking status Expo push failed:", pushError);
      });
    }

    return NextResponse.json(
      { ok: true, bookingId, status },
      { status: 200, headers: cors },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update booking status.",
      },
      { status: 500, headers: cors },
    );
  }
}
