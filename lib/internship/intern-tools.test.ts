import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INTERN_HOME_TOOLS,
  INTERN_GROWTH_WORKPLACE,
  internContentByPlatform,
  internMarketSnapshot,
  internSchoolEmphasis,
  toInternPromoteEvent,
} from "./intern-tools";

describe("intern home tools", () => {
  it("stays intern-scoped, including social", () => {
    const ids = INTERN_HOME_TOOLS.map((tool) => tool.id);
    assert.deepEqual(ids, ["brand", "tracking", "snapshot", "events", "social"]);
  });

  it("opens the live growth workplace inside the intern portal", () => {
    assert.equal(INTERN_GROWTH_WORKPLACE.href, "/intern/growth");
    assert.equal(INTERN_GROWTH_WORKPLACE.href.startsWith("/admin"), false);
  });

  it("color-codes each tool like Ambassador social/referrals", () => {
    const tones = INTERN_HOME_TOOLS.map((tool) => tool.tone);
    assert.deepEqual(tones, ["emerald", "sky", "violet", "amber", "rose"]);
  });
});

describe("intern school emphasis", () => {
  it("puts the campus school first, without inventing a university partnership", () => {
    const school = internSchoolEmphasis({
      university: {
        name: "Pennsylvania State University",
        displayName: "Penn State Abington",
        city: "Abington",
        state: "PA",
        isUniversityPartner: false,
      },
      campus: { displayName: "Abington", city: "Abington", state: "PA" },
      intern: {
        academicProgram: "Corporate Communication",
        courseCode: "CAS 495",
        credits: 3,
        requiredHours: 135,
        semester: "Spring 2027",
        academicLevel: "junior",
      },
      cohort: { season: "spring", year: 2027 },
    });
    assert.equal(school.school, "Penn State Abington");
    assert.equal(school.program, "Corporate Communication");
    assert.equal(school.courseCode, "CAS 495");
    assert.equal(school.semester, "Spring 2027");
    assert.equal(school.partner, false);
    assert.match(school.place, /Abington/);
  });
});

describe("intern promote events", () => {
  it("keeps public title and place, drops emails and street address", () => {
    const event = toInternPromoteEvent({
      id: "secret-id",
      slug: "dog-fest",
      title: "Dog Fest",
      start_at: "2026-10-01T18:00:00.000Z",
      venue_name: "Central Park",
      city: "Doylestown",
      state: "PA",
      address_line_1: "10 Secret Street",
      contact_email: "owner@example.com",
      partners: { email: "partner@example.com", business_name: "Hidden LLC" },
    });
    const blob = JSON.stringify(event);
    assert.equal(event.href, "/events/dog-fest");
    assert.match(event.place, /Doylestown/);
    assert.equal(blob.includes("owner@"), false);
    assert.equal(blob.includes("partner@"), false);
    assert.equal(blob.includes("Secret Street"), false);
    assert.equal(blob.includes("Hidden LLC"), false);
    assert.equal(blob.includes("secret-id"), false);
  });
});

describe("intern market snapshot", () => {
  it("aggregates intern-owned counts without admin paths", () => {
    const snapshot = internMarketSnapshot({
      university: { region: "Greater Philadelphia" },
      campus: { city: "Abington", state: "PA" },
      metrics: [
        {
          isVerified: true,
          label: "Pet Parent signups",
          valueNumeric: 12,
          sourceSystem: "ga4",
        },
        {
          isVerified: false,
          label: "Unverified clicks",
          valueNumeric: 99,
          sourceSystem: "meta",
        },
      ],
      campaigns: [{}],
      content: [{ platform: "Instagram" }, { platform: "Instagram" }, { platform: "TikTok" }],
      smartGoals: [
        {
          id: "g1",
          specific: "Grow PA Pet Parent signups",
          targetValue: "40",
          metricKey: "pet_parent_signups",
        },
      ],
    });
    assert.equal(snapshot.marketLabel, "Greater Philadelphia");
    assert.equal(snapshot.verifiedCount, 1);
    assert.equal(snapshot.pendingCount, 1);
    assert.equal(snapshot.campaignCount, 1);
    assert.equal(snapshot.contentCount, 3);
    assert.deepEqual(snapshot.platforms, [
      { platform: "Instagram", count: 2 },
      { platform: "TikTok", count: 1 },
    ]);
    assert.ok(snapshot.publicLinks.every((link) => !link.href.startsWith("/admin")));
    assert.equal(
      snapshot.verifiedMetrics.some((row) => row.label === "Unverified clicks"),
      false,
    );
  });
});

describe("intern social counts", () => {
  it("groups posts by platform", () => {
    assert.deepEqual(internContentByPlatform([{ platform: "" }, { platform: "X" }]), [
      { platform: "Unspecified", count: 1 },
      { platform: "X", count: 1 },
    ]);
  });
});
