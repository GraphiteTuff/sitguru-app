/** Shared finance period helpers for admin export / statement pages. */

export type FinancePeriodKind =
  | "month"
  | "quarter"
  | "ytd"
  | "year"
  | "launch-to-date";

export type FinancePeriodWindow = {
  kind: FinancePeriodKind;
  label: string;
  start: string;
  end: string;
};

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** SitGuru marketplace launch date for launch-to-date packages. */
export const SITGURU_LAUNCH_DATE = "2026-06-01";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatPeriodLabel(startIso: string, endIso: string) {
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startIso}–${endIso}`;
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth =
    sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    if (start.getDate() === end.getDate()) {
      return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}, ${end.getFullYear()}`;
    }

    return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }

  if (sameYear) {
    return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}–${MONTH_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }

  return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}–${MONTH_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

export function appendDateRange(
  href: string,
  startDate?: string | null,
  endDate?: string | null,
) {
  if (!startDate && !endDate) return href;

  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const query = params.toString();
  if (!query) return href;

  return `${href}${href.includes("?") ? "&" : "?"}${query}`;
}

export function getMonthPeriod(now = new Date()): FinancePeriodWindow {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = now;
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);

  return {
    kind: "month",
    label: formatPeriodLabel(startIso, endIso),
    start: startIso,
    end: endIso,
  };
}

export function getQuarterPeriod(now = new Date()): FinancePeriodWindow {
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const start = new Date(now.getFullYear(), quarterStartMonth, 1);
  const end = now;
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);
  const quarter = Math.floor(now.getMonth() / 3) + 1;

  return {
    kind: "quarter",
    label: `Q${quarter} ${now.getFullYear()} · ${formatPeriodLabel(startIso, endIso)}`,
    start: startIso,
    end: endIso,
  };
}

export function getYtdPeriod(now = new Date()): FinancePeriodWindow {
  const start = new Date(now.getFullYear(), 0, 1);
  const end = now;
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);

  return {
    kind: "ytd",
    label: `YTD ${now.getFullYear()} · ${formatPeriodLabel(startIso, endIso)}`,
    start: startIso,
    end: endIso,
  };
}

export function getYearPeriod(now = new Date()): FinancePeriodWindow {
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);

  return {
    kind: "year",
    label: `${now.getFullYear()} · ${formatPeriodLabel(startIso, endIso)}`,
    start: startIso,
    end: endIso,
  };
}

export function getLaunchToDatePeriod(now = new Date()): FinancePeriodWindow {
  const endIso = toIsoDate(now);
  const startIso =
    endIso < SITGURU_LAUNCH_DATE ? endIso : SITGURU_LAUNCH_DATE;

  return {
    kind: "launch-to-date",
    label: `Launch-to-date · ${formatPeriodLabel(startIso, endIso)}`,
    start: startIso,
    end: endIso,
  };
}
