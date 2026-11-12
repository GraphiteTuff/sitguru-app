/**
 * Offline / deterministic scorer for companion policy + session + routing.
 * Does NOT mark live browser cases as passed — only architecture gates.
 *
 * Usage: node scripts/companion-bank-offline-score.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// Use tsx-compatible dynamic import via child process instead — keep pure JS checks here.
const bank = JSON.parse(
  readFileSync("quality/sitguru-ai-companions-400-question-bank.json", "utf8"),
);

const SUPPORT = "support@sitguru.com";
const AMBASSADOR = "/programs/ambassadors/apply";
const PARENT = "/signup?role=pet_parent";

function lower(s) {
  return String(s || "").toLowerCase();
}

/** Heuristic expected-fail patterns the NEW code must never emit. */
function failsHardGuardrails(reply) {
  const t = lower(reply);
  if (!t) return "empty";
  if (
    /live teammate|pack coordinator is on the way|connecting you with a real sitguru teammate|teammate will take over/.test(
      t,
    )
  ) {
    return "fake_escalation";
  }
  if (/\$10\s*(to|–|-)\s*\$?20/.test(t) && /petperks|reward|ambassador/.test(t)) {
    return "petperks_10_20_claim";
  }
  if (/\b2\.99\b/.test(t) && /(fee|charge|marketplace)/.test(t) && !/not published|can't verify|cannot verify|do not/.test(t)) {
    return "fee_299_claim";
  }
  if (/pack@sitguru\.com/.test(t)) return "stale_pack_email";
  return null;
}

const results = [];
for (const q of bank.questions) {
  const expected = lower(q.expected);
  const row = {
    id: q.id,
    companion: q.companion,
    category: q.category,
    question: q.question,
    offline_gate: "pending_live",
    notes: [],
  };

  // Flag questions that are now policy/session deterministically answerable
  if (
    /background check|insurance|safety guarantee|2\.99|marketplace support|booking fee|\$10 to \$20|live teammate|talk to a human|are you (a )?(real )?person|support email/i.test(
      q.question,
    )
  ) {
    row.offline_gate = "policy_intercept_expected";
    row.notes.push("Covered by companion-response-policy");
  }
  if (
    /what (city|zip|service|name)|summar|start over|actually /i.test(q.question)
  ) {
    row.offline_gate = "session_state_expected";
    row.notes.push("Covered by session-state recall/correct");
  }
  if (q.companion === "taco" && /apply|sign.?up|join as an ambassador|application/i.test(q.question)) {
    row.offline_gate = "taco_canonical_link_expected";
    row.notes.push(`Must emit ${AMBASSADOR}`);
  }
  if (/pack@/.test(expected)) {
    row.notes.push(`Expected text still mentions pack@ — use ${SUPPORT} per discrepancy-report`);
  }

  results.push(row);
}

const summary = {
  total: results.length,
  byGate: results.reduce((acc, r) => {
    acc[r.offline_gate] = (acc[r.offline_gate] || 0) + 1;
    return acc;
  }, {}),
  hardGuardrailBanList: [
    "live teammate / Pack Coordinator takeover claims",
    "$10-$20 PetPerks",
    "unpublished $2.99 as current",
    "pack@sitguru.com",
  ],
  canonicals: { SUPPORT, AMBASSADOR, PARENT },
};

writeFileSync(
  "quality/offline-gate-map.json",
  JSON.stringify({ summary, results }, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
