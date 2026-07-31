/**
 * POST /api/checkout/create-intent
 * Server-authoritative booking PaymentIntent + PENDING_PAYMENT booking update.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  AMBASSADOR_CODE_COOKIE,
  AMBASSADOR_REF_COOKIE,
} from "@/lib/ambassador/ledger-types";
import { createCheckoutPaymentIntent } from "@/lib/billing/createCheckoutIntent";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CreateIntentBody = {
  bookingId?: string;
  baseRate?: number;
  daysCount?: number;
  additionalPets?: number;
  holidaySurge?: boolean;
  ambassadorCode?: string;
  currency?: string;
  saveCard?: boolean;
  pawperksPointsToRedeem?: number;
  petName?: string;
  petPhotoUrl?: string;
  guruName?: string;
  guruAvatarUrl?: string;
  startDate?: string;
  endDate?: string;
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readAmbassadorCookie(request: NextRequest): string {
  return (
    cleanText(request.cookies.get(AMBASSADOR_CODE_COOKIE)?.value) ||
    cleanText(request.cookies.get(AMBASSADOR_REF_COOKIE)?.value) ||
    cleanText(request.cookies.get("sitguru_ambassador_code")?.value) ||
    cleanText(request.cookies.get("sitguru_ambassador_ref")?.value)
  );
}

async function resolveRequestUser(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user;

  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (!bearer) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(bearer);
  if (error || !data.user) return null;
  return data.user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as CreateIntentBody | null;
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const cookieCode = readAmbassadorCookie(request);
    const result = await createCheckoutPaymentIntent({
      bookingId: cleanText(body.bookingId),
      userId: user.id,
      userEmail: user.email,
      baseRate: Number(body.baseRate),
      daysCount: Number(body.daysCount),
      additionalPets: Number(body.additionalPets) || 0,
      holidaySurge: Boolean(body.holidaySurge),
      ambassadorCode: cleanText(body.ambassadorCode) || cookieCode || undefined,
      pawperksPointsToRedeem: Number(body.pawperksPointsToRedeem) || 0,
      saveCard: Boolean(body.saveCard),
      currency: cleanText(body.currency) || "usd",
      petName: cleanText(body.petName) || undefined,
      petPhotoUrl: cleanText(body.petPhotoUrl) || undefined,
      guruName: cleanText(body.guruName) || undefined,
      guruAvatarUrl: cleanText(body.guruAvatarUrl) || undefined,
      startDate: cleanText(body.startDate) || undefined,
      endDate: cleanText(body.endDate) || undefined,
    });

    if (!result.ok) {
      const status = /not found/i.test(result.error)
        ? 404
        : /access/i.test(result.error)
          ? 403
          : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json({
      ok: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amountCents: result.amountCents,
      currency: result.currency,
      pricing: result.pricing,
      bookingContext: result.bookingContext,
      paymentStatus: result.paymentStatus,
      saveCard: result.saveCard,
      pawperks: {
        availablePoints: result.availablePoints,
        ...result.pawperks,
      },
      ambassadorLedger: result.ambassadorLedger,
    });
  } catch (error) {
    console.error("[checkout/create-intent]", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create payment intent.",
      },
      { status: 500 },
    );
  }
}
