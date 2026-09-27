/**
 * Audit realistic customer / Guru / Ambassador / events questions against
 * companion FAQ + soft-intent + care-matching resolvers.
 *
 * Run: npx tsx scripts/audit-companion-questions.ts
 */

import assert from "node:assert/strict";
import {
  matchRoguePublicSoftIntent,
  resolveOfficerInstantFaqAnswer,
  ROGUE_PUBLIC_MARKETING_FAQS,
  SCOUT_PUBLIC_MARKETING_FAQS,
  SCOUT_DASHBOARD_FAQS,
  TACO_PUBLIC_MARKETING_FAQS,
  TACO_DASHBOARD_FAQS,
  matchMarketingFaq,
} from "../lib/ai/officer-marketing-faqs";
import { resolveDelilahInstantFaqAnswer } from "../lib/ai/community-events-faqs";
import { resolveCompanionGrowthFaqAnswer } from "../lib/ai/companion-growth-faqs";
import {
  buildCareMatchingAsk,
  parseCareMatchingIntake,
} from "../lib/chat/care-matching-intake";
import { inferLookupParamsFromChat } from "../lib/gurus/guru-chat-snapshot";
import {
  allowsParentSignupCta,
  allowsGuruSignupCta,
  allowsAmbassadorSignupCta,
  stripDisallowedCompanionCtas,
  type CompanionViewerContext,
} from "../lib/chat/companion-auth";

type CaseResult = {
  role: string;
  question: string;
  ok: boolean;
  detail: string;
  answer?: string;
};

const failures: CaseResult[] = [];
const passes: CaseResult[] = [];

function record(result: CaseResult) {
  if (result.ok) passes.push(result);
  else failures.push(result);
}

function expectAnswer(
  role: string,
  question: string,
  answer: string | null | undefined,
  opts?: { mustInclude?: RegExp[]; mustNotInclude?: RegExp[] },
) {
  if (!answer || !String(answer).trim()) {
    record({
      role,
      question,
      ok: false,
      detail: "NO_ANSWER",
    });
    return;
  }
  for (const re of opts?.mustInclude || []) {
    if (!re.test(answer)) {
      record({
        role,
        question,
        ok: false,
        detail: `MISSING_PATTERN ${re}`,
        answer,
      });
      return;
    }
  }
  for (const re of opts?.mustNotInclude || []) {
    if (re.test(answer)) {
      record({
        role,
        question,
        ok: false,
        detail: `FORBIDDEN_PATTERN ${re}`,
        answer,
      });
      return;
    }
  }
  record({ role, question, ok: true, detail: "ok", answer });
}

function rogueAnswer(question: string) {
  return (
    matchMarketingFaq(ROGUE_PUBLIC_MARKETING_FAQS, question)?.answer ||
    matchRoguePublicSoftIntent(question)?.answer ||
    resolveCompanionGrowthFaqAnswer("rogue", question) ||
    null
  );
}

function scoutPublic(question: string) {
  return resolveOfficerInstantFaqAnswer({
    officer: "scout",
    question,
    surface: "public",
  });
}

function scoutDash(question: string) {
  return (
    matchMarketingFaq(SCOUT_DASHBOARD_FAQS, question)?.answer ||
    resolveOfficerInstantFaqAnswer({
      officer: "scout",
      question,
      surface: "dashboard",
    })
  );
}

function tacoPublic(question: string) {
  return resolveOfficerInstantFaqAnswer({
    officer: "taco",
    question,
    surface: "public",
  });
}

function tacoDash(question: string) {
  return (
    matchMarketingFaq(TACO_DASHBOARD_FAQS, question)?.answer ||
    resolveOfficerInstantFaqAnswer({
      officer: "taco",
      question,
      surface: "dashboard",
    })
  );
}

/** ——— Pet Parent / Rogue ——— */
const ROGUE_QUESTIONS: Array<{
  q: string;
  mustInclude?: RegExp[];
  mustNotInclude?: RegExp[];
}> = [
  { q: "How do I find a Guru?", mustInclude: [/search|Guru/i] },
  { q: "how do i find a pet sitter near me", mustInclude: [/Guru|search/i] },
  { q: "How do bookings work?", mustInclude: [/book/i] },
  { q: "is SitGuru free for pet parents?", mustInclude: [/free/i] },
  { q: "What is PawReport Live?", mustInclude: [/PawReport|update/i] },
  { q: "how do pawperks work?", mustInclude: [/PawPerks|pts|points/i] },
  { q: "are gurus vetted?", mustInclude: [/safe|vet|trust/i] },
  { q: "can I message my guru?", mustInclude: [/message/i] },
  { q: "what services can I book?", mustInclude: [/drop-?in|walk/i] },
  { q: "will I pay sales tax?", mustInclude: [/tax/i] },
  { q: "how do I rebook my favorite guru?", mustInclude: [/rebook|favorite|book again/i] },
  { q: "where can I follow SitGuru?", mustInclude: [/SitGuruOfficial|cta:social/i] },
  { q: "how do I get email updates?", mustInclude: [/cta:email|subscribe|email/i] },
  { q: "why should I join SitGuru?", mustInclude: [/join|Guru|cta:parent/i] },
  { q: "what is SitGuru?", mustInclude: [/Guru|booking|PawReport/i] },
  { q: "do you have overnight pet sitting?", mustInclude: [/overnight|house sit|service|book/i] },
  { q: "is there dog walking?", mustInclude: [/walk|service|book/i] },
  { q: "how do I cancel a booking?", mustInclude: [/cancel|booking/i] },
  { q: "can I tip my guru?", mustInclude: [/tip/i] },
  { q: "do gurus do background checks?", mustInclude: [/trust|background|check/i] },
  { q: "how much does a dog walk cost?", mustInclude: [/rate|Guru|own/i] },
];

/** ——— Guru / Scout public ——— */
const SCOUT_PUBLIC_QUESTIONS: Array<{
  q: string;
  mustInclude?: RegExp[];
}> = [
  { q: "Is it free to apply?", mustInclude: [/free/i] },
  { q: "how much does it cost to become a guru?", mustInclude: [/free/i] },
  { q: "What services can I offer?", mustInclude: [/walk|sit|service/i] },
  { q: "Can I set my own rates?", mustInclude: [/rate/i] },
  { q: "How do payments and payouts work?", mustInclude: [/payout|pay|Stripe|PayPal/i] },
  { q: "when do I get paid?", mustInclude: [/pay|payout/i] },
  { q: "Can I choose my schedule and service area?", mustInclude: [/schedule|area|avail/i] },
  { q: "What happens after I apply?", mustInclude: [/apply|profile|bookable|next/i] },
  { q: "How do I start my free Guru profile?", mustInclude: [/profile|Guru|cta:guru|become/i] },
  { q: "What is Guru Academy?", mustInclude: [/Academy|certif/i] },
  { q: "How do Pet Parents find me?", mustInclude: [/Pet Parent|search|profile/i] },
  { q: "Do I need professional pet care experience?", mustInclude: [/experience|need|not required|help/i] },
  { q: "Does SitGuru collect sales tax for me?", mustInclude: [/tax/i] },
  { q: "tell me about guru benefits", mustInclude: [/Guru|cta:guru|benefit/i] },
  { q: "do I need insurance?", mustInclude: [/insurance|trust|bookable/i] },
  { q: "how long does approval take?", mustInclude: [/approv|bookable|profile|trust/i] },
  { q: "can I work in multiple cities?", mustInclude: [/service area|neighborhood|city|cover/i] },
];

/** ——— Guru dashboard ——— */
const SCOUT_DASH_QUESTIONS: Array<{ q: string; mustInclude?: RegExp[] }> = [
  { q: "How do I update my Guru profile?", mustInclude: [/profile|update/i] },
  { q: "Where do I see my bookings?", mustInclude: [/booking|dashboard|schedule/i] },
  { q: "How do I set availability?", mustInclude: [/avail|schedule/i] },
  { q: "What is PawReport Live?", mustInclude: [/PawReport/i] },
  { q: "How do I get paid as a Guru?", mustInclude: [/pay|payout|Stripe|PayPal/i] },
];

/** ——— Ambassador / Taco ——— */
const TACO_PUBLIC_QUESTIONS: Array<{ q: string; mustInclude?: RegExp[] }> = [
  { q: "What do Ambassadors do?", mustInclude: [/Ambassador|refer/i] },
  { q: "Who can become a SitGuru Ambassador?", mustInclude: [/Ambassador|join|apply/i] },
  { q: "Do I need a huge social following?", mustInclude: [/follow|social|need/i] },
  { q: "Is this the same as becoming a Guru?", mustInclude: [/Guru|Ambassador|different|not the same/i] },
  { q: "Are earnings or rewards guaranteed?", mustInclude: [/not guaranteed|guaranteed|terms/i] },
  { q: "How do I become a SitGuru Ambassador?", mustInclude: [/apply|Ambassador|cta:ambassador/i] },
  { q: "How do I get my referral link and QR code?", mustInclude: [/referral|QR|link/i] },
  { q: "What is PetPerks for Ambassadors?", mustInclude: [/PetPerks|reward/i] },
  { q: "What metrics can I track as an Ambassador?", mustInclude: [/metric|dashboard|track|click|refer/i] },
  { q: "is there a student ambassador program?", mustInclude: [/student|Ambassador|apply/i] },
  { q: "how much can I earn as an ambassador?", mustInclude: [/reward|PetPerks|guaranteed|terms/i] },
];

const TACO_DASH_QUESTIONS: Array<{ q: string; mustInclude?: RegExp[] }> = [
  { q: "How do I share my referral link?", mustInclude: [/referral|share|link/i] },
  { q: "How do PetPerks rewards work for me?", mustInclude: [/PetPerks|reward/i] },
  { q: "Where do I see my referrals?", mustInclude: [/referral|dashboard/i] },
];

/** ——— Delilah / events ——— */
const DELILAH_QUESTIONS: Array<{ q: string; mustInclude?: RegExp[] }> = [
  { q: "what pet events are coming up?", mustInclude: [/event/i] },
  { q: "what's happening near me?", mustInclude: [/event/i] },
  { q: "how do I host an event?", mustInclude: [/host|publish|event|planner/i] },
  { q: "how do I edit my event listing?", mustInclude: [/edit|manage|event/i] },
  { q: "how do I cancel an event?", mustInclude: [/cancel/i] },
  { q: "how do I promote my partner event?", mustInclude: [/share|promot|graphic|QR|event/i] },
  { q: "where is the pet event manager?", mustInclude: [/event|manager|host/i] },
  { q: "difference between partner event and pet event", mustInclude: [/partner|event/i] },
  { q: "how do I RSVP to an event?", mustInclude: [/Yes|Maybe|No|RSVP|Attending/i] },
  { q: "are dogs allowed at events?", mustInclude: [/pet friendly|Pet Friendly|dog|listing/i] },
];

/** ——— Care matching (location + time) ——— */
const MATCHING_CASES: Array<{
  thread: string;
  expectCity?: string;
  expectState?: string;
  expectZip?: string;
  expectNext?: string;
  askMustInclude?: RegExp;
  askMustNotInclude?: RegExp;
}> = [
  {
    thread: "Looking for Drop-in Visits",
    expectNext: "location",
    askMustInclude: /city and state|ZIP/i,
    askMustNotInclude: /Hey\s+\w+/i,
  },
  {
    thread: "Drop-ins near Arlington Va",
    expectCity: "Arlington",
    expectState: "VA",
    expectNext: "time",
    askMustInclude: /Arlington,\s*VA/i,
    askMustNotInclude: /Hey\s+\w+/i,
  },
  {
    thread: "Where are drop inns near new york, ny?",
    expectCity: "New York",
    expectState: "NY",
    expectNext: "time",
    askMustInclude: /New York,\s*NY/i,
  },
  {
    thread: "drop inns near boston ma\nWhere are drop inns near new york, ny?",
    expectCity: "New York",
    expectState: "NY",
    expectNext: "time",
    askMustInclude: /New York,\s*NY/i,
    askMustNotInclude: /Boston/i,
  },
  {
    thread: "90001\nWhere are drop inns near new york, ny?",
    expectCity: "New York",
    expectState: "NY",
    expectNext: "time",
    askMustInclude: /New York,\s*NY/i,
    askMustNotInclude: /90001/,
  },
  {
    thread: "Drop-ins near Arlington Va\nI need care in the Morning",
    expectCity: "Arlington",
    expectState: "VA",
    expectNext: "ready",
  },
  {
    thread: "pet sitter near Austin TX",
    expectCity: "Austin",
    expectState: "TX",
    expectNext: "time",
  },
  {
    thread: "dog walk in Philadelphia Pennsylvania",
    expectCity: "Philadelphia",
    expectState: "PA",
    expectNext: "time",
  },
  {
    thread: "drop in 19103",
    expectZip: "19103",
    expectNext: "time",
  },
  {
    thread: "I need a dog walker\nquakertown pa",
    expectCity: "Quakertown",
    expectState: "PA",
    expectNext: "time",
    askMustInclude: /Quakertown,\s*PA/i,
    askMustNotInclude: /Hey\s+Quakertown/i,
  },
  {
    thread: "I need a dog walker\nquakertown pa\ndog walker",
    expectCity: "Quakertown",
    expectState: "PA",
    expectNext: "time",
    askMustInclude: /Quakertown,\s*PA/i,
    askMustNotInclude: /Dog Walker Quakertown|city and state|ZIP/i,
  },
  {
    thread: "dog walking Quakertown PA",
    expectCity: "Quakertown",
    expectState: "PA",
    expectNext: "time",
  },
  {
    thread: "need walks in austin, texas",
    expectCity: "Austin",
    expectState: "TX",
    expectNext: "time",
  },
  {
    thread: "looking for a sitter in brooklyn new york",
    expectCity: "Brooklyn",
    expectState: "NY",
    expectNext: "time",
  },
  {
    thread: "board my dog in denver, co",
    expectCity: "Denver",
    expectState: "CO",
    expectNext: "time",
  },
  {
    thread: "daycare phoenix az",
    expectCity: "Phoenix",
    expectState: "AZ",
    expectNext: "time",
  },
  {
    thread: "drop inns near st. louis mo",
    expectCity: "St Louis",
    expectState: "MO",
    expectNext: "time",
  },
  {
    thread: "Looking for Dog Walks\nLos Angeles, California",
    expectCity: "Los Angeles",
    expectState: "CA",
    expectNext: "time",
  },
  {
    thread: "I need a pet sitter\n18951",
    expectZip: "18951",
    expectNext: "time",
  },
  {
    thread: "dog walker\nLA",
    expectCity: "Los Angeles",
    expectState: "CA",
    expectNext: "time",
    askMustInclude: /Los Angeles,\s*CA/i,
  },
  {
    thread: "Looking for Dog Walks\nNYC",
    expectCity: "New York",
    expectState: "NY",
    expectNext: "time",
    askMustInclude: /New York,\s*NY/i,
  },
  {
    thread: "drop-ins near Philly",
    expectCity: "Philadelphia",
    expectState: "PA",
    expectNext: "time",
  },
  {
    thread: "pet sitter in SF",
    expectCity: "San Francisco",
    expectState: "CA",
    expectNext: "time",
  },
  {
    thread: "dog walks\nTrenton NJ",
    expectCity: "Trenton",
    expectState: "NJ",
    expectNext: "time",
    askMustInclude: /Trenton,\s*NJ/i,
  },
  {
    thread: "I need a dog walker\nLA CA",
    expectCity: "Los Angeles",
    expectState: "CA",
    expectNext: "time",
  },
  {
    thread: "board my dog\nSD CA",
    expectCity: "San Diego",
    expectState: "CA",
    expectNext: "time",
  },
  {
    thread: "I need a dog walker\nPA",
    expectState: "PA",
    expectNext: "time",
    askMustInclude: /\bPA\b/,
    askMustNotInclude: /city and state|ZIP/i,
  },
  {
    thread: "I need a dog walker\nNJ",
    expectState: "NJ",
    expectNext: "time",
    askMustInclude: /\bNJ\b/,
  },
];

/** ——— Auth CTA stripping ——— */
function testAuthCtas() {
  const parent: CompanionViewerContext = {
    isAuthenticated: true,
    firstName: "Jason",
    roles: ["Pet Parent"],
  };
  const guru: CompanionViewerContext = {
    isAuthenticated: true,
    firstName: "Alex",
    roles: ["Guru"],
  };
  const guest: CompanionViewerContext = {
    isAuthenticated: false,
    firstName: null,
    roles: ["Guest Pet Parent"],
  };

  assert.equal(allowsParentSignupCta(parent), false);
  assert.equal(allowsGuruSignupCta(guru), false);
  assert.equal(allowsAmbassadorSignupCta(guest), true);

  const stripped = stripDisallowedCompanionCtas(
    "Join free [[cta:parent]] [[cta:guru]] [[cta:social]]",
    parent,
  );
  assert.equal(/cta:parent/i.test(stripped), false);
  assert.equal(/cta:guru/i.test(stripped), true);
  assert.equal(/cta:social/i.test(stripped), true);

  record({
    role: "auth",
    question: "CTA strip for logged-in Pet Parent",
    ok: true,
    detail: "ok",
  });
}

console.log("Auditing companion question coverage...\n");

for (const item of ROGUE_QUESTIONS) {
  expectAnswer("rogue", item.q, rogueAnswer(item.q), item);
}
for (const item of SCOUT_PUBLIC_QUESTIONS) {
  expectAnswer("scout-public", item.q, scoutPublic(item.q), item);
}
for (const item of SCOUT_DASH_QUESTIONS) {
  expectAnswer("scout-dash", item.q, scoutDash(item.q), item);
}
for (const item of TACO_PUBLIC_QUESTIONS) {
  expectAnswer("taco-public", item.q, tacoPublic(item.q), item);
}
for (const item of TACO_DASH_QUESTIONS) {
  expectAnswer("taco-dash", item.q, tacoDash(item.q), item);
}
for (const item of DELILAH_QUESTIONS) {
  expectAnswer("delilah", item.q, resolveDelilahInstantFaqAnswer(item.q), item);
}

for (const item of MATCHING_CASES) {
  const intake = parseCareMatchingIntake(item.thread);
  const inferred = inferLookupParamsFromChat(item.thread);
  const ask = buildCareMatchingAsk(item.thread);
  let ok = true;
  const notes: string[] = [];

  if (item.expectCity && intake.city !== item.expectCity) {
    ok = false;
    notes.push(`city=${intake.city} want ${item.expectCity}`);
  }
  if (item.expectState && intake.state !== item.expectState) {
    ok = false;
    notes.push(`state=${intake.state} want ${item.expectState}`);
  }
  if (item.expectZip && intake.zip !== item.expectZip) {
    ok = false;
    notes.push(`zip=${intake.zip} want ${item.expectZip}`);
  }
  if (item.expectNext && intake.nextStep !== item.expectNext) {
    ok = false;
    notes.push(`next=${intake.nextStep} want ${item.expectNext}`);
  }
  if (item.expectNext === "ready" && ask !== null) {
    ok = false;
    notes.push(`expected null ask, got ${ask}`);
  }
  if (item.expectNext && item.expectNext !== "ready" && !ask) {
    ok = false;
    notes.push("expected ask text");
  }
  if (ask && item.askMustInclude && !item.askMustInclude.test(ask)) {
    ok = false;
    notes.push(`ask missing ${item.askMustInclude}`);
  }
  if (ask && item.askMustNotInclude && item.askMustNotInclude.test(ask)) {
    ok = false;
    notes.push(`ask has forbidden ${item.askMustNotInclude}`);
  }
  // Sanity: inferred city should agree when we expect one
  if (item.expectCity && inferred?.city && inferred.city !== item.expectCity) {
    ok = false;
    notes.push(`infer city=${inferred.city}`);
  }

  record({
    role: "matching",
    question: item.thread.replace(/\n/g, " | "),
    ok,
    detail: ok ? "ok" : notes.join("; "),
    answer: ask || undefined,
  });
}

try {
  testAuthCtas();
} catch (error) {
  record({
    role: "auth",
    question: "CTA strip assertions",
    ok: false,
    detail: error instanceof Error ? error.message : String(error),
  });
}

console.log(`PASS ${passes.length}`);
console.log(`FAIL ${failures.length}`);
if (failures.length) {
  console.log("\n--- FAILURES ---");
  for (const fail of failures) {
    console.log(`[${fail.role}] ${fail.question}`);
    console.log(`  → ${fail.detail}`);
    if (fail.answer) console.log(`  answer: ${fail.answer.slice(0, 160)}`);
  }
  process.exitCode = 1;
} else {
  console.log("\nAll companion question audits passed.");
}
