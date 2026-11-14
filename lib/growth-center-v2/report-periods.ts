import { zonedLocalToUtc, zonedParts } from "./date-range";
import type { GrowthCenterFilters } from "./types";

export type ReportCadence = "daily" | "weekly" | "monthly";

export type GrowthReportPeriod = {
  cadence: ReportCadence;
  startDate: string;
  endDate: string;
  startIso: string;
  endIso: string;
  priorStartIso: string;
  priorEndIso: string;
  weekEnding: string;
  completed: boolean;
  title: string;
  label: string;
  folderSegments: string[];
  fileStem: string;
};

const TZ = "America/New_York";

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function utcDate(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const d = new Date(input + "T12:00:00.000Z");
  return Number.isFinite(d.getTime()) && dateOnly(d) === input ? d : null;
}

function shift(date: Date, delta: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + delta, 12));
}

function monthLast(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12));
}

function localMidnight(date: Date) {
  return zonedLocalToUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), 0, 0, 0, TZ).toISOString();
}

function todayInNewYork(now: Date) {
  const p = zonedParts(now, TZ);
  return new Date(Date.UTC(p.year, p.month - 1, p.day, 12));
}

function nextSunday(date: Date) {
  return shift(date, (7 - date.getUTCDay()) % 7);
}

export function getGrowthReportPeriod(input: {
  cadence?: string | null;
  end?: string | null;
  now?: Date;
} = {}): GrowthReportPeriod {
  const cadence: ReportCadence =
    input.cadence === "daily" || input.cadence === "monthly" ? input.cadence : "weekly";
  const today = todayInNewYork(input.now || new Date());
  const requested = input.end ? utcDate(input.end) : null;
  const defaultEnd = cadence === "weekly" ? nextSunday(today) : cadence === "monthly" ? monthLast(today) : today;
  const rawEnd = requested || defaultEnd;
  const ending = cadence === "weekly" ? nextSunday(rawEnd) : cadence === "monthly" ? monthLast(rawEnd) : rawEnd;
  const starting =
    cadence === "weekly" ? shift(ending, -6)
      : cadence === "monthly" ? new Date(Date.UTC(ending.getUTCFullYear(), ending.getUTCMonth(), 1, 12))
        : ending;
  const previousStarting =
    cadence === "monthly"
      ? new Date(Date.UTC(starting.getUTCFullYear(), starting.getUTCMonth() - 1, 1, 12))
      : shift(starting, cadence === "weekly" ? -7 : -1);
  const endExclusive = shift(ending, 1);
  const weekEnding = dateOnly(nextSunday(ending));
  const startDate = dateOnly(starting);
  const endDate = dateOnly(ending);
  const completed = endExclusive.getTime() <= today.getTime();
  const year = ending.getUTCFullYear().toString();
  const title =
    cadence === "weekly" ? "Weekly Growth Report"
      : cadence === "monthly" ? "Monthly Growth Report" : "Daily Growth Snapshot";
  const label =
    cadence === "weekly" ? "Week Ending " + endDate
      : cadence === "monthly" ? "Month Ending " + endDate : "Daily Snapshot " + endDate;
  const folderSegments =
    cadence === "monthly"
      ? ["Analytics and Results", "07 Monthly Reports", year, "Month Ending " + endDate]
      : ["Analytics and Results", "01 Weekly Reports", weekEnding.slice(0, 4), "Week Ending " + weekEnding]
        .concat(cadence === "daily" ? ["Daily Snapshots"] : []);

  return {
    cadence,
    startDate,
    endDate,
    startIso: localMidnight(starting),
    endIso: localMidnight(endExclusive),
    priorStartIso: localMidnight(previousStarting),
    priorEndIso: localMidnight(starting),
    weekEnding,
    completed,
    title,
    label,
    folderSegments,
    fileStem: cadence === "daily" ? endDate : "Growth Report",
  };
}

export function growthReportFilters(period: GrowthReportPeriod): GrowthCenterFilters {
  return {
    preset: "custom",
    startIso: period.startIso,
    endIso: period.endIso,
    priorStartIso: period.priorStartIso,
    priorEndIso: period.priorEndIso,
    platform: "all",
    audience: "all",
    campaignId: null,
    timezone: TZ,
  };
}

export function growthReportCronPeriods(now = new Date()) {
  const today = todayInNewYork(now);
  const yesterday = shift(today, -1);
  const periods: GrowthReportPeriod[] = [
    getGrowthReportPeriod({ cadence: "daily", end: dateOnly(yesterday), now }),
  ];
  if (today.getUTCDay() === 1) {
    periods.push(getGrowthReportPeriod({ cadence: "weekly", end: dateOnly(yesterday), now }));
  }
  if (today.getUTCDate() === 1) {
    periods.push(getGrowthReportPeriod({ cadence: "monthly", end: dateOnly(yesterday), now }));
  }
  return periods;
}
