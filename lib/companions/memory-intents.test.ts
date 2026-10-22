import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatMemoriesForUserReply,
  parseMemoryIntent,
} from "./memory-intents";

describe("parseMemoryIntent", () => {
  it("saves an explicit boarding preference", () => {
    const intent = parseMemoryIntent("Remember that I prefer boarding.");
    assert.equal(intent?.type, "save");
    if (intent?.type === "save") {
      assert.equal(intent.key, "preferred_care_type");
      assert.match(intent.value, /boarding/i);
      assert.equal(intent.category, "care");
    }
  });

  it("saves a distance preference", () => {
    const intent = parseMemoryIntent(
      "I would rather stay within 10 miles.",
    );
    assert.equal(intent?.type, "save");
    if (intent?.type === "save") {
      assert.equal(intent.key, "search_radius");
      assert.match(intent.value, /10 miles/i);
      assert.equal(intent.category, "location");
    }
  });

  it("updates a preference", () => {
    const intent = parseMemoryIntent(
      "Update that preference to overnight stays",
    );
    assert.equal(intent?.type, "update");
    if (intent?.type === "update") {
      assert.match(intent.value, /overnight/i);
    }
  });

  it("lists memories", () => {
    const intent = parseMemoryIntent("What do you remember about me?");
    assert.equal(intent?.type, "list");
  });

  it("forgets a specific preference", () => {
    const intent = parseMemoryIntent("Forget that boarding preference");
    assert.equal(intent?.type, "forget");
    if (intent?.type === "forget") {
      assert.equal(intent.key, "preferred_care_type");
    }
  });

  it("forgets all preferences", () => {
    const intent = parseMemoryIntent("Forget all my preferences");
    assert.equal(intent?.type, "forget");
    if (intent?.type === "forget") {
      assert.equal(intent.key, null);
    }
  });

  it("ignores ordinary chat", () => {
    assert.equal(
      parseMemoryIntent("Find dog walkers near me in Austin"),
      null,
    );
  });

  it("ignores remember-when storytelling", () => {
    assert.equal(
      parseMemoryIntent("Remember when we talked about boarding last week?"),
      null,
    );
  });
});

describe("formatMemoriesForUserReply", () => {
  it("explains empty memory clearly", () => {
    const text = formatMemoriesForUserReply([], "Rogue");
    assert.match(text, /don't have any saved preferences/i);
  });

  it("lists active memories", () => {
    const text = formatMemoriesForUserReply(
      [
        {
          key: "preferred_care_type",
          value: "boarding",
          category: "care",
        },
      ],
      "Rogue",
    );
    assert.match(text, /boarding/);
    assert.match(text, /Forget/);
  });
});
