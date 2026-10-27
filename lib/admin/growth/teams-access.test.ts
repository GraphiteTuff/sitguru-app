import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSitGuruWorkEmail,
  sitguruGrowthTeamsChannelLinks,
  sitguruTeamsHref,
  teamsChannelForSitguruPath,
  SITGURU_GROWTH_TEAMS_CHANNELS,
  SITGURU_GROWTH_TEAMS_TEAM,
  SITGURU_TEAMS_CLOUD_HOME,
} from "./teams-access";

describe("isSitGuruWorkEmail", () => {
  it("allows SitGuru work mailboxes", () => {
    assert.equal(isSitGuruWorkEmail("jason@sitguru.com"), true);
    assert.equal(isSitGuruWorkEmail("ava@sitguru.com"), true);
    assert.equal(isSitGuruWorkEmail("  Ava@SitGuru.com "), true);
  });

  it("rejects school, personal, and empty addresses", () => {
    assert.equal(isSitGuruWorkEmail("student@university.edu"), false);
    assert.equal(isSitGuruWorkEmail("jasongraff1978@gmail.com"), false);
    assert.equal(isSitGuruWorkEmail("ava@sitgur.com"), false);
    assert.equal(isSitGuruWorkEmail(""), false);
    assert.equal(isSitGuruWorkEmail(null), false);
  });
});

describe("SitGuru Marketing & Community Growth Teams", () => {
  it("defaults to teams.cloud.microsoft", () => {
    assert.equal(SITGURU_TEAMS_CLOUD_HOME, "https://teams.cloud.microsoft");
    assert.equal(sitguruTeamsHref(), SITGURU_TEAMS_CLOUD_HOME);
  });

  it("names live channels and maps SitGuru process paths", () => {
    assert.match(SITGURU_GROWTH_TEAMS_TEAM.name, /Marketing & Community Growth/);
    const labels = SITGURU_GROWTH_TEAMS_CHANNELS.map((item) => item.label);
    assert.deepEqual(labels, [
      "General",
      "Analytics and Results",
      "Content and Social",
      "Growth and Strategy",
      "Intern Projects",
      "Leadership - Jason, Danette, and Ava",
      "Partnerships and Community",
    ]);
    assert.equal(
      SITGURU_GROWTH_TEAMS_CHANNELS.find((item) => item.id === "leadership")?.private,
      true,
    );
    assert.ok(
      SITGURU_GROWTH_TEAMS_CHANNELS.every(
        (item) => item.process && item.sitguruPaths.length > 0,
      ),
    );
  });

  it("maps SitGuru report routes back to Teams channels", () => {
    assert.equal(
      teamsChannelForSitguruPath("/manager/analytics")?.id,
      "analytics-results",
    );
    assert.equal(teamsChannelForSitguruPath("/intern/manage")?.id, "intern-projects");
    assert.equal(
      teamsChannelForSitguruPath("/manager/partners")?.id,
      "partnerships-community",
    );
  });

  it("exposes channel links that fall back to Teams cloud home", () => {
    const links = sitguruGrowthTeamsChannelLinks();
    assert.equal(links.length, 7);
    assert.ok(links.every((item) => item.href.startsWith("https://")));
  });
});
