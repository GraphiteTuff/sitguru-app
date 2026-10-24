import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignmentChangeSummary,
  findDuplicateAssignment,
  focusedInternshipWeek,
  isEligibleInternshipManagerRole,
  managerDeskIncludes,
} from "./assignment";
import { canReadPrivateInternRecord } from "./manager-access";
import { summarizeInternshipHours } from "./hours";

describe("dynamic manager assignment", () => {
  it("shows a manager only the interns assigned to them", () => {
    const ava = "manager-ava";
    const other = "manager-b";
    assert.equal(
      canReadPrivateInternRecord({
        actor: "manager",
        actorUserId: ava,
        targetInternId: "ryan",
        managerUserId: ava,
      }),
      true,
    );
    assert.equal(
      canReadPrivateInternRecord({
        actor: "manager",
        actorUserId: ava,
        targetInternId: "lola",
        managerUserId: ava,
      }),
      true,
    );
    assert.equal(
      canReadPrivateInternRecord({
        actor: "manager",
        actorUserId: ava,
        targetInternId: "intern-c",
        managerUserId: other,
      }),
      false,
    );
    assert.equal(
      canReadPrivateInternRecord({
        actor: "manager",
        actorUserId: other,
        targetInternId: "intern-c",
        managerUserId: other,
      }),
      true,
    );
    assert.equal(
      canReadPrivateInternRecord({
        actor: "manager",
        actorUserId: ava,
        targetInternId: "unassigned",
        managerUserId: null,
      }),
      false,
    );
  });

  it("moves current access on reassignment and leaves the old review attributed", () => {
    const review = {
      id: "review-1",
      reviewerId: "manager-ava",
      reviewerName: "Ava Venezia",
      stage: "ava_approved",
    };
    const nextManager = "manager-b";
    assert.equal(
      canReadPrivateInternRecord({
        actor: "manager",
        actorUserId: "manager-ava",
        targetInternId: "ryan",
        managerUserId: nextManager,
      }),
      false,
    );
    assert.equal(
      canReadPrivateInternRecord({
        actor: "manager",
        actorUserId: nextManager,
        targetInternId: "ryan",
        managerUserId: nextManager,
      }),
      true,
    );
    assert.equal(review.reviewerId, "manager-ava");
    assert.match(
      assignmentChangeSummary({
        oldManagerName: "Ava Venezia",
        newManagerName: "Future Manager",
      }),
      /Ava Venezia to Future Manager/,
    );
  });

  it("rejects customer accounts and accepts an intern manager role", () => {
    assert.equal(isEligibleInternshipManagerRole("pet_parent"), false);
    assert.equal(isEligibleInternshipManagerRole("customer"), false);
    assert.equal(isEligibleInternshipManagerRole("guru"), false);
    assert.equal(isEligibleInternshipManagerRole("intern_manager"), true);
    assert.equal(isEligibleInternshipManagerRole("social_community_manager"), true);
    assert.equal(isEligibleInternshipManagerRole("founder"), true);
  });

  it("blocks a second open assignment for the same account and term", () => {
    const existing = [
      {
        id: "ryan",
        email: "ryan@example.edu",
        userId: "user-ryan",
        cohortId: "spring-2027",
        status: "pending_university_approval",
      },
    ];
    assert.ok(
      findDuplicateAssignment(existing, {
        email: "ryan@example.edu",
        cohortId: "spring-2027",
      }),
    );
    assert.equal(
      findDuplicateAssignment(existing, {
        email: "lola@example.edu",
        userId: "user-lola",
        cohortId: "spring-2027",
      }),
      null,
    );
  });
});

describe("internship clock", () => {
  it("does not start week 1 while university approval is still pending", () => {
    assert.equal(
      focusedInternshipWeek({
        status: "pending_university_approval",
        startDate: "2027-01-11",
        today: new Date("2027-02-16T12:00:00"),
        weekZeroReady: true,
      }),
      0,
    );
    assert.equal(
      focusedInternshipWeek({
        status: "active",
        startDate: "2027-01-11",
        today: new Date("2027-02-16T12:00:00"),
        weekZeroReady: true,
      }),
      6,
    );
    assert.equal(managerDeskIncludes("pending_university_approval"), true);
    assert.equal(managerDeskIncludes("archived"), false);
  });

  it("keeps a pending hour requirement from showing a false pace", () => {
    const summary = summarizeInternshipHours({
      requiredHours: null,
      requirementStatus: "pending",
      plannedWeeklyHours: null,
      startDate: "2027-01-11",
      today: new Date("2027-02-16T12:00:00"),
      clockRunning: true,
      weekZeroReady: true,
    });
    assert.equal(summary.pendingRequirement, true);
    assert.equal(summary.expectedHours, null);
    assert.match(summary.progressLabel, /pending confirmation/i);
  });
});
