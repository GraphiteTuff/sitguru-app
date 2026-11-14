import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readableAssignmentDeliverables, readAssignmentBrief } from "./manager-assignment";

describe("simple manager/intern assignment instructions", () => {
  it("separates Lola's three legacy inline Markdown deliverables", () => {
    const brief = readAssignmentBrief({
      deliverables: [
        "- **2 links** to pet-related posts or trends, with a quick note on what caught your eye. - **2 SitGuru post or Reel ideas**, one inspired by each link. - **1 SitGuru Pack discussion question** based on either idea.",
      ],
    });
    assert.deepEqual(brief.deliverables, [
      "2 links to pet-related posts or trends, with a quick note on what caught your eye.",
      "2 SitGuru post or Reel ideas, one inspired by each link.",
      "1 SitGuru Pack discussion question based on either idea.",
    ]);
  });

  it("accepts existing individual deliverables without changing their order", () => {
    assert.deepEqual(readableAssignmentDeliverables(["Research the trend", "Create a post", "Share insights"]), [
      "Research the trend", "Create a post", "Share insights",
    ]);
  });

  it("splits multiline bullets and numbering", () => {
    assert.deepEqual(readableAssignmentDeliverables(["- First task\n- Second task\n3. Last task"]), [
      "First task", "Second task", "Last task",
    ]);
  });

  it("preserves normal punctuation and hyphenated words", () => {
    assert.deepEqual(readableAssignmentDeliverables(["Create a high-quality, pet-safe guide - one page long"]), [
      "Create a high-quality, pet-safe guide - one page long",
    ]);
  });
});
