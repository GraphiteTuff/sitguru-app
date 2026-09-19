import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  connectStatusFromStripeAccount,
  resolveStripeConnectStatus,
  toStoredStripeConnectStatus,
} from "../stripe/connect-status";

describe("resolveStripeConnectStatus", () => {
  it("CASE 8: no Stripe account id -> Not Started", () => {
    const result = resolveStripeConnectStatus({
      guru: { stripe_account_id: null },
    });
    assert.equal(result.key, "not_started");
    assert.equal(result.label, "Not Started");
  });

  it("CASE 6: account exists with currently_due -> Action required", () => {
    const result = resolveStripeConnectStatus({
      guru: { stripe_account_id: "acct_123" },
      stripeAccount: {
        id: "acct_123",
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: true,
        requirements: {
          currently_due: ["individual.verification.document"],
          past_due: [],
          pending_verification: [],
        },
      },
    });
    assert.equal(result.key, "action_required");
    assert.equal(result.label, "Action required");
  });

  it("CASE 7: charges + payouts enabled, no blocking requirements -> Ready", () => {
    const result = resolveStripeConnectStatus({
      guru: { stripe_account_id: "acct_ready" },
      stripeAccount: {
        id: "acct_ready",
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: [],
          past_due: [],
          pending_verification: [],
        },
      },
    });
    assert.equal(result.key, "ready");
    assert.equal(result.label, "Ready");
  });

  it("account id alone is Started, not Not Started or Ready", () => {
    const result = resolveStripeConnectStatus({
      guru: {
        stripe_account_id: "acct_started",
        stripe_connect_status: null,
        charges_enabled: false,
        payouts_enabled: false,
      },
    });
    assert.equal(result.key, "started");
    assert.equal(result.label, "Started");
  });

  it("maps stored statuses for writers", () => {
    assert.equal(toStoredStripeConnectStatus("ready"), "connected");
    assert.equal(toStoredStripeConnectStatus("action_required"), "action_required");
    assert.equal(toStoredStripeConnectStatus("started"), "onboarding_started");
  });

  it("connectStatusFromStripeAccount uses live requirements", () => {
    const result = connectStatusFromStripeAccount({
      id: "acct_x",
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
      requirements: { currently_due: ["tos_acceptance.date"] },
    });
    assert.equal(result.key, "action_required");
  });
});
