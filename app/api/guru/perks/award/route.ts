/**
 * POST /api/guru/perks/award
 * Guru awards PawPerks to the Pet Parent on a live walk booking.
 */

import { NextRequest, NextResponse } from "next/server";
import { GURU_REWARD_TEMPLATES } from "@/lib/pawperks/constants";
import { awardPawPerks } from "@/lib/pawperks/ledger";
import {
  bookingAssignedGuruId,
  loadBookingForPawReport,
} from "@/lib/pawreport/access";
import { sendWebPushToUser } from "@/lib/services/webPush";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_CUSTOM_POINTS = 200;
const MIN_CUSTOM_POINTS = 5;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function resolvePetParentUserId(booking: Record<string, unknown>) {
  return (
    cleanText(booking.pet_owner_id) ||
    cleanText(booking.customer_id) ||
    cleanText(booking.user_id) ||
    cleanText(booking.pet_parent_id) ||
    cleanText(booking.owner_id) ||
    cleanText(booking.parent_id)
  );
}

function resolvePetName(booking: Record<string, unknown>) {
  return (
    cleanText(booking.pet_name) ||
    cleanText(booking.petName) ||
    cleanText(booking.animal_name) ||
    "your pet"
  );
}

function resolveGuruDisplayName(
  profile: Record<string, unknown> | null,
  fallback: string,
) {
  return (
    cleanText(profile?.full_name) ||
    cleanText(profile?.first_name) ||
    cleanText(profile?.display_name) ||
    fallback
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    const bookingId = cleanText(body?.bookingId);
    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: "bookingId is required." },
        { status: 400 },
      );
    }

    const booking = await loadBookingForPawReport(bookingId);
    if (!booking?.id) {
      return NextResponse.json(
        { ok: false, error: "Booking not found." },
        { status: 404 },
      );
    }

    const assignedGuruId = bookingAssignedGuruId(booking);
    if (!assignedGuruId || assignedGuruId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Only the assigned Guru can award PawPerks." },
        { status: 403 },
      );
    }

    const parentId = resolvePetParentUserId(booking as Record<string, unknown>);
    if (!parentId) {
      return NextResponse.json(
        { ok: false, error: "Pet Parent not linked to this booking." },
        { status: 400 },
      );
    }

    const templateId = cleanText(body?.templateId);
    const template = GURU_REWARD_TEMPLATES.find((t) => t.id === templateId);

    let points = 0;
    let memo = "";

    if (template) {
      points = template.points;
      const customMemo = cleanText(body?.memo);
      memo =
        customMemo ||
        `Awarded by Guru for ${template.label.toLowerCase()}!`;
    } else {
      points = Math.floor(Number(body?.points) || 0);
      if (points < MIN_CUSTOM_POINTS || points > MAX_CUSTOM_POINTS) {
        return NextResponse.json(
          {
            ok: false,
            error: `Custom awards must be between ${MIN_CUSTOM_POINTS} and ${MAX_CUSTOM_POINTS} points.`,
          },
          { status: 400 },
        );
      }
      memo =
        cleanText(body?.memo) ||
        `Awarded by Guru for excellent care! (+${points} PawPerks)`;
    }

    const { data: guruProfile } = await supabase
      .from("profiles")
      .select("full_name,first_name,display_name")
      .eq("id", user.id)
      .maybeSingle();

    const guruName = resolveGuruDisplayName(
      (guruProfile as Record<string, unknown> | null) || null,
      "your Guru",
    );
    const petName = resolvePetName(booking as Record<string, unknown>);

    if (!cleanText(body?.memo) && template) {
      memo = `Awarded by Guru ${guruName} for ${template.label.toLowerCase()}!`;
    } else if (!cleanText(body?.memo)) {
      memo = `Awarded by Guru ${guruName} for excellent leash walking!`;
    }

    const result = await awardPawPerks({
      parentId,
      points,
      sourceType: "GURU_REWARD",
      memo,
      bookingId,
      awardedByGuruId: user.id,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 },
      );
    }

    // Fire-and-forget push — never block the Guru on delivery failures
    void sendWebPushToUser({
      userId: parentId,
      title: "🎉 PawPerks earned!",
      body: `${petName} just earned ${points} PawPerks for excellent behavior!`,
      url: "/parent/perks",
      tag: "pawperks-reward",
      data: {
        type: "pawperks_reward",
        bookingId,
        points,
      },
    }).catch((error) => {
      console.warn("[guru/perks/award] push skipped:", error);
    });

    return NextResponse.json({
      ok: true,
      pointsAwarded: result.pointsAwarded,
      pointsBalance: result.pointsBalance,
      lifetimeEarned: result.lifetimeEarned,
      memo,
      petName,
      parentId,
      transactionId: result.transaction?.transaction_id,
    });
  } catch (error) {
    console.error("[guru/perks/award]", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to award PawPerks.",
      },
      { status: 500 },
    );
  }
}
