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

export function buildDashboardSearchHref(input: {
  service: string;
  location: string;
  timing: CareTiming;
  chosenDate?: string;
  now?: Date;
}) {
  const params = new URLSearchParams();
  const service = input.service.trim();
  if (service) params.set("service", service);

  const place = readSearchPlace(input.location);
  if (place.zip) params.set("zip", place.zip);
  else if (place.city) params.set("city", place.city);

  if (input.timing === "today") params.set("date", nyCalendarDate(0, input.now));
  if (input.timing === "tomorrow") params.set("date", nyCalendarDate(1, input.now));
  if (input.timing === "dates" && /^\d{4}-\d{2}-\d{2}$/.test(input.chosenDate || "")) {
    params.set("date", String(input.chosenDate));
  }

  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}

export function withBookingSelections(
  href: string,
  input: { service?: string; location?: string; timing: CareTiming; chosenDate?: string; now?: Date },
) {
  try {
    const url = new URL(href, "https://www.sitguru.com");
    const place = readSearchPlace(input.location || "");
    if (input.service) url.searchParams.set("service", input.service);
    if (place.zip) url.searchParams.set("zip", place.zip);
    if (input.timing === "today") url.searchParams.set("date", nyCalendarDate(0, input.now));
    if (input.timing === "tomorrow") url.searchParams.set("date", nyCalendarDate(1, input.now));
    if (input.timing === "dates" && /^\d{4}-\d{2}-\d{2}$/.test(input.chosenDate || "")) {
      url.searchParams.set("date", String(input.chosenDate));
    }
    if (input.timing === "flexible") url.searchParams.delete("date");
    return `${url.pathname}${url.search}`;
  } catch {
    return href;
  }
}
