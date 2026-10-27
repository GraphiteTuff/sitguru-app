/**
 * Decimal-safe money helpers for staff Timekeeper payments.
 * Store rates as integer cents; hours as numeric with ≤2 decimal places.
 */

export function dollarsToCents(dollars: number): number {
  if (!Number.isFinite(dollars)) return 0;
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(centsToDollars(cents));
}

export function formatHours(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

/** amount_cents = round(hours × rate_cents) with hours quantized to 0.01. */
export function hoursTimesRateCents(hours: number, rateCents: number): number {
  const quantizedHours = Math.round(hours * 100) / 100;
  if (!Number.isFinite(quantizedHours) || !Number.isFinite(rateCents)) return 0;
  return Math.round(quantizedHours * rateCents);
}

export function sumCents(values: number[]): number {
  return values.reduce((sum, value) => sum + Math.round(value || 0), 0);
}

export function parsePositiveHours(raw: unknown):
  | { ok: true; hours: number }
  | { ok: false; error: string } {
  const text = typeof raw === "number" ? String(raw) : String(raw ?? "").trim();
  if (!text) return { ok: false, error: "Enter how many hours you worked." };
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return { ok: false, error: "Use a number like 0.5, 1.25, or 2.5." };
  }
  const hours = Number(text);
  if (!Number.isFinite(hours) || hours <= 0) {
    return { ok: false, error: "Hours must be greater than zero." };
  }
  if (hours > 24) {
    return { ok: false, error: "One entry can be at most 24 hours." };
  }
  return { ok: true, hours: Math.round(hours * 100) / 100 };
}
