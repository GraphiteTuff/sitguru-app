import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("manager submits a confirmed saved period and sends an exact-record alert", () => {
  const action = read("lib/staff-time/actions.ts");
  assert.match(action, /select\("id,status,submitted_at"\)/);
  assert.match(action, /notifyHref: `\/admin\/hr\/people\/payments#period-/);
  assert.match(action, /resourceVersion: now/);
});

test("founder and active HR approvers are the contractor submission notification recipients", () => {
  const receivers = read("lib/realtime/recipients.ts");
  const publisher = read("lib/realtime/publish-staff-time.ts");
  assert.match(receivers, /listContractorHoursApproverIds/);
  assert.match(receivers, /SUPER_USER_EMAILS/);
  assert.match(publisher, /notifyRecipientUserIds/);
  assert.match(publisher, /TIME_PERIOD_SUBMITTED/);
});

test("bell delivery honors targeted recipients and avoids duplicate events", () => {
  const publisher = read("lib/realtime/publish-live-signal.ts");
  assert.match(publisher, /ignoreDuplicates: true/);
  assert.match(publisher, /insertedSignals/);
  assert.match(publisher, /notifyRecipientUserIds/);
});

test("previous periods remain visible in Manager and Admin preview after rollover", () => {
  const queries = read("lib/staff-time/queries.ts");
  assert.match(queries, /listRecentStaffPeriods/);
  assert.match(queries, /recentPeriods,/);
  for (const filename of ["MyTimeDesk", "MyTimePanel", "PaymentsDesk"]) {
    assert.match(read(`components/staff-time/${filename}.tsx`), /data\.recentPeriods/);
  }
});

test("Admin HQ and Action Center link to one contractor record", () => {
  const queue = read("components/staff-time/AdminPaymentQueue.tsx");
  const actions = read("app/admin/action-center/page.tsx");
  assert.match(queue, /id=\{`period-/);
  assert.match(actions, /\/admin\/hr\/people\/payments#period-/);
});
