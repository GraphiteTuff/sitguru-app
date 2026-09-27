import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import { deriveStripeConnectReadiness } from "../stripe-connect-readiness";

function makeAccount(
  overrides: Partial<Stripe.Account> & {
    requirements?: Partial<Stripe.Account.Requirements> | null;
  } = {},
): Stripe.Account {
  const { requirements, ...rest } = overrides;
  return {
    id: "acct_test",
    object: "account",
    charges_enabled: false,
    payouts_enabled: false,
    details_submitted: false,
    requirements: {
      currently_due: [],
      eventually_due: [],
      past_due: [],
      pending_verification: [],
      disabled_reason: null,
      alternatives: null,
      current_deadline: null,
      errors: [],
      ...(requirements || {}),
    },
    ...rest,
  } as Stripe.Account;
}

describe("deriveStripeConnectReadiness", () => {
  it("marks transfers-only Express accounts complete when payouts are enabled", () => {
    const readiness = deriveStripeConnectReadiness(
      makeAccount({
        charges_enabled: false,
        payouts_enabled: true,
        details_submitted: true,
      }),
    );

    expect(readiness.complete).toBe(true);
    expect(readiness.pendingReview).toBe(false);
    expect(readiness.connectStatus).toBe("connected");
  });

  it("shows pending review after info submitted while Stripe verifies", () => {
    const readiness = deriveStripeConnectReadiness(
      makeAccount({
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: true,
        requirements: {
          currently_due: [],
          disabled_reason: "requirements.pending_verification",
        },
      }),
    );

    expect(readiness.complete).toBe(false);
    expect(readiness.pendingReview).toBe(true);
    expect(readiness.connectStatus).toBe("pending");
  });

  it("stays restricted while currently_due requirements remain", () => {
    const readiness = deriveStripeConnectReadiness(
      makeAccount({
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: true,
        requirements: {
          currently_due: ["individual.ssn_last_4"],
          disabled_reason: "requirements.past_due",
        },
      }),
    );

    expect(readiness.complete).toBe(false);
    expect(readiness.pendingReview).toBe(false);
    expect(readiness.connectStatus).toBe("restricted");
  });

  it("treats classic charges+payouts accounts as complete", () => {
    const readiness = deriveStripeConnectReadiness(
      makeAccount({
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      }),
    );

    expect(readiness.complete).toBe(true);
    expect(readiness.connectStatus).toBe("connected");
  });
});
