// app/api/messaging/ensure-booking-conversation/route.ts
/**
 * Ensure a conversation exists for a booking (parent ↔ assigned guru).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import {
  bookingAssignedGuruId,
  loadBookingForPawReport,
} from "@/lib/pawreport/access";

export const dynamic = "force-dynamic";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const bookingId = safeString(body?.bookingId);
    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: "bookingId is required" },
        { status: 400 },
      );
    }

    const booking = await loadBookingForPawReport(bookingId);
    if (!booking?.id) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    const guruUserId = bookingAssignedGuruId(booking);
    const parentUserId =
      safeString(booking.pet_owner_id) ||
      safeString(booking.customer_id) ||
      safeString(booking.user_id);

    if (!guruUserId || !parentUserId) {
      return NextResponse.json(
        { ok: false, error: "Booking is missing parent or guru assignment." },
        { status: 422 },
      );
    }

    if (user.id !== guruUserId && user.id !== parentUserId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const role = String(
        (profile as { role?: string } | null)?.role || "",
      ).toLowerCase();
      if (role !== "admin") {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const { data: existing } = await supabaseAdmin
      .from("conversations")
      .select("id,ai_assist_enabled")
      .eq("booking_id", bookingId)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json({
        ok: true,
        conversationId: existing.id,
        aiAssistEnabled: Boolean(
          (existing as { ai_assist_enabled?: boolean }).ai_assist_enabled,
        ),
        created: false,
      });
    }

    const bookingRow = booking as Record<string, unknown>;
    const now = new Date().toISOString();
    const petName =
      safeString(bookingRow.pet_name) ||
      safeString(bookingRow.petName) ||
      "Pet";

    const { data: created, error } = await supabaseAdmin
      .from("conversations")
      .insert({
        customer_id: parentUserId,
        guru_id: guruUserId,
        started_by_user_id: user.id,
        booking_id: bookingId,
        subject: `${petName} care chat`,
        status: "open",
        topic: "booking_care",
        ai_assist_enabled: false,
        created_at: now,
        updated_at: now,
        last_message_at: now,
        last_message_preview: "Care chat opened from live walk.",
      })
      .select("id,ai_assist_enabled")
      .maybeSingle();

    if (error || !created?.id) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Could not create conversation." },
        { status: 500 },
      );
    }

    await supabaseAdmin.from("conversation_participants").upsert(
      [
        {
          conversation_id: created.id,
          user_id: parentUserId,
          role: "customer",
          created_at: now,
          updated_at: now,
        },
        {
          conversation_id: created.id,
          user_id: guruUserId,
          role: "guru",
          created_at: now,
          updated_at: now,
        },
      ],
      { onConflict: "conversation_id,user_id" },
    );

    return NextResponse.json({
      ok: true,
      conversationId: created.id,
      aiAssistEnabled: Boolean(
        (created as { ai_assist_enabled?: boolean }).ai_assist_enabled,
      ),
      created: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ensure conversation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
