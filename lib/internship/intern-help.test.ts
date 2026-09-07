import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INTERNSHIP_ONBOARDING_PATH } from "./onboarding";
import { internPortalDestination, INTERNSHIP_HELP_PATH } from "./intern-growth";
import {
  internHelpArticle,
  internHelpMediaAllowed,
  internHelpMediaSrc,
  searchInternHelpArticles,
  INTERN_HELP_ARTICLES,
} from "./intern-help";

describe("intern help catalog", () => {
  it("keeps every article inside the intern portal, not Admin HQ or public Help Center", () => {
    assert.equal(INTERNSHIP_HELP_PATH, "/intern/help");
    assert.ok(INTERN_HELP_ARTICLES.length >= 12);
    for (const article of INTERN_HELP_ARTICLES) {
      assert.equal(article.href.startsWith("/intern/help/"), true);
      assert.equal(article.href.startsWith("/admin"), false);
      assert.equal(article.href.startsWith("/help/"), false);
    }
    assert.ok(internHelpArticle("home"));
    assert.equal(internHelpArticle("missing"), null);
  });

  it("finds student wording like check-in, hours, and tracking links", () => {
    const checkin = searchInternHelpArticles("weekly check-in");
    assert.ok(checkin.some((article) => article.slug === "weekly-checkin"));
    const hours = searchInternHelpArticles("hours this week");
    assert.ok(hours.some((article) => article.slug === "report-hours"));
    const tracking = searchInternHelpArticles("tracking link");
    assert.ok(tracking.some((article) => article.slug === "toolkit-tracking"));
  });

  it("serves training screenshots from intern Help media, never Your page", () => {
    assert.equal(
      internHelpMediaSrc("01-home-welcome.png"),
      "/intern/help/media/screenshots/01-home-welcome.png",
    );
    assert.equal(
      internHelpMediaSrc("assets/syllabus-cover.jpg"),
      "/intern/help/media/assets/syllabus-cover.jpg",
    );
    assert.equal(internHelpMediaAllowed("screenshots/01-home-welcome.png"), true);
    assert.equal(internHelpMediaAllowed("assets/syllabus-cover.jpg"), true);
    assert.equal(internHelpMediaAllowed("screenshots/17-your-page.png"), false);
    assert.equal(internHelpMediaAllowed("../.env"), false);
  });

  it("lets unsigned interns open Help during onboarding", () => {
    assert.equal(internPortalDestination("/intern/help", false), "/intern/help");
    assert.equal(
      internPortalDestination("/intern/help/onboarding", false),
      "/intern/help/onboarding",
    );
    assert.equal(
      internPortalDestination("/intern/growth", false),
      INTERNSHIP_ONBOARDING_PATH,
    );
  });
});
