import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateAffiliateCommission, proposedAffiliateDefaults, type AffiliateCommissionInput } from "./commission";
const eligible: AffiliateCommissionInput = {
 enabled: true, agreementActive: true, attributionVerified: true,
 firstCompletedBooking: true, paymentSettled: true, refundedOrDisputed: false,
 selfReferral: false, platformRevenueCents: 3000, processingCostCents: 600, rateBasisPoints: 2000
};
test("commission is based on net platform revenue", () => {
 assert.equal(calculateAffiliateCommission(eligible), 480);
 assert.equal(calculateAffiliateCommission({...eligible, processingCostCents: 4000}), 0);
});
test("all eligibility gates fail closed", () => {
 for (const key of ["enabled","agreementActive","attributionVerified","firstCompletedBooking","paymentSettled"] as const) {
  assert.equal(calculateAffiliateCommission({...eligible,[key]:false}),0);
 }
 for (const key of ["refundedOrDisputed","selfReferral"] as const) {
  assert.equal(calculateAffiliateCommission({...eligible,[key]:true}),0);
 }
});
test("invalid inputs rejected and defaults inactive", () => {
 assert.throws(() => calculateAffiliateCommission({...eligible,rateBasisPoints:10001}), RangeError);
 assert.throws(() => calculateAffiliateCommission({...eligible,processingCostCents:-1}), RangeError);
 assert.equal(proposedAffiliateDefaults.commissionsEnabled,false);
 assert.equal(proposedAffiliateDefaults.publicEnrollmentEnabled,false);
 assert.equal(proposedAffiliateDefaults.automaticPayoutsEnabled,false);
});
