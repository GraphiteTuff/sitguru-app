/**
 * Pure Stripe Connect readiness helpers for Guru payouts.
 * SitGuru charges Pet Parents on the platform and transfers to Gurus, so
 * Express accounts request `transfers` only — charges_enabled may stay false.
 */

import type Stripe from "stripe";

export type StripeConnectReadiness = {
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  complete: boolean;
  pendingReview: boolean;
  connectStatus:
    | "connected"
    | "pending"
    | "onboarding_started"
    | "restricted";
  requirementsCurrentlyDue: string[];
  disabledReason: string | null;
};

function isPendingVerificationReason(reason: string | null | undefined) {
  const normalized = String(reason || "")
    .trim()
    .toLowerCase();
  return (
    normalized === "requirements.pending_verification" ||
    normalized === "pending_verification" ||
    normalized.includes("pending_verification")
  );
}

export function deriveStripeConnectReadiness(
  account: Stripe.Account,
): StripeConnectReadiness {
  const chargesEnabled = account.charges_enabled === true;
  const payoutsEnabled = account.payouts_enabled === true;
  const detailsSubmitted = account.details_submitted === true;
  const currentlyDue = Array.isArray(account.requirements?.currently_due)
    ? account.requirements.currently_due.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const disabledReason = account.requirements?.disabled_reason || null;
  // Open dues or a hard disabled reason (not pending verification) = more setup needed.
  const restricted =
    currentlyDue.length > 0 ||
    (Boolean(disabledReason) && !isPendingVerificationReason(disabledReason));

  // Transfers-only Express: payouts + submitted details with no open dues.
  const complete =
    payoutsEnabled && detailsSubmitted && currentlyDue.length === 0;

  // After Stripe's "Information submitted" screen, details are in and payouts
  // are not live yet — treat as In review so Earnings does not say Continue.
  const pendingReview =
    detailsSubmitted &&
    !complete &&
    !restricted &&
    currentlyDue.length === 0;

  const connectStatus: StripeConnectReadiness["connectStatus"] = complete
    ? "connected"
    : restricted
      ? "restricted"
      : pendingReview || detailsSubmitted
        ? "pending"
        : "onboarding_started";

  return {
    stripeAccountId: account.id,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    complete,
    pendingReview,
    connectStatus,
    requirementsCurrentlyDue: currentlyDue,
    disabledReason,
  };
}
