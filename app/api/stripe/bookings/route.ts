import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

function toIsoDate(date: string) {
  return `${date}T12:00:00`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const guruId = String(body.guru_id || "").trim();
    const petName = String(body.pet_name || "").trim();
    const date = String(body.date || "").trim();
    const notes = String(body.notes || "").trim();

    if (!guruId) {
      return NextResponse.json({ error: "Guru ID is required" }, { status: 400 });
    }

    if (!petName) {
      return NextResponse.json({ error: "Pet name is required" }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const { data: guru, error: guruError } = await supabaseAdmin
      .from("gurus")
      .select("profile_id, display_name, hourly_rate, stripe_account_id")
      .eq("profile_id", guruId)
      .single();

    if (guruError || !guru) {
      console.error("Guru lookup failed:", guruError);
      return NextResponse.json({ error: "Guru not found" }, { status: 404 });
    }

    const totalAmount =
      typeof guru.hourly_rate === "number" && guru.hourly_rate > 0
        ? guru.hourly_rate
        : 25;

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        pet_owner_id: user.id,
        guru_id: guru.profile_id,
        status: "pending",
        payment_status: "unpaid",
        total_amount: totalAmount,
        pet_name: petName,
        notes,
        start_time: toIsoDate(date),
      })
      .select("*")
      .single();

    if (bookingError || !booking) {
      console.error("Booking insert failed:", bookingError);
      return NextResponse.json(
        { error: bookingError?.message || "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Booking create route error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}