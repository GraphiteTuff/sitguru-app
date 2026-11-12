/**
 * Batch API runner for the 400-question companion bank.
 * Maintains per-companion chat history for memory tests.
 * Auto-scores with heuristics; writes evidence JSONL + summary.
 *
 * Usage:
 *   node scripts/companion-400-batch-runner.mjs
 *   node scripts/companion-400-batch-runner.mjs --limit=40
 *   node scripts/companion-400-batch-runner.mjs --companions=rogue,scout
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const ORIGIN = process.env.SITGURU_PROBE_ORIGIN || "https://www.sitguru.com";
const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const companionsArg = args.find((a) => a.startsWith("--companions="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : 400;
const ONLY = companionsArg
  ? new Set(companionsArg.split("=")[1].split(","))
  : null;

const bank = JSON.parse(
  readFileSync("quality/sitguru-ai-companions-400-question-bank.json", "utf8"),
);

const SUPPORT = "support@sitguru.com";
const AMBASSADOR = "/programs/ambassadors/apply";

function extractTextFromDataStream(raw) {
  const chunks = [];
  for (const line of String(raw).split(/\n/)) {
    if (line.startsWith("0:")) {
      try {
        chunks.push(JSON.parse(line.slice(2)));
      } catch {
        chunks.push(line.slice(2));
      }
    }
  }
  if (chunks.length) return chunks.join("");
  try {
    const j = JSON.parse(raw);
    return j.reply || j.text || j.message || raw;
  } catch {
    return raw;
  }
}

function endpointFor(companion) {
  return companion === "rogue" ? "/api/chat/send" : "/api/ai/officer-stream";
}

function pagePathFor(companion) {
  if (companion === "scout") return "/become-a-guru";
  if (companion === "taco") return "/ambassadors";
  if (companion === "delilah") return "/events";
  return "/";
}

async function ask(companion, history, question) {
  const endpoint = endpointFor(companion);
  const messages = [...history, { role: "user", content: question }];
  const body =
    companion === "rogue"
      ? {
          messages,
          companion: "rogue",
          pagePath: "/",
          client_first_name: "Alex",
        }
      : {
          messages,
          officer: companion,
          surface: "public",
          pagePath: pagePathFor(companion),
        };

  const started = Date.now();
  const res = await fetch(`${ORIGIN}${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/plain, application/json",
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  const reply = extractTextFromDataStream(raw);
  return {
    status: res.status,
    ttfr_ms: Date.now() - started,
    reply,
    messages: [...messages, { role: "assistant", content: reply }],
  };
}

function score(q, reply) {
  const r = String(reply || "");
  const rl = r.toLowerCase();
  const exp = String(q.expected || "").toLowerCase();
  const failures = [];

  if (!r.trim()) failures.push("empty");
  // Affirmative fake handoff only — honest "can't confirm a live teammate" is OK.
  if (
    /(i (sent|passed|forwarded) it to a live teammate|sent it to a live teammate|pack coordinator is on the way|connecting you with a real sitguru teammate|teammate will take over shortly|they'll pick it up in chat)/.test(
      rl,
    ) &&
    !/can('|no)?t confirm|cannot confirm|never claim|not (a |an )?(real )?teammate|no live teammate was/.test(
      rl,
    )
  ) {
    failures.push("fake_escalation");
  }
  if (
    q.companion === "rogue" &&
    /how do i|what (is|are)|do i need|payment|become a guru|sign up|account/i.test(
      q.question,
    ) &&
    /\[\[\s*matching_intake\s*\]\]/i.test(r) &&
    !/\b\d{5}\b|near me|i need (dog|pet|care|a walker|a sitter)/i.test(q.question)
  ) {
    failures.push("sticky_intake");
  }
  if (/pack@sitguru\.com/.test(rl)) failures.push("stale_pack_email");
  if (
    /\$10\s*(to|–|-)\s*\$?20/.test(rl) &&
    /petperks|reward/.test(rl) &&
    !/can't verify|cannot verify|not (a |an )?(published|general)/.test(rl)
  ) {
    failures.push("petperks_10_20_claim");
  }
  if (/\b2\.99\b/.test(rl) && /(fee|charge)/.test(rl) && !/not published|can't verify|do not|don't/.test(rl)) {
    failures.push("fee_299_claim");
  }

  // Sticky intake loop on standalone Scout FAQs
  if (
    q.companion === "scout" &&
    /free to apply|my rates|payout|rover|academy/i.test(q.question) &&
    /city and state|zip where you need care|for \*\*.*\*\*, i'm on it/i.test(rl)
  ) {
    failures.push("sticky_intake");
  }

  // Taco canonical apply link
  if (
    q.companion === "taco" &&
    /apply|sign.?up|join as an ambassador|application link/i.test(q.question) &&
    !/business|rescue|eligible|rejected/i.test(q.question)
  ) {
    if (!r.includes(AMBASSADOR) && !/\[\[\s*cta:ambassador\s*\]\]/i.test(r)) {
      failures.push("wrong_ambassador_link");
    }
  }

  // Support email when expected mentions contact/support
  if (/support@|contact|human|pack@/.test(exp) && /support|contact|human/.test(q.question.toLowerCase())) {
    if (!rl.includes(SUPPORT) && !rl.includes("/contact")) {
      // soft — don't always fail
    }
  }

  // Expected negation: "not published" / "do not invent"
  if (/not published|do not invent|do not claim|say so|can't verify|cannot verify/.test(exp)) {
    if (
      /yes[,.]?\s+(gurus|sitguru|we)|we (guarantee|provide) (insurance|background)|fee is \$2\.99|starts on/.test(
        rl,
      )
    ) {
      failures.push("hallucination_vs_unpublished");
    }
  }

  // Geography Manayunk
  if (/manayunk/i.test(q.question) && /58\s*mi|montgomery county/i.test(rl) && !/philadelphia/i.test(rl)) {
    failures.push("wrong_geography");
  }

  // Harrisburg empty
  if (/17101|harrisburg/i.test(q.question) && /find|walker|sitter|guru/i.test(q.question)) {
    if (/\b[1-9]\d*\s+gurus?\b/i.test(rl) && !/\b0\s+gurus?\b/i.test(rl)) {
      // soft — live inventory may change; only fail if inventing a named local guru
    }
    if (/amanda costello|sofia martinez|george medina/i.test(rl) && /harrisburg|17101/i.test(rl)) {
      failures.push("invented_harrisburg_guru");
    }
  }

  const pass = failures.length === 0 && r.trim().length > 0;
  return { pass, failures };
}

mkdirSync("quality/evidence", { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const evidencePath = `quality/evidence/run-${stamp}.jsonl`;
const summaryPath = `quality/evidence/summary-${stamp}.json`;

const histories = { rogue: [], scout: [], taco: [], delilah: [] };
const tallies = {
  rogue: { tested: 0, passed: 0, failed: 0 },
  scout: { tested: 0, passed: 0, failed: 0 },
  taco: { tested: 0, passed: 0, failed: 0 },
  delilah: { tested: 0, passed: 0, failed: 0 },
};
const failedIds = [];
let evidence = "";

let questions = bank.questions;
if (ONLY) questions = questions.filter((q) => ONLY.has(q.companion));
questions = questions.slice(0, LIMIT);

console.log(`Running ${questions.length} questions against ${ORIGIN}`);

for (const q of questions) {
  // Reset history every 20 questions per companion (batch size from runbook)
  if (tallies[q.companion].tested > 0 && tallies[q.companion].tested % 20 === 0) {
    histories[q.companion] = [];
    console.log(`-- new ${q.companion} batch session --`);
  }

  let result;
  try {
    result = await ask(q.companion, histories[q.companion], q.question);
    histories[q.companion] = result.messages.slice(-12); // bounded memory window
  } catch (error) {
    result = {
      status: 0,
      ttfr_ms: 0,
      reply: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const scored = score(q, result.reply || "");
  if (result.status >= 400 || result.error) {
    scored.pass = false;
    scored.failures.push(result.error || `http_${result.status}`);
  }

  tallies[q.companion].tested += 1;
  if (scored.pass) tallies[q.companion].passed += 1;
  else {
    tallies[q.companion].failed += 1;
    failedIds.push(q.id);
  }

  const row = {
    id: q.id,
    companion: q.companion,
    category: q.category,
    question: q.question,
    expected: q.expected,
    build_sha_hint: "live-origin",
    environment: ORIGIN,
    timestamp: new Date().toISOString(),
    reply: (result.reply || "").slice(0, 2000),
    ttfr_ms: result.ttfr_ms,
    pass: scored.pass,
    failure_types: scored.failures,
    status: result.status,
  };
  evidence += JSON.stringify(row) + "\n";
  writeFileSync(evidencePath, evidence);

  const mark = scored.pass ? "PASS" : "FAIL";
  console.log(
    `${mark} ${q.id} ${result.ttfr_ms || 0}ms ${scored.failures.join(",") || "ok"}`,
  );
  if (!scored.pass) {
    console.log("  ", (result.reply || "").slice(0, 160).replace(/\s+/g, " "));
  }

  // Gentle pacing so we don't stampede production
  await sleep(150);
}

const summary = {
  origin: ORIGIN,
  limit: LIMIT,
  timestamp: new Date().toISOString(),
  tallies,
  totals: {
    tested: Object.values(tallies).reduce((a, b) => a + b.tested, 0),
    passed: Object.values(tallies).reduce((a, b) => a + b.passed, 0),
    failed: Object.values(tallies).reduce((a, b) => a + b.failed, 0),
  },
  failedIds,
  evidencePath,
  gates: {
    rogue: tallies.rogue.passed >= 85,
    scout: tallies.scout.passed >= 80,
    taco: tallies.taco.passed >= 80,
    delilah: tallies.delilah.passed >= 80,
    zero_fake_escalation_note:
      "Inspect evidence for failure_types containing fake_escalation",
  },
};
summary.totals.failed = Object.values(tallies).reduce((a, b) => a + b.failed, 0);

writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log("\n=== SUMMARY ===");
console.log(JSON.stringify(summary.tallies, null, 2));
console.log(`Evidence: ${evidencePath}`);
console.log(`Summary: ${summaryPath}`);
