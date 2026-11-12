import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isLegacyMobileCompanionKey,
  mayRestoreLocalCompanionHistory,
} from "./legacy-history";

describe("legacy companion history", () => {
  it("detects unscoped v1 mobile keys", () => {
    assert.equal(
      isLegacyMobileCompanionKey("sitguru:companion-chat:v1:rogue"),
      true,
    );
    assert.equal(
      isLegacyMobileCompanionKey("sitguru:companion-chat:v2:user-1:rogue"),
      false,
    );
  });

  it("never restores legacy keys for a signed-in user", () => {
    assert.equal(
      mayRestoreLocalCompanionHistory({
        storageKey: "sitguru:companion-chat:v1:rogue",
        signedInUserId: "user-b",
      }),
      false,
    );
  });

  it("allows only matching user-scoped v2 keys", () => {
    assert.equal(
      mayRestoreLocalCompanionHistory({
        storageKey: "sitguru:companion-chat:v2:user-a:rogue",
        signedInUserId: "user-a",
      }),
      true,
    );
    assert.equal(
      mayRestoreLocalCompanionHistory({
        storageKey: "sitguru:companion-chat:v2:user-a:rogue",
        signedInUserId: "user-b",
      }),
      false,
    );
  });

  it("allows guest-scoped v2 keys only while signed out", () => {
    assert.equal(
      mayRestoreLocalCompanionHistory({
        storageKey: "sitguru:companion-chat:v2:guest:rogue",
        signedInUserId: null,
      }),
      true,
    );
    assert.equal(
      mayRestoreLocalCompanionHistory({
        storageKey: "sitguru:companion-chat:v2:guest:rogue",
        signedInUserId: "user-a",
      }),
      false,
    );
  });
});
