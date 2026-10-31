import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { portalEnabledForInternStatus } from "./onboarding-authority";
import {
  candidateContactEmail,
  SPRING_2027_CANDIDATE_PLANS,
} from "./spring2027-candidates";

const plan = (key: "ryan" | "lola" | "lalita") =>
  SPRING_2027_CANDIDATE_PLANS.find((item) => item.key === key)!;

describe("Spring 2027 candidate plans", () => {
  it("plans Ryan at 3 credits, 150 hours, and 10 hours a week", () => {
    const ryan = plan("ryan");
    assert.equal(ryan.requestedCredits, 3);
    assert.equal(ryan.plannedTotalHours, 150);
    assert.equal(ryan.plannedWeeklyHours, 10);
    assert.equal(ryan.plannedWeeks, 15);
    assert.equal(ryan.verifiedRequiredHours, null);
    assert.equal(ryan.requirementStatus, "pending");
  });

  it("plans Lola at 10 hours a week without inventing verified credits", () => {
    const lola = plan("lola");
    assert.equal(lola.requestedCredits, null);
    assert.equal(lola.plannedTotalHours, 150);
    assert.equal(lola.plannedWeeklyHours, 10);
    assert.equal(lola.verifiedRequiredHours, null);
    assert.equal(lola.contactEmail, "lola.uh15@gmail.com");
  });

  it("keeps Lalita's 6-credit 300-hour plan provisional", () => {
    const lalita = plan("lalita");
    assert.equal(lalita.requestedCredits, 6);
    assert.equal(lalita.plannedTotalHours, 300);
    assert.equal(lalita.plannedWeeklyHours, 20);
    assert.equal(lalita.status, "prospective");
    assert.equal(lalita.universityVerificationStatus, "pending");
    assert.equal(portalEnabledForInternStatus(lalita.status), false);
    assert.equal(portalEnabledForInternStatus("pending_university_approval"), false);
    assert.equal(portalEnabledForInternStatus("active"), true);
  });

  it("does not invent Ryan's contact email", () => {
    assert.equal(candidateContactEmail(plan("ryan"), ""), null);
    assert.equal(candidateContactEmail(plan("ryan"), "ryan@example.edu"), "ryan@example.edu");
  });
});
