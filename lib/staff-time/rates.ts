import type { StaffCompensationRate, StaffTimeEntry } from "@/lib/staff-time/types";
import {
  formatUsdFromCents,
  hoursTimesRateCents,
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
  let totalHours = 0;
  const amountParts: number[] = [];
  const rateLabels = new Set<string>();
  const missingRateDates: string[] = [];

  for (const entry of entries) {
    totalHours += entry.hours;
    const rate = rateForWorkDate(rates, entry.workedOn);
    if (!rate) {
      missingRateDates.push(entry.workedOn);
      continue;
    }
    amountParts.push(hoursTimesRateCents(entry.hours, rate.hourlyRateCents));
    rateLabels.add(formatUsdFromCents(rate.hourlyRateCents) + "/hr");
  }

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    amountCents: sumCents(amountParts),
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
