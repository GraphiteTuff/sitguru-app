import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyTapFeedback,
  tapFeedbackLifetime,
  tapPawPosition,
  TAP_PAW_PRESS_MS,
  TAP_PAW_NAVIGATE_MS,
  TAP_PAW_SUBMIT_MS,
} from "./tap-feedback";

describe("tiny sitewide click/tap paw", () => {
  it("acknowledges real buttons and role-based controls", () => {
    assert.equal(classifyTapFeedback({ tagName: "BUTTON", type: "button" }), "press");
    assert.equal(classifyTapFeedback({ tagName: "BUTTON", type: "submit" }), "submit");
    assert.equal(classifyTapFeedback({ tagName: "INPUT", type: "checkbox" }), "press");
    assert.equal(classifyTapFeedback({ tagName: "INPUT", type: "radio" }), "press");
    assert.equal(classifyTapFeedback({ tagName: "DIV", role: "tab" }), "press");
    assert.equal(classifyTapFeedback({ tagName: "SUMMARY" }), "press");
    assert.equal(classifyTapFeedback({ tagName: "SELECT" }), "press");
  });

  it("shows on navigable links but does not disrupt regular text inputs", () => {
    assert.equal(classifyTapFeedback({ tagName: "A", href: "/intern/assignments" }), "navigate");
    assert.equal(classifyTapFeedback({ tagName: "A", href: "https://example.com", target: "_blank" }), "press");
    assert.equal(classifyTapFeedback({ tagName: "A", href: "#" }), null);
    assert.equal(classifyTapFeedback({ tagName: "A", href: "javascript:alert(1)" }), null);
    assert.equal(classifyTapFeedback({ tagName: "INPUT", type: "text" }), null);
  });

  it("never indicates disabled, aria-disabled, or explicitly excluded controls", () => {
    assert.equal(classifyTapFeedback({ tagName: "BUTTON", disabled: true }), null);
    assert.equal(classifyTapFeedback({ tagName: "A", href: "/checkout", ariaDisabled: "true" }), null);
    assert.equal(classifyTapFeedback({ tagName: "BUTTON", skip: true }), null);
  });

  it("disappears promptly and does not imply an operation succeeded", () => {
    assert.equal(tapFeedbackLifetime("press"), TAP_PAW_PRESS_MS);
    assert.equal(tapFeedbackLifetime("navigate"), TAP_PAW_NAVIGATE_MS);
    assert.equal(tapFeedbackLifetime("submit"), TAP_PAW_SUBMIT_MS);
    assert.ok(TAP_PAW_PRESS_MS < TAP_PAW_NAVIGATE_MS);
    assert.ok(TAP_PAW_SUBMIT_MS < 3000);
  });

  it("keeps the 28px paw inside small phone and desktop viewports", () => {
    assert.deepEqual(tapPawPosition(700, 800, 320, 480), { left: 282, top: 442 });
    assert.deepEqual(tapPawPosition(-20, -30, 320, 480), { left: 6, top: 6 });
    assert.deepEqual(tapPawPosition(40, 40, 1440, 900), { left: 52, top: 27 });
  });
});
