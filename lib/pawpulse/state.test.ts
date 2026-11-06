import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PAWPULSE_SHOW_DELAY_MS,
  parsePawPulseHandoff,
  pawToastPlacement,
  reducePawPulses,
  visiblePawPulse,
} from "./state";

describe("PawPulse", () => {
  it("shows loading only after the short delay and keeps a second action", () => {
    const started = reducePawPulses([], { type: "begin", id: "save", message: "Saving your changes…" });
    const both = reducePawPulses(started, { type: "begin", id: "upload", message: "Uploading your agreement…" });
    assert.equal(visiblePawPulse(both[0], PAWPULSE_SHOW_DELAY_MS - 1), false);
    const loading = reducePawPulses(both, { type: "promote", id: "save" });
    const saved = reducePawPulses(loading, { type: "succeed", id: "save", message: "Changes saved successfully" });
    assert.equal(saved.find((item) => item.id === "save")?.phase, "success");
    assert.equal(saved.find((item) => item.id === "upload")?.phase, "pending");
  });

  it("ignores a repeated click while the same action is still running", () => {
    const started = reducePawPulses([], { type: "begin", id: "save", message: "Saving your changes…" });
    const again = reducePawPulses(started, { type: "begin", id: "save", message: "Saving your changes…" });
    assert.equal(again.length, 1);
  });

  it("turns a failed request into an error without a success state", () => {
    const started = reducePawPulses([], { type: "begin", id: "save", message: "Saving your changes…" });
    const failed = reducePawPulses(started, { type: "fail", id: "save", message: "Unable to save changes. Please try again." });
    assert.equal(failed[0]?.phase, "error");
    assert.equal(failed.some((item) => item.phase === "success"), false);
  });

  it("places the toast above a mobile dock and keeps a route handoff", () => {
    assert.equal(pawToastPlacement(true), "above-dock");
    assert.equal(pawToastPlacement(false), "corner");
    const handoff = parsePawPulseHandoff(JSON.stringify({ message: "Internship approval saved", tone: "success" }));
    assert.equal(handoff?.message, "Internship approval saved");
    assert.equal(parsePawPulseHandoff("not json"), null);
  });
});
