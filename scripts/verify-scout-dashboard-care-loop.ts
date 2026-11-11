/**
 * Regression: Scout dashboard must not trap Trail Check / PawReport / profile
 * asks inside parent Dog Walking ZIP intake.
 */
import assert from "node:assert/strict";
import {
  buildCareMatchingAsk,
  joinRecentUserTexts,
  looksLikeGuruLogisticsQuery,
  needsCareMatchingAsk,
  parseCareMatchingIntake,
} from "../lib/chat/care-matching-intake";
import { resolveOfficerInstantFaqAnswer } from "../lib/ai/officer-marketing-faqs";

const TRAIL_CHECK =
  "Run a Trail Check: summarize my assigned walks and what needs attention for tracking the trail today.";
const PAWREPORT = "What is PawReport Live?";
const UPDATE_PROFILE = "How do I update my Guru profile?";
const LOOKING_WALKS = "Looking for Dog Walks";

function section(title: string) {
  console.log(`\n✓ ${title}`);
}

section("Logistics detector catches Scout dashboard chips");
assert.equal(looksLikeGuruLogisticsQuery(TRAIL_CHECK), true);
assert.equal(looksLikeGuruLogisticsQuery(PAWREPORT), true);
assert.equal(looksLikeGuruLogisticsQuery(UPDATE_PROFILE), true);
assert.equal(looksLikeGuruLogisticsQuery(LOOKING_WALKS), false);

section("Trail Check is not parent care-matching");
const trail = parseCareMatchingIntake(TRAIL_CHECK);
assert.equal(trail.service, "Dog Walking", "still detects walk service words");
assert.equal(trail.isCareSeeking, false);
assert.equal(needsCareMatchingAsk(TRAIL_CHECK), false);
assert.equal(buildCareMatchingAsk(TRAIL_CHECK), null);

section("Poisoned thread (Trail Check + later FAQs) stays out of ZIP loop");
const poisoned = joinRecentUserTexts(
  [
    { role: "user", content: TRAIL_CHECK },
    { role: "user", content: PAWREPORT },
    { role: "user", content: UPDATE_PROFILE },
  ],
  UPDATE_PROFILE,
);
assert.equal(needsCareMatchingAsk(poisoned), false);
assert.equal(buildCareMatchingAsk(poisoned), null);

section("Dashboard FAQs still resolve for PawReport + profile");
const pawFaq = resolveOfficerInstantFaqAnswer({
  officer: "scout",
  question: PAWREPORT,
  surface: "dashboard",
});
assert.ok(pawFaq && /PawReport Live/i.test(pawFaq));

const profileFaq = resolveOfficerInstantFaqAnswer({
  officer: "scout",
  question: UPDATE_PROFILE,
  surface: "dashboard",
});
assert.ok(profileFaq && /Update Guru Profile|guru\/dashboard\/profile/i.test(profileFaq));

section("Parent care pills still trigger matching ask");
assert.equal(needsCareMatchingAsk(LOOKING_WALKS), true);
const ask = buildCareMatchingAsk(LOOKING_WALKS);
assert.ok(ask && /Dog Walking|ZIP|city/i.test(ask));
assert.ok(ask && /matching_intake/i.test(ask));

console.log("\nAll Scout dashboard care-loop checks passed.\n");
