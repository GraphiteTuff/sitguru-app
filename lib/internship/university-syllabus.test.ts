import assert from "node:assert/strict";
import {
  ASSIGNMENT_CATEGORY_FINAL_SECTION,
  defaultFinalSectionForCategory,
  isValidFinalSection,
  syllabusDeliveryCrosswalk,
  syllabusWeekCrosswalk,
} from "./syllabus-alignment";
import { CAPSTONE_WEEK_PLAN, FINAL_CONTRIBUTION_SECTIONS, FINAL_WORKSPACE_CHAPTERS } from "./final-project";
import { ASSIGNMENT_CATEGORIES, assignmentBrief, readAssignmentBrief, validateManagerAssignment } from "./manager-assignment";
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
      "300 planned hours",
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
      "150 planned hours",
      "15 weeks planned",
    ]);
  });
});

describe("syllabus mapped to existing project and assignment workflows", () => {
  it("maps all ten deliverables to canonical Final Growth Report sections and chapters", () => {
    const mappings = syllabusDeliveryCrosswalk();
    assert.equal(mappings.length, SYLLABUS_CORE_DELIVERABLES.length);
    assert.deepEqual(new Set(mappings.map((m) => m.id)), new Set(SYLLABUS_CORE_DELIVERABLES.map((m) => m.id)));
    for (const mapped of mappings) {
      const source = FINAL_CONTRIBUTION_SECTIONS.find((s) => s.id === mapped.sectionId);
      assert.ok(source, mapped.id);
      const chapter = FINAL_WORKSPACE_CHAPTERS.find((c) => c.id === mapped.chapterId);
      assert.ok(chapter, mapped.id);
      assert.equal(source.chapter, chapter.id);
      assert.equal(source.output, mapped.output);
    }
  });

  it("follows the actual 15-week capstone plan exactly once across five phases", () => {
    const phases = syllabusWeekCrosswalk();
    assert.equal(phases.length, 5);
    assert.deepEqual(phases.flatMap((p) => p.weeks.map((w) => w.week)), CAPSTONE_WEEK_PLAN.map((w) => w.week));
  });

  it("provides an explicit mapped final destination for every manager assignment category", () => {
    assert.deepEqual(new Set(Object.keys(ASSIGNMENT_CATEGORY_FINAL_SECTION)), new Set(ASSIGNMENT_CATEGORIES));
    for (const category of ASSIGNMENT_CATEGORIES) {
      assert.ok(isValidFinalSection(defaultFinalSectionForCategory(category)), category);
    }
    assert.equal(defaultFinalSectionForCategory("Research"), "market_analysis");
    assert.equal(defaultFinalSectionForCategory("Campus Growth"), "guru_growth");
  });

  it("stores and reads each assignment's cohort project and report chapter without replacing work", () => {
    const checked = validateManagerAssignment({
      internId: "f110e46b-a7ac-4d64-b112-2adf9957cc31",
      title: "Campus outreach research",
      category: "Campus Growth",
      milestoneId: "",
      projectId: "b4775347-aa34-4dfb-a021-802c123e4ac8",
      finalSection: "guru_growth",
      dueOn: "2027-03-15",
      priority: "Normal",
      description: "Research three campus community options and save sources.",
      deliverables: ["Three sources and one research summary"],
      review: "Manager Review Required",
      freedom: "Guided",
      resources: [],
      notes: "",
      clientRequestId: "fixture",
    }, "create");
    assert.equal(checked.ok, true);
    const payload = assignmentBrief(checked.value, "manager-1");
    const fromDb = readAssignmentBrief(payload);
    assert.equal(fromDb.projectId, checked.value.projectId);
    assert.equal(fromDb.finalSection, "guru_growth");
  });

  it("rejects an unknown final-report chapter rather than silently assigning work to Market Analysis", () => {
    const checked = validateManagerAssignment({
      internId: "f110e46b-a7ac-4d64-b112-2adf9957cc31",
      title: "Study",
      category: "Research",
      milestoneId: "",
      finalSection: "not-real",
      dueOn: "2027-03-15",
      priority: "Normal",
      description: "Collect sources",
      deliverables: ["Source list"],
      review: "Manager Review Required",
      freedom: "Guided",
      resources: [],
      notes: "",
      clientRequestId: "fixture",
    }, "create");
    assert.equal(checked.ok, false);
    assert.ok(checked.errors.finalSection);
  });
});
