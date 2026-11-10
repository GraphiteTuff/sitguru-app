function escapeCalendarText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r/g, "");
}

function stamp(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** A downloadable calendar event; importing never sends an Outlook invitation. */
export function communityCalendarEvent(input: { id: string; title: string; publishAt: string; url: string }, now = new Date()) {
  const start = new Date(input.publishAt);
  if (!Number.isFinite(start.getTime()) || !/^https?:\/\//.test(input.url)) return "";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SitGuru//Community Studio//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${escapeCalendarText(input.id)}@community.sitguru.com`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(new Date(start.getTime() + 15 * 60000))}`, `SUMMARY:${escapeCalendarText(`Publish: ${input.title}`)}`,
    `DESCRIPTION:${escapeCalendarText("Community Studio publishing reminder. Open the approved story in SitGuru.")}`, `URL:${escapeCalendarText(input.url)}`,
    "END:VEVENT", "END:VCALENDAR"];
  // Fold by UTF-8 octets while preserving character boundaries.
  const encoder = new TextEncoder();
  return lines.map(line => {
    const chunks: string[] = [];
    let current = "";
    for (const char of line) {
      if (encoder.encode(current + char).length > 74) { chunks.push(current); current = " " + char; }
      else current += char;
    }
    chunks.push(current);
    return chunks.join("\r\n");
  }).join("\r\n") + "\r\n";
}
