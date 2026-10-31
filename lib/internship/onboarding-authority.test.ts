import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { internOnThisManagerDesk } from "./manager-access";
import {
  activationReady,
  assignmentNoticeAllowed,
  reassignmentKeepsAcademicRecord,
  resolveStaffSeat,
  shouldSendOnce,
} from "./onboarding-authority";
import { canAdministerInternshipOnboarding } from "./manager-access";

const ava = { id: "ava-user", email: "ava@sitguru.com", name: "Ava Venezia" };
const jason = { id: "jason-user", email: "jason@sitguru.com", name: "Jason Graff" };

describe("super admin internship onboarding", () => {
  it("lets a super admin onboard and blocks a manager", () => {
    assert.equal(canAdministerInternshipOnboarding({ isSuperUser: true, role: "admin" }), true);
    assert.equal(canAdministerInternshipOnboarding({ role: "super_admin" }), true);
    assert.equal(canAdministerInternshipOnboarding({ role: "social_community_manager" }), false);
    assert.equal(canAdministerInternshipOnboarding({ role: "admin" }), false);
    assert.equal(canAdministerInternshipOnboarding({ role: "intern" }), false);
  });

  it("resolves Ava and Jason by a single verified staff id", () => {
    assert.deepEqual(resolveStaffSeat([ava, jason], "ava@sitguru.com"), ava);
    assert.equal(resolveStaffSeat([ava, { ...ava, id: "other" }], "ava@sitguru.com"), null);
    assert.equal(resolveStaffSeat([jason], "ava@sitguru.com"), null);
  });

  it("saves a pending assignment without an active handoff email", () => {
    assert.equal(
      assignmentNoticeAllowed({
        status: "prospective",
        portalEnabled: false,
        managerChanged: true,
      }),
      false,
    );
    assert.equal(
      assignmentNoticeAllowed({
        status: "pending_university_approval",
        portalEnabled: false,
        managerChanged: true,
      }),
      false,
    );
    assert.equal(shouldSendOnce(false, false), false);
  });

  it("shows only activated assigned interns on Ava's desk", () => {
    const pending = {
      id: "lalita",
      status: "prospective",
      portalEnabled: false,
      managerUserId: ava.id,
    };
    const active = {
      id: "ryan",
      status: "active",
      portalEnabled: true,
      managerUserId: ava.id,
    };
    assert.equal(
      internOnThisManagerDesk({
        actorKind: "manager",
        actorUserId: ava.id,
        intern: pending,
      }),
      false,
    );
    assert.equal(
      internOnThisManagerDesk({
        actorKind: "manager",
        actorUserId: ava.id,
        intern: active,
      }),
      true,
    );
    assert.equal(
      internOnThisManagerDesk({
        actorKind: "manager",
        actorUserId: "other-manager",
        intern: active,
      }),
      false,
    );
    assert.equal(
      internOnThisManagerDesk({
        actorKind: "manager",
        actorUserId: ava.id,
        intern: { ...active, status: "denied", portalEnabled: false },
      }),
      false,
    );
  });

  it("activates only when onboarding gates are complete and emails once", () => {
    const waiting = activationReady({
      hasIdentity: true,
      internshipApproved: true,
      universityVerified: false,
      onboardingComplete: true,
      managerUserId: ava.id,
      supervisorUserId: jason.id,
    });
    assert.equal(waiting.ok, false);
    const ready = activationReady({
      hasIdentity: true,
      internshipApproved: true,
      universityVerified: true,
      onboardingComplete: true,
      managerUserId: ava.id,
      supervisorUserId: jason.id,
    });
    assert.equal(ready.ok, true);
    assert.equal(
      assignmentNoticeAllowed({ status: "active", portalEnabled: true, managerChanged: true }),
      true,
    );
    assert.equal(shouldSendOnce(false, true), true);
    assert.equal(shouldSendOnce(true, true), false);
    assert.equal(reassignmentKeepsAcademicRecord(), true);
  });
});
