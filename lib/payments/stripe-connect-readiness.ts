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
  connectStatus: "connected" | "pending" | "onboarding_started" | "restricted";
  requirementsCurrentlyDue: string[];
};

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
  const restricted = Boolean(disabledReason) || currentlyDue.length > 0;

  // Transfers-only Express: payouts + submitted details with no open dues.
  const complete =
    payoutsEnabled &&
    detailsSubmitted &&
    !restricted &&
    currentlyDue.length === 0;

  const connectStatus: StripeConnectReadiness["connectStatus"] = complete
    ? "connected"
    : restricted && detailsSubmitted
      ? "restricted"
      : detailsSubmitted
        ? "pending"
        : "onboarding_started";

  return {
    stripeAccountId: account.id,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    complete,
    connectStatus,
    requirementsCurrentlyDue: currentlyDue,
  };
}
