/**
 * SitGuru booking pricing — single source of truth for drawer UI + server validation.
 * All dollar math is rounded through integer cents to avoid float drift.
 */

import {
  clampRedeemablePoints,
  pointsToUsd,
} from "@/lib/pawperks/constants";

export const PRICING_SCHEMA_VERSION = "1.1" as const;

/** Shared commercial defaults — keep frontend display + create-intent in lockstep. */
export const PRICING_DEFAULTS = {
  /** Extra pet fee as a fraction of the daily base rate, per additional pet, per day. */
  additionalPetFeeRate: 0.5,
  /** Multiplier applied to visit + pet fees when holidaySurge is true (1.5 = +50%). */
  holidaySurgeMultiplier: 1.5,
  /** Customer-facing coupon when a valid ambassador code is supplied. */
  ambassadorDiscountRate: 0.1,
} as const;

export type PricingLineItemCode =
  | "BASE_VISIT"
  | "ADDITIONAL_PET"
  | "HOLIDAY_SURGE"
  | "AMBASSADOR_DISCOUNT"
  | "PAWPERKS_REDEMPTION";

export type PricingLineItem = {
  code: PricingLineItemCode;
  label: string;
  quantity: number;
  /** Unit price in USD (2-decimal dollars). */
  unitAmount: number;
  /** Line total in USD (negative for discounts). */
  amount: number;
};

export type BookingPricingOptions = {
  additionalPets: number;
  holidaySurge: boolean;
  ambassadorCode?: string;
  /** Requested PawPerks to redeem (100 pts = $1). Server re-clamps against balance. */
  pawperksPointsToRedeem?: number;
  /** Available balance used for client preview clamping. */
  pawperksAvailablePoints?: number;
};

export type BookingPricingBreakdown = {
  version: typeof PRICING_SCHEMA_VERSION;
  currency: "usd";
  inputs: {
    baseRate: number;
    daysCount: number;
    additionalPets: number;
    holidaySurge: boolean;
    ambassadorCode: string | null;
    pawperksPointsToRedeem: number;
    pawperksAvailablePoints: number;
  };
  rates: {
    additionalPetFeeRate: number;
    holidaySurgeMultiplier: number;
    ambassadorDiscountRate: number;
  };
  lineItems: PricingLineItem[];
  /** Sum of non-discount line items. */
  subtotalBeforeDiscount: number;
  /** Absolute discount dollars (ambassador + pawperks). */
  discountTotal: number;
  /** Payable total in USD. */
  total: number;
  /** Payable total in integer cents for Stripe PaymentIntents. */
  amountCents: number;
  ambassadorDiscountApplied: boolean;
  pawperksPointsRedeemed: number;
  pawperksDiscountUsd: number;
};

function toCents(dollars: number): number {
  return Math.round(Number(dollars) * 100);
}

function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function normalizeAmbassadorCode(code: string | undefined): string | null {
  const cleaned = String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
  return cleaned || null;
}

/**
 * Calculate a booking total with a strict line-item breakdown.
 * Used by CheckoutDrawer (display) and `/api/checkout/create-intent` (authoritative).
 */
export function calculateBookingTotal(
  baseRate: number,
  daysCount: number,
  options: BookingPricingOptions,
): BookingPricingBreakdown {
  const safeBaseRate = clampNonNegative(baseRate);
  const safeDays = Math.max(0, Math.floor(clampNonNegative(daysCount)));
  const additionalPets = Math.max(
    0,
    Math.floor(clampNonNegative(options.additionalPets)),
  );
  const holidaySurge = Boolean(options.holidaySurge);
  const ambassadorCode = normalizeAmbassadorCode(options.ambassadorCode);
  const availablePoints = Math.max(
    0,
    Math.floor(clampNonNegative(options.pawperksAvailablePoints ?? 0)),
  );

  const {
    additionalPetFeeRate,
    holidaySurgeMultiplier,
    ambassadorDiscountRate,
  } = PRICING_DEFAULTS;

  const lineItems: PricingLineItem[] = [];

  const baseVisitCents = toCents(safeBaseRate) * safeDays;
  lineItems.push({
    code: "BASE_VISIT",
    label:
      safeDays === 1
        ? "Base visit cost"
        : `Base visit cost × ${safeDays} days`,
    quantity: safeDays,
    unitAmount: fromCents(toCents(safeBaseRate)),
    amount: fromCents(baseVisitCents),
  });

  let additionalPetCents = 0;
  if (additionalPets > 0 && safeDays > 0) {
    const unitPetCents = Math.round(toCents(safeBaseRate) * additionalPetFeeRate);
    additionalPetCents = unitPetCents * additionalPets * safeDays;
    lineItems.push({
      code: "ADDITIONAL_PET",
      label:
        additionalPets === 1
          ? `Additional pet fee × ${safeDays} day${safeDays === 1 ? "" : "s"}`
          : `Additional pets (${additionalPets}) × ${safeDays} day${safeDays === 1 ? "" : "s"}`,
      quantity: additionalPets * safeDays,
      unitAmount: fromCents(unitPetCents),
      amount: fromCents(additionalPetCents),
    });
  }

  const preSurgeCents = baseVisitCents + additionalPetCents;
  let surgeCents = 0;
  if (holidaySurge && preSurgeCents > 0) {
    surgeCents = Math.round(preSurgeCents * (holidaySurgeMultiplier - 1));
    lineItems.push({
      code: "HOLIDAY_SURGE",
      label: `Holiday surge (+${Math.round((holidaySurgeMultiplier - 1) * 100)}%)`,
      quantity: 1,
      unitAmount: fromCents(surgeCents),
      amount: fromCents(surgeCents),
    });
  }

  const subtotalBeforeDiscountCents = preSurgeCents + surgeCents;
  let ambassadorDiscountCents = 0;
  const ambassadorDiscountApplied = Boolean(ambassadorCode);

  if (ambassadorDiscountApplied && subtotalBeforeDiscountCents > 0) {
    ambassadorDiscountCents = Math.round(
      subtotalBeforeDiscountCents * ambassadorDiscountRate,
    );
    lineItems.push({
      code: "AMBASSADOR_DISCOUNT",
      label: `Ambassador discount (${Math.round(ambassadorDiscountRate * 100)}%)`,
      quantity: 1,
      unitAmount: fromCents(-ambassadorDiscountCents),
      amount: fromCents(-ambassadorDiscountCents),
    });
  }

  const afterAmbassadorCents = Math.max(
    0,
    subtotalBeforeDiscountCents - ambassadorDiscountCents,
  );

  const pawperksPointsRedeemed = clampRedeemablePoints({
    availablePoints,
    payableCentsBeforePerks: afterAmbassadorCents,
    requestedPoints: options.pawperksPointsToRedeem,
  });

  // 1 point = 1 cent (100 pts = $1.00)
  const pawperksDiscountCents = pawperksPointsRedeemed;

  if (pawperksDiscountCents > 0) {
    lineItems.push({
      code: "PAWPERKS_REDEMPTION",
      label: `PawPerks redemption (−${pawperksPointsRedeemed} pts)`,
      quantity: pawperksPointsRedeemed,
      unitAmount: -0.01,
      amount: fromCents(-pawperksDiscountCents),
    });
  }

  const discountCents = ambassadorDiscountCents + pawperksDiscountCents;
  const totalCents = Math.max(0, subtotalBeforeDiscountCents - discountCents);

  return {
    version: PRICING_SCHEMA_VERSION,
    currency: "usd",
    inputs: {
      baseRate: fromCents(toCents(safeBaseRate)),
      daysCount: safeDays,
      additionalPets,
      holidaySurge,
      ambassadorCode,
      pawperksPointsToRedeem: pawperksPointsRedeemed,
      pawperksAvailablePoints: availablePoints,
    },
    rates: {
      additionalPetFeeRate,
      holidaySurgeMultiplier,
      ambassadorDiscountRate,
    },
    lineItems,
    subtotalBeforeDiscount: fromCents(subtotalBeforeDiscountCents),
    discountTotal: fromCents(discountCents),
    total: fromCents(totalCents),
    amountCents: totalCents,
    ambassadorDiscountApplied,
    pawperksPointsRedeemed,
    pawperksDiscountUsd: pointsToUsd(pawperksPointsRedeemed),
  };
}

/** Format USD for checkout UI (always two decimals). */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(amount) ? amount : 0);
}
