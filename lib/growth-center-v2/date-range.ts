import type { GrowthDatePreset, GrowthCenterFilters } from "./types";
import { GROWTH_BUSINESS_TIMEZONE } from "./types";

/** Calendar parts in the business timezone for a UTC instant. */
export function zonedParts(date: Date, timeZone: string = GROWTH_BUSINESS_TIMEZONE) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function offsetMs(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - date.getTime();
}

/** UTC instant for local wall time in the business timezone. */
export function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  timeZone: string = GROWTH_BUSINESS_TIMEZONE,
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const first = new Date(utcGuess.getTime() - offsetMs(utcGuess, timeZone));
  return new Date(first.getTime() - offsetMs(first, timeZone));
}

function addDays(year: number, month: number, day: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

export function resolveDateRange(input: {
  preset?: string | null;
  start?: string | null;
  end?: string | null;
  now?: Date;
  timeZone?: string;
}): GrowthCenterFilters {
  const timeZone = input.timeZone || GROWTH_BUSINESS_TIMEZONE;
  const now = input.now || new Date();
  const today = zonedParts(now, timeZone);
  const presetRaw = (input.preset || "last_7").toLowerCase();
  const preset = (
    [
      "today",
      "yesterday",
      "last_7",
      "last_28",
      "last_90",
      "this_month",
      "last_month",
      "custom",
    ].includes(presetRaw)
      ? presetRaw
      : "last_7"
  ) as GrowthDatePreset;

  let startLocal = { year: today.year, month: today.month, day: today.day };
  let endExclusiveLocal = addDays(today.year, today.month, today.day, 1);

  if (preset === "today") {
    startLocal = { year: today.year, month: today.month, day: today.day };
    endExclusiveLocal = addDays(today.year, today.month, today.day, 1);
  } else if (preset === "yesterday") {
    startLocal = addDays(today.year, today.month, today.day, -1);
    endExclusiveLocal = {
      year: today.year,
      month: today.month,
      day: today.day,
    };
  } else if (preset === "last_7") {
    startLocal = addDays(today.year, today.month, today.day, -6);
  } else if (preset === "last_28") {
    startLocal = addDays(today.year, today.month, today.day, -27);
  } else if (preset === "last_90") {
    startLocal = addDays(today.year, today.month, today.day, -89);
  } else if (preset === "this_month") {
    startLocal = { year: today.year, month: today.month, day: 1 };
  } else if (preset === "last_month") {
    const firstThis = { year: today.year, month: today.month, day: 1 };
    endExclusiveLocal = firstThis;
    const lastOfPrior = addDays(firstThis.year, firstThis.month, firstThis.day, -1);
    startLocal = {
      year: lastOfPrior.year,
      month: lastOfPrior.month,
      day: 1,
    };
  } else if (preset === "custom" && input.start && input.end) {
    const s = new Date(input.start);
    const e = new Date(input.end);
    if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && e > s) {
      const sp = zonedParts(s, timeZone);
      const ep = zonedParts(e, timeZone);
      startLocal = { year: sp.year, month: sp.month, day: sp.day };
      endExclusiveLocal = addDays(ep.year, ep.month, ep.day, 1);
    }
  }

  const start = zonedLocalToUtc(
    startLocal.year,
    startLocal.month,
    startLocal.day,
    0,
    0,
    0,
    timeZone,
  );
  const end = zonedLocalToUtc(
    endExclusiveLocal.year,
    endExclusiveLocal.month,
    endExclusiveLocal.day,
    0,
    0,
    0,
    timeZone,
  );
  const durationMs = Math.max(end.getTime() - start.getTime(), 24 * 60 * 60 * 1000);
  const priorEnd = start;
  const priorStart = new Date(start.getTime() - durationMs);

  return {
    preset,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    priorStartIso: priorStart.toISOString(),
    priorEndIso: priorEnd.toISOString(),
    platform: "all",
    audience: "all",
    campaignId: null,
    timezone: timeZone,
  };
}

export function formatRangeLabel(filters: GrowthCenterFilters) {
  const start = new Date(filters.startIso);
  const end = new Date(new Date(filters.endIso).getTime() - 1);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: filters.timezone,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${fmt.format(start)} – ${fmt.format(end)} (${filters.timezone})`;
}

export function isoDateLabel(iso: string, timeZone: string = GROWTH_BUSINESS_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function parseFiltersFromSearch(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
): GrowthCenterFilters {
  const get = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key);
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const base = resolveDateRange({
    preset: get("preset"),
    start: get("start"),
    end: get("end"),
  });
  const platform = (get("platform") || "all").toLowerCase();
  const audience = (get("audience") || "all").toLowerCase();
  return {
    ...base,
    platform: (
      [
        "all",
        "facebook",
        "instagram",
        "tiktok",
        "youtube",
        "x",
        "sitguru",
      ].includes(platform)
        ? platform
        : "all"
    ) as GrowthCenterFilters["platform"],
    audience: (
      ["all", "guru", "pet_parent", "ambassador", "community"].includes(audience)
        ? audience
        : "all"
    ) as GrowthCenterFilters["audience"],
    campaignId: get("campaign") || null,
  };
}
