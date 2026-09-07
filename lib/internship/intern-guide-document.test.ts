import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  internGuideBlocks,
  internGuideParts,
  internGuidePortalHtml,
  internGuideSourceHtml,
  internGuideWordBuffer,
} from "./intern-guide-document";
import {
  INTERN_GUIDE_CONFIDENTIALITY,
  INTERN_GUIDE_PRINT_PATH,
  INTERN_GUIDE_WORD_HREF,
} from "./intern-help";
import { internPortalDestination } from "./intern-growth";
import { INTERNSHIP_ONBOARDING_PATH } from "./onboarding";

describe("intern student user guide downloads", () => {
  it("rewrites screenshot paths to intern Help media", async () => {
    const html = internGuidePortalHtml(await internGuideSourceHtml());
    assert.match(html, /\/intern\/help\/media\/assets\/syllabus-cover\.jpg/);
    assert.match(html, /Spring 2027 Internship User Guide cover/);
    assert.doesNotMatch(html, /syllabus cover/i);
    assert.match(html, /\/intern\/help\/media\/screenshots\/26-onboarding\.png/);
    assert.doesNotMatch(html, /\bsrc="screenshots\//);
    assert.match(html, /@bottom-center/);
    assert.match(html, /Proprietary and confidential/);
    assert.ok(html.includes(INTERN_GUIDE_CONFIDENTIALITY));
  });

  it("puts the confidentiality disclaimer in HTML source and the Word page footer", async () => {
    const html = await internGuideSourceHtml();
    assert.ok(html.includes(INTERN_GUIDE_CONFIDENTIALITY));
    assert.match(html, /@bottom-center/);
    assert.match(html, /class="guide-confidentiality"/);
    const docx = await internGuideWordBuffer();
    const wordXml = docx.toString("utf8");
    assert.match(wordXml, /w:footerReference/);
    assert.match(wordXml, /word\/footer1\.xml/);
    assert.match(wordXml, /Proprietary and confidential/);
    assert.ok(wordXml.includes("belongs solely to SitGuru"));
    const { body } = internGuideParts(html);
    const text = internGuideBlocks(body)
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n");
    assert.doesNotMatch(text, /Proprietary and confidential/);
  });

  it("parses headings, steps, and screenshots from the illustrated guide", async () => {
    const { body } = internGuideParts(await internGuideSourceHtml());
    const blocks = internGuideBlocks(body);
    assert.ok(blocks.some((block) => block.type === "h1"));
    assert.ok(
      blocks.some(
        (block) => block.type === "h2" && "text" in block && /Onboarding/.test(block.text),
      ),
    );
    assert.ok(blocks.some((block) => block.type === "image" && block.src.endsWith(".png")));
    assert.ok(!blocks.some((block) => "text" in block && /Save as PDF/.test(block.text)));
  });

  it("builds a Word document with the guide text and screenshots", async () => {
    const source = await internGuideSourceHtml();
    const { body } = internGuideParts(source);
    const text = internGuideBlocks(body)
      .map((block) => ("text" in block ? block.text : block.alt))
      .join("\n");
    const docx = await internGuideWordBuffer();
    assert.equal(docx.subarray(0, 2).toString(), "PK");
    assert.match(docx.toString("utf8"), /Intern Portal Student User Guide/);
    assert.match(docx.toString("utf8"), /word\/media\/image1/);
    assert.match(text, /intern agreement/);
    assert.match(text, /Market Analysis/);
    assert.match(text, /sitguru\.com\/events/);
    assert.match(text, /PawReport/);
    assert.match(text, /Trusted Local Pet Care/);
    assert.match(text, /Starting Point/);
    assert.match(text, /week 15/);
    assert.match(text, /student user guide/i);
    assert.doesNotMatch(text, /\bRover\b/i);
    assert.doesNotMatch(text, /\bWag\b/i);
    assert.doesNotMatch(text, /last 4 digits of your SSN/i);
  });

  it("keeps print and Word downloads inside intern Help during onboarding", () => {
    assert.equal(INTERN_GUIDE_PRINT_PATH, "/intern/help/print");
    assert.equal(INTERN_GUIDE_WORD_HREF, "/intern/help/export?format=word");
    assert.equal(internPortalDestination(INTERN_GUIDE_PRINT_PATH, false), INTERN_GUIDE_PRINT_PATH);
    assert.equal(
      internPortalDestination("/intern/help/export?format=word", false),
      "/intern/help/export?format=word",
    );
    assert.equal(internPortalDestination("/intern/growth", false), INTERNSHIP_ONBOARDING_PATH);
  });
});
