import assert from "node:assert/strict";
import test from "node:test";
import {
  bookingCountBucket,
  conversionRate,
  formalCommitmentNeedsApproval,
  partnershipCanProceed,
  surveyIsOpen,
  trackingLink,
  weekStartKey,
} from "./model";

test("week starts Monday in New York", () => {
  assert.equal(weekStartKey(new Date("2026-10-28T16:00:00.000Z")), "2026-10-26");
});

test("canceled bookings are not confirmed results", () => {
  assert.equal(bookingCountBucket("canceled"), "ignored");
  assert.equal(bookingCountBucket("confirmed"), "confirmed");
  assert.equal(conversionRate(2, 0), null);
});

test("a contract cannot proceed until leadership approves it", () => {
  assert.equal(formalCommitmentNeedsApproval("Contract"), true);
  assert.equal(formalCommitmentNeedsApproval("Conversation"), false);
  assert.equal(partnershipCanProceed({ commitment: "Sponsorship", leadershipApproved: false }), false);
  assert.equal(partnershipCanProceed({ commitment: "Cross-promotion", leadershipApproved: false }), true);
  assert.equal(partnershipCanProceed({ commitment: "Legal agreement", leadershipApproved: true }), true);
});

test("closed polls stay closed and tracking links do not invent bookings", () => {
  assert.equal(surveyIsOpen({ status: "Closed", today: "2026-11-02" }), false);
  assert.equal(surveyIsOpen({ status: "Open", startOn: "2026-11-01", endOn: "2026-11-07", today: "2026-11-02" }), true);
  assert.match(trackingLink("https://www.sitguru.com", "shelter-week", "instagram"), /utm_campaign=shelter-week/);
});
