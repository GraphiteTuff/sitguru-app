import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEMO_TEAM, DEMO_TEAM_PICKS } from "../demo-data";
import { buildTeamPickRoster } from "../team-roster";

describe("buildTeamPickRoster", () => {
  it("keeps every teammate and fills missing picks with placeholders", () => {
    const jasonOnly = DEMO_TEAM_PICKS.filter(
      (pick) => pick.team_member?.slug === "jason-graff",
    );
    const roster = buildTeamPickRoster(DEMO_TEAM, jasonOnly);
    assert.equal(roster.length, DEMO_TEAM.length);
    assert.equal(roster[0]?.member.slug, "jason-graff");
    assert.ok(roster[0]?.pick);
    assert.equal(roster[0]?.pick?.content?.slug, "the-forever-dog");
    const placeholders = roster.filter((item) => !item.pick);
    assert.equal(placeholders.length, DEMO_TEAM.length - 1);
    assert.deepEqual(
      placeholders.map((item) => item.member.slug),
      ["danette-graff", "ava-venezia", "ryan-manibo", "lola-uhl"],
    );
  });
});
