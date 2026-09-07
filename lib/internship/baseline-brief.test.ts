import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BASELINE_ATTACHMENT_CATEGORIES,
  BASELINE_GROWTH_BRIEF_EMPLOYER,
  BASELINE_GROWTH_BRIEF_HELP_INBOX,
  BASELINE_GROWTH_BRIEF_PURPOSE,
  BASELINE_GROWTH_BRIEF_TITLE,
  BASELINE_INTERN_REPORTED_RULE,
  BASELINE_KPI_VANITY_RULE,
  BASELINE_PII_REMINDER,
  attachmentsForBriefCategory,
  allBaselineBriefDefinitions,
  baselineBriefChecklist,
  baselineBriefReadyPercent,
  baselineBriefReadyToSubmit,
  baselineBriefSubmitBlockers,
  briefIsLocked,
  emptyBaselineBriefPayload,
  fileMatchesBriefCategory,
  internAllowedBriefUpload,
  internCanEditBrief,
  internSafeBriefCopy,
  isBaselineGrowthBriefTask,
  mapApprovedBriefToReportSections,
  officialSmartGoal,
  parseBaselineBriefPayload,
} from "./baseline-brief";

describe("Baseline & Growth Brief", () => {
  it("detects the semester deliverable without treating every week-1 task as the brief", () => {
    assert.equal(
      isBaselineGrowthBriefTask({ title: "Baseline & Growth Brief" }),
      true,
    );
    assert.equal(
      isBaselineGrowthBriefTask({
        title: "Week 1: Market definition, existing SitGuru metrics, audience research",
      }),
      false,
    );
  });

  it("categorizes written brief, presentation, and evidence without overwriting history", () => {
    const files = [
      { itemType: "task", itemId: "t1", caption: "brief", fileName: "v1.docx" },
      { itemType: "task", itemId: "t1", caption: "brief", fileName: "v2.docx" },
      { itemType: "task", itemId: "t1", category: "presentation", fileName: "deck.pptx" },
      { itemType: "task", itemId: "t1", caption: "evidence", fileName: "chart.png" },
      { itemType: "task", itemId: "other", caption: "brief", fileName: "nope.pdf" },
    ];
    assert.deepEqual(
      attachmentsForBriefCategory(files, "t1", "brief").map((row) => row.fileName),
      ["v1.docx", "v2.docx"],
    );
    assert.equal(attachmentsForBriefCategory(files, "t1", "presentation").length, 1);
    assert.equal(fileMatchesBriefCategory("brief.docx", "brief"), true);
    assert.equal(fileMatchesBriefCategory("deck.pdf", "presentation"), false);
    assert.match(internAllowedBriefUpload({ name: "deck.pdf", size: 12 }, "presentation"), /PPT/);
    assert.equal(internAllowedBriefUpload({ name: "brief.pdf", size: 12 }, "brief"), "");
    assert.equal(BASELINE_ATTACHMENT_CATEGORIES.length, 3);
  });

  it("requires sections plus brief and deck before submit — a file alone is not complete", () => {
    const payload = emptyBaselineBriefPayload();
    const empty = baselineBriefChecklist({
      payload,
      taskId: "t1",
      attachments: [{ itemType: "task", itemId: "t1", caption: "brief" } as never],
    });
    assert.equal(empty.writtenBrief, true);
    assert.equal(baselineBriefReadyToSubmit(empty), false);
    assert.ok(baselineBriefSubmitBlockers(empty).some((row) => /presentation/i.test(row)));

    payload.project = {
      name: "Campus Pet Parent growth",
      growthTrack: "pet_parent_growth",
      assignedMarket: "Greater Philadelphia campus",
      geographicBoundaries: "Campus + 10 miles",
      businessObjective: "Help nearby Pet Parents book trusted local Gurus on SitGuru.",
      projectStartDate: "2026-08-09",
      baselineMeasurementRange: "2026-08-01 to 2026-08-20",
    };
    payload.audience.primary = "Campus Pet Parents without a SitGuru account";
    payload.audience.geo = "Campus + 10 miles";
    payload.audience.problemNeed = "Trusted local weekend care";
    payload.audience.whySitguru = "Find Care + bookings stay on SitGuru";
    payload.situation.current = "Find Care and official socials";
    payload.situation.working = "Approved tracking-link posts";
    payload.situation.weak = "Homepage URLs";
    payload.situation.missing = "Campus Guru story";
    payload.risks = payload.risks.map((row, index) => ({
      ...row,
      risk: `Risk ${index + 1}`,
      mitigation: "Document and test",
    }));
    payload.opportunities = payload.opportunities.map((row, index) => ({
      ...row,
      opportunity: `Opportunity ${index + 1}`,
      recommendedTest: "Run a two-week CTA test",
    }));
    payload.metrics = [
      {
        metricKey: "people.pet_parents",
        label: "Pet Parent registrations",
        kpiTier: "tier_1",
        internReportedValue: "20",
        verifiedValue: "",
        unit: "registrations",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-20",
        sourceSystem: "registration_records",
        sourceUrl: "",
        capturedOn: "2026-08-20",
        internNotes: "Market snapshot",
        verificationStatus: "submitted",
      },
    ];
    payload.supervisorReviewRequested = "Please verify the registration baseline.";
    const ready = baselineBriefChecklist({
      payload,
      taskId: "t1",
      attachments: [
        { itemType: "task", itemId: "t1", caption: "brief", fileName: "brief.pdf" } as never,
        { itemType: "task", itemId: "t1", caption: "presentation", fileName: "deck.pptx" } as never,
      ],
      smartGoals: [
        {
          id: "g1",
          internId: "i1",
          specific: "Grow attributable registrations from 20 to 40",
          measurable: "SitGuru registration records",
          achievable: "Campus events plus tracking links",
          relevant: "Pet Parent Growth",
          timeBound: "March 31",
          metricKey: "people.pet_parents",
          baselineValue: "20",
          targetValue: "40",
          sourceSystem: "registration_records",
          status: "draft",
        },
      ],
      experiments: [
        {
          id: "e1",
          internId: "i1",
          hypothesis: "First-comment tracking link lifts sessions",
          action: "Move the CTA to the first comment",
          audience: "Campus Pet Parents",
          result: "",
          lesson: "",
          nextStep: "",
        },
      ],
    });
    assert.equal(baselineBriefReadyToSubmit(ready), true);
    assert.equal(baselineBriefReadyPercent(ready), 100);
  });

  it("maps only an approved brief into Final Growth Report sections", () => {
    const payload = parseBaselineBriefPayload({
      project: {
        name: "Campus growth",
        businessObjective: "Grow attributable Pet Parent registrations on SitGuru.",
      },
      audience: { primary: "Campus Pet Parents" },
      situation: { current: "Find Care plus official socials" },
      risks: [{ risk: "No tracking links" }],
      opportunities: [{ opportunity: "Campus club posts with UTMs" }],
      metrics: [
        {
          label: "Pet Parent registrations",
          internReportedValue: "20",
          verifiedValue: "18",
        },
      ],
    });
    assert.deepEqual(mapApprovedBriefToReportSections({ payload, approved: false }), []);
    const mapped = mapApprovedBriefToReportSections({
      payload,
      approved: true,
      smartGoals: [
        {
          id: "g1",
          internId: "i1",
          specific: "20 to 40 registrations",
          measurable: "",
          achievable: "",
          relevant: "",
          timeBound: "",
          metricKey: "",
          baselineValue: "20",
          targetValue: "40",
          sourceSystem: "",
          status: "approved",
        },
      ],
      experiments: [
        {
          id: "e1",
          internId: "i1",
          hypothesis: "First-comment CTA wins",
          action: "Test first-comment link",
          audience: "",
          result: "",
          lesson: "",
          nextStep: "",
        },
      ],
    });
    assert.ok(mapped.some((row) => row.reportSection === "starting_point" && /Campus growth|Situation|Challenges/.test(row.title)));
    assert.ok(mapped.some((row) => row.reportSection === "baseline_goals" && /intern-reported 20/.test(row.summary)));
    assert.ok(mapped.some((row) => row.reportSection === "methods" && /Audience/.test(row.title)));
    assert.ok(mapped.some((row) => row.reportSection === "experiments"));
    assert.equal(officialSmartGoal({ status: "draft" }), false);
    assert.equal(officialSmartGoal({ status: "approved" }), true);
  });

  it("locks the intern out of edits after SitGuru locks the baseline", () => {
    const payload = emptyBaselineBriefPayload();
    assert.equal(briefIsLocked({ baselineLockedAt: null }, payload), false);
    assert.equal(briefIsLocked({ baselineLockedAt: "2026-08-20T12:00:00.000Z" }, payload), true);
    assert.equal(
      internCanEditBrief({
        intern: { baselineLockedAt: "2026-08-20T12:00:00.000Z" },
        payload,
        taskStatus: "submitted",
      }),
      false,
    );
    payload.overallStatus = "approved";
    assert.equal(internCanEditBrief({ intern: { baselineLockedAt: null }, payload }), false);
  });

  it("keeps intern-safe copy and first-year definitions for Help search", () => {
    assert.match(BASELINE_GROWTH_BRIEF_TITLE, /Baseline & Growth Brief/);
    assert.match(BASELINE_GROWTH_BRIEF_PURPOSE, /Final Business Growth Report/);
    assert.match(BASELINE_GROWTH_BRIEF_EMPLOYER, /Graff Enterprises LLC dba SitGuru/);
    assert.equal(BASELINE_GROWTH_BRIEF_HELP_INBOX, "intern@sitguru.com");
    assert.match(BASELINE_PII_REMINDER, /Do not include customer names/);
    assert.match(BASELINE_KPI_VANITY_RULE, /Follower count/);
    assert.match(BASELINE_INTERN_REPORTED_RULE, /never auto-verify/i);
    const defs = allBaselineBriefDefinitions();
    assert.ok(defs.some((row) => /Tier 1/i.test(row.label)));
    assert.ok(defs.some((row) => /Locked baseline/i.test(row.label)));
    assert.ok(defs.some((row) => /SMART goal/i.test(row.label)));
    assert.ok(defs.some((row) => /Intern-reported vs verified/i.test(row.label)));
    for (const row of defs) {
      assert.equal(internSafeBriefCopy(`${row.label} ${row.meaning} ${row.example || ""}`), true, row.label);
    }
    assert.equal(internSafeBriefCopy("Email jasongraff1978@gmail.com"), false);
    assert.equal(internSafeBriefCopy("Ask Jason"), false);
    assert.equal(internSafeBriefCopy("© SitGuru. Proprietary and confidential."), false);
  });
});
