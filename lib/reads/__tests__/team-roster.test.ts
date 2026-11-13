import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEMO_TEAM, DEMO_TEAM_PICKS } from "../demo-data";
import { buildTeamPickRoster } from "../team-roster";
import { AVA_BOOK_SLUG, mergeAvaBookPick } from "../curated-ava-book";

describe("buildTeamPickRoster", () => {
  it("shows Ava's actual recommended book ahead of the obsolete demo placeholder", () => {
    const ava = DEMO_TEAM.find((member) => member.slug === "ava-venezia");
    assert.ok(ava);
    const picks = mergeAvaBookPick(DEMO_TEAM_PICKS, ava);
    const avaPicks = picks.filter((pick) => pick.team_member?.slug === "ava-venezia");
    assert.equal(avaPicks.length, 1);
    const card = buildTeamPickRoster(DEMO_TEAM, picks).find((row) => row.member.slug === "ava-venezia");
    assert.equal(card?.pick?.content?.slug, AVA_BOOK_SLUG);
  });

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
