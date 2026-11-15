import test from "node:test";
import assert from "node:assert/strict";
import { paymentPeriodContaining, biweeklyPeriodContaining, weekBoundsContaining } from "./periods";

test("weekly contractor periods follow the configured anchor", () => {
  assert.deepEqual(paymentPeriodContaining("2026-11-15", "2026-11-15", "weekly"), {
    start: "2026-11-15", end: "2026-11-21",
  });
  assert.deepEqual(paymentPeriodContaining("2026-11-22", "2026-11-15", "weekly"), {
    start: "2026-11-22", end: "2026-11-28",
  });
});

test("older biweekly contractor periods remain backward compatible", () => {
  assert.deepEqual(paymentPeriodContaining("2026-11-14", "2026-11-01", "biweekly"), {
    start: "2026-11-01", end: "2026-11-14",
  });
  assert.deepEqual(biweeklyPeriodContaining("2026-11-14", "2026-11-01"), {
    start: "2026-11-01", end: "2026-11-14",
  });
});

test("weekly reporting remains Monday through Sunday", () => {
  assert.deepEqual(weekBoundsContaining("2026-11-15"), {
    start: "2026-11-09", end: "2026-11-15",
  });
});
