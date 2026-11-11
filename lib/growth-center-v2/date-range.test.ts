import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDateRange, formatRangeLabel } from "./date-range";
import { buildGrowthInsights } from "./insights";
import { METRIC_DEFINITIONS } from "./metrics";
import { snapshotToCsv } from "./reports";
import type { GrowthCenterSnapshot } from "./types";

describe("growth center v2 date ranges", () => {
  it("builds last_7 with matching prior window length", () => {
    const filters = resolveDateRange({
      preset: "last_7",
      now: new Date("2026-11-11T17:00:00.000Z"),
      timeZone: "America/New_York",
    });
    const current = Date.parse(filters.endIso) - Date.parse(filters.startIso);
    const prior =
      Date.parse(filters.priorEndIso) - Date.parse(filters.priorStartIso);
    assert.equal(filters.preset, "last_7");
    assert.equal(current, prior);
    assert.match(formatRangeLabel(filters), /America\/New_York/);
  });
});

describe("growth center v2 metrics", () => {
  it("documents conversion as signups over visits", () => {
    const def = METRIC_DEFINITIONS.registration_conversion_rate;
    assert.equal(def.numerator, "attributed signups");
    assert.equal(def.denominator, "attributed visits");
    assert.equal(def.unit, "percent");
  });
});

describe("growth center v2 insights", () => {
  it("flags visits without signups using observed metrics", () => {
    const filters = resolveDateRange({ preset: "last_7" });
    const insights = buildGrowthInsights({
      audience: "manager",
      filters,
      kpis: [
        {
          id: "campaign_visits",
          label: "Campaign Visits",
          value: 40,
          prior: 10,
          unit: "count",
          availability: "available",
          definitionId: "campaign_visits",
          source: "growth_campaign_events",
        },
        {
          id: "campaign_signups",
          label: "Attributed Signups",
          value: 0,
          prior: 2,
          unit: "count",
          availability: "available",
          definitionId: "campaign_signups",
          source: "growth_campaign_events",
        },
      ],
      funnel: [],
      campaigns: [],
      contentPending: 0,
    });
    assert.equal(
      insights.some((item) => item.id === "visits-no-signups"),
      true,
    );
  });
});

describe("growth center v2 reports", () => {
  it("exports unavailable metrics without coercing to zero", () => {
    const filters = resolveDateRange({ preset: "last_7" });
    const snapshot: GrowthCenterSnapshot = {
      version: 2,
      flagEnabled: true,
      audience: "manager",
      capturedAt: "2026-11-11T00:00:00.000Z",
      freshnessLabel: "test",
      filters,
      kpis: [
        {
          id: "social_followers",
          label: "Tracked Followers",
          value: null,
          prior: null,
          unit: "count",
          availability: "unavailable",
          definitionId: "social_followers",
          source: "social_platform_metrics",
        },
      ],
      funnel: [],
      social: [],
      campaigns: [],
      content: [],
      goals: [],
      insights: [],
      community: {
        submissions: null,
        events: null,
        packParticipants: null,
        availability: "partial",
        note: "n/a",
      },
      campus: {
        profiles: 0,
        visits: 0,
        leads: 0,
        availability: "partial",
        note: "n/a",
      },
      coverageNotes: [],
    };
    const csv = snapshotToCsv(snapshot);
    assert.match(csv, /social_followers,,/);
    assert.match(csv, /unavailable/);
    assert.doesNotMatch(csv, /social_followers,0,/);
  });
});
