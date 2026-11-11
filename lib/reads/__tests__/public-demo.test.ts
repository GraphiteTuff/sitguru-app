import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEMO_CONTENT,
  DEMO_TEAM,
  DEMO_TEAM_PICKS,
  isDemoContentId,
} from "../demo-data";
import { READS_FORMAT_NAV, READS_PRIMARY_CTAS } from "../constants";

describe("reads public demo safety", () => {
  it("marks demo content clearly and includes required formats", () => {
    const types = new Set(DEMO_CONTENT.map((c) => c.content_type));
    assert.ok(types.has("book"));
    assert.ok(types.has("magazine"));
    assert.ok(types.has("podcast"));
    assert.ok(types.has("video"));
    assert.ok(types.has("author"));
    assert.ok(DEMO_CONTENT.every((c) => isDemoContentId(c.id)));
    assert.ok(DEMO_CONTENT.every((c) => c.status === "published"));
  });

  it("includes Ava, Ryan, and Lola in team members and picks", () => {
    const names = DEMO_TEAM.map((m) => m.full_name);
    assert.ok(names.includes("Ava Venezia"));
    assert.ok(names.includes("Ryan Manibo"));
    assert.ok(names.includes("Lola Uhl"));
    assert.ok(DEMO_TEAM_PICKS.length >= 3);
    assert.ok(
      DEMO_TEAM_PICKS.some((p) => p.team_member?.slug === "ava-venezia"),
    );
    assert.ok(
      DEMO_TEAM_PICKS.some((p) => p.team_member?.slug === "ryan-manibo"),
    );
    assert.ok(
      DEMO_TEAM_PICKS.some((p) => p.team_member?.slug === "lola-uhl"),
    );
  });

  it("exposes primary public navigation and CTAs", () => {
    assert.ok(READS_FORMAT_NAV.some((i) => i.href === "/reads/books"));
    assert.ok(READS_FORMAT_NAV.some((i) => i.href === "/reads/team-picks"));
    assert.equal(READS_PRIMARY_CTAS.length, 4);
  });
});
