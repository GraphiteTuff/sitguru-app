import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dollarsToCents,
  formatHours,
  formatUsdFromCents,
  hoursTimesRateCents,
  parsePositiveHours,
  sumCents,
} from "./money";
import { calculatePeriodTotals, rateForWorkDate } from "./rates";
import { biweeklyPeriodContaining, formatPeriodLabel } from "./periods";
import type { StaffCompensationRate, StaffTimeEntry } from "./types";

describe("staff money math", () => {
  it("keeps Ava sample math exact: 26h × $16.75 = $435.50", () => {
    const rateCents = dollarsToCents(16.75);
    assert.equal(rateCents, 1675);
    assert.equal(hoursTimesRateCents(26, rateCents), 43550);
    assert.equal(formatUsdFromCents(43550), "$435.50");
  });

  it("splits period totals across effective-dated rates", () => {
    const rates: StaffCompensationRate[] = [
      {
        id: "1",
        engagementId: "e",
        hourlyRateCents: 1675,
        effectiveOn: "2025-11-01",
        endedOn: "2025-11-09",
        notes: "",
      },
      {
        id: "2",
        engagementId: "e",
        hourlyRateCents: 2000,
        effectiveOn: "2025-11-10",
        endedOn: null,
        notes: "",
      },
    ];
    const entries = [
      {
        id: "a",
        engagementId: "e",
        userId: "u",
        paymentPeriodId: "p",
        workedOn: "2025-11-05",
        hours: 10,
        categorySlug: "social_content",
        description: "a",
        growthInitiativeId: null,
        status: "draft",
        timerStartedAt: null,
        timerStoppedAt: null,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "b",
        engagementId: "e",
        userId: "u",
        paymentPeriodId: "p",
        workedOn: "2025-11-12",
        hours: 5,
        categorySlug: "meetings",
        description: "b",
        growthInitiativeId: null,
        status: "draft",
        timerStartedAt: null,
        timerStoppedAt: null,
        createdAt: "",
        updatedAt: "",
      },
    ] satisfies StaffTimeEntry[];

    assert.equal(rateForWorkDate(rates, "2025-11-05")?.hourlyRateCents, 1675);
    assert.equal(rateForWorkDate(rates, "2025-11-12")?.hourlyRateCents, 2000);
    const totals = calculatePeriodTotals(entries, rates);
    // 10*16.75 + 5*20 = 167.50 + 100 = 267.50
    assert.equal(totals.amountCents, 26750);
    assert.equal(totals.totalHours, 15);
  });

  it("validates hours and formats", () => {
    assert.equal(parsePositiveHours("2.5").ok, true);
    assert.equal(parsePositiveHours("0").ok, false);
    assert.equal(formatHours(2.5), "2.5");
    assert.equal(sumCents([100, 50]), 150);
  });
});

describe("biweekly periods", () => {
  it("anchors Ava-style Nov 2–15 period", () => {
    const range = biweeklyPeriodContaining("2025-11-08", "2025-11-02");
    assert.deepEqual(range, { start: "2025-11-02", end: "2025-11-15" });
    assert.match(formatPeriodLabel(range), /Nov/);
  });
});
