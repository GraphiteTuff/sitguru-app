import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SITGURU_GROWTH_TEAM_WORKFLOW,
  SITGURU_ONENOTE_NOTEBOOK,
  SITGURU_ONENOTE_SECTIONS,
  sitguruOneNoteShortcuts,
} from "./onenote-notebook";

describe("SitGuru Growth OneNote notebook", () => {
  it("names the Marketing & Community Growth notebook and sections", () => {
    assert.match(SITGURU_ONENOTE_NOTEBOOK.name, /Marketing & Community Growth/);
    assert.equal(SITGURU_ONENOTE_SECTIONS[0]?.name, "00 Start Here");
    assert.equal(SITGURU_ONENOTE_SECTIONS[1]?.name, "01 Team Playbook");
    assert.equal(SITGURU_ONENOTE_SECTIONS[1]?.pages?.length, 5);
  });

  it("defines the How We Work operating loop", () => {
    assert.deepEqual([...SITGURU_GROWTH_TEAM_WORKFLOW], [
      "Direction",
      "Assignment",
      "Work",
      "Manager Review",
      "Approval",
      "Publish/Complete",
      "Measure",
      "Learn",
    ]);
  });

  it("only exposes shortcuts for SitGuru work emails", () => {
    assert.equal(sitguruOneNoteShortcuts({ email: "ryan@school.edu" }).length, 0);
    assert.ok(sitguruOneNoteShortcuts({ email: "ava@sitguru.com" }).length >= 7);
  });
});
