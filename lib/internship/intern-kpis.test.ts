import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildInternKpiBoard,
  internBaselineValue,
  internCampaignMatchesClick,
  internKpiImpact,
  internSocialPlatformFromText,
  type InternSafeKpiSnapshot,
} from "./intern-kpis";
import type { InternshipMetric } from "./types";

const snapshot: InternSafeKpiSnapshot = {
  marketLabel: "Greater Philadelphia",
  people: {
    petParents: 30,
    gurus: 71,
    bookableGurus: 56,
    ambassadors: 9,
  },
  marketPeople: { petParents: 12, gurus: 20, ambassadors: 3 },
  social: {
    facebook: { visits: 10, scans: 2, attributed: 4 },
    instagram: { visits: 8, scans: 0, attributed: 0 },
    tiktok: { visits: 0, scans: 0, attributed: 0 },
    x: { visits: 1, scans: 0, attributed: 0 },
    youtube: { visits: 0, scans: 3, attributed: 1 },
  },
  capturedAt: "2026-09-05T00:00:00.000Z",
};

function metric(
  key: string,
  value: number,
  extras?: Partial<InternshipMetric>,
): InternshipMetric {
  return {
    id: key,
    internId: "intern-1",
    campaignId: null,
    projectId: null,
    metricKey: key,
    label: key,
    valueNumeric: value,
    periodStart: null,
    periodEnd: null,
    sourceSystem: "sitguru_admin",
    sourceNote: "baseline",
    isVerified: true,
    selfReported: false,
    ...extras,
  };
}

describe("intern KPI growth board", () => {
  it("shows People and per-site social impact against Jason's baseline", () => {
    const board = buildInternKpiBoard({
      snapshot,
      metrics: [
        metric("people.pet_parents", 25),
        metric("people.gurus", 71),
        metric("people.ambassadors", 8),
        metric("social.facebook", 5),
      ],
    });
    const parents = board.find((row) => row.key === "people.pet_parents");
    const gurus = board.find((row) => row.key === "people.gurus");
    const facebook = board.find((row) => row.key === "social.facebook");
    assert.equal(parents?.current, 30);
    assert.equal(parents?.baseline, 25);
    assert.equal(parents?.impact, 5);
    assert.equal(gurus?.impact, 0);
    assert.equal(gurus?.helper, "56 can take bookings");
    assert.equal(facebook?.current, 12);
    assert.equal(facebook?.impact, 7);
    assert.match(facebook?.helper || "", /your tracking links/);
  });

  it("ignores unverified intern-submitted baselines", () => {
    assert.equal(
      internBaselineValue(
        [
          metric("people.pet_parents", 99, {
            isVerified: false,
            selfReported: true,
          }),
        ],
        "people.pet_parents",
      ),
      null,
    );
  });

  it("does not invent impact before a baseline exists", () => {
    assert.equal(internKpiImpact(30, null), null);
  });
});

describe("intern social platform matching", () => {
  it("maps twitter and x to the same site", () => {
    assert.equal(internSocialPlatformFromText("Twitter"), "x");
    assert.equal(internSocialPlatformFromText("instagram_story"), "instagram");
  });

  it("attributes clicks to intern UTM campaigns without needing Admin", () => {
    assert.equal(
      internCampaignMatchesClick(
        [{ utmSource: "instagram", utmCampaign: "spring27_growth" }],
        { utmSource: "Instagram", utmCampaign: "spring27_growth" },
      ),
      true,
    );
    assert.equal(
      internCampaignMatchesClick(
        [{ utmSource: "instagram", utmCampaign: "spring27_growth" }],
        { utmSource: "Instagram", utmCampaign: "other" },
      ),
      false,
    );
  });
});
