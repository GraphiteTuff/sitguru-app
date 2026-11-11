import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  READS_TEAM_AVATARS,
  readsTeamAvatar,
  readsTeamFirstName,
  readsTeamPickLabel,
} from "@/lib/reads/team";

describe("reads team display helpers", () => {
  it("maps every seeded teammate to a local avatar path", () => {
    for (const slug of [
      "jason-graff",
      "danette-graff",
      "ava-venezia",
      "ryan-manibo",
      "lola-uhl",
    ]) {
      assert.ok(READS_TEAM_AVATARS[slug]);
      assert.equal(readsTeamAvatar({ slug }), READS_TEAM_AVATARS[slug]);
    }
  });

  it("uses first names only on facing labels", () => {
    assert.equal(readsTeamFirstName("Jason Graff"), "Jason");
    assert.equal(readsTeamFirstName("Danette Graff"), "Danette");
    assert.equal(readsTeamFirstName("Ava Venezia"), "Ava");
    assert.equal(readsTeamPickLabel("Ryan Manibo"), "Ryan's Pick");
    assert.equal(readsTeamPickLabel("Lola Uhl"), "Lola's Pick");
  });
});
