/** Pure calculation only. Never authorizes a payout or establishes attribution. */
export interface AffiliateCommissionInput {
  enabled: boolean;
  agreementActive: boolean;
  attributionVerified: boolean;
  firstCompletedBooking: boolean;
  paymentSettled: boolean;
  refundedOrDisputed: boolean;
  selfReferral: boolean;
  platformRevenueCents: number;
  processingCostCents: number;
  rateBasisPoints: number;
}
export function calculateAffiliateCommission(input: AffiliateCommissionInput): number {
  const { platformRevenueCents, processingCostCents, rateBasisPoints } = input;
  if (![platformRevenueCents, processingCostCents, rateBasisPoints].every(n => Number.isSafeInteger(n) && n >= 0) || rateBasisPoints > 10000) {
    throw new RangeError("Invalid commission inputs");
  }
  if (!input.enabled || !input.agreementActive || !input.attributionVerified ||
      !input.firstCompletedBooking || !input.paymentSettled ||
      input.refundedOrDisputed || input.selfReferral) return 0;
  const eligible = Math.max(0, platformRevenueCents - processingCostCents);
  return Number(BigInt(eligible) * BigInt(rateBasisPoints) / BigInt(10000));
}
export const proposedAffiliateDefaults = Object.freeze({
  publicEnrollmentEnabled: false,
  commissionsEnabled: false,
  automaticPayoutsEnabled: false,
  rateBasisPoints: 2000,
  attributionDays: 30,
  minimumPayoutCents: 2500,
  pilotDays: 90,
});
