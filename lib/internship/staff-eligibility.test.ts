import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignmentStaffChangeAllowed,
  canSelectInternshipManager,
  canSelectInternshipSupervisor,
  internshipStaffOptionLabel,
  type InternshipStaffIdentity,
} from "./staff-eligibility";

function person(extra: Partial<InternshipStaffIdentity> = {}): InternshipStaffIdentity {
  return {
    id: "user-1",
    name: "Ava Venezia",
    email: "ava@sitguru.com",
    role: "social_community_manager",
    jobTitle: "Social Media & Community Growth Manager",
    active: true,
    canManageInterns: false,
    canSuperviseInterns: false,
    ...extra,
  };
}

describe("internship staff selectors", () => {
  it("shows an explicitly eligible manager and hides role-only admins", () => {
    assert.equal(canSelectInternshipManager(person({ canManageInterns: true })), true);
    assert.equal(canSelectInternshipManager(person({ role: "admin", canManageInterns: false })), false);
    assert.equal(
      canSelectInternshipManager(person({
        name: "SitGuru staff",
        email: "hq@sitguru.com",
        role: "admin",
        canManageInterns: true,
      })),
      false,
    );
    assert.equal(
      canSelectInternshipManager(person({
        name: "Admin User",
        email: "admin.user@sitguru.com",
        role: "admin",
        canManageInterns: true,
      })),
      false,
    );
    assert.equal(
      canSelectInternshipManager(person({
        name: "Test User",
        email: "test.user@sitguru.com",
        role: "admin",
        isTest: true,
        canManageInterns: true,
      })),
      false,
    );
    assert.equal(
      canSelectInternshipManager(person({
        name: "Pat Parent",
        email: "pat@example.com",
        role: "pet_parent",
        canManageInterns: true,
      })),
      false,
    );
    assert.equal(
      canSelectInternshipManager(person({
        name: "Disabled Lead",
        email: "lead@sitguru.com",
        active: false,
        canManageInterns: true,
      })),
      false,
    );
  });

  it("keeps supervisor eligibility separate from manager eligibility", () => {
    const managerOnly = person({ canManageInterns: true, canSuperviseInterns: false });
    const supervisorOnly = person({
      id: "user-2",
      name: "Jason Graff",
      email: "jason@sitguru.com",
      role: "founder",
      jobTitle: "Founder & CEO",
      canManageInterns: false,
      canSuperviseInterns: true,
    });
    assert.equal(canSelectInternshipSupervisor(managerOnly), false);
    assert.equal(canSelectInternshipSupervisor(supervisorOnly), true);
    assert.equal(canSelectInternshipManager(supervisorOnly), false);
    assert.match(internshipStaffOptionLabel(supervisorOnly), /Jason Graff — Founder & CEO — jason@sitguru.com/);
  });

  it("rejects a posted ineligible id and keeps an existing assignment", () => {
    assert.equal(
      assignmentStaffChangeAllowed({
        currentId: null,
        nextId: "generic-admin",
        selectable: false,
        roleLabel: "manager",
      }).ok,
      false,
    );
    assert.equal(
      assignmentStaffChangeAllowed({
        currentId: "legacy-manager",
        nextId: "legacy-manager",
        selectable: false,
        roleLabel: "manager",
      }).ok,
      true,
    );
    assert.equal(
      assignmentStaffChangeAllowed({
        currentId: null,
        nextId: "bad-supervisor",
        selectable: false,
        roleLabel: "supervisor",
      }).ok,
      false,
    );
  });
});
