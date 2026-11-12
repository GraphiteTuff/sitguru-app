import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCareMatchingAsk,
  isCurrentTurnCareIntent,
  joinRecentUserTexts,
  needsCareMatchingAsk,
} from "./care-matching-intake";

describe("care matching interruptibility", () => {
  it("does not treat standalone Scout FAQs as care intake", () => {
    for (const q of [
      "Free to apply?",
      "What are my rates?",
      "How do payouts work?",
      "Can I keep Rover?",
      "Is Guru Academy required?",
    ]) {
      assert.equal(isCurrentTurnCareIntent(q), false, q);
      assert.equal(needsCareMatchingAsk(q), false, q);
      assert.equal(buildCareMatchingAsk(q), null, q);
    }
  });

  it("still starts intake for an explicit care search", () => {
    const q = "I need dog walking in Harrisburg 17101";
    assert.equal(isCurrentTurnCareIntent(q), true);
  });

  it("does not let prior care context hijack a fresh FAQ turn", () => {
    const thread = joinRecentUserTexts(
      [
        { role: "user", content: "I need dog walking in Harrisburg 17101" },
        { role: "assistant", content: "When do you need care?" },
        { role: "user", content: "Is applying free?" },
      ],
      "Is applying free?",
    );
    // Thread still looks care-seeking, but CURRENT turn must win.
    assert.equal(isCurrentTurnCareIntent("Is applying free?"), false);
    assert.equal(
      isCurrentTurnCareIntent("Is applying free?")
        ? buildCareMatchingAsk(thread)
        : null,
      null,
    );
  });
});
