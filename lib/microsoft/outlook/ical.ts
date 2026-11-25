import { createHash } from "node:crypto";
import type { ManagerScheduleItem } from "@/lib/internship/manager-dashboard";
import type { OutlookPortal } from "./security";

function escapeText(value: string) {
  return value.replaceAll("\\", "\\\\").replace(/\r\n|\r|\n/g, "\\n").replaceAll(";", "\\;").replaceAll(",", "\\,");
}

function fold(line: string) {
  let chunk = "";
  let result = "";
  for (const character of line) {
    if (Buffer.byteLength(chunk + character) > 75) {
      result += `${chunk}\r\n`;
      chunk = " ";
    }
    chunk += character;
  }
  return result + chunk;
}

export function calendarMonth(value: unknown, today = new Date()) {
  return typeof value === "string" && /^20\d\d-(0[1-9]|1[0-2])$/.test(value)
    ? value : today.toISOString().slice(0, 7);
}

export function outlookMonthWindow(month?: string) {
  const start = new Date(`${calendarMonth(month)}-01T00:00:00Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const easternOffset = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", timeZoneName: "shortOffset",
  });
  function midnight(date: Date) {
    const offset = easternOffset.formatToParts(date).find((part) => part.type === "timeZoneName")?.value;
    const hours = Number(offset?.replace(/^GMT/, ""));
    return new Date(date.getTime() - hours * 3600_000).toISOString();
  }
  return { start: midnight(start), end: midnight(end) };
}

export function internshipCalendarIcs(portal: OutlookPortal, events: ManagerScheduleItem[], now = new Date()) {
  const name = portal === "intern" ? "SitGuru Internship" : "SitGuru Manager";
  const unique = new Set<string>();
  const stamp = now.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SitGuru//Internship Calendar//EN",
    "CALSCALE:GREGORIAN", `X-WR-CALNAME:${name}`];
  for (const event of events) {
    if (unique.has(event.id) || /^(checkin|report|desk)-/.test(event.id)) continue;
    if (!/^\d{4}-\d\d-\d\d$/.test(event.date)) continue;
    const date = new Date(`${event.date}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== event.date) continue;
    unique.add(event.id);
    const end = new Date(date.getTime() + 86_400_000).toISOString().slice(0, 10);
    const uid = createHash("sha256").update(`${portal}:${event.id}`).digest("hex");
    lines.push("BEGIN:VEVENT", `UID:${uid}@calendar.sitguru.com`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${event.date.replaceAll("-", "")}`, `DTEND;VALUE=DATE:${end.replaceAll("-", "")}`,
      `SUMMARY:${escapeText(event.title)}`, "TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
