import { NextRequest, NextResponse } from "next/server";

import { guruCanAcceptPaidBookings } from "@/lib/payments/sync-stripe-connect-account";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RespondBody = {
  action?: string;
};

function json(req: NextRequest, body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: mobileCorsHeaders(req),
  });
}

function normalizeAction(value: unknown): "accept" | "decline" | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "accept" || normalized === "accepted") return "accept";
  if (normalized === "decline" || normalized === "declined") return "decline";
  return null;
}

export async function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await context.params;
  const id = String(bookingId || "").trim();

  if (!id) {
    return json(req, { success: false, error: "Missing booking id." }, 400);
  }

  const resolved = await resolveRequestUser(req);
  if (!resolved?.user) {
    return json(req, { success: false, error: "Unauthorized." }, 401);
  }

  let body: RespondBody = {};
  try {
    body = (await req.json()) as RespondBody;
  } catch {
    body = {};
  }

  const action = normalizeAction(body.action);
  if (!action) {
    return json(
      req,
      { success: false, error: "Action must be accept or decline." },
      400,
    );
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, status, payment_status, guru_id, provider_id, sitter_id, caregiver_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (bookingError || !booking) {
    return json(req, { success: false, error: "Booking not found." }, 404);
  }

  const { data: guru } = await supabaseAdmin
    .from("gurus")
    .select("id, user_id")
    .eq("user_id", resolved.user.id)
    .maybeSingle();

  if (!guru?.id) {
    return json(req, { success: false, error: "Guru profile not found." }, 404);
  }

  const assignedIds = [
    booking.guru_id,
    booking.provider_id,
    booking.sitter_id,
    booking.caregiver_id,
  ]
    .map((value) => (value == null ? "" : String(value)))
    .filter(Boolean);

  if (!assignedIds.includes(String(guru.id))) {
    return json(
      req,
      { success: false, error: "This booking is not assigned to you." },
      403,
    );
  }

  if (action === "accept") {
    const readiness = await guruCanAcceptPaidBookings(resolved.user.id);

    if (!readiness.ready) {
      return json(
        req,
        {
          success: false,
          code: "PAYOUT_SETUP_REQUIRED",
          error:
            "Finish your quick secure payout setup before accepting this paid booking.",
          nextAction: "setup_payouts",
          payoutSetupPath: "/api/payouts/setup?role=guru",
          earningsPath: "/guru/dashboard/earnings",
          mobileEarningsPath: "/guru-earnings",
        },
        409,
      );
    }
  }

  const nextStatus = action === "accept" ? "accepted" : "declined";
  const now = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("bookings")
    .update({
      status: nextStatus,
      updated_at: now,
    })
    .eq("id", id);

  if (updateError) {
    console.error("Booking respond update failed:", updateError);
    return json(
      req,
      { success: false, error: "Could not update booking status." },
      500,
    );
  }

  return json(req, {
    success: true,
    bookingId: id,
    status: nextStatus,
    message:
      action === "accept"
        ? "Booking accepted. The Pet Parent can finish payment next."
        : "Booking declined.",
  });
}
