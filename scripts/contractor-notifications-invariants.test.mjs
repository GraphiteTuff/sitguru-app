import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("manager submits a confirmed saved period and sends an exact-record alert", () => {
  const action = read("lib/staff-time/actions.ts");
  assert.match(action, /staff_time_submit_period/);
  assert.match(action, /submitted !== true/);
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


test("manager receives an own-account submission confirmation without Admin review permission", () => {
  const action = read("lib/staff-time/actions.ts");
  const publisher = read("lib/realtime/publish-staff-time.ts");
  assert.match(action, /await publishManagerTimesheetReceipt\(/);
  assert.match(publisher, /export async function publishManagerTimesheetReceipt/);
  assert.match(publisher, /eventType = "time.period.submission_confirmed"/);
  assert.match(publisher, /recipientUserIds: \[input\.engagement\.userId\]/);
  assert.match(publisher, /notifyRecipientUserIds: \[input\.engagement\.userId\]/);
  assert.match(publisher, /actorUserId: null/);
  assert.match(publisher, /notifyTitle: "Your hours were submitted successfully"/);
  assert.match(action, /href: `\$\{myTimeHome\(formData\)\}#period-\$\{periodId\}`/);
});

test("reviewed-and-approved and Paid messages deep-link to the correct manager period", () => {
  const action = read("lib/staff-time/actions.ts");
  assert.match(action, /Your hours were reviewed and approved by Admin/);
  assert.match(action, /Your contractor payment was marked Paid/);
  assert.equal((action.match(/notifyHref: `\/manager\/payments#period-\$\{periodId\}`/g) || []).length, 2);
  for (const filename of ["MyTimeDesk", "MyTimePanel", "PaymentsDesk"]) {
    assert.match(read(`components/staff-time/${filename}.tsx`), /id=\{`period-\$\{period\.id\}\`\}/);
  }
});
