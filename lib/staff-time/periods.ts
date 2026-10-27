/**
 * Biweekly payment period math from an engagement period_anchor_on.
 */

export type DateRange = { start: string; end: string };

function toDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function addDays(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

function daysBetween(a: string, b: string): number {
  const ms = parseDateKey(b).getTime() - parseDateKey(a).getTime();
  return Math.floor(ms / 86_400_000);
}

/** Resolve the biweekly period containing `onDate` (YYYY-MM-DD). */
export function biweeklyPeriodContaining(
  onDate: string,
  anchorOn: string,
): DateRange {
  const offset = daysBetween(anchorOn, onDate);
  const periodIndex = Math.floor(offset / 14);
  const start = addDays(anchorOn, periodIndex * 14);
  const end = addDays(start, 13);
  return { start, end };
}

export function formatPeriodLabel(range: DateRange, year = true): string {
  const start = parseDateKey(range.start);
  const end = parseDateKey(range.end);
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: year ? "numeric" : undefined,
    timeZone: "UTC",
  });
  return `${startLabel}–${endLabel.replace(",", "")}`;
}

export function isoToday(now = new Date()): string {
  return toDateKey(
    new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
  );
}

export function weekBoundsContaining(onDate: string): DateRange {
  const date = parseDateKey(onDate);
  const day = date.getUTCDay(); // 0 Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = addDays(onDate, mondayOffset);
  const end = addDays(start, 6);
  return { start, end };
}
