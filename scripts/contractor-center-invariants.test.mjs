import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) { return readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }

test("HR payments is the only contractor workflow and uses all contractor statuses", () => {
  const page = source("app/admin/hr/people/payments/page.tsx");
  assert.match(page, /listContractorPeriods/);
  assert.match(page, /AdminPaymentQueue/);
  assert.match(page, /Submitted for review/);
  assert.match(page, /Ready for payment/);
});

test("Finance contractor pages redirect to canonical HR workspace", () => {
  for (const path of ["contractor-hours", "contractor-payments"]) {
    const page = source(`app/admin/financials/${path}/page.tsx`);
    assert.match(page, /redirect\(/);
    assert.match(page, /\/admin\/hr\/people\/payments/);
    assert.doesNotMatch(page, /listContractorPeriods/);
    assert.doesNotMatch(page, /AdminPaymentQueue/);
  }
});

test("Only one canonical link appears in Finance navigation", () => {
  const page = source("lib/admin/hq-nav.ts");
  assert.match(page, /Contractor Hours & Payments/);
  assert.doesNotMatch(page, /href: "\/admin\/financials\/contractor-(hours|payments)"/);
});

test("Queue includes entries for review, drafts and paid reconciliation", () => {
  const queue = source("components/staff-time/AdminPaymentQueue.tsx");
  assert.match(queue, /item\.entries/);
  assert.match(queue, /Saved, Not Submitted/);
  assert.match(queue, /Recent Paid Periods/);
});
