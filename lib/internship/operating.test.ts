import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  academicFieldsVerified,
  academicStatusKind,
  academicStatusLabel,
  displayVerifiedNumber,
  internReviewAttention,
  internSupervisorAttention,
  isFormalUniversityPartner,
  recruitingAttention,
  requiredHoursPending,
  sitguruEmploymentLabel,
  sumVerifiedRequiredHours,
} from "./operating";
import type { InternshipWorkspaceData } from "./types";

function intern(overrides: Partial<InternshipWorkspaceData["intern"]> = {}) {
  return {
    id: "intern-1",
    userId: null,
    fullName: "Jason Graff-Test Intern",
    email: "jasongraff1978@gmail.com",
    studentId: "900000000",
    studentEmail: "student@test.edu",
    phone: "555-0100",
    academicLevel: "sophomore",
    cohortId: "c1",
    universityId: "u-test",
    campusId: null,
    pathType: "credit_bearing",
    academicProgram: "Communication",
    courseCode: "",
    credits: 0,
    requiredHours: 0,
    facultySupervisor: "",
    academicAdvisor: "",
    careerOffice: "",
    academicCoordinator: "",
    approvalStatus: "pending",
    approvalDate: null,
    semester: "Spring 2027",
    academicStartDate: null,
    academicEndDate: null,
    status: "accepted" as const,
    portalEnabled: true,
    academicSnapshot: {},
    notes: "",
    avatarUrl: "",
    isTest: true,
    baselineLockedAt: null,
    baselineLockReason: "",
    ...overrides,
  };
}

function workspace(
  overrides: Partial<InternshipWorkspaceData> = {},
): InternshipWorkspaceData {
  return {
    intern: intern(),
    university: null,
    campus: null,
    cohort: null,
    projects: [],
    tasks: [],
    content: [],
    campaigns: [],
    metrics: [],
    scorecards: [],
    weeklyReviews: [],
    smartGoals: [],
    experiments: [],
    accessGrants: [],
    milestones: [],
    comments: [],
    attachments: [],
    onboarding: null,
    ...overrides,
  };
}

describe("internship operating semantics", () => {
  it("does not treat a school as a partner unless relationship is formal/active", () => {
    assert.equal(
      isFormalUniversityPartner({ isUniversityPartner: true, status: "contacted" }),
      false,
    );
    assert.equal(
      isFormalUniversityPartner({
        isUniversityPartner: true,
        status: "formal_partner",
      }),
      true,
    );
    assert.equal(
      isFormalUniversityPartner({
        isUniversityPartner: false,
        status: "active_partner",
      }),
      false,
    );
  });

  it("renders unverified academic numbers as Pending, including stored zeros", () => {
    const row = intern({ credits: 0, requiredHours: 0, academicSnapshot: {} });
    assert.equal(academicFieldsVerified(row), false);
    assert.equal(displayVerifiedNumber(row.credits, false), "Pending");
    assert.equal(displayVerifiedNumber(row.requiredHours, false), "Pending");
    assert.equal(displayVerifiedNumber(0, true), "0");
    assert.equal(academicStatusLabel(academicStatusKind(row)), "Requirements Not Verified");
    assert.equal(sitguruEmploymentLabel("accepted"), "Accepted");
    assert.equal(sitguruEmploymentLabel("active"), "Active Intern");
  });

  it("treats missing required hours as pending, not a zero total", () => {
    const pending = intern({ requiredHours: null, academicSnapshot: {} });
    const verified = intern({
      requiredHours: 135,
      academicSnapshot: { requirementId: "req-1" },
    });
    assert.equal(requiredHoursPending([pending]), true);
    assert.equal(sumVerifiedRequiredHours([pending]), null);
    assert.equal(sumVerifiedRequiredHours([verified]), 135);
  });

  it("builds intern review attention from actual missing conditions", () => {
    const items = internReviewAttention(workspace());
    const texts = items.map((item) => item.text);
    assert.match(texts.join(" | "), /University requirements need verification/);
    assert.match(texts.join(" | "), /Required hours pending/);
    assert.match(texts.join(" | "), /SMART goal not established/);
    assert.match(texts.join(" | "), /Baseline not locked/);
    assert.match(texts.join(" | "), /Weekly update due/);
    assert.match(texts.join(" | "), /No KPI verification source connected/);
    assert.match(texts.join(" | "), /Onboarding e-sign and signed-page upload pending/);
  });

  it("does not invent intern attention when the record is complete", () => {
    const items = internSupervisorAttention(
      workspace({
        intern: intern({
          academicSnapshot: { requirementId: "req-1" },
          requiredHours: 135,
          baselineLockedAt: "2026-09-05T12:00:00.000Z",
        }),
        onboarding: {
          internId: "intern-1",
          policyVersion: "2027-spring-v1",
          typedLegalName: "Jason Graff-Test Intern",
          accessRulesAcceptedAt: "2026-09-05T12:00:00.000Z",
          electronicSignedAt: "2026-09-05T12:01:00.000Z",
          signerEmail: "jasongraff1978@gmail.com",
          wetInkFileName: "signed.pdf",
          wetInkStoragePath: "interns/intern-1/confidentiality/signed.pdf",
          wetInkMimeType: "application/pdf",
          wetInkFileSize: 1200,
          wetInkUploadedAt: "2026-09-05T12:02:00.000Z",
          wetInkSubmittedAt: "2026-09-05T12:03:00.000Z",
          wetInkEmailedAt: "2026-09-05T12:03:00.000Z",
        },
        smartGoals: [
          {
            id: "g1",
            internId: "intern-1",
            specific: "Grow Pet Parents",
            measurable: "100",
            achievable: "yes",
            relevant: "growth",
            timeBound: "April",
            metricKey: "people.pet_parents",
            baselineValue: "10",
            targetValue: "100",
            sourceSystem: "sitguru_admin",
            status: "locked",
            submittedAt: null,
            approvedAt: "2026-09-05T12:00:00.000Z",
            approvedBy: "jason",
            lockedAt: "2026-09-05T12:00:00.000Z",
            changeReason: "",
          },
        ],
        metrics: [
          {
            id: "m1",
            internId: "intern-1",
            campaignId: null,
            projectId: null,
            metricKey: "people.pet_parents",
            label: "Pet Parents",
            valueNumeric: 12,
            periodStart: "2026-09-05",
            periodEnd: "2026-09-05",
            sourceSystem: "sitguru_admin",
            sourceNote: "live",
            isVerified: true,
            selfReported: false,
          },
        ],
        weeklyReviews: [
          {
            id: "w1",
            internId: "intern-1",
            weekOf: new Date().toISOString().slice(0, 10),
            accomplished: "Posted",
            dataShowed: "Up",
            didntWork: "",
            changingNextWeek: "",
            upcomingApproved: false,
          },
        ],
        accessGrants: [
          {
            toolKey: "verified_metrics",
            granted: true,
            notes: "",
            grantStatus: "active",
          },
        ],
        scorecards: [
          {
            id: "s1",
            internId: "intern-1",
            periodStart: "2026-09-01",
            periodEnd: "2026-09-14",
            quality: 4,
            communication: 4,
            reliability: 4,
            creativity: 4,
            analytics: 4,
            judgment: 4,
            initiative: 4,
            kpiContribution: 4,
            strongestContribution: "Tracking",
            improvementRequired: "",
            scoredAt: "2026-09-05",
          },
        ],
      }),
    );
    assert.equal(items.length, 0);
  });

  it("surfaces recruiting attention from university pipeline status", () => {
    const items = recruitingAttention([
      {
        id: "psu",
        slug: "penn-state-abington",
        displayName: "Penn State Abington",
        recruitingStatus: "posting_submitted",
        fundingStatus: "not_yet_open",
        nextAction: "Posting approval / CPD response",
      },
      {
        id: "gmercy",
        slug: "gwynedd-mercy-university",
        displayName: "Gwynedd Mercy University",
        recruitingStatus: "awaiting_response",
        fundingStatus: "research_needed",
        nextAction: "Follow up if no response",
      },
    ]);
    const blob = items.map((item) => item.text).join(" | ");
    assert.match(blob, /Penn State Abington posting awaiting approval/);
    assert.match(blob, /1 university outreach response pending/);
    assert.match(blob, /Spring 2027 funding information pending/);
  });
});
