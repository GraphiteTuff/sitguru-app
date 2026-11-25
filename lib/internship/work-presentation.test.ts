import assert from "node:assert/strict";
import { test } from "node:test";
import type { InternshipWorkComment } from "./types";
import { workCommentsForItem, workDateLabel, workTextParts, workTextPreview } from "./work-presentation";

test("activity grouping preserves all matching records and keeps substantive feedback visible", () => {
  const make = (id: string, body: string, extra: Partial<InternshipWorkComment> = {}): InternshipWorkComment => ({
    id, body, internId: "intern-a", itemType: "task", itemId: "task-a", authorRole: "supervisor", createdAt: "2026-11-25T12:00:00Z", ...extra,
  });
  const rows = [make("1", "Assignment created."), make("2", "Assignment updated."), make("3", "Assignment updated."),
    make("4", "Assignment updated. Please revise the caption."), make("5", "Thanks for the research!"),
    make("6", "Other content", { itemType: "content" }), make("7", "Other intern", { internId: "intern-b" })];
  const before = JSON.stringify(rows);
  const result = workCommentsForItem(rows, { internId: "intern-a", itemType: "task", id: "task-a" });
  assert.deepEqual(result.activity.map((row) => row.id), ["1", "2", "3"]);
  assert.deepEqual(result.feedback.map((row) => row.id), ["4", "5"]);
  assert.equal(JSON.stringify(rows), before);
});

test("readable links retain the entire original note, punctuation, and exact destinations", () => {
  const note = "Trend 1 (https://www.tiktok.com/@example/video/123?ref=long).\nNext: https://example.com/a_(b) and https://example.com/report.pdf, then discuss.";
  const parts = workTextParts(note);
  assert.equal(parts.map((part) => part.text).join(""), note);
  assert.deepEqual(parts.filter((part) => part.href).map((part) => part.href), [
    "https://www.tiktok.com/@example/video/123?ref=long", "https://example.com/a_(b)", "https://example.com/report.pdf",
  ]);
  assert.match(workTextPreview(note), /TikTok link 1/);
  assert.doesNotMatch(workTextPreview(note), /ref=long/);
});

test("plain text and unsafe schemes never become executable links", () => {
  const note = '<script>alert(1)</script> javascript:alert(1) https://';
  const parts = workTextParts(note);
  assert.equal(parts.map((part) => part.text).join(""), note);
  assert.equal(parts.some((part) => part.href), false);
  assert.equal(workTextPreview("A".repeat(250)).length, 201);
  assert.equal(workDateLabel("invalid"), "");
  assert.equal(workDateLabel("2026-11-25"), "Nov 25, 2026");
});
