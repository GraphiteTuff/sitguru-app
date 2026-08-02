/**
 * Smoke checks for Rogue admin reporting routing helpers (no DB required).
 * Run: npx tsx scripts/smoke-rogue-admin-reporting.ts
 */

import {
  ALL_ADMIN_REPORT_MODULES,
  FINANCIAL_REPORT_MODULES,
  filterModulesForAccess,
  inferPeriodFromText,
  resolveModulesForQuery,
} from "../lib/actions/admin-reporting";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  assert(ALL_ADMIN_REPORT_MODULES.length === 33, "expected 33 modules");
  assert(FINANCIAL_REPORT_MODULES.length >= 12, "expected finance modules");

  assert(inferPeriodFromText("monthly MoM growth") === "monthly", "mom period");
  assert(inferPeriodFromText("weekly financials") === "weekly", "weekly period");
  assert(inferPeriodFromText("yearly tax overview") === "yearly", "yearly period");
  assert(inferPeriodFromText("how are payouts") === "daily", "default daily");

  const payouts = resolveModulesForQuery("how are payouts looking for Friday?");
  assert(payouts.includes("payouts"), "payouts route");
  assert(payouts.includes("dashboard"), "dashboard context");

  const audit = resolveModulesForQuery("who approved Guru #42?");
  assert(audit.includes("audit_trail") || audit.includes("gurus"), "audit/guru route");

  const growth = resolveModulesForQuery("what is our current month-over-month growth rate?");
  assert(
    growth.includes("analytics") || growth.includes("financial_overview"),
    "growth route",
  );

  const daily = resolveModulesForQuery("sync", "daily_sync");
  assert(daily.includes("bookings") && daily.includes("payouts"), "daily preset");

  const gated = filterModulesForAccess(
    ["dashboard", "payouts", "banking", "messages"],
    false,
  );
  assert(!gated.includes("payouts"), "finance gated");
  assert(!gated.includes("banking"), "banking gated");
  assert(gated.includes("dashboard") && gated.includes("messages"), "ops kept");

  const emptyGate = filterModulesForAccess(["payouts", "tax_center"], false);
  assert(emptyGate.length > 0, "fallback pulse");
  assert(!emptyGate.some((id) => FINANCIAL_REPORT_MODULES.includes(id)), "no finance fallback");

  console.log("rogue admin reporting smoke: ok");
}

main();
