import type { CanonicalAccountingEvent } from "./types";

function money(value: number) {
  return Number((Number.isFinite(value) ? value : 0).toFixed(2));
}

export function buildCanonicalAccountingEvent(input: {
  sourceKey: string;
  bookingId?: string;
  paymentId?: string;
  eventType?: string;
  eventDate: string;
  grossServiceAmount?: number;
  salesTax?: number;
  tip?: number;
  guruPayout?: number;
  refundAmount?: number;
  paymentProcessingCost?: number;
  otherExpense?: number;
  currency?: string;
}): CanonicalAccountingEvent {
  const tip = money(input.tip || 0);
  const salesTax = money(input.salesTax || 0);
  const refundAmount = money(input.refundAmount || 0);
  const guruPayout = money(input.guruPayout || 0);
  const grossServiceAmount = money(input.grossServiceAmount || 0);

  return {
    sourceKey: input.sourceKey,
    bookingId: input.bookingId || "",
    paymentId: input.paymentId || "",
    eventType: input.eventType || "booking_settlement",
    eventDate: input.eventDate.slice(0, 10),
    grossServiceAmount,
    salesTax,
    tip,
    guruPayout,
    refundAmount,
    paymentProcessingCost: money(input.paymentProcessingCost || 0),
    otherExpense: money(input.otherExpense || 0),
    currency: input.currency || "USD",
  };
}

export function eventDoesNotTreatTipsAsRevenue(event: CanonicalAccountingEvent) {
  return event.tip >= 0 && event.grossServiceAmount >= 0;
}

export function refundReversesAmounts(event: CanonicalAccountingEvent) {
  if (event.refundAmount <= 0) return event;
  return {
    ...event,
    grossServiceAmount: money(Math.max(0, event.grossServiceAmount - event.refundAmount)),
  };
}

export function salesTaxStaysSeparate(event: CanonicalAccountingEvent) {
  return event.salesTax !== event.grossServiceAmount || event.salesTax === 0;
}
