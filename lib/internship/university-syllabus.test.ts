import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BA495A_EXAMPLE,
  SYLLABUS_ACADEMIC_FIELDS,
  SYLLABUS_ASSESSMENT,
  SYLLABUS_CORE_DELIVERABLES,
  SYLLABUS_GUIDELINES,
  SYLLABUS_PHASES,
  SYLLABUS_WORKFLOW,
  syllabusAcademicPlanSummary,
} from "./university-syllabus";

describe("university-neutral SitGuru Spring 2027 program syllabus", () => {
  it("preserves ten measurable, uniquely identified deliverables", () => {
    assert.equal(SYLLABUS_CORE_DELIVERABLES.length, 10);
    assert.equal(new Set(SYLLABUS_CORE_DELIVERABLES.map((d) => d.id)).size, 10);
    assert.equal(SYLLABUS_CORE_DELIVERABLES.map((d) => d.letter).join(""), "ABCDEFGHIJ");
    for (const row of SYLLABUS_CORE_DELIVERABLES) {
      assert.ok(row.title.length > 8);
      assert.ok(row.evidence.length > 20);
      assert.ok(row.objective.length > 20);
    }
  });

  it("keeps university-specific hours/credits out of the common deliverable standards", () => {
    assert.equal(SYLLABUS_PHASES.length, 5);
    assert.equal(SYLLABUS_ACADEMIC_FIELDS.length, 5);
    assert.equal(SYLLABUS_WORKFLOW.length, 6);
    assert.equal(SYLLABUS_ASSESSMENT.length, 4);
    assert.ok(SYLLABUS_GUIDELINES.some((s) => /the university/i.test(s)));
    const universal = JSON.stringify(SYLLABUS_CORE_DELIVERABLES);
    assert.ok(!universal.includes("300 total hours"));
    assert.ok(!universal.includes("6 credits"));
  });

  it("clearly identifies BA 495A as an academic example only", () => {
    assert.match(BA495A_EXAMPLE.label, /example/i);
    assert.match(BA495A_EXAMPLE.summary, /does not change SitGuru's universal program/);
    assert.match(BA495A_EXAMPLE.hours, /300/);
  });

  it("does not invent hours, credits, or university approval for incomplete profiles", () => {
    assert.deepEqual(syllabusAcademicPlanSummary({
      courseCode: "",
      credits: null,
      requiredHours: null,
      weeks: null,
    }), [
      "Course pending",
      "Credits pending",
      "Hours pending",
      "Academic schedule pending",
    ]);
  });

  it("shows individual academic plans without projecting them onto other interns", () => {
    assert.deepEqual(syllabusAcademicPlanSummary({
      courseCode: "BA 495A",
      credits: 6,
      requiredHours: 300,
      weeks: 15,
    }), [
      "BA 495A",
      "6 planned credits",
      "300 hours recorded",
      "15 weeks planned",
    ]);
    assert.deepEqual(syllabusAcademicPlanSummary({
      courseCode: "MKT 490",
      credits: 3,
      requiredHours: 150,
      weeks: 15,
    }), [
      "MKT 490",
      "3 planned credits",
      "150 hours recorded",
      "15 weeks planned",
    ]);
  });
});
