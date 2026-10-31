import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allowedContentTransition } from "./content-flow";
import {
  expectedHoursForWeek,
  summarizeInternshipHours,
  validateInternshipHours,
} from "./hours";
import {
  canBrowseAllPortals,
  canGiveCeoReview,
  canPreviewInternPortal,
  canReadPrivateInternRecord,
  internOnThisManagerDesk,
  internshipActorKind,
  staffPreviewUserId,
  superUserMayPreviewManager,
} from "./manager-access";
import {
  draftReportContributions,
  nextReportRevision,
  officialReportContributions,
  type ReportContribution,
} from "./report-provenance";
import { nextReviewStage } from "./review-flow";
import { groupWorkload } from "./workload";
import { isWeekZeroReady } from "./week-zero";
import { internshipWeekNumber } from "./process";

const ryanStart = "2027-01-11";

describe("internship authorization", () => {
  it("keeps Ryan and Lola on their own records", () => {
    assert.equal(
      canReadPrivateInternRecord({
        actor: "intern",
        actorInternId: "ryan",
        targetInternId: "lola",
      }),
      false,
    );
    assert.equal(
      canReadPrivateInternRecord({
        actor: "intern",
        actorInternId: "lola",
        targetInternId: "ryan",
      }),
      false,
    );
    assert.equal(
      canReadPrivateInternRecord({
        actor: "intern",
        actorInternId: "ryan",
        targetInternId: "ryan",
      }),
      true,
    );
  });

  it("lets Ava read assigned interns and blocks unrelated staff", () => {
    assert.equal(
      internshipActorKind({ role: "social_community_manager" }),
      "manager",
    );
    assert.equal(
      canReadPrivateInternRecord({
        actor: "manager",
        actorUserId: "ava",
        targetInternId: "ryan",
        managerUserId: "ava",
      }),
      true,
    );
    assert.equal(
      canReadPrivateInternRecord({
        actor: "manager",
        actorUserId: "ava",
        targetInternId: "ryan",
        managerUserId: "someone-else",
      }),
      false,
    );
    assert.equal(internshipActorKind({ role: "customer_service" }), "none");
    assert.equal(
      canReadPrivateInternRecord({
        actor: "none",
        targetInternId: "ryan",
      }),
      false,
    );
  });

  it("gives Jason supervisor access, not Ava CEO approval", () => {
    assert.equal(internshipActorKind({ role: "support_admin", isSuperUser: true }), "supervisor");
    assert.equal(canGiveCeoReview("supervisor"), true);
    assert.equal(canGiveCeoReview("manager"), false);
  });

  it("lets admin open every portal and keeps a growth login on assigned interns", () => {
    assert.equal(
      canBrowseAllPortals({ actor: "supervisor", canAccessAdmin: true }),
      true,
    );
    assert.equal(
      canBrowseAllPortals({
        actor: "none",
        canAccessAdmin: true,
        growthOnly: false,
      }),
      true,
    );
    assert.equal(
      canBrowseAllPortals({
        actor: "manager",
        canAccessAdmin: true,
        growthOnly: true,
      }),
      false,
    );
    assert.equal(
      canPreviewInternPortal({
        actor: "supervisor",
        targetInternId: "intern-a",
        managerUserId: "manager-b",
      }),
      true,
    );
    assert.equal(
      canPreviewInternPortal({
        actor: "manager",
        canAccessAdmin: true,
        growthOnly: true,
        actorUserId: "manager-a",
        targetInternId: "intern-a",
        managerUserId: "manager-a",
      }),
      true,
    );
    assert.equal(
      canPreviewInternPortal({
        actor: "manager",
        canAccessAdmin: true,
        growthOnly: true,
        actorUserId: "manager-a",
        targetInternId: "intern-b",
        managerUserId: "manager-b",
      }),
      false,
    );
    assert.equal(
      staffPreviewUserId({
        actor: "supervisor",
        actorUserId: "founder",
        requestedUserId: "11111111-1111-4111-8111-111111111111",
      }),
      "11111111-1111-4111-8111-111111111111",
    );
    assert.equal(
      staffPreviewUserId({
        actor: "manager",
        growthOnly: true,
        canAccessAdmin: true,
        actorUserId: "manager-a",
        requestedUserId: "11111111-1111-4111-8111-111111111111",
      }),
      "manager-a",
    );
  });

  it("lets a super user open an active manager portal and blocks everyone else", () => {
    const ava = "023ef25a-44a5-4732-a96e-e67430ee8798";
    assert.equal(
      superUserMayPreviewManager({
        isSuperUser: true,
        requestedUserId: ava,
        activeManagerIds: [ava],
      }),
      true,
    );
    assert.equal(
      superUserMayPreviewManager({
        isSuperUser: false,
        requestedUserId: ava,
        activeManagerIds: [ava],
      }),
      false,
    );
    assert.equal(
      superUserMayPreviewManager({
        isSuperUser: true,
        requestedUserId: "11111111-1111-4111-8111-111111111111",
        activeManagerIds: [ava],
      }),
      false,
    );
  });

  it("filters a supervisor desk to one manager without hiding the full desk", () => {
    const intern = {
      id: "intern-a",
      status: "active",
      managerUserId: "manager-a",
    };
    assert.equal(
      internOnThisManagerDesk({
        actorKind: "supervisor",
        actorUserId: "founder",
        intern,
      }),
      true,
    );
    assert.equal(
      internOnThisManagerDesk({
        actorKind: "supervisor",
        actorUserId: "founder",
        managerFilter: "manager-a",
        intern,
      }),
      true,
    );
    assert.equal(
      internOnThisManagerDesk({
        actorKind: "supervisor",
        actorUserId: "founder",
        managerFilter: "manager-b",
        intern,
      }),
      false,
    );
    assert.equal(
      internOnThisManagerDesk({
        actorKind: "manager",
        actorUserId: "manager-b",
        managerFilter: "manager-a",
        intern,
      }),
      false,
    );
  });
});

describe("internship hours", () => {
  it("calculates Ryan’s 150-hour pace at week 6", () => {
    const summary = summarizeInternshipHours({
      requiredHours: 150,
      requirementStatus: "confirmed",
      plannedWeeklyHours: 10,
      internshipWeeks: 15,
      startDate: ryanStart,
      today: new Date("2027-02-16T12:00:00"),
      weekZeroReady: true,
      entries: [
        { workedOn: "2027-01-12", hours: 10, status: "ava_approved", weekNumber: 1 },
        { workedOn: "2027-01-19", hours: 10, status: "ava_approved", weekNumber: 2 },
        { workedOn: "2027-01-26", hours: 10, status: "ava_approved", weekNumber: 3 },
        { workedOn: "2027-02-02", hours: 10, status: "ava_approved", weekNumber: 4 },
        { workedOn: "2027-02-09", hours: 10, status: "ava_approved", weekNumber: 5 },
        { workedOn: "2027-02-16", hours: 5, status: "ava_approved", weekNumber: 6 },
        { workedOn: "2027-02-17", hours: 2.5, status: "submitted", weekNumber: 6 },
        { workedOn: "2027-02-18", hours: 3, status: "draft", weekNumber: 6 },
      ],
    });

    assert.equal(summary.weekNumber, 6);
    assert.equal(summary.expectedHours, 60);
    assert.equal(summary.loggedThisWeek, 10.5);
    assert.equal(summary.submittedHours, 57.5);
    assert.equal(summary.approvedHours, 55);
    assert.equal(summary.remainingHours, 95);
    assert.equal(summary.paceLabel, "5 hours behind");
    assert.equal(summary.progressLabel, "55 / 150 approved — 36.7%");
    assert.equal(expectedHoursForWeek({
      weekNumber: 1,
      plannedWeeklyHours: 10,
      internshipWeeks: 15,
    }), 10);
    assert.equal(expectedHoursForWeek({
      weekNumber: 15,
      plannedWeeklyHours: 10,
      internshipWeeks: 15,
    }), 150);
  });

  it("does not invent a pace when Lola’s requirement is pending", () => {
    const summary = summarizeInternshipHours({
      requiredHours: 150,
      requirementStatus: "pending",
      plannedWeeklyHours: 10,
      internshipWeeks: 15,
      startDate: ryanStart,
      today: new Date("2027-02-16T12:00:00"),
      weekZeroReady: true,
      entries: [{ workedOn: "2027-02-16", hours: 2, status: "submitted", weekNumber: 6 }],
    });
    assert.equal(summary.pendingRequirement, true);
    assert.match(summary.pendingMessage, /pending confirmation/);
    assert.equal(summary.expectedHours, null);
    assert.equal(summary.submittedHours, 2);
    assert.equal(summary.approvedHours, 0);
  });

  it("accepts decimal hours and rejects invalid hours", () => {
    assert.equal(validateInternshipHours("0.5").ok, true);
    assert.equal(validateInternshipHours("1.25").ok, true);
    assert.equal(validateInternshipHours(2.5).ok, true);
    assert.equal(validateInternshipHours("-1").ok, false);
    assert.equal(validateInternshipHours("0").ok, false);
    assert.equal(validateInternshipHours("1.234").ok, false);
    assert.equal(validateInternshipHours("18").ok, false);
  });

  it("uses a schedule exception without rewriting other weeks", () => {
    assert.equal(
      expectedHoursForWeek({
        weekNumber: 3,
        plannedWeeklyHours: 10,
        internshipWeeks: 15,
        exceptions: [{ weekNumber: 2, plannedHours: 0 }],
      }),
      20,
    );
  });
});

describe("review workflow", () => {
  it("runs submit, changes, resubmit, Ava approval, and optional CEO review", () => {
    const submitted = nextReviewStage({
      stage: "draft",
      action: "submit",
      actor: "intern",
    });
    assert.equal(submitted.ok && submitted.stage, "submitted_to_ava");

    const changes = nextReviewStage({
      stage: "submitted_to_ava",
      action: "request_changes",
      actor: "manager",
    });
    assert.equal(changes.ok && changes.stage, "changes_requested");

    const resubmit = nextReviewStage({
      stage: "changes_requested",
      action: "resubmit",
      actor: "intern",
    });
    assert.equal(resubmit.ok && resubmit.stage, "submitted_to_ava");

    const approved = nextReviewStage({
      stage: "submitted_to_ava",
      action: "approve",
      actor: "manager",
    });
    assert.equal(approved.ok && approved.stage, "ava_approved");

    const blocked = nextReviewStage({
      stage: "submitted_to_ava",
      action: "ceo_approve",
      actor: "manager",
    });
    assert.equal(blocked.ok, false);

    const escalated = nextReviewStage({
      stage: "submitted_to_ava",
      action: "escalate",
      actor: "manager",
    });
    assert.equal(escalated.ok && escalated.stage, "submitted_to_jason");

    const ceo = nextReviewStage({
      stage: "submitted_to_jason",
      action: "ceo_approve",
      actor: "supervisor",
    });
    assert.equal(ceo.ok && ceo.stage, "ceo_approved");
  });
});

describe("report contributions", () => {
  const draft: ReportContribution = {
    id: "c1",
    sourceType: "weekly",
    sourceId: "w1",
    internId: "ryan",
    weekNumber: 1,
    sectionId: "market_analysis",
    body: "Campus research",
    status: "submitted_to_ava",
    approved: false,
  };
  const official: ReportContribution = {
    ...draft,
    id: "c2",
    status: "ava_approved",
    approved: true,
    reviewerId: "ava",
    approvedAt: "2027-01-20T12:00:00Z",
  };

  it("keeps drafts out of official report material and preserves provenance", () => {
    assert.equal(officialReportContributions([draft, official]).length, 1);
    assert.equal(officialReportContributions([draft, official])[0]?.id, "c2");
    assert.equal(draftReportContributions([draft, official])[0]?.id, "c1");
    const revision = nextReportRevision({
      previous: official,
      nextBody: "Revised campus research",
      reason: "Added the missing baseline source",
      reviewerId: "ava",
      status: "ava_approved",
      approved: true,
    });
    assert.equal(revision.preservesPrevious, true);
    assert.equal(revision.previousId, "c2");
    assert.equal(revision.version, 2);
    assert.match(revision.reason, /baseline/);
  });
});

describe("week focus", () => {
  it("groups later semester work away from this week and stays on Week 0 before the start date", () => {
    assert.equal(internshipWeekNumber(ryanStart, new Date("2026-10-23T12:00:00")), 0);
    const grouped = groupWorkload(
      [
        { id: "now", title: "Baseline", status: "todo", weekNumber: 6 },
        { id: "next", title: "Pillar test", status: "todo", weekNumber: 7 },
        { id: "soon", title: "Channel test", status: "todo", weekNumber: 8 },
        { id: "later", title: "Final deck", status: "todo", weekNumber: 15 },
      ],
      6,
    );
    assert.deepEqual(grouped.counts, { current: 1, upcoming: 2, later: 1 });
    assert.equal(isWeekZeroReady({ completedKeys: ["welcome"] }), false);
    assert.equal(isWeekZeroReady({ approvedAt: "2026-10-01" }), true);
  });
});

describe("content workflow", () => {
  it("lets Ava approve routine drafts and reserves CEO review for escalation", () => {
    assert.equal(
      allowedContentTransition({
        from: "Draft",
        to: "Submitted to Ava",
        actor: "intern",
      }),
      true,
    );
    assert.equal(
      allowedContentTransition({
        from: "Submitted to Ava",
        to: "Approved",
        actor: "manager",
      }),
      true,
    );
    assert.equal(
      allowedContentTransition({
        from: "Submitted to Ava",
        to: "Needs CEO Review",
        actor: "manager",
      }),
      true,
    );
    assert.equal(
      allowedContentTransition({
        from: "Needs CEO Review",
        to: "Approved",
        actor: "manager",
      }),
      false,
    );
    assert.equal(
      allowedContentTransition({
        from: "Needs CEO Review",
        to: "Approved",
        actor: "supervisor",
      }),
      true,
    );
    assert.equal(
      allowedContentTransition({
        from: "Approved",
        to: "Ready to Publish",
        actor: "intern",
      }),
      true,
    );
    assert.equal(
      allowedContentTransition({
        from: "Ready to Publish",
        to: "Published",
        actor: "intern",
      }),
      true,
    );
  });
});
