export type CareTiming = "today" | "tomorrow" | "dates" | "flexible";

export function nyCalendarDate(offsetDays = 0, now = new Date()) {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [year, month, day] = formatted.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return date.toISOString().slice(0, 10);
}

export function readSearchPlace(value: string) {
  const zip = value.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1] || "";
  const city = value.replace(/\b\d{5}(?:-\d{4})?\b/g, " ").replace(/\s+/g, " ").trim();
  return { zip, city };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function serviceUsesDateRange(service: string) {
  const value = service.toLowerCase();
  return value.includes("board") || value.includes("sitting");
}

export function cleanDateList(dates: string[] | undefined) {
  return [...new Set((dates || []).filter((date) => ISO_DATE.test(date)))].sort();
}

function applySchedule(
  params: URLSearchParams,
  input: {
    service: string;
    timing: CareTiming;
    dates?: string[];
    rangeStart?: string;
    rangeEnd?: string;
    now?: Date;
  },
) {
  if (input.timing === "today") {
    params.set("date", nyCalendarDate(0, input.now));
    return;
  }
  if (input.timing === "tomorrow") {
    params.set("date", nyCalendarDate(1, input.now));
    return;
  }
  if (input.timing !== "dates") return;

  if (serviceUsesDateRange(input.service)) {
    const start = ISO_DATE.test(input.rangeStart || "") ? String(input.rangeStart) : "";
    const end = ISO_DATE.test(input.rangeEnd || "") ? String(input.rangeEnd) : "";
    if (start) params.set("date", start);
    if (end) params.set("end", end);
    return;
  }

  const picked = cleanDateList(input.dates);
  if (picked[0]) params.set("date", picked[0]);
  if (picked.length > 1) params.set("dates", picked.join(","));
}

export function buildDashboardSearchHref(input: {
  service: string;
  location: string;
  timing: CareTiming;
  dates?: string[];
  rangeStart?: string;
  rangeEnd?: string;
  now?: Date;
}) {
  const params = new URLSearchParams();
  const service = input.service.trim();
  if (service) params.set("service", service);

  const place = readSearchPlace(input.location);
  if (place.zip) params.set("zip", place.zip);
  else if (place.city) params.set("city", place.city);

  applySchedule(params, input);

  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}

export function withBookingSelections(
  href: string,
  input: {
    service?: string;
    location?: string;
    timing: CareTiming;
    dates?: string[];
    rangeStart?: string;
    rangeEnd?: string;
    now?: Date;
  },
) {
  try {
    const url = new URL(href, "https://www.sitguru.com");
    const place = readSearchPlace(input.location || "");
    if (input.service) url.searchParams.set("service", input.service);
    if (place.zip) url.searchParams.set("zip", place.zip);
    url.searchParams.delete("date");
    url.searchParams.delete("end");
    url.searchParams.delete("dates");
    applySchedule(url.searchParams, { ...input, service: input.service || "" });
    return `${url.pathname}${url.search}`;
  } catch {
    return href;
  }
}
