import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeUsState, usStateDisplayName } from "@/lib/gurus/guru-chat-snapshot";

type AnyRow = Record<string, unknown>;

export type MarketplaceTaxStateRow = {
  state: string;
  stateName: string;
  bookingCount: number;
  taxableBase: number;
  tipsExcluded: number;
  taxCollected: number;
  missingLocation: boolean;
};

export type MarketplaceTaxBookingRow = {
  id: string;
  createdAt: string;
  guruName: string;
  city: string;
  state: string;
  zip: string;
  provider: string;
  taxableBase: number;
  tipAmount: number;
  taxCollected: number;
};

export type MarketplaceTaxReport = {
  paidBookingCount: number;
  taxCollected: number;
  tipsExcluded: number;
  taxableBase: number;
  bookingsMissingLocation: number;
  paypalBookingCount: number;
  taxedBookingCount: number;
  byState: MarketplaceTaxStateRow[];
  recent: MarketplaceTaxBookingRow[];
  sourceHealth: { id: string; label: string; ok: boolean; rowCount: number }[];
};

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%\s,()]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function centsToDollars(value: unknown) {
  return toNumber(value) / 100;
}

function isPaidBooking(row: AnyRow) {
  const status = `${asTrimmed(row.payment_status)} ${asTrimmed(row.status)}`.toLowerCase();
  return (
    status.includes("paid") ||
    status.includes("succeeded") ||
    status.includes("complete") ||
    status.includes("confirmed")
  );
}

function bookingTip(row: AnyRow) {
  return Math.abs(toNumber(row.tip_amount) || toNumber(row.guru_tip_amount));
}

function bookingTax(row: AnyRow) {
  return Math.abs(
    toNumber(row.sales_tax_amount) ||
      toNumber(row.tax_amount) ||
      centsToDollars(row.sales_tax_cents) ||
      centsToDollars(row.tax_cents),
  );
}

function bookingTaxableBase(row: AnyRow) {
  const subtotal = toNumber(row.subtotal_amount) || toNumber(row.service_price);
  const fee =
    toNumber(row.marketplace_fee_amount) ||
    toNumber(row.sitguru_fee_amount) ||
    toNumber(row.platform_fee);
  if (subtotal > 0) return Math.abs(subtotal + fee);
  const total =
    toNumber(row.total_customer_paid) ||
    toNumber(row.customer_total_amount) ||
    toNumber(row.amount_total);
  return Math.max(0, Math.abs(total) - bookingTip(row) - bookingTax(row));
}

async function safeRows(query: PromiseLike<{ data: unknown; error: unknown }>, label: string) {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`Marketplace tax query skipped for ${label}:`, result.error);
      return [] as AnyRow[];
    }
    return Array.isArray(result.data) ? (result.data as AnyRow[]) : [];
  } catch (error) {
    console.warn(`Marketplace tax query skipped for ${label}:`, error);
    return [] as AnyRow[];
  }
}

export async function loadMarketplaceTaxReport(): Promise<MarketplaceTaxReport> {
  const [bookings, payments] = await Promise.all([
    safeRows(
      supabaseAdmin
        .from("bookings")
        .select(
          "id,created_at,status,payment_status,payment_provider,guru_name,care_city,care_state,care_zip_code,city,state,subtotal_amount,service_price,marketplace_fee_amount,sitguru_fee_amount,platform_fee,tip_amount,guru_tip_amount,sales_tax_amount,tax_amount,total_customer_paid,customer_total_amount,amount_total",
        )
        .order("created_at", { ascending: false })
        .limit(2500),
      "bookings",
    ),
    safeRows(
      supabaseAdmin
        .from("booking_payments")
        .select(
          "id,created_at,status,provider,tax_cents,sales_tax_cents,tax_amount,tip_amount,tip_cents,amount_cents,marketplace_support_cents",
        )
        .order("created_at", { ascending: false })
        .limit(2500),
      "booking_payments",
    ),
  ]);

  const paid = bookings.filter(isPaidBooking);
  const stateMap = new Map<string, MarketplaceTaxStateRow>();
  let taxCollected = 0;
  let tipsExcluded = 0;
  let taxableBase = 0;
  let bookingsMissingLocation = 0;
  let paypalBookingCount = 0;
  let taxedBookingCount = 0;

  for (const row of paid) {
    const tip = bookingTip(row);
    const tax = bookingTax(row);
    const base = bookingTaxableBase(row);
    const state = normalizeUsState(
      asTrimmed(row.care_state) || asTrimmed(row.state),
    );
    const city = asTrimmed(row.care_city) || asTrimmed(row.city);
    const zip = asTrimmed(row.care_zip_code);
    const provider = asTrimmed(row.payment_provider).toLowerCase();

    taxCollected += tax;
    tipsExcluded += tip;
    taxableBase += base;
    if (tax > 0) taxedBookingCount += 1;
    if (provider.includes("paypal")) paypalBookingCount += 1;
    if (!state && !zip) bookingsMissingLocation += 1;

    const key = state || "UNASSIGNED";
    const current = stateMap.get(key) || {
      state: key,
      stateName: state ? usStateDisplayName(state) : "Missing location",
      bookingCount: 0,
      taxableBase: 0,
      tipsExcluded: 0,
      taxCollected: 0,
      missingLocation: !state,
    };
    current.bookingCount += 1;
    current.taxableBase += base;
    current.tipsExcluded += tip;
    current.taxCollected += tax;
    stateMap.set(key, current);
  }

  const paymentTax = payments.reduce((sum, row) => {
    const status = asTrimmed(row.status).toLowerCase();
    if (
      !status.includes("paid") &&
      !status.includes("succeeded") &&
      !status.includes("complete")
    ) {
      return sum;
    }
    return (
      sum +
      Math.abs(
        centsToDollars(row.tax_cents) ||
          centsToDollars(row.sales_tax_cents) ||
          toNumber(row.tax_amount),
      )
    );
  }, 0);

  return {
    paidBookingCount: paid.length,
    taxCollected: taxCollected || paymentTax,
    tipsExcluded,
    taxableBase,
    bookingsMissingLocation,
    paypalBookingCount,
    taxedBookingCount,
    byState: [...stateMap.values()].sort(
      (a, b) => b.taxCollected - a.taxCollected || b.bookingCount - a.bookingCount,
    ),
    recent: paid.slice(0, 20).map((row) => ({
      id: asTrimmed(row.id),
      createdAt: asTrimmed(row.created_at),
      guruName: asTrimmed(row.guru_name) || "Guru",
      city: asTrimmed(row.care_city) || asTrimmed(row.city),
      state: normalizeUsState(asTrimmed(row.care_state) || asTrimmed(row.state)),
      zip: asTrimmed(row.care_zip_code),
      provider: asTrimmed(row.payment_provider) || "stripe",
      taxableBase: bookingTaxableBase(row),
      tipAmount: bookingTip(row),
      taxCollected: bookingTax(row),
    })),
    sourceHealth: [
      {
        id: "bookings",
        label: "Paid bookings",
        ok: paid.length > 0,
        rowCount: paid.length,
      },
      {
        id: "booking_payments",
        label: "booking_payments",
        ok: payments.length > 0,
        rowCount: payments.length,
      },
      {
        id: "tax_collected",
        label: "Sales tax collected",
        ok: taxedBookingCount > 0 || paymentTax > 0,
        rowCount: taxedBookingCount,
      },
    ],
  };
}
