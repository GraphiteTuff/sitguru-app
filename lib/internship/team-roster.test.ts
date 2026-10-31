import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSpringRoster,
  describeManagerAccess,
  displayUniversityName,
  excludeFromInternPortalList,
  internPortalActionLabel,
  legacyInternshipReviews,
  mergeStaffOnce,
  type RosterInternRecord,
} from "./team-roster";

function row(overrides: Partial<RosterInternRecord> & Pick<RosterInternRecord, "id" | "fullName" | "email">): RosterInternRecord {
  return {
    preferredName: "",
    userId: null,
    status: "pending_university_approval",
    portalEnabled: false,
    universityName: "",
    credits: null,
    requestedCredits: null,
    plannedTotalHours: null,
    plannedWeeklyHours: null,
    internshipWeeks: null,
    ...overrides,
  };
}

const lola = row({
  id: "lola",
  fullName: "Lola Uhl",
  email: "lola.uh15@gmail.com",
  status: "pending_university_approval",
  universityName: "Saint Joseph's University",
  plannedTotalHours: 150,
  plannedWeeklyHours: 10,
  internshipWeeks: 15,
});

const lalita = row({
  id: "lalita",
  fullName: "Lalita Dhital",
  email: "lalitadhital5@gmail.com",
  status: "prospective",
  universityName: "Penn State Hazleton",
  requestedCredits: 6,
  plannedTotalHours: 300,
  plannedWeeklyHours: 20,
  internshipWeeks: 15,
});

const jason = row({
  id: "jason-test",
  fullName: "Jason Graff",
  preferredName: "Jason",
  email: "jasongraff1978@gmail.com",
  userId: "personal-user",
  status: "accepted",
  portalEnabled: true,
  universityName: "University Test",
});

describe("Spring 2027 team roster", () => {
  const roster = buildSpringRoster({ interns: [jason, lola, lalita] });

  it("lists Ryan, Lola, and Lalita once and leaves Ryan unmatched", () => {
    assert.deepEqual(
      roster.map((entry) => entry.fullName),
      ["Ryan Manibo", "Lola Uhl", "Lalita Dhital"],
    );
    const ryan = roster[0];
    assert.equal(ryan.accountLabel, "Record Missing");
    assert.equal(ryan.recordId, null);
    assert.equal(ryan.workspaceAction, "none");
    assert.equal(ryan.canCreatePendingRecord, true);
    assert.equal(ryan.universityLabel, "Penn State");
    assert.equal(ryan.creditLabel, "3 planned credits");
    assert.equal(ryan.hoursLabel, "150 planned hours");
    assert.equal(ryan.weeklyLabel, "10 planned hours/week");
    assert.equal(ryan.statusLabel, "University approval pending");
  });

  it("keeps Lola and Lalita pending and unregistered", () => {
    const lolaCard = roster[1];
    const lalitaCard = roster[2];
    assert.equal(lolaCard.accountLabel, "Needs Registration");
    assert.equal(lolaCard.creditLabel, "Credits pending");
    assert.equal(lolaCard.hoursLabel, "150 proposed hours");
    assert.equal(lolaCard.workspaceAction, "preview");
    assert.equal(lolaCard.statusLabel, "University approval pending");
    assert.equal(lalitaCard.accountLabel, "Needs Registration");
    assert.equal(lalitaCard.creditLabel, "6 requested credits");
    assert.equal(lalitaCard.hoursLabel, "300 provisional planned hours");
    assert.equal(lalitaCard.weeklyLabel, "20 planned hours/week");
    assert.equal(lalitaCard.statusLabel, "Prospective / pending confirmation");
    assert.equal(lalitaCard.workspaceAction, "preview");
  });

  it("does not classify the founder marketplace login as a Spring intern", () => {
    assert.equal(roster.some((entry) => entry.fullName === "Jason Graff"), false);
    const reviews = legacyInternshipReviews([jason, lola, lalita]);
    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].email, "jasongraff1978@gmail.com");
    assert.match(reviews[0].recommendation, /jason@sitguru.com/);
    assert.match(reviews[0].recommendation, /Do not delete/);
    assert.equal(excludeFromInternPortalList(jason), true);
    assert.equal(excludeFromInternPortalList(lola), false);
  });

  it("does not call a pending portal active, even if the flag is on", () => {
    assert.equal(
      internPortalActionLabel({ portalEnabled: false, status: "pending_university_approval" }),
      "Preview Intern Workspace",
    );
    assert.equal(
      internPortalActionLabel({ portalEnabled: true, status: "prospective" }),
      "Preview Intern Workspace",
    );
    assert.equal(
      internPortalActionLabel({ portalEnabled: true, status: "active" }),
      "Open Active Portal",
    );
    const pendingOn = buildSpringRoster({
      interns: [{ ...lola, portalEnabled: true, status: "pending_university_approval" }],
    });
    assert.equal(pendingOn[1].workspaceAction, "preview");
  });

  it("reports a linked account without inventing one", () => {
    const linked = buildSpringRoster({
      interns: [{ ...lola, userId: "lola-user" }],
      accounts: [{ userId: "lola-user", email: lola.email, fullName: lola.fullName }],
    });
    assert.equal(linked[1].accountLabel, "Account linked");
    const foundOnly = buildSpringRoster({
      interns: [lalita],
      accounts: [{ userId: "ryan-user", email: "ryan@example.edu", fullName: "Ryan Manibo" }],
    });
    assert.equal(foundOnly[0].accountLabel, "Account found · record missing");
    assert.equal(foundOnly[0].canCreatePendingRecord, true);
  });

  it("shortens Penn State and shows the manager once", () => {
    assert.equal(displayUniversityName("Penn State University"), "Penn State");
    assert.equal(displayUniversityName("Penn State Hazleton"), "Penn State Hazleton");
    const staff = mergeStaffOnce(
      [{ id: "ava", name: "Ava Venezia", email: "ava@sitguru.com" }],
      [{ id: "ava", name: "Ava Venezia", email: "ava@sitguru.com" }],
    );
    assert.equal(staff.length, 1);
    assert.equal(staff[0].managerDesk, true);
    assert.equal(staff[0].growthAccess, true);
  });

  it("describes Ava's access from stored flags", () => {
    assert.equal(
      describeManagerAccess({
        email: "ava@sitguru.com",
        userId: "ava",
        accessActive: true,
        canManageInterns: true,
      }).label,
      "Manager access active",
    );
    assert.equal(
      describeManagerAccess({
        email: "ava@sitguru.com",
        userId: null,
        accessActive: false,
        canManageInterns: false,
      }).label,
      "Account missing",
    );
  });
});
