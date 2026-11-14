import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { daysUntilDue, parseAssignmentReminderSettings, reminderForDate, safeReminderDayValues } from "./assignment-reminder-rules";
import { parseMicrosoftPlannerTaskUrl } from "../microsoft/planner-link";

describe("manager assignment reminders", () => {
  it("stays off until the manager explicitly opts in", () => {
    const initial = parseAssignmentReminderSettings({});
    assert.equal(initial.enabled, false);
    assert.equal(reminderForDate({ dueOn: "2026-11-19", today: "2026-11-16", status: "todo", settings: initial }), null);
  });
  it("accepts only approved reminder offsets and recipient settings", () => {
    assert.deepEqual(safeReminderDayValues(["1", "7", "90", "oops", 3, "1"]), [7, 3, 1]);
    const config = parseAssignmentReminderSettings({ managerAutomation: { enabled: true, daysBefore: [7, 1], notifyManager: false } });
    assert.deepEqual(config.daysBefore, [7, 1]);
    assert.equal(config.notifyIntern, true);
    assert.equal(config.notifyManager, false);
  });
  it("delivers on selected days, but never for submitted work", () => {
    const settings = parseAssignmentReminderSettings({
      managerAutomation: { enabled: true, daysBefore: [7, 3, 1, 0], notifyIntern: true, notifyManager: true },
    });
    assert.equal(reminderForDate({ dueOn: "2026-11-19", today: "2026-11-16", status: "todo", settings }), 3);
    assert.equal(reminderForDate({ dueOn: "2026-11-19", today: "2026-11-18", status: "in_progress", settings }), 1);
    assert.equal(reminderForDate({ dueOn: "2026-11-19", today: "2026-11-19", status: "revision_requested", settings }), 0);
    assert.equal(reminderForDate({ dueOn: "2026-11-19", today: "2026-11-18", status: "submitted", settings }), null);
    assert.equal(reminderForDate({ dueOn: "2026-11-19", today: "2026-11-18", status: "approved", settings }), null);
  });
  it("uses UTC calendar days, including leap days, and rejects invalid dates", () => {
    assert.equal(daysUntilDue("2028-03-01", "2028-02-28"), 2);
    assert.equal(daysUntilDue("2026-11-13", "2026-11-14"), -1);
    assert.equal(daysUntilDue("2026-02-30", "2026-02-27"), null);
  });
});

describe("safe manual Planner links", () => {
  it("accepts a task link from the Microsoft Planner domain", () => {
    const result = parseMicrosoftPlannerTaskUrl("https://planner.cloud.microsoft/webui/plan/plan-12345/task/task12345");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.taskId, "task12345");
  });
  it("rejects lookalikes and plan home pages without specific tasks", () => {
    assert.equal(parseMicrosoftPlannerTaskUrl("https://planner.cloud.microsoft.evil.example/webui/plan/abc/task/xyz01234").ok, false);
    assert.equal(parseMicrosoftPlannerTaskUrl("http://planner.cloud.microsoft/webui/plan/abc/task/xyz01234").ok, false);
    assert.equal(parseMicrosoftPlannerTaskUrl("https://planner.cloud.microsoft/webui/plan/abc").ok, false);
    assert.equal(parseMicrosoftPlannerTaskUrl("https://example.com/planner/task/abc12345").ok, false);
  });
});
