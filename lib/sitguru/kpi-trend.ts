export type KpiTrendDirection = "up" | "down" | "flat";
export type KpiTrendTone = "up" | "down" | "flat";

export type KpiTrend = {
  direction: KpiTrendDirection;
  tone: KpiTrendTone;
  delta: number;
  label: string;
  srLabel: string;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function isoDaysAgo(days: number, now = Date.now()) {
  return new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
}

export function compareKpi(
  current: number,
  previous: number,
  options?: { invert?: boolean; decimals?: number },
): KpiTrend {
  const currentValue = Number.isFinite(current) ? current : 0;
  const previousValue = Number.isFinite(previous) ? previous : 0;
  const delta = currentValue - previousValue;
  const direction: KpiTrendDirection =
    delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const favorable = options?.invert ? delta < 0 : delta > 0;
  const tone: KpiTrendTone =
    direction === "flat" ? "flat" : favorable ? "up" : "down";
  const abs = Math.abs(delta);
  const formatted =
    options?.decimals != null ? abs.toFixed(options.decimals) : String(abs);
  const label =
    direction === "flat" ? "even" : `${delta > 0 ? "+" : "−"}${formatted}`;
  const srLabel =
    direction === "flat"
      ? "Unchanged versus last week"
      : `${direction === "up" ? "Up" : "Down"} ${formatted} versus last week`;

  return { direction, tone, delta, label, srLabel };
}

export function weekOverWeekTrend(
  dates: Array<string | null | undefined>,
  options?: { invert?: boolean; now?: number },
): KpiTrend {
  const now = options?.now ?? Date.now();
  const currentStart = new Date(now - WEEK_MS).toISOString();
  const previousStart = new Date(now - 2 * WEEK_MS).toISOString();
  const nowIso = new Date(now).toISOString();
  let current = 0;
  let previous = 0;

  for (const value of dates) {
    if (!value) continue;
    if (value >= currentStart && value < nowIso) current += 1;
    else if (value >= previousStart && value < currentStart) previous += 1;
  }

  return compareKpi(current, previous, { invert: options?.invert });
}
