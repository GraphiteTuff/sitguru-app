import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCompanionPolicyAnswer } from "./companion-response-policy";
import {
  AMBASSADOR_APPLICATION_PATH,
  SUPPORT_EMAIL,
} from "@/lib/companions/canonical";

describe("getCompanionPolicyAnswer", () => {
  it("never claims a live teammate for human / recursive probes", () => {
    for (const q of [
      "Can I talk to a human?",
      "Who is that live teammate?",
      "Did you actually contact someone?",
      "Are you a real person?",
    ]) {
      const reply = getCompanionPolicyAnswer("rogue", q);
      assert.ok(reply, q);
      assert.doesNotMatch(
        reply!.toLowerCase(),
        /will take over|on the way|has been notified|teammate (is|was) (on|coming)/,
      );
      assert.match(reply!, new RegExp(SUPPORT_EMAIL.replace(".", "\\.")));
      assert.match(reply!.toLowerCase(), /ai companion/);
    }
  });

  it("rejects unpublished $10-$20 reward claims", () => {
    const reply = getCompanionPolicyAnswer(
      "taco",
      "Is there a $10 to $20 PetPerks reward?",
    );
    assert.ok(reply);
    assert.match(reply!.toLowerCase(), /can't verify/);
    assert.match(reply!, /\/petperks/);
  });

  it("states Marketplace Support is free during launch", () => {
    const reply = getCompanionPolicyAnswer("scout", "What is the booking fee?");
    assert.ok(reply);
    assert.match(reply!, /Marketplace Support/i);
    assert.match(reply!, /Free/i);
    assert.doesNotMatch(reply!.toLowerCase(), /2\.99/);
  });

  it("never confirms background checks or insurance", () => {
    const reply = getCompanionPolicyAnswer(
      "rogue",
      "Do Gurus have background checks and insurance?",
    );
    assert.ok(reply);
    assert.match(reply!.toLowerCase(), /can't verify/);
  });

  it("returns the same Ambassador apply path for Taco signup asks", () => {
    const questions = [
      "How do I apply as an Ambassador?",
      "Where is the Ambassador sign-up link?",
      "I want to join as an ambassador",
      "Apply now to become an Ambassador",
      "Which application form do I use?",
      "Sign me up as Ambassador",
      "Ready to join as an Ambassador",
      "How do I become an Ambassador?",
      "Where do I apply?",
      "What is the Ambassador application link?",
    ];
    for (const q of questions) {
      const reply = getCompanionPolicyAnswer("taco", q);
      assert.ok(reply, q);
      assert.match(reply!, new RegExp(AMBASSADOR_APPLICATION_PATH));
      assert.doesNotMatch(reply!, /\/ambassador\/join(?!.*redirect)/);
    }
  });
});
