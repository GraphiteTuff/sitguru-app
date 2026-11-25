import type { InternshipWorkComment } from "@/lib/internship/types";

// These are the exact messages written by manager-assignment-actions.ts.
// Keep free-form comments in the conversation, even when they mention an update.
const ASSIGNMENT_ACTIVITY = new Set([
  "Assignment created.",
  "Assignment updated.",
  "Assignment draft saved.",
]);

export function workCommentsForItem(
  comments: InternshipWorkComment[],
  item: { internId: string; itemType: "task" | "content"; id: string },
) {
  const feedback: InternshipWorkComment[] = [];
  const activity: InternshipWorkComment[] = [];
  for (const comment of comments) {
    if (comment.internId !== item.internId || comment.itemType !== item.itemType || comment.itemId !== item.id) continue;
    (ASSIGNMENT_ACTIVITY.has(comment.body.trim()) ? activity : feedback).push(comment);
  }
  return { feedback, activity };
}

export type WorkTextPart = { text: string; href?: string; label?: string };

/** Short link labels for display; text and destinations are retained verbatim. */
export function workTextParts(text: string): WorkTextPart[] {
  const parts: WorkTextPart[] = [];
  let cursor = 0;
  let linkNumber = 0;
  for (const match of text.matchAll(/https?:\/\/[^\s<>]+/gi)) {
    const start = match.index;
    let href = match[0].replace(/[.,!;:]+$/, "");
    // A closing bracket outside a URL is punctuation in the surrounding note.
    for (const [open, close] of [["(", ")"], ["[", "]"]]) {
      while (href.endsWith(close) && href.split(close).length > href.split(open).length) {
        href = href.slice(0, -1);
      }
    }
    try {
      const url = new URL(href);
      if (url.protocol !== "https:" && url.protocol !== "http:") continue;
      if (start > cursor) parts.push({ text: text.slice(cursor, start) });
      const host = url.hostname.replace(/^www\./, "");
      const provider = host === "tiktok.com" || host.endsWith(".tiktok.com") ? "TikTok"
        : host === "instagram.com" || host.endsWith(".instagram.com") ? "Instagram"
        : host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be" ? "YouTube"
        : host;
      linkNumber += 1;
      parts.push({ text: href, href, label: `${provider} link ${linkNumber}` });
      cursor = start + href.length;
    } catch {
      // Malformed links remain ordinary text; never lose part of the submission.
    }
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}

export function workTextPreview(text: string, limit = 200) {
  const plain = workTextParts(text).map((part) => part.label || part.text).join("").replace(/\s+/g, " ").trim();
  return plain.length > limit ? `${plain.slice(0, limit).trimEnd()}…` : plain;
}

export function workDateLabel(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}
