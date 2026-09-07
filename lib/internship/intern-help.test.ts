import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INTERNSHIP_ONBOARDING_PATH } from "./onboarding";
import { internPortalDestination, INTERNSHIP_HELP_PATH } from "./intern-growth";
import {
  internHelpArticle,
  internHelpFileAllowed,
  internHelpMediaAllowed,
  internHelpMediaSrc,
  searchInternHelpArticles,
  INTERN_HELP_ARTICLES,
} from "./intern-help";
import { INTERN_WATCH_VIDEOS } from "./intern-glossary";

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
    for (const article of INTERN_HELP_ARTICLES) {
      assert.ok(article.purpose.length > 40, article.slug);
      assert.ok(article.contributes.length > 40, article.slug);
    }
  });

  it("finds student wording like check-in, hours, and tracking links", () => {
    const checkin = searchInternHelpArticles("weekly check-in");
    assert.ok(checkin.some((article) => article.slug === "weekly-checkin"));
    const hours = searchInternHelpArticles("hours this week");
    assert.ok(hours.some((article) => article.slug === "report-hours"));
    const tracking = searchInternHelpArticles("tracking link");
    assert.ok(tracking.some((article) => article.slug === "toolkit-tracking"));
    const pdf = searchInternHelpArticles("print pdf");
    assert.ok(pdf.some((article) => article.slug === "student-guide"));
    const checkinField = searchInternHelpArticles("lessons learned");
    assert.ok(checkinField.some((article) => article.slug === "weekly-checkin"));
    const metricKey = searchInternHelpArticles("metric key");
    assert.ok(metricKey.some((article) => article.slug === "metrics"));
    const reportPart = searchInternHelpArticles("which part of your report");
    assert.ok(reportPart.some((article) => article.slug === "definitions"));
    const pawreport = searchInternHelpArticles("pawreport");
    assert.ok(pawreport.some((article) => article.slug === "sitguru-features"));
    const events = searchInternHelpArticles("paws at the park");
    assert.ok(events.some((article) => article.slug === "vendor-events"));
    const stripe = searchInternHelpArticles("bookings stay on sitguru");
    assert.ok(stripe.some((article) => article.slug === "payments-on-sitguru"));
    const localCare = searchInternHelpArticles("trusted local pet care");
    assert.ok(localCare.some((article) => article.slug === "watch-sitguru"));
    assert.ok(INTERN_WATCH_VIDEOS.some((video) => video.id === "trusted-local-pet-care"));
    assert.ok(internHelpArticle("definitions"));
    assert.ok(internHelpArticle("sitguru-university"));
    assert.equal(internHelpFileAllowed("best-pa-nj-vendor-events.docx"), true);
    assert.equal(internHelpFileAllowed("stripe-setup.docx"), true);
    assert.equal(internHelpFileAllowed("secret.env"), false);
    const brandGreen = searchInternHelpArticles("#166534");
    assert.ok(brandGreen.some((article) => article.slug === "toolkit-brand"));
    const brandUpload = searchInternHelpArticles("your brand files");
    assert.ok(brandUpload.some((article) => article.slug === "toolkit-brand"));
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
    assert.equal(internHelpMediaAllowed("assets/sitguru-university-guide.jpg"), true);
    assert.equal(internHelpMediaAllowed("assets/brand/sitguru-logo-horizontal.jpg"), true);
    assert.equal(internHelpMediaAllowed("screenshots/17-your-page.png"), false);
    assert.equal(internHelpMediaAllowed("../.env"), false);
  });

  it("lets unsigned interns open Help during onboarding", () => {
    assert.equal(internPortalDestination("/intern/help", false), "/intern/help");
    assert.equal(
      internPortalDestination("/intern/help/onboarding", false),
      "/intern/help/onboarding",
    );
    assert.equal(internPortalDestination("/intern/help/print", false), "/intern/help/print");
    assert.equal(
      internPortalDestination("/intern/growth", false),
      INTERNSHIP_ONBOARDING_PATH,
    );
  });
});
