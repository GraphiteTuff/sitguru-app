import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  approvedHours,
  canRewriteSubmittedActuals,
  canUserApproveOwnTime,
  createAdjustment,
  creditBearingHours,
  defaultPlanTotals,
  lockedAfterApproval,
  managerCanAccessIntern,
  nextWeeklyTransition,
  semesterOverage,
  semesterPace,
  weekHoursAreFlexible,
} from "./domain";

const spring = { requiredHours: 150, internshipWeeks: 15, weeklyTarget: 10 };

describe("SitGuru Timekeeper", () => {
  it("treats 15 weeks at the 10-hour planning target as 150 hours", () => {
    assert.equal(defaultPlanTotals(15, 10), 150);
  });

  it("allows a 6-hour week and a later 14-hour week", () => {
    assert.equal(weekHoursAreFlexible(6).ok, true);
    assert.equal(weekHoursAreFlexible(14).ok, true);
    assert.equal(weekHoursAreFlexible(6).ok && weekHoursAreFlexible(6).differsFromTarget, true);
  });

  it("still projects a varied pace back to the semester requirement", () => {
    const pace = semesterPace({ ...spring, approvedHours: 6 + 14 + 10 * 4, currentWeek: 6 });
    assert.equal(pace.approved, 60);
    assert.equal(pace.remaining, 90);
    assert.equal(pace.weeksRemaining, 9);
    assert.equal(pace.averageNeeded, 10);
    assert.equal(pace.status, "on_track");
  });

  it("warns when 143 approved hours plus 10 more would pass 150", () => {
    const warning = semesterOverage({ approvedHours: 143, additionalHours: 10, requiredHours: 150 });
    assert.equal(warning.exceeds, true);
    assert.match(warning.message, /150-hour/);
    assert.equal(warning.total, 153);
  });

  it("does not let an intern approve their own hours", () => {
    assert.equal(canUserApproveOwnTime(), false);
    const own = nextWeeklyTransition({ status: "submitted", action: "founder_approve", actor: "intern" });
    assert.equal(own.ok, false);
  });

  it("hides an intern from a manager who is not assigned", () => {
    assert.equal(
      managerCanAccessIntern({
        actor: "manager",
        actorUserId: "manager-b",
        targetInternId: "intern-a",
        managerUserId: "manager-a",
      }),
      false,
    );
    assert.equal(
      managerCanAccessIntern({
        actor: "manager",
        actorUserId: "manager-a",
        targetInternId: "intern-a",
        managerUserId: "manager-a",
      }),
      true,
    );
  });

  it("lets the manager return a week and the intern resubmit", () => {
    assert.equal(canRewriteSubmittedActuals(), false);
    const returned = nextWeeklyTransition({ status: "submitted", action: "return", actor: "manager" });
    assert.equal(returned.ok && returned.status, "returned");
    const again = nextWeeklyTransition({ status: "returned", action: "resubmit", actor: "intern" });
    assert.equal(again.ok && again.status, "submitted");
  });

  it("recommends approval and lets the founder batch-approve official hours", () => {
    const recommended = nextWeeklyTransition({
      status: "submitted",
      action: "recommend",
      actor: "manager",
    });
    assert.equal(recommended.ok && recommended.status, "manager_recommended");
    const approved = nextWeeklyTransition({
      status: "manager_recommended",
      action: "founder_approve",
      actor: "supervisor",
    });
    assert.equal(approved.ok && approved.status, "founder_approved");
    assert.equal(
      approvedHours([
        { hours: 10, status: "founder_approved" },
        { hours: 9.5, status: "manager_recommended" },
        { hours: 4, status: "draft" },
      ]),
      10,
    );
  });

  it("locks approved time and keeps the original value on an adjustment", () => {
    assert.equal(lockedAfterApproval("founder_approved"), true);
    assert.equal(lockedAfterApproval("draft"), false);
    const adjustment = createAdjustment({
      originalHours: 8,
      proposedHours: 7.5,
      reason: "Meeting ended early",
    });
    assert.equal(adjustment.originalHours, 8);
    assert.equal(adjustment.preservesOriginal, true);
  });

  it("calculates a recovery pace when weekly hours vary", () => {
    const pace = semesterPace({ ...spring, approvedHours: 56, currentWeek: 7 });
    assert.equal(pace.remaining, 94);
    assert.equal(pace.weeksRemaining, 8);
    assert.equal(pace.averageNeeded, 11.75);
    assert.equal(pace.status, "recovery");
    assert.equal(pace.label, "Recovery plan recommended");
    assert.equal(creditBearingHours(153, 150), 150);
    const lighter = semesterPace({ ...spring, approvedHours: 60, currentWeek: 6 });
    assert.equal(lighter.averageNeeded, 10);
    assert.equal(lighter.status, "on_track");
  });

  it("uses a different required-hour total without code changes", () => {
    const pace = semesterPace({
      requiredHours: 120,
      approvedHours: 40,
      internshipWeeks: 12,
      currentWeek: 4,
      weeklyTarget: 10,
    });
    assert.equal(pace.remaining, 80);
    assert.equal(pace.weeksRemaining, 8);
    assert.equal(pace.averageNeeded, 10);
    assert.equal(semesterOverage({ approvedHours: 118, additionalHours: 4, requiredHours: 120 }).exceeds, true);
  });
});
