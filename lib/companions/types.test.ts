import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isCompanionId,
  normalizeCompanionId,
} from "./types";

describe("companion types", () => {
  it("accepts the four companions", () => {
    assert.equal(isCompanionId("rogue"), true);
    assert.equal(isCompanionId("scout"), true);
    assert.equal(isCompanionId("taco"), true);
    assert.equal(isCompanionId("delilah"), true);
    assert.equal(isCompanionId("admin"), false);
  });

  it("normalizes unknown companions to rogue", () => {
    assert.equal(normalizeCompanionId("SCOUT"), "scout");
    assert.equal(normalizeCompanionId("nope"), "rogue");
  });
});
