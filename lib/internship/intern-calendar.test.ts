import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildInternAssignmentCalendar } from "./intern-calendar";
import type { InternshipTask } from "./types";

const INTERN_ID = "dcb4119c-8ac0-4bcf-b9ba-b0729e08f438";
const OTHER_INTERN_ID = "11111111-1111-4111-8111-111111111111";
const ASSIGNMENT_ID = "a79e6bb0-4439-421b-b24f-5fb8553f620c";
function task(patch: Partial<InternshipTask> = {}): InternshipTask {
  return {
    id: ASSIGNMENT_ID,
    internId: INTERN_ID,
    projectId: null,
    title: "Pet Trend Research & SitGuru Content Ideas",
    dueOn: "2026-11-19",
    status: "todo",
    workUrl: "",
    businessObjective: "",
    metricAffected: "",
    studentNotes: "",
    supervisorNotes: "",
    supervisorApproved: false,
    approvedAt: null,
    submittedAt: null,
    employerLetter: "",
    kpiTier: "",
    outputVsTarget: null,
    ...patch,
  };
}

describe("intern calendar follows Ava's SitGuru assignments automatically", () => {
  it("shows Lola's due date with a direct link into her assignment", () => {
    const events = buildInternAssignmentCalendar({ internId: INTERN_ID, tasks: [task()] });
    assert.equal(events.length, 1);
    assert.deepEqual(events[0], {
      id: `intern-task-${ASSIGNMENT_ID}`,
      date: "2026-11-19",
      title: "Pet Trend Research & SitGuru Content Ideas",
      kind: "assignment",
      time: "",
      href: `/intern/assignments/${ASSIGNMENT_ID}`,
    });
  });

  it("never shows another intern's tasks or unpublished drafts", () => {
    const events = buildInternAssignmentCalendar({
      internId: INTERN_ID,
      tasks: [task({ internId: OTHER_INTERN_ID }), task({ status: "draft" })],
    });
    assert.deepEqual(events, []);
  });

  it("deduplicates by assignment ID across loads and moves due dates after edits", () => {
    const tasks = [task(), task()];
    assert.equal(buildInternAssignmentCalendar({ internId: INTERN_ID, tasks }).length, 1);
    const revised = buildInternAssignmentCalendar({ internId: INTERN_ID, tasks: [task({ dueOn: "2026-11-22" })] });
    assert.equal(revised[0]?.date, "2026-11-22");
    assert.equal(revised.length, 1);
  });

  it("rejects undated or invalid assignments and sorts real deadlines", () => {
    const events = buildInternAssignmentCalendar({
      internId: INTERN_ID,
      tasks: [
        task({ id: "b", dueOn: "" }),
        task({ id: "c", dueOn: "2026-02-30" }),
        task({ id: "a", dueOn: "2026-11-20" }),
        task(),
      ],
    });
    assert.deepEqual(events.map((event) => event.date), ["2026-11-19", "2026-11-20"]);
  });
});
