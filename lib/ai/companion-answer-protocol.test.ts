import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isOpeningCompanionTurn } from "./companion-answer-protocol";

describe("companion thread depth", () => {
  it("treats the first user message as an opening turn", () => {
    assert.equal(
      isOpeningCompanionTurn([{ role: "user" }]),
      true,
    );
  });

  it("treats a follow-up as a chance to go deeper", () => {
    assert.equal(
      isOpeningCompanionTurn([
        { role: "user" },
        { role: "assistant" },
        { role: "user" },
      ]),
      false,
    );
  });
});
