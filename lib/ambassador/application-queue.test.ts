import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ambassadorTypeForApplication,
  matchesAmbassadorWorkQueue,
  roleContactEmails,
  sameInboxEmail,
} from "./application-queue";

describe("Ambassador application queue", () => {
  it("keeps a new application visible even when attention is the other view", () => {
    const application = {
      id: "application:3eafe5cc-cdc0-4d2a-97dc-324a348ea216",
      status: "new",
      needsAttention: true,
      archived: false,
    };
    assert.equal(matchesAmbassadorWorkQueue({ ...application, queue: "new" }), true);
    assert.equal(matchesAmbassadorWorkQueue({ ...application, queue: "approved" }), false);
    assert.equal(matchesAmbassadorWorkQueue({ ...application, queue: "all" }), true);
    assert.equal(
      matchesAmbassadorWorkQueue({
        queue: "attention",
        id: "existing",
        status: "active",
        needsAttention: false,
        archived: false,
      }),
      false,
    );
  });

  it("maps community applications onto the allowed ambassador type", () => {
    assert.equal(ambassadorTypeForApplication("community"), "community_ambassador");
    assert.equal(ambassadorTypeForApplication("campus"), "campus_ambassador");
  });

  it("keeps the personal inbox and stores a future work inbox beside it", () => {
    assert.deepEqual(roleContactEmails("lola.uhl5@gmail.com", "lola@sitguru.com"), {
      email: "lola.uhl5@gmail.com",
      contactEmail: "lola.uhl5@gmail.com",
      loginEmail: "lola@sitguru.com",
      workEmail: "lola@sitguru.com",
    });
    assert.equal(roleContactEmails("lola.uhl5@gmail.com").loginEmail, "lola.uhl5@gmail.com");
  });

  it("treats a one-character mailbox typo as the same inbox", () => {
    assert.equal(sameInboxEmail("lola.uhl5@gmail.com", "lola.uh15@gmail.com"), true);
    assert.equal(sameInboxEmail("lola.uhl5@gmail.com", "lola.uhl5@gmail.com"), true);
    assert.equal(sameInboxEmail("lola.uhl5@gmail.com", "someone.else@gmail.com"), false);
    assert.equal(sameInboxEmail("lola.uhl5@gmail.com", "lola.uhl5@school.edu"), false);
  });
});
