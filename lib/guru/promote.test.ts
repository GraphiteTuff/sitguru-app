import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { guruPromoCaption, guruPublicUrl } from "./promote";

describe("guru public promotion", () => {
  it("keeps the public profile URL stable for a slug", () => {
    assert.equal(guruPublicUrl("taylor-kim"), "https://www.sitguru.com/guru/taylor-kim");
  });

  it("rejects a slug that is not a public profile id", () => {
    assert.equal(guruPublicUrl("../admin"), "");
    assert.equal(guruPublicUrl(""), "");
  });

  it("writes a caption from real profile fields only", () => {
    const caption = guruPromoCaption({
      name: "Taylor",
      location: "Boca Raton, FL",
      services: ["Dog Walking", "Drop-In Visits"],
      url: "https://www.sitguru.com/guru/taylor-kim",
    });
    assert.match(caption, /Taylor/);
    assert.match(caption, /Boca Raton, FL/);
    assert.match(caption, /Dog Walking/);
    assert.match(caption, /https:\/\/www.sitguru.com\/guru\/taylor-kim/);
    assert.equal(caption.includes("5.0"), false);
  });
});
