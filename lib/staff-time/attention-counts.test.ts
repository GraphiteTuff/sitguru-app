import assert from "node:assert/strict";
import test from "node:test";
import { contractorAttentionCounts } from "@/lib/staff-time/attention-counts";

test("contractorAttentionCounts returns a shaped result without throwing", async () => {
  const counts = await contractorAttentionCounts();
  assert.equal(typeof counts.hoursAwaitingApproval, "number");
  assert.equal(typeof counts.awaitingPayment, "number");
  assert.equal(typeof counts.needsCorrection, "number");
  assert.equal(typeof counts.available, "boolean");
  assert.ok(counts.hoursAwaitingApproval >= 0);
  assert.ok(counts.awaitingPayment >= 0);
});
