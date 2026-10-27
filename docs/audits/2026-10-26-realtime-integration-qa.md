# Real-Time Integration — SitGuru QA Report

**Date:** October 26, 2026 (America/New_York)  
**Updated:** October 26, 2026 (America/New_York) — production release  
**Merged to:** `sitguru-main` via PR #178 stack (Growth Workspace + Realtime + Manager Time/Payments)  
**Principle:** One action → one authoritative update → all relevant authorized views refresh automatically.

---

## Release Decision

Jason approved production deployment prior to completion of the full multi-user acceptance matrix.

## Production Release Status

**Deployed / Verified** — Vercel Production SUCCESS for `e292b847` on `sitguru-main`.

## Multi-User Acceptance

**POST-PRODUCTION VALIDATION PENDING**

| Scenario | Status |
|----------|--------|
| A — Ava Time → Jason Approval | POST-PRODUCTION VALIDATION PENDING |
| B — Business ACH Mark Paid | POST-PRODUCTION VALIDATION PENDING |
| C — Ryan Hours | POST-PRODUCTION VALIDATION PENDING |
| D — Weekly Check-In | POST-PRODUCTION VALIDATION PENDING |
| E — Assignment Sync | POST-PRODUCTION VALIDATION PENDING |
| F — View-As Live | POST-PRODUCTION VALIDATION PENDING |
| G — Cross-Platform | POST-PRODUCTION VALIDATION PENDING |

Do **not** rewrite these as PASS until actually validated in production/use.

---

## 1. Architecture

| Mechanism | Status |
|-----------|--------|
| Supabase Realtime `postgres_changes` | Production (Messaging, notifications, Guru live, etc.) |
| SSE + walk event bus | Production (PawReport) |
| `sitguru_live_signals` | **Production** — authorized workspace sync bus |
| Second realtime framework | **Not introduced** |

---

## 2. Staff Time / Payment publishers

| Event | Publisher |
|-------|-----------|
| `time.entry.created` / `time.entry.updated` | Timekeeper actions |
| `time.period.submitted` / `returned` / `approved` | Payment period workflow |
| `payment.ready` / `payment.paid` | Approve / Mark Paid |
| `compensation.rate.updated` | Effective-dated rate change |

Client: `WorkspaceLiveSyncMount` + `useRealtimeSubscription` + refresh-on-focus fallback.

---

## 3. Cache invalidation

Authoritative write → `revalidatePath` (staff time paths) → idempotent `sitguru_live_signals` upsert → client debounce `router.refresh()` → focus fallback.

---

## 4. Authorization / W-9

- Ava cannot self-approve, self Mark Paid, or self-change rate (non-super)  
- W-9: status label only; no SSN/TIN/bank in UI/Help/schema  
- View-As: Admin-only, read-only, labeled, no password impersonation  

---

## 5. Automated results

| Test | Result |
|------|--------|
| Domain events / paths / idempotency / concurrency | **Passed** (7/7) |
| Money 26×$16.75=$435.50; split rates; biweekly Nov 2–15 | **Passed** (+4 → 11/11) |
| TypeScript `tsc --noEmit` | **Passed** |
| Vercel Preview on PR #178 | **Passed** prior to merge |

---

## Schema

- `20261027_sitguru_live_signals.sql`  
- `20261027_staff_timekeeper_payments.sql`  
- `20261025_growth_workspace_outcomes.sql`  

Applied to SitGuru production + Staging. RLS enabled on business tables.

---

## Final status

**PRODUCTION COMPLETE**  
Multi-user matrix remains **POST-PRODUCTION VALIDATION PENDING**.
