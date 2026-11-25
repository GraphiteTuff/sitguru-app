import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupInternAttachments } from "./attachment-groups";
import type { InternshipWorkAttachment } from "./types";

function attachment(
  id: string,
  changes: Partial<InternshipWorkAttachment> = {},
): InternshipWorkAttachment {
  return {
    id,
    internId: "intern-1",
    itemType: "task",
    itemId: "task-1",
    fileName: "Pet Trend Research.pdf",
    fileUrl: `https://files.example/${id}`,
    storageBucket: "internship",
    storagePath: id,
    mimeType: "application/pdf",
    fileSize: 100,
    caption: "",
    contributesToFinal: true,
    uploadedByRole: "intern",
    createdAt: "2026-11-24T12:00:00Z",
    ...changes,
  };
}

describe("assignment attachment display groups", () => {
  it("shows the newest upload and preserves every older record and URL without mutating input", () => {
    const first = attachment("first");
    const newest = attachment("newest", { createdAt: "2026-11-25T16:00:00Z" });
    const middle = attachment("middle", { createdAt: "2026-11-25T11:00:00Z" });
    const files = Object.freeze([first, newest, middle]);
    const groups = groupInternAttachments(files);

    assert.equal(groups.length, 1);
    assert.equal(groups[0].latest, newest);
    assert.deepEqual(groups[0].previous, [middle, first]);
    assert.deepEqual(files, [first, newest, middle]);
    assert.deepEqual(
      [groups[0].latest, ...groups[0].previous].map((file) => [file.id, file.fileUrl]),
      [newest, middle, first].map((file) => [file.id, file.fileUrl]),
    );
  });

  it("keeps matching names separate across categories, assignments, and interns", () => {
    const files = [
      attachment("brief", { category: "brief" }),
      attachment("evidence", { category: "evidence" }),
      attachment("legacy", { caption: "presentation" }),
      attachment("another-task", { category: "brief", itemId: "task-2" }),
      attachment("another-intern", { category: "brief", internId: "intern-2" }),
      attachment("another-type", { category: "brief", itemType: "content" }),
      attachment("another-name", { category: "brief", fileName: "Market Research.pdf" }),
    ];

    assert.equal(groupInternAttachments(files).length, files.length);
  });

  it("handles legacy categories and incomplete dates while preserving stable order", () => {
    const old = attachment("old", { caption: "evidence", createdAt: "" });
    const sameDate = attachment("same-date", { category: "evidence" });
    const latest = attachment("latest", { category: "evidence" });
    const invalid = attachment("invalid", { category: "evidence", createdAt: "not-a-date" });
    const [group] = groupInternAttachments([old, sameDate, latest, invalid]);

    assert.equal(group.latest, sameDate);
    assert.deepEqual(group.previous, [latest, old, invalid]);
    assert.deepEqual(groupInternAttachments([]), []);
  });
});
