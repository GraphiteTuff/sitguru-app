import assert from "node:assert/strict";
import { test } from "node:test";
import type { ManagerScheduleItem } from "@/lib/internship/manager-dashboard";
import { calendarMonth, internshipCalendarIcs, outlookMonthWindow } from "./ical";
import { checkedOutlookFlow, openOutlookValue, outlookDeepLink, outlookHash, outlookSecret, outlookSettings, sealOutlookValue } from "./security";

test("Outlook credentials and subscription secrets are bound to their owner and purpose", () => {
  const key = Buffer.alloc(32, 9);
  const encoded = sealOutlookValue(key, "outlook:token:intern-a", { refresh: "fixture-refresh" });
  assert.ok(!encoded.includes("fixture-refresh"));
  assert.deepEqual(openOutlookValue(key, "outlook:token:intern-a", encoded), { refresh: "fixture-refresh" });
  assert.equal(openOutlookValue(key, "outlook:token:intern-b", encoded), null);
  assert.equal(openOutlookValue(key, "outlook:flow", encoded), null);
  const secret = outlookSecret();
  assert.match(secret, /^[\w-]{43}$/);
  assert.match(outlookHash(secret), /^[a-f0-9]{64}$/);
});

test("OAuth state is valid only in its own verified session before expiry", () => {
  const flow = { userId: "first", portal: "manager" as const, state: "fixture-state", verifier: "fixture-verifier", expires: 100 };
  assert.equal(checkedOutlookFlow(flow, "first", "fixture-state", 99), flow);
  assert.equal(checkedOutlookFlow(flow, "second", "fixture-state", 99), null);
  assert.equal(checkedOutlookFlow(flow, "first", "other-state", 99), null);
  assert.equal(checkedOutlookFlow(flow, "first", "fixture-state", 100), null);
});

test("Outlook configuration and outbound links accept only the expected origins and paths", () => {
  const config = {
    SITGURU_OUTLOOK_ENABLED: "true", MICROSOFT_OUTLOOK_TENANT_ID: "organizations", MICROSOFT_OUTLOOK_CLIENT_ID: "fixture-client",
    MICROSOFT_OUTLOOK_CLIENT_SECRET: "fixture-secret", MICROSOFT_OUTLOOK_ENCRYPTION_KEY: Buffer.alloc(32).toString("base64"),
    MICROSOFT_OUTLOOK_REDIRECT_URI: "https://www.sitguru.com/api/internship/outlook/callback",
  };
  assert.ok(outlookSettings(config));
  assert.equal(outlookSettings({ ...config, SITGURU_OUTLOOK_ENABLED: "false" }), null);
  assert.equal(outlookSettings({ ...config, MICROSOFT_OUTLOOK_REDIRECT_URI: "https://www.sitguru.com/other" }), null);
  assert.equal(outlookDeepLink("https://outlook.office.com/calendar/item"), "https://outlook.office.com/calendar/item");
  assert.equal(outlookDeepLink("https://outlook.office.com.example.test/item"), null);
  assert.equal(outlookDeepLink("javascript:alert(1)"), null);
});

test("SitGuru subscriptions use one stable event per source, with valid and escaped dates and titles", () => {
  const event: ManagerScheduleItem = { id: "owned-assignment", kind: "assignment", date: "2027-02-28",
    title: "Research, content; draft\nATTENDEE:outside@example.test " + "é".repeat(50), time: "" };
  const now = new Date("2026-11-25T18:00:00Z");
  const calendar = internshipCalendarIcs("intern", [
    event, { ...event, date: "2027-03-01" }, { ...event, id: "invalid", date: "2027-02-30" },
    { ...event, id: "checkin-2027-01-01", title: "Unscheduled check-in" },
  ], now);
  assert.match(calendar, /DTSTART;VALUE=DATE:20270228\r\nDTEND;VALUE=DATE:20270301/);
  assert.match(calendar, /SUMMARY:Research\\, content\\; draft\\nATTENDEE:/);
  assert.ok(!calendar.includes("\r\nATTENDEE:"));
  assert.equal(calendar.match(/BEGIN:VEVENT/g)?.length, 1);
  assert.ok(calendar.split("\r\n").every((line) => Buffer.byteLength(line) <= 75));
  const moved = internshipCalendarIcs("intern", [{ ...event, date: "2027-03-01" }], now);
  const unfold = (feed: string) => feed.replaceAll("\r\n ", "");
  assert.equal(unfold(calendar).match(/UID:.*/)?.[0], unfold(moved).match(/UID:.*/)?.[0]);
  assert.equal(calendarMonth("2027-13", now), "2026-11");
});


test("the Outlook range follows SitGuru's Eastern month boundary across daylight saving", () => {
  assert.deepEqual(outlookMonthWindow("2027-03"), {
    start: "2027-03-01T05:00:00.000Z", end: "2027-04-01T04:00:00.000Z",
  });
});
