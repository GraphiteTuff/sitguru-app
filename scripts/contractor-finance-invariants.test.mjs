import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Admin Finance has no draft counter, sections, or loading", () => {
  const page = source("app/admin/hr/people/payments/page.tsx");
  const queue = source("components/staff-time/AdminPaymentQueue.tsx");
  const query = source("lib/staff-time/queries.ts");
  assert.doesNotMatch(page, /Saved drafts|count\("draft"\)|#drafts/);
  assert.doesNotMatch(queue, /Saved, Not Submitted|Draft — not submitted|id="drafts"/);
  const financeStatuses = query.slice(query.indexOf("const CONTRACTOR_STATUSES"), query.indexOf("async function queryPaymentPeriodQueue"));
  assert.doesNotMatch(financeStatuses, /"draft"/);
  assert.match(query, /\.eq\("employment_classification", "contractor"\)/);
});

test("Contractor finance transitions are all server-authorized atomic RPC calls", () => {
  const action = source("lib/staff-time/actions.ts");
  const migration = source("supabase/migrations/20261115_staff_payments_atomic_finance.sql");
  for (const name of [
    "staff_time_submit_period", "staff_time_approve_period",
    "staff_time_return_period", "staff_time_record_confirmed_ach",
  ]) {
    assert.match(action, new RegExp(name));
    assert.match(migration, new RegExp("function public\\." + name));
  }
  assert.match(migration, /staff_period_audit_events/);
  assert.match(migration, /security invoker/g);
  assert.match(migration, /revoke all on function/);
  assert.match(action, /amountCents !== Number\(periodRow\.amount_cents\)/);
});

test("Weekly cadence is engagement-specific, previous approved periods remain immutable", () => {
  const period = source("lib/staff-time/periods.ts");
  const query = source("lib/staff-time/queries.ts");
  assert.match(period, /paymentPeriodContaining/);
  assert.match(query, /engagement\.paymentCadence/);
  assert.match(query, /if \(!\["draft", "needs_correction"\]\.includes\(period\.status\)\) return period/);
});

test("Manager views show submitted, Admin reviewed and Paid stages", () => {
  for (const file of ["MyTimeDesk", "MyTimePanel", "PaymentsDesk"]) {
    const code = source(`components/staff-time/${file}.tsx`);
    assert.match(code, /submittedAt/);
    assert.match(code, /approvedAt/);
    assert.match(code, /paidAt/);
  }
});
