import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SITGURU_SHAREPOINT_FOLDERS,
  SITGURU_SHAREPOINT_LIBRARY,
  sitguruSharePointShortcuts,
} from "./sharepoint-files";

describe("SitGuru Growth SharePoint Documents", () => {
  it("covers Documents sections including Leadership for Ava/Jason/Danette", () => {
    assert.match(SITGURU_SHAREPOINT_LIBRARY.team, /Marketing & Community Growth/);
    const sections = [...new Set(SITGURU_SHAREPOINT_FOLDERS.map((f) => f.section))];
    assert.ok(sections.includes("Analytics and Results"));
    assert.ok(sections.includes("Content and Social"));
    assert.ok(sections.includes("Intern Projects"));
    assert.ok(sections.includes("Leadership - Jason, Danette, and Ava"));
  });

  it("gates shortcuts to SitGuru work emails and can include leadership", () => {
    assert.equal(
      sitguruSharePointShortcuts({ email: "student@school.edu" }).length,
      0,
    );
    const withLeadership = sitguruSharePointShortcuts({
      email: "jason@sitguru.com",
      includeLeadership: true,
    });
    assert.ok(withLeadership.some((item) => item.leadershipOnly));
    const without = sitguruSharePointShortcuts({
      email: "ava@sitguru.com",
      includeLeadership: false,
    });
    assert.ok(without.every((item) => !item.leadershipOnly));
  });
});
