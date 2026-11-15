import type { StaffCompensationRate, StaffTimeEntry } from "@/lib/staff-time/types";
import {
  formatUsdFromCents,
  sumCents,
} from "@/lib/staff-time/money";

/** Pick the rate effective on a work date (effective_on ≤ date, not ended before date). */
export function rateForWorkDate(
  rates: StaffCompensationRate[],
  workedOn: string,
): StaffCompensationRate | null {
  const eligible = rates
    .filter((rate) => rate.effectiveOn <= workedOn)
    .filter((rate) => !rate.endedOn || rate.endedOn >= workedOn)
    .sort((a, b) => b.effectiveOn.localeCompare(a.effectiveOn));
  return eligible[0] || null;
}

export function currentRate(
  rates: StaffCompensationRate[],
  onDate: string,
): StaffCompensationRate | null {
  return rateForWorkDate(rates, onDate);
}

export type PeriodTotals = {
  totalHours: number;
  amountCents: number;
  rateSummary: string;
  missingRateDates: string[];
};

export function calculatePeriodTotals(
  entries: StaffTimeEntry[],
  rates: StaffCompensationRate[],
): PeriodTotals {
  let hundredthsOfHours = 0;
  // Round at the pay-period level for each effective rate, not once per
  // small time entry. Summing rounded entry cents overpays Ava's 7.34 hrs by 2c.
  const groups = new Map<string, { hundredths: number; rateCents: number }>();
  const rateLabels = new Set<string>();
  const missingRateDates: string[] = [];

  for (const entry of entries) {
    const entryHundredths = Math.round(entry.hours * 100);
    hundredthsOfHours += entryHundredths;
    const rate = rateForWorkDate(rates, entry.workedOn);
    if (!rate) {
      missingRateDates.push(entry.workedOn);
      continue;
    }
    const current = groups.get(rate.id) || { hundredths: 0, rateCents: rate.hourlyRateCents };
    current.hundredths += entryHundredths;
    groups.set(rate.id, current);
    rateLabels.add(formatUsdFromCents(rate.hourlyRateCents) + "/hr");
  }

  return {
    totalHours: hundredthsOfHours / 100,
    amountCents: sumCents([...groups.values()].map(
      ({ hundredths, rateCents }) => Math.round((hundredths * rateCents) / 100),
    )),
    rateSummary: [...rateLabels].join(", ") || "—",
    missingRateDates,
  };
}

export function weeklyHoursSummary(
  entries: StaffTimeEntry[],
  expectedMin: number,
  expectedMax: number,
): { hours: number; aboveExpected: boolean; rangeLabel: string } {
  const hours = Math.round(entries.reduce((sum, e) => sum + e.hours, 0) * 100) / 100;
  const aboveExpected = hours > expectedMax;
  const rangeLabel = aboveExpected
    ? "Above Expected Range · Founder Review Recommended"
    : `${expectedMin}–${expectedMax} hrs expected`;
  return { hours, aboveExpected, rangeLabel };
}
