import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applySessionMetaIntent,
  emptyCompanionSessionState,
  mergeSessionStateFromTurn,
  parseSessionMetaIntent,
} from "./session-state";

describe("companion session state", () => {
  it("remembers Harrisburg ZIP across turns and recalls it", () => {
    let state = emptyCompanionSessionState();
    state = mergeSessionStateFromTurn(
      state,
      "I need dog walking in Harrisburg 17101",
    );
    assert.equal(state.zip, "17101");
    assert.equal(state.service, "Dog Walking");

    const intent = parseSessionMetaIntent("What ZIP did I give?");
    assert.equal(intent?.type, "recall");
    const { reply } = applySessionMetaIntent(state, intent!);
    assert.match(reply, /17101/);
  });

  it("applies service corrections", () => {
    let state = mergeSessionStateFromTurn(
      emptyCompanionSessionState(),
      "I need walking",
    );
    const intent = parseSessionMetaIntent("Actually boarding, not walking");
    assert.equal(intent?.type, "correct");
    const applied = applySessionMetaIntent(state, intent!);
    assert.equal(applied.state.service, "Boarding");
    assert.match(applied.reply, /Boarding/);
  });

  it("clears state on start over", () => {
    let state = mergeSessionStateFromTurn(
      emptyCompanionSessionState(),
      "My name is Alex and I need care in 17101",
    );
    const intent = parseSessionMetaIntent("Start over");
    const applied = applySessionMetaIntent(state, intent!);
    assert.equal(applied.state.zip, null);
    assert.equal(applied.state.name, null);
    assert.match(applied.reply.toLowerCase(), /fresh start|cleared/);
  });
});
