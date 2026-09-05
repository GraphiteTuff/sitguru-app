import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  capLetterByEvidence,
  letterFromAttainment,
  parseMetricNumber,
  suggestKpiStanding,
} from "./grading";

describe("internship KPI letter system", () => {
  it("awards A only for verified Tier 1 at or above the SMART target", () => {
    assert.equal(letterFromAttainment(110, "tier_1"), "A");
    assert.equal(letterFromAttainment(100, "tier_1"), "A");
    assert.equal(letterFromAttainment(110, "tier_2"), "B");
    assert.equal(letterFromAttainment(110, "tier_3"), "D");
  });

  it("bands B/C/D/F from percent of target, then caps by evidence tier", () => {
    assert.equal(letterFromAttainment(90, "tier_1"), "B");
    assert.equal(letterFromAttainment(60, "tier_1"), "C");
    assert.equal(letterFromAttainment(20, "tier_1"), "D");
    assert.equal(letterFromAttainment(0, "tier_1"), "F");
    assert.equal(letterFromAttainment(90, "tier_3"), "D");
    assert.equal(letterFromAttainment(null, "tier_1"), "I");
  });

  it("caps vanity evidence so awareness cannot outrank business output", () => {
    assert.equal(capLetterByEvidence("A", "tier_3"), "D");
    assert.equal(capLetterByEvidence("A", "tier_2"), "B");
    assert.equal(capLetterByEvidence("C", "tier_1"), "C");
  });

  it("uses the primary Pet Parent SMART goal and verified metrics only", () => {
    const standing = suggestKpiStanding(
      [
        {
          id: "1",
          internId: "i",
          specific: "Grow followers",
          measurable: "follower count",
          achievable: "",
          relevant: "",
          timeBound: "",
          metricKey: "followers",
          baselineValue: "100",
          targetValue: "200",
          sourceSystem: "meta",
          status: "draft",
        },
        {
          id: "2",
          internId: "i",
          specific: "Increase Pet Parent registrations",
          measurable: "verified registrations",
          achievable: "",
          relevant: "Primary KPI",
          timeBound: "",
          metricKey: "pet_parent_registrations",
          baselineValue: "40",
          targetValue: "50",
          sourceSystem: "sitguru_admin",
          status: "approved",
        },
      ],
      [
        {
          id: "m1",
          internId: "i",
          campaignId: null,
          projectId: null,
          metricKey: "followers",
          label: "Followers",
          valueNumeric: 400,
          periodStart: null,
          periodEnd: null,
          sourceSystem: "meta",
          sourceNote: "",
          isVerified: true,
          selfReported: false,
        },
        {
          id: "m2",
          internId: "i",
          campaignId: null,
          projectId: null,
          metricKey: "pet_parent_registrations",
          label: "Pet Parent registrations",
          valueNumeric: 50,
          periodStart: null,
          periodEnd: null,
          sourceSystem: "sitguru_admin",
          sourceNote: "",
          isVerified: true,
          selfReported: false,
        },
      ],
    );
    assert.equal(standing.letter, "A");
    assert.equal(standing.goals.find((row) => row.primary)?.metricKey, "pet_parent_registrations");
    assert.equal(parseMetricNumber("15–25%"), 15);
  });

  it("does not let intern self-reported numbers create an A", () => {
    const standing = suggestKpiStanding(
      [
        {
          id: "1",
          internId: "i",
          specific: "Pet Parent acquisition",
          measurable: "registrations",
          achievable: "",
          relevant: "Primary",
          timeBound: "",
          metricKey: "pet_parent_registrations",
          baselineValue: "10",
          targetValue: "20",
          sourceSystem: "sitguru_admin",
          status: "draft",
        },
      ],
      [
        {
          id: "m1",
          internId: "i",
          campaignId: null,
          projectId: null,
          metricKey: "pet_parent_registrations",
          label: "Pet Parent registrations",
          valueNumeric: 40,
          periodStart: null,
          periodEnd: null,
          sourceSystem: "other_approved",
          sourceNote: "",
          isVerified: false,
          selfReported: true,
        },
      ],
    );
    assert.equal(standing.letter, "I");
  });
});
