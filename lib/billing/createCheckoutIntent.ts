/**
 * Shared checkout PaymentIntent authorization used by the API route + E2E runner.
 * Never trusts client-computed totals — recalculates via pricingCalculator.
 */

import { calculateBookingTotal } from "@/lib/billing/pricingCalculator";
import { extractCheckoutBookingContext } from "@/lib/checkout/bookingContext";
import {
  getParentPerksBalance,
  redeemPawPerksForBooking,
} from "@/lib/pawperks/ledger";
import { getStripeServer } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export type CreateCheckoutIntentInput = {
  bookingId: string;
  userId: string;
  userEmail?: string | null;
  baseRate: number;
  daysCount: number;
  additionalPets?: number;
  holidaySurge?: boolean;
  ambassadorCode?: string | null;
  pawperksPointsToRedeem?: number;
  saveCard?: boolean;
  currency?: string;
  petName?: string;
  petPhotoUrl?: string;
  guruName?: string;
  guruAvatarUrl?: string;
  startDate?: string;
  endDate?: string;
  /** When true, skip booking ownership check (journey / service tooling). */
  skipOwnershipCheck?: boolean;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getMissingColumnName(message: string): string | null {
  const match =
    message.match(/column ["']?([a-zA-Z0-9_]+)["']? of relation/i) ||
    message.match(/Could not find the '([a-zA-Z0-9_]+)' column/i);
  return match?.[1] || null;
}

async function safeBookingUpdate(
  bookingId: string,
  payload: Record<string, unknown>,
) {
  let updatePayload = { ...payload };

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (!error) return { ok: true as const };

    const missingColumn = getMissingColumnName(error.message || "");
    if (missingColumn && missingColumn in updatePayload) {
      delete updatePayload[missingColumn];
      continue;
    }

    return { ok: false as const, error: error.message };
  }

  return { ok: false as const, error: "Too many missing booking columns." };
}

async function resolveStripeCustomerId(params: {
  userId: string;
  email: string | null | undefined;
  saveCard: boolean;
}) {
  if (!params.saveCard) return null;

  const stripe = getStripeServer();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id,email")
    .eq("id", params.userId)
    .maybeSingle();

  const existing = cleanText(
    (profile as { stripe_customer_id?: string | null } | null)
      ?.stripe_customer_id,
  );
  if (existing) return existing;

  const customer = await stripe.customers.create({
    email:
      params.email ||
      cleanText((profile as { email?: string } | null)?.email) ||
      undefined,
    metadata: { sitguru_user_id: params.userId },
  });

  await supabaseAdmin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", params.userId);

  return customer.id;
}

export async function createCheckoutPaymentIntent(
  input: CreateCheckoutIntentInput,
) {
  const bookingId = cleanText(input.bookingId);
  if (!bookingId) {
    return { ok: false as const, error: "bookingId is required." };
  }

  const baseRate = Number(input.baseRate);
  const daysCount = Number(input.daysCount);
  if (!Number.isFinite(baseRate) || baseRate < 0) {
    return { ok: false as const, error: "baseRate must be a non-negative number." };
  }
  if (!Number.isFinite(daysCount) || daysCount <= 0) {
    return { ok: false as const, error: "daysCount must be a positive number." };
  }

  const ambassadorCode = cleanText(input.ambassadorCode) || undefined;
  const saveCard = Boolean(input.saveCard);
  const requestedPerks = Math.max(
    0,
    Math.floor(Number(input.pawperksPointsToRedeem) || 0),
  );

  const perksRow = await getParentPerksBalance(input.userId);
  const availablePoints = Math.max(0, Math.floor(perksRow.points_balance || 0));

  const pricing = calculateBookingTotal(baseRate, daysCount, {
    additionalPets: Math.max(0, Math.floor(Number(input.additionalPets) || 0)),
    holidaySurge: Boolean(input.holidaySurge),
    ambassadorCode,
    pawperksAvailablePoints: availablePoints,
    pawperksPointsToRedeem: requestedPerks,
  });

  if (pricing.amountCents < 50) {
    return {
      ok: false as const,
      error: "Booking total must be at least $0.50 to charge with Stripe.",
      pricing,
      availablePoints,
    };
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    return { ok: false as const, error: "Booking not found." };
  }

  const bookingRow = booking as Record<string, unknown>;
  if (!input.skipOwnershipCheck) {
    const ownerIds = [
      bookingRow.parent_id,
      bookingRow.customer_id,
      bookingRow.user_id,
      bookingRow.owner_id,
      bookingRow.pet_parent_id,
      bookingRow.pet_owner_id,
      bookingRow.payer_user_id,
    ]
      .filter(Boolean)
      .map(String);

    if (ownerIds.length > 0 && !ownerIds.includes(input.userId)) {
      return {
        ok: false as const,
        error: "You do not have access to this booking.",
      };
    }
  }

  const bookingContext = extractCheckoutBookingContext(bookingRow, {
    daysCount: pricing.inputs.daysCount,
    petName: cleanText(input.petName) || undefined,
    petPhotoUrl: cleanText(input.petPhotoUrl) || undefined,
    guruName: cleanText(input.guruName) || undefined,
    guruAvatarUrl: cleanText(input.guruAvatarUrl) || undefined,
    startDate: cleanText(input.startDate) || undefined,
    endDate: cleanText(input.endDate) || undefined,
  });

  const currency = (cleanText(input.currency) || "usd").toLowerCase();
  const stripe = getStripeServer();
  const customerId = await resolveStripeCustomerId({
    userId: input.userId,
    email: input.userEmail,
    saveCard,
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: pricing.amountCents,
    currency,
    customer: customerId || undefined,
    setup_future_usage: saveCard ? "off_session" : undefined,
    automatic_payment_methods: { enabled: true },
    metadata: {
      booking_id: bookingId,
      user_id: input.userId,
      pricing_version: pricing.version,
      days_count: String(pricing.inputs.daysCount),
      additional_pets: String(pricing.inputs.additionalPets),
      holiday_surge: pricing.inputs.holidaySurge ? "1" : "0",
      ambassador_code: pricing.inputs.ambassadorCode || "",
      subtotal_before_discount: String(pricing.subtotalBeforeDiscount),
      discount_total: String(pricing.discountTotal),
      total: String(pricing.total),
      save_card: saveCard ? "1" : "0",
      pet_name: bookingContext.petName,
      guru_name: bookingContext.guruName,
      pawperks_points: String(pricing.pawperksPointsRedeemed),
      pawperks_discount_usd: String(pricing.pawperksDiscountUsd),
    },
    receipt_email: input.userEmail || undefined,
    description: `SitGuru · ${bookingContext.petName} with Guru ${bookingContext.guruName}`,
  });

  const updateResult = await safeBookingUpdate(bookingId, {
    payment_status: "PENDING_PAYMENT",
    payout_status: "pending_payment",
    stripe_payment_intent_id: paymentIntent.id,
    customer_total_amount: pricing.total,
    total_amount: pricing.total,
    amount_total: pricing.total,
    total_customer_paid: pricing.total,
    updated_at: new Date().toISOString(),
  });

  if (!updateResult.ok) {
    return {
      ok: false as const,
      error: "PaymentIntent created but booking update failed.",
      detail: updateResult.error,
    };
  }

  const redemption = await redeemPawPerksForBooking({
    parentId: input.userId,
    bookingId,
    pointsToRedeem: pricing.pawperksPointsRedeemed,
    paymentIntentId: paymentIntent.id,
    memo: `Checkout redemption for ${bookingContext.petName} · ${pricing.pawperksPointsRedeemed} pts`,
  });

  if (!redemption.ok) {
    return { ok: false as const, error: redemption.error, pricing };
  }

  let ambassadorLedger: {
    recorded: boolean;
    ambassadorId?: string;
    commissionEarned?: number;
    error?: string;
  } = { recorded: false };

  if (ambassadorCode) {
    try {
      const { recordAmbassadorBookingCommission } = await import(
        "@/lib/ambassador/ledger"
      );
      const result = await recordAmbassadorBookingCommission({
        referralSlug: ambassadorCode,
        payerUserId: input.userId,
        bookingId,
        bookingTotal: pricing.total,
        referredRole: "pet_parent",
      });
      if (result.ok) {
        ambassadorLedger = {
          recorded: true,
          ambassadorId: result.ambassadorId,
          commissionEarned: result.commissionEarned,
        };
      } else {
        ambassadorLedger = { recorded: false, error: result.error };
      }
    } catch (error) {
      ambassadorLedger = {
        recorded: false,
        error: error instanceof Error ? error.message : "ledger_error",
      };
    }
  }

  return {
    ok: true as const,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amountCents: pricing.amountCents,
    currency,
    pricing,
    bookingContext,
    paymentStatus: "PENDING_PAYMENT" as const,
    saveCard,
    availablePoints,
    pawperks: {
      redeemed: redemption.pointsRedeemed > 0,
      pointsRedeemed: redemption.pointsRedeemed,
      pointsBalance: redemption.pointsBalance,
    },
    ambassadorLedger,
  };
}
