import assert from "node:assert/strict";
import { test } from "node:test";
import { internDraftHref, promoCampaignHref, publishedReadsPath } from "./promotion-links";

test("published editorial links route to the correct SitGuru section", () => {
  assert.equal(publishedReadsPath("book", "the-forever-dog"), "/reads/books/the-forever-dog");
  assert.equal(publishedReadsPath("podcast", "puppies"), "/reads/podcasts/puppies");
  assert.equal(publishedReadsPath("video", "how-to"), "/reads/videos/how-to");
  assert.equal(publishedReadsPath("unknown", "x"), null);
  assert.equal(publishedReadsPath("book", "../../secret"), null);
});

test("tracked campaigns retain SitGuru destinations without accepting off-domain redirects", () => {
  const href = promoCampaignHref({ kind: "events", title: "Pet Fun Day", destination: "/events/pet-fun-day" });
  const url = new URL(href, "https://www.sitguru.com");
  assert.equal(url.pathname, "/manager/create");
  assert.equal(url.searchParams.get("type"), "event");
  assert.equal(url.searchParams.get("title"), "Pet Fun Day");
  assert.equal(url.searchParams.get("dest"), "/events/pet-fun-day");
  const unsafe = new URL(promoCampaignHref({
    kind: "reads", title: "Bad", destination: "https://evil.example/phishing",
  }), "https://www.sitguru.com");
  assert.equal(unsafe.searchParams.get("dest"), "/");
});

test("intern draft links carry source references, not access rights or private media", () => {
  const url = new URL(internDraftHref({
    kind: "community", id: "source-123", title: "Happy Pup", destination: "/pack#story-source-123",
  }), "https://www.sitguru.com");
  assert.equal(url.pathname, "/intern/content");
  assert.equal(url.searchParams.get("seedId"), "source-123");
  assert.equal(url.searchParams.get("seedKind"), "community");
  assert.equal(url.searchParams.get("seedTitle"), null);
  assert.equal(url.searchParams.get("assetId"), null);
});