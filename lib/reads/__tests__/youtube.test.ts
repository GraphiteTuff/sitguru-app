import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildManualYoutubeImport,
  extractYoutubeVideoId,
  youtubeEmbedUrl,
  youtubeWatchUrl,
  withYoutubeUtm,
} from "../youtube";

describe("reads youtube helpers", () => {
  it("extracts video ids from common YouTube URL shapes", () => {
    assert.equal(
      extractYoutubeVideoId("dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
    assert.equal(
      extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
    assert.equal(
      extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
    assert.equal(
      extractYoutubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
    assert.equal(
      extractYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
    assert.equal(extractYoutubeVideoId("not-valid"), null);
    assert.equal(extractYoutubeVideoId("https://example.com/watch?v=nope"), null);
  });

  it("builds embed and watch urls without autoplay", () => {
    const embed = youtubeEmbedUrl("dQw4w9WgXcQ");
    assert.match(embed, /embed\/dQw4w9WgXcQ/);
    assert.doesNotMatch(embed, /autoplay=1/);
    assert.equal(
      youtubeWatchUrl("dQw4w9WgXcQ"),
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("adds SitGuru UTMs for YouTube attribution", () => {
    const url = withYoutubeUtm("https://www.youtube.com/watch?v=dQw4w9WgXcQ", {
      content: "reads-demo",
    });
    assert.match(url, /utm_source=sitguru/);
    assert.match(url, /utm_medium=reads/);
    assert.match(url, /utm_content=reads-demo/);
  });

  it("creates a needs-review manual import draft", () => {
    const draft = buildManualYoutubeImport(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      { title: "Demo import" },
    );
    assert.ok(draft);
    assert.equal(draft?.import_status, "needs_review");
    assert.equal(draft?.import_source, "manual");
    assert.equal(draft?.title, "Demo import");
  });
});
