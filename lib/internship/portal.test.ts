import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attachmentsForItem,
  internAllowedUpload,
  internPortalFirstName,
  internSafeLinkedInUrl,
  internWorkItemType,
} from "./portal";

describe("intern portal personalization", () => {
  it("prefers the intern’s chosen name on their page", () => {
    assert.equal(
      internPortalFirstName({ preferredName: "Alex Rivera", fullName: "Alexandra Rivera" }),
      "Alex",
    );
    assert.equal(internPortalFirstName({ fullName: "Jordan Lee" }), "Jordan");
  });

  it("only keeps LinkedIn URLs", () => {
    assert.match(internSafeLinkedInUrl("linkedin.com/in/sitguru"), /linkedin.com/);
    assert.equal(internSafeLinkedInUrl("https://evil.example/intern"), "");
  });
});

describe("intern work attachments", () => {
  it("scopes files to a work area", () => {
    const files = [
      { itemType: "task", itemId: "a", fileName: "brief.pdf" },
      { itemType: "report", itemId: "a", fileName: "report.docx" },
    ];
    assert.deepEqual(
      attachmentsForItem(files, "task", "a").map((row) => row.fileName),
      ["brief.pdf"],
    );
  });

  it("rejects oversized or unknown files", () => {
    assert.equal(internAllowedUpload({ name: "notes.pdf", type: "application/pdf", size: 12 }), "");
    assert.equal(internAllowedUpload({ name: "headshot.heic", type: "image/heic", size: 12 }), "");
    assert.match(
      internAllowedUpload({ name: "notes.exe", type: "application/octet-stream", size: 12 }),
      /PDF/,
    );
    assert.match(
      internAllowedUpload({ name: "notes.pdf", type: "application/pdf", size: 11 * 1024 * 1024 }),
      /10MB/,
    );
  });

  it("keeps work types intern-scoped", () => {
    assert.equal(internWorkItemType("campaign"), "campaign");
    assert.equal(internWorkItemType("brand"), "brand");
    assert.equal(internWorkItemType("admin"), null);
  });

  it("accepts PowerPoint uploads for the Baseline presentation box", () => {
    assert.equal(internAllowedUpload({ name: "deck.pptx", type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", size: 12 }), "");
    assert.equal(internAllowedUpload({ name: "deck.ppt", type: "application/vnd.ms-powerpoint", size: 12 }), "");
  });
});
