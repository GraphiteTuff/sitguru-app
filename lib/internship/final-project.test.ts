import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assembleBusinessGrowthReport,
  assembleFinalProjectWorkspace,
  capstoneWeekForNumber,
  defaultFinalSectionForWeek,
  FINAL_CONTRIBUTION_SECTIONS,
  FINAL_PROJECT_OUTPUTS,
  FINAL_WORKSPACE_CHAPTERS,
} from "./final-project";

describe("SitGuru Market Growth Project capstone", () => {
  it("keeps three connected final outputs and a 15-week build path", () => {
    assert.deepEqual(
      FINAL_PROJECT_OUTPUTS.map((row) => row.id),
      ["report", "playbook", "portfolio"],
    );
    assert.equal(FINAL_CONTRIBUTION_SECTIONS.length, 13);
    assert.equal(FINAL_WORKSPACE_CHAPTERS.length, 9);
    assert.equal(capstoneWeekForNumber(1).buildsToward, "Final report: Starting Point");
    assert.equal(capstoneWeekForNumber(5).section, "campaign_system");
    assert.equal(capstoneWeekForNumber(14).section, "sop_handoff");
    assert.equal(defaultFinalSectionForWeek(6), "pet_parent_growth");
    assert.equal(
      capstoneWeekForNumber(15).buildsToward,
      "Business Growth Report: measurable outcomes and lessons learned",
    );
    assert.equal(capstoneWeekForNumber(99).week, 15);
  });

  it("assembles approved weekly work into Business Growth Report chapters instead of leaving it as busywork", () => {
    const workspace = assembleFinalProjectWorkspace({
      weeklyReviews: [
        {
          id: "w1",
          weekOf: "2027-01-11",
          accomplished: "Mapped Greater Philadelphia Pet Parent demand",
          dataShowed: "Baseline pending",
          didntWork: "",
          changingNextWeek: "Lock SMART targets",
          finalSection: "market_analysis",
          contributionAdded: "Starting Point: market definition and current SitGuru metrics.",
          hoursLogged: 10,
          workApproved: true,
          hoursApproved: true,
          evidenceApproved: true,
          contributionApproved: true,
        },
      ],
      tasks: [
        {
          id: "t6",
          title: "Week 6: Test Find a local Guru messaging",
          status: "approved",
          supervisorApproved: true,
          finalSection: "pet_parent_growth",
          weekNumber: 6,
          internReportedValue: "27 registrations",
          verifiedValue: "24 registrations",
          studentNotes: "Urgency CTA increased visits but lowered conversion.",
        },
      ],
      campaigns: [
        {
          id: "c1",
          name: "SG-SP27-PP-006",
          objective: "Generate attributable Pet Parent registrations",
          status: "active",
          finalSection: "pet_parent_growth",
        },
      ],
      experiments: [
        {
          id: "e1",
          hypothesis: "Find a local Guru messaging will convert better than generic care copy",
          action: "Test urgency CTA on landing page",
          result: "Traffic up, conversion down",
          lesson: "Urgency CTA increased landing-page visits but lowered conversion",
          nextStep: "Test trust-first CTA",
          finalSection: "pet_parent_growth",
          internReportedResult: "27 registrations",
          verifiedResult: "24 registrations",
          includedInFinal: true,
        },
      ],
      metrics: [
        {
          id: "m1",
          label: "Pet Parent registrations",
          valueNumeric: 24,
          isVerified: true,
          selfReported: false,
          finalSection: "analytics_attribution",
        },
      ],
      smartGoals: [
        {
          id: "g1",
          specific: "Generate 25 attributable Pet Parent registrations",
          targetValue: "25",
          baselineValue: "0",
          status: "locked",
        },
      ],
    });

    assert.ok(workspace.overallPercent > 0);
    const market = workspace.chapters.find((row) => row.id === "market_analysis");
    assert.equal(market?.statusLabel, "100%");
    const experiments = workspace.blocks.filter(
      (row) => row.chapter === "experiments_results" && row.included,
    );
    assert.ok(experiments.some((row) => row.verified === "24 registrations"));
    assert.ok(experiments.some((row) => /lowered conversion/i.test(row.learning || row.summary)));
    const goals = workspace.chapters.find((row) => row.id === "baseline_goals");
    assert.ok((goals?.percent || 0) > 0);
    const portfolio = workspace.chapters.find((row) => row.id === "portfolio");
    assert.equal(portfolio?.statusLabel, "Not Started");
  });

  it("does not count unapproved weekly work toward the final product", () => {
    const workspace = assembleFinalProjectWorkspace({
      weeklyReviews: [
        {
          id: "w2",
          weekOf: "2027-01-18",
          accomplished: "Posted five Instagram graphics",
          dataShowed: "",
          didntWork: "",
          changingNextWeek: "",
          finalSection: "content_system",
          contributionAdded: "Posted five things",
          contributionApproved: false,
        },
      ],
    });
    const content = workspace.chapters.find((row) => row.id === "campaign_system");
    assert.equal(content?.statusLabel, "Not Started");
  });

  it("builds the Business Growth Report from verified outcomes and lessons learned", () => {
    const workspace = assembleFinalProjectWorkspace({
      experiments: [
        {
          id: "e1",
          hypothesis: "Urgency CTA wins",
          action: "Test urgency CTA",
          result: "Traffic up, conversion down",
          lesson: "Urgency CTA increased landing-page visits but lowered conversion",
          nextStep: "Test trust-first CTA",
          internReportedResult: "27 registrations",
          verifiedResult: "24 registrations",
          includedInFinal: true,
        },
        {
          id: "e2",
          hypothesis: "Unapproved test",
          action: "Posted without tracking",
          result: "Claimed 40 signups",
          lesson: "This should not appear until Jason approves it",
          nextStep: "",
          internReportedResult: "40 signups",
          verifiedResult: "",
          includedInFinal: false,
        },
      ],
      metrics: [
        {
          id: "m1",
          label: "Pet Parent registrations",
          valueNumeric: 24,
          isVerified: true,
          selfReported: false,
        },
        {
          id: "m2",
          label: "Self-reported reach",
          valueNumeric: 900,
          isVerified: false,
          selfReported: true,
        },
      ],
    });
    const report = assembleBusinessGrowthReport(workspace);
    assert.equal(report.name, "Business Growth Report");
    assert.ok(report.outcomes.some((row) => row.verified === "24" || row.verified === "24 registrations"));
    assert.equal(
      report.outcomes.some((row) => row.verified === "900" || /40 signups/.test(row.internReported)),
      false,
    );
    assert.ok(report.lessons.some((row) => /lowered conversion/i.test(row.learning)));
    assert.equal(report.lessons.some((row) => /should not appear/i.test(row.learning)), false);
    assert.ok(report.percent > 0);
    const empty = assembleBusinessGrowthReport(assembleFinalProjectWorkspace({}));
    assert.equal(empty.outcomes.length, 0);
    assert.equal(empty.lessons.length, 0);
    assert.equal(empty.percent, 0);
  });
});
