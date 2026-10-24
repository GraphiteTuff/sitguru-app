import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateBookingTotal } from "../billing/pricingCalculator";
import {
  countPaypalMerchantReadiness,
  describePaypalMerchantReadiness,
  paypalCheckoutChargeAllowed,
  paypalReadinessStatusMessage,
} from "./paypal-readiness";

const examples = [
  {
    name: "Ashley Boelens",
    email: "8psrn7wt5v@privaterelay.appleid.com",
    status: "referral_created",
    paymentsReceivable: false,
    environment: "sandbox",
    label: "Setup Started",
    canReceiveLivePayments: false,
  },
  {
    name: "Echo Levine",
    email: "echodlevine@gmail.com",
    status: "disconnected",
    paymentsReceivable: false,
    environment: "sandbox",
    label: "Disconnected",
    canReceiveLivePayments: false,
  },
  {
    name: "Jason Graff",
    email: "jasongraff1978@gmail.com",
    status: "connected",
    paymentsReceivable: true,
    environment: "sandbox",
    label: "Ready",
    canReceiveLivePayments: false,
  },
  {
    name: "Merchant",
    email: "Merchant",
    status: "pending",
    paymentsReceivable: false,
    environment: "sandbox",
    label: "Setup Pending",
    canReceiveLivePayments: false,
  },
  {
    name: "Diana",
    email: "d@dianaofosu.com",
    status: "referral_created",
    paymentsReceivable: false,
    environment: "sandbox",
    label: "Setup Started",
    canReceiveLivePayments: false,
  },
];

describe("PayPal and Venmo readiness", () => {
  for (const example of examples) {
    it(`${example.name} is ${example.label} and cannot take live PayPal`, () => {
      const readiness = describePaypalMerchantReadiness(example);
      assert.equal(readiness.label, example.label);
      assert.equal(readiness.environmentLabel, "Test");
      assert.equal(readiness.canReceiveLivePayments, false);
      assert.equal(readiness.sentence.length > 0, true);
    });
  }

  it("treats a sandbox connected account as test-only, not live-ready", () => {
    const readiness = describePaypalMerchantReadiness(examples[2]);
    assert.equal(readiness.canReceiveInEnvironment, true);
    assert.equal(readiness.canReceiveLivePayments, false);
    assert.match(readiness.sentence, /test environment only/i);
  });

  it("does not treat payments receivable alone as ready", () => {
    const readiness = describePaypalMerchantReadiness({
      status: "pending",
      paymentsReceivable: true,
      environment: "live",
    });
    assert.equal(readiness.label, "Setup Pending");
    assert.equal(readiness.canReceiveLivePayments, false);
  });

  it("marks live connected accounts with payments receivable as customer-ready", () => {
    const readiness = describePaypalMerchantReadiness({
      status: "connected",
      paymentsReceivable: true,
      environment: "live",
    });
    assert.equal(readiness.label, "Ready");
    assert.equal(readiness.environmentLabel, "Live");
    assert.equal(readiness.canReceiveLivePayments, true);
  });

  it("counts the sample merchants as zero live-ready and one test-only", () => {
    const counts = countPaypalMerchantReadiness(examples);
    assert.deepEqual(counts, { total: 5, liveReady: 0, testReady: 1 });
    assert.equal(
      paypalReadinessStatusMessage(examples),
      "0 live ready · 1 test only · 5 merchants",
    );
  });

  it("refuses PayPal and Venmo charges until a PayPal order path exists", () => {
    assert.equal(paypalCheckoutChargeAllowed(), false);
  });
});

describe("booking payment totals", () => {
  it("prices a multi-day visit with an extra pet, holiday surge, and ambassador discount", () => {
    const pricing = calculateBookingTotal(40, 2, {
      additionalPets: 1,
      holidaySurge: true,
      ambassadorCode: "ROGUE10",
    });
    assert.equal(pricing.subtotalBeforeDiscount, 180);
    assert.equal(pricing.total, 162);
    assert.equal(pricing.amountCents, 16200);
  });

  it("rejects a charge below the Stripe minimum through the pricing total", () => {
    const pricing = calculateBookingTotal(0.2, 1, {
      additionalPets: 0,
      holidaySurge: false,
    });
    assert.equal(pricing.amountCents < 50, true);
  });
});
