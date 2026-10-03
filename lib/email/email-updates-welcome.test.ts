import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildEmailUpdatesWelcome, sendEmailUpdatesWelcome } from "./email-updates-welcome";

const SOCIAL = {
  facebook: "https://www.facebook.com/SitGuruOfficial",
  instagram: "https://www.instagram.com/SitGuruOfficial",
  tiktok: "https://www.tiktok.com/@SitGuruOfficial",
  x: "https://x.com/SitGuruOfficial",
  youtube: "https://www.youtube.com/@SitGuruOfficial",
} as const;

const BANNED_PHRASES = [
  "mobile friendly",
  "mobile app friendly",
  "web app friendly",
  "available on mobile",
  "available on web",
];

function welcome() {
  process.env.NEXT_PUBLIC_SITE_URL = "https://www.sitguru.com";
  return buildEmailUpdatesWelcome({
    to: "jasongraff1978+welcome2@gmail.com",
    fullName: "Ava<script> Parent",
    unsubscribeToken: "welcome-token-123",
  });
}

describe("email updates welcome", () => {
  it("uses the approved welcome subject", () => {
    assert.equal(welcome().subject, "Welcome to the SitGuru community");
  });

  it("uses HTTPS SitGuru links", () => {
    const { html, text } = welcome();
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(hrefs.length > 0);
    for (const href of hrefs) {
      if (href.startsWith("mailto:")) continue;
      assert.match(href, /^https:\/\//);
      if (href.includes("sitguru.com")) {
        assert.match(href, /^https:\/\/www\.sitguru\.com/);
      }
    }
    assert.match(text, /https:\/\/www\.sitguru\.com\//);
    assert.doesNotMatch(`${html}\n${text}`, /http:\/\/(www\.)?sitguru\.com/);
  });

  it("includes the exact official social URLs", () => {
    const { html, text } = welcome();
    for (const url of Object.values(SOCIAL)) {
      assert.equal(html.split(url).length - 1, 1);
      assert.match(
        html,
        new RegExp(
          `<a href="${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*target="_blank"`,
        ),
      );
      assert.match(text, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  });

  it("links Facebook, Instagram, TikTok, X, and YouTube as separate anchors", () => {
    const { html } = welcome();
    assert.match(html, new RegExp(`href="${SOCIAL.facebook}"`));
    assert.match(html, new RegExp(`href="${SOCIAL.instagram}"`));
    assert.match(html, new RegExp(`href="${SOCIAL.tiktok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.match(html, new RegExp(`href="${SOCIAL.x}"`));
    assert.match(html, new RegExp(`href="${SOCIAL.youtube.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.match(html, />\s*Facebook\s*</);
    assert.match(html, />\s*Instagram\s*</);
    assert.match(html, />\s*TikTok\s*</);
    assert.match(html, />\s*X\s*</);
    assert.match(html, />\s*YouTube\s*</);
  });

  it("does not include a LinkedIn URL", () => {
    const { html, text } = welcome();
    assert.doesNotMatch(`${html}\n${text}`, /linkedin/i);
  });

  it("keeps a tokenized unsubscribe URL and a preferences URL", () => {
    const { html, text } = welcome();
    const unsubscribe =
      "https://www.sitguru.com/unsubscribe?token=welcome-token-123";
    const preferences =
      "https://www.sitguru.com/customer/dashboard/profile/notifications";
    const escapeRegExp = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(html, new RegExp(`href="${escapeRegExp(unsubscribe)}"`));
    assert.match(html, /Unsubscribe anytime/);
    assert.match(html, new RegExp(`href="${escapeRegExp(preferences)}"`));
    assert.match(html, /Manage preferences/);
    assert.match(text, new RegExp(escapeRegExp(unsubscribe)));
    assert.match(text, new RegExp(escapeRegExp(preferences)));
  });

  it("omits mobile-app and web-app availability claims", () => {
    const { html, text } = welcome();
    const blob = `${html}\n${text}`.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      assert.equal(blob.includes(phrase), false, phrase);
    }
  });

  it("includes responsive viewport metadata and a mobile breakpoint", () => {
    const { html } = welcome();
    assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
    assert.match(html, /max-width:\s*620px/);
    assert.match(html, /\.cta-btn\s*\{[^}]*width:\s*100%/);
    assert.match(html, /x-apple-disable-message-reformatting/);
    assert.match(html, /PixelsPerInch>96/);
  });

  it("declares light and dark color schemes", () => {
    const { html } = welcome();
    assert.match(html, /name="color-scheme" content="light dark"/);
    assert.match(html, /name="supported-color-schemes" content="light dark"/);
    assert.match(html, /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)/);
    assert.match(html, /\.bg-page/);
    assert.match(html, /\.bg-card/);
    assert.match(html, /\.bg-hero/);
    assert.match(html, /\.text-body/);
    assert.match(html, /\.text-secondary/);
    assert.match(html, /\.bg-feature/);
    assert.match(html, /\.bg-footer/);
    assert.match(html, /\.link/);
  });

  it("does not set an automated From of jason@sitguru.com", () => {
    const { html, text } = welcome();
    const sendSource = sendEmailUpdatesWelcome.toString();
    assert.doesNotMatch(html, /jason@sitguru\.com/i);
    assert.doesNotMatch(text, /jason@sitguru\.com/i);
    assert.doesNotMatch(sendSource, /jason@sitguru\.com/i);
    assert.match(sendSource, /isMarketing:\s*true/);
    assert.match(sendSource, /marketingUnsubscribeHeadersForToken/);
    assert.match(html, /href="mailto:support@sitguru\.com"/);
    assert.match(text, /support@sitguru\.com/);
  });

  it("gives every image alt text, dimensions, and block display", () => {
    const { html } = welcome();
    const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
    assert.ok(images.length >= 4);
    for (const tag of images) {
      const alt = tag.match(/\balt="([^"]+)"/);
      assert.ok(alt?.[1]?.trim(), tag);
      assert.match(tag, /\bwidth="/);
      assert.match(tag, /\bheight="/);
      assert.match(tag, /display:\s*block/);
      assert.match(tag, /max-width:/);
    }
  });

  it("keeps the approved copy, CTA, and a useful plain-text version", () => {
    const { html, text } = welcome();
    assert.match(html, /Welcome to the SitGuru community — trusted pet care starts here\./);
    assert.match(html, /Hi Ava&lt;script&gt; — we’re so happy to have you here\./);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /Explore SitGuru/);
    assert.match(html, /href="https:\/\/www\.sitguru\.com\/"/);
    assert.match(html, /width="210"/);
    assert.match(text, /Welcome to the SitGuru community!/);
    assert.match(text, /Hi Ava<script> — we’re so happy to have you here\./);
    assert.match(text, /Explore SitGuru:\nhttps:\/\/www\.sitguru\.com\//);
    assert.match(text, /Woof and purrs,/);
    assert.match(text, /Trusted Pet Care\. Simplified\./);
  });
});
