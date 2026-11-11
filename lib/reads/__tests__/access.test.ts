import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertNoSelfPublish,
  canInternEditContent,
  type ReadsIdentity,
} from "../access";
import { slugifyReads, ensureUniqueSlug } from "../slug";
import { INTERN_ALLOWED_STATUSES } from "../constants";

function identity(
  staffRole: ReadsIdentity["staffRole"],
  id = "user-1",
): ReadsIdentity {
  return {
    id,
    email: `${staffRole}@sitguru.com`,
    role: staffRole === "intern" ? "content_intern" : staffRole,
    staffRole,
    canCreate: true,
    canSubmit: true,
    canReview: staffRole !== "intern",
    canPublish: staffRole !== "intern",
    canOverride: staffRole === "admin",
    canManagePartnerships: staffRole !== "intern",
    canEscalate: staffRole !== "intern",
    canViewAllAnalytics: staffRole !== "intern",
    canViewOwnAnalytics: true,
    canManageTaxonomy: staffRole !== "intern",
    canImportYoutube: true,
  };
}

describe("reads permissions", () => {
  it("prevents intern self-publish", () => {
    assert.throws(() => assertNoSelfPublish(identity("intern")), /cannot publish/i);
    assert.doesNotThrow(() => assertNoSelfPublish(identity("manager")));
  });

  it("limits intern edits to own drafts", () => {
    const intern = identity("intern", "intern-1");
    assert.equal(
      canInternEditContent(intern, {
        created_by: "intern-1",
        assigned_intern_id: null,
      }),
      true,
    );
    assert.equal(
      canInternEditContent(intern, {
        created_by: "other",
        assigned_intern_id: null,
      }),
      false,
    );
    assert.equal(
      canInternEditContent(identity("manager"), {
        created_by: "other",
        assigned_intern_id: null,
      }),
      true,
    );
  });

  it("keeps intern status vocabulary away from publish states", () => {
    assert.equal(INTERN_ALLOWED_STATUSES.has("draft"), true);
    assert.equal(INTERN_ALLOWED_STATUSES.has("submitted"), true);
    assert.equal(INTERN_ALLOWED_STATUSES.has("published"), false);
    assert.equal(INTERN_ALLOWED_STATUSES.has("approved"), false);
  });
});

describe("reads slugs", () => {
  it("slugifies titles cleanly", () => {
    assert.equal(slugifyReads("Puppy Foundations!"), "puppy-foundations");
  });

  it("ensures unique slugs", () => {
    const existing = new Set(["puppy-foundations"]);
    assert.equal(
      ensureUniqueSlug("Puppy Foundations", existing),
      "puppy-foundations-2",
    );
  });
});
