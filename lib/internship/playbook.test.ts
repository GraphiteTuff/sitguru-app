import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HOURS_RULE,
  INTERNSHIP_TITLE,
  MARKET_GROWTH_PROJECT_NAME,
  internshipPositioningSummary,
} from "./playbook";
import { internshipProgramShortName } from "./labels";
import { SPRING_2027_PENN_STATE_ABINGTON_MILESTONES, SPRING_2027_SITGURU_MILESTONES } from "./timeline";

describe("internship playbook is SitGuru-owned", () => {
  it("does not name the program after one university", () => {
    assert.equal(internshipProgramShortName(), "Internship Program");
    assert.match(INTERNSHIP_TITLE, /Social Media & Community Growth Intern/);
    assert.equal(INTERNSHIP_TITLE.includes("Penn State"), false);
    assert.equal(MARKET_GROWTH_PROJECT_NAME.includes("Penn State"), false);
  });

  it("refuses a universal weekly hour promise", () => {
    assert.match(HOURS_RULE, /does not promise a fixed weekly hour/);
    assert.match(internshipPositioningSummary(), /university-specific|academic program/i);
  });

  it("keeps SitGuru timeline separate from one campus's published deadlines", () => {
    assert.ok(SPRING_2027_SITGURU_MILESTONES.every((row) => !row.universitySlug));
    assert.ok(
      SPRING_2027_PENN_STATE_ABINGTON_MILESTONES.every(
        (row) => row.universitySlug === "penn-state-abington" && row.owner === "university",
      ),
    );
  });
});
