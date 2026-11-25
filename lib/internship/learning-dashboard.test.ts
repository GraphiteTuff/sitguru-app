import assert from "node:assert/strict";
import { test } from "node:test";
import { documentationInternWorkspace } from "./documentation-fixture";
import { buildLearningDashboard } from "./learning-dashboard";

test("dashboard progress and deadlines only count visible, relevant records", () => {
  const data = documentationInternWorkspace();
  const [task] = data.tasks;
  const [milestone] = data.milestones;
  const dueOn = "2027-03-09";
  data.tasks = [
    { ...task, id: "community", status: "approved", reviewStage: "approved_complete", dueOn, briefPayload: { category: "Campus Growth" } },
    { ...task, id: "social", status: "approved", reviewStage: "ceo_review_required", dueOn, briefPayload: { category: "Social Media" } },
    { ...task, id: "unclassified", status: "todo", reviewStage: "", supervisorApproved: false, dueOn, briefPayload: { category: "Research" } },
    { ...task, id: "draft", status: "draft", dueOn, briefPayload: { category: "Social Media" } },
    { ...task, id: "other", internId: "other-intern", status: "todo", dueOn, briefPayload: { category: "Social Media" } },
  ];
  data.milestones = [
    { ...milestone, id: "ours", universityId: data.intern.universityId, status: "planned", dueOn },
    { ...milestone, id: "other-school", universityId: "other-school", status: "planned", dueOn },
    { ...milestone, id: "complete", universityId: null, status: "complete", dueOn },
  ];
  const summary = buildLearningDashboard(data, "2027-03-08");

  assert.deepEqual(summary.pillars.map(({ id, assigned, completed }) => [id, assigned, completed]), [
    ["community", 1, 1],
    ["social", 1, 0],
  ]);
  assert.equal(summary.unclassified, 1);
  assert.deepEqual(summary.upcoming.map(({ id }) => id).sort(), ["ours", "social", "unclassified"]);
  assert.equal(summary.assignments.length, 3);
});

test("links approved hours to one assignment and its explicit pillar", () => {
  const data = documentationInternWorkspace();
  const [base] = data.tasks;
  data.tasks = [
    { ...base, id: "assigned-task", internId: data.intern.id, status: "in_progress",
      briefPayload: { category: "Content", primaryGrowthPillar: "community", targetAudiences: ["Pet Parents", "Gurus"] } },
  ];
  const time = {
    id: "linked-time", internId: data.intern.id, workedOn: "2027-03-08", hours: 2.25,
    activity: "Campus content", workItemType: "task", workItemId: "assigned-task",
    weekNumber: 5, notes: "", evidenceUrl: "", status: "ava_approved",
    submittedAt: null, managerReviewedAt: null,
  };
  data.timeLogs = [
    time,
    { ...time, status: "supervisor_verified" },
    { ...time, id: "draft", status: "draft" },
    { ...time, id: "other-intern", internId: "another-intern" },
    { ...time, id: "unlinked", workItemId: "" },
  ];
  const summary = buildLearningDashboard(data, "2027-03-08");

  assert.deepEqual(summary.pillars.map(({ id, assigned, approvedHours }) => [id, assigned, approvedHours]), [
    ["community", 1, 2.25],
    ["social", 0, 0],
  ]);
});
