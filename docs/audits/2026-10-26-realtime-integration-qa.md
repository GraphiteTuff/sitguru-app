# Real-Time Integration — SitGuru QA Report

**Date:** October 26, 2026 (America/New_York)  
**Updated:** October 26, 2026 (America/New_York) — Manager Time/Payments pre-staging  
**Branch:** `cursor/realtime-workspace-sync-69fa`  
**PR:** #178  
**Principle:** One action → one authoritative update → all relevant authorized views refresh automatically.

---

## Pre-staging summary

| Area | Status |
|------|--------|
| Architecture (single `sitguru_live_signals` bus) | **Passed** |
| Time / payment / rate publishers | **Passed** (implemented) |
| Subscriptions + refresh-on-focus fallback | **Passed** (implemented) |
| Unit tests (events, idempotency, paths, concurrency + money) | **Passed** (11/11) |
| Help live state (authorized, no tax/bank) | **Passed** (code review) |
| Admin View-As read-only | **Passed** (code review) |
| Mobile native Manager Time parity | **Not Tested** / not shipped |
| Dual-session Ava / Jason / Ryan matrix | **Blocked** |

---

## 1. Existing realtime architecture discovered

| Mechanism | Status | Primary surfaces |
|-----------|--------|------------------|
| Supabase Realtime `postgres_changes` | Production | Messaging, NotificationBell, Guru live, Admin live walks, Support |
| SSE + walk event bus | Production | PawReport GPS |
| Debounced `router.refresh()` | Production | MessageRealtimeRefresh, Guru bridges, workspace sync |
| Poll + visibility/focus fallback | Production | MessageAutoRefresh, Admin live walks |
| Mobile `useRealtimeSubscription` | Production | Messages, notifications, bookings, PawReport |
| `sitguru_live_signals` | **Shipped** | Authorized workspace sync bus (RLS own rows) |
| TanStack Query / Kafka / Redis streams | Unused / absent | — |

Internship/Growth/Staff business tables remain **service-role only**. Clients sync via `sitguru_live_signals`, not direct table subscriptions.

---

## 2. Realtime architecture reused

- Extended Messaging / Admin Live Walks / mobile subscription patterns.
- **No second framework.**
- Messaging + PawReport realtime **unchanged**.

---

## 3. New subscriptions / events added

### `sitguru_live_signals` (prior)
RLS: `recipient_user_id = auth.uid()`. Service-role writes. Realtime publication enabled.

### Staff Timekeeper / Payment events (this update)

| Event | Publisher |
|-------|-----------|
| `time.entry.created` | Manual entry / start timer |
| `time.entry.updated` | Edit / delete draft / stop timer |
| `time.period.submitted` | Ava submits payment period |
| `time.period.returned` | Admin Needs Correction |
| `time.period.approved` | Admin approve → Ready for Payment |
| `payment.ready` | After approve |
| `payment.processing` | Reserved in catalog if used |
| `payment.paid` | Admin Mark Paid (manual_bank_ach) |
| `compensation.rate.updated` | Effective-dated rate change |

Client mounts unchanged: Intern / Admin / Internship layouts via `WorkspaceLiveSyncMount`.

Publish path: `lib/realtime/publish-staff-time.ts` → `publish-live-signal.ts` → `sitguru_live_signals` upsert (idempotent event ids).

---

## 4. Modules now synchronized

| Module | Status |
|--------|--------|
| Intern Portal / Manager Desk / Growth / Onboarding | Synced (prior) |
| **Ava My Time** `/admin/growth/my-time` | **Added** + live signals |
| **Ava My Payments** `/admin/growth/payments` | **Added** + live signals |
| **Admin Team Payments** `/admin/hr/people/payments` | **Added** + live signals |
| **People & Administration** `/admin/hr/people` | **Added** |
| Manager Home extras (Needs Attention / My Time / Payment) | **Added** on Growth Home |
| Help (Manager live answers) `/admin/help/manager` | **Added** |
| Admin View-As Growth Manager `/admin/growth/preview/[userId]` | **Added** (read-only) |
| Messaging | Unchanged |

---

## 5. Cache invalidation strategy

1. Authoritative DB write  
2. `revalidatePath` for Growth / My Time / Payments / People routes (`STAFF_TIME_PATHS`)  
3. Idempotent `sitguru_live_signals` upsert  
4. Client debounce → `router.refresh()`  
5. Refresh-on-focus fallback (`useRefreshOnFocus`)  

### Expected refresh targets

| Mutation | Surfaces |
|----------|----------|
| Ava time change | My Time, Growth Home My Time summary, payment period summary, Admin authorized time views |
| Payment submission | Ava status, Admin approval queue, Needs Attention, payment estimate/state |
| Approval | Ava Time, Ava Payments, Growth Home, Admin Payments |
| Paid | Ava Payments, Payment History, annual Paid total, Admin queue, People profile, Help live status |

Avoids whole-app polling; scoped paths + recipient-filtered signals.

---

## 6. Mobile / web synchronization

Same bus + channel naming (`sitguru-live-signals:{userId}`). Staff Time UI is web-first in this delivery; mobile hook parity remains available for future native Manager screens.

| Item | Status |
|------|--------|
| Web My Time / Payments | Implemented |
| Mobile Manager Time screens | **Not Tested** / not shipped as native routes this pass |
| Web↔Admin signal refresh | Unit + architecture Ready; dual-session **Blocked** on staging accounts |

---

## 7. Admin View-As synchronization

| Surface | Status |
|---------|--------|
| Intern Portal `?view=` | Prior — live workspace data |
| Growth Manager preview `/admin/growth/preview/[userId]` | **Added** — same `loadMyTimeDashboard`, read-only (`pointer-events-none`), persistent banner + Exit Preview |
| Mutations while previewing | Blocked in UI; server still requires real actor |
| Act-As / password impersonation | **Not implemented** (intentional) |

---

## 8. Authorization protection

| Rule | Status |
|------|--------|
| Ava cannot approve own payment | Enforced in `approvePaymentPeriod` / `recordStaffPaymentPaid` |
| Ava cannot change own compensation (non-super) | Enforced in `updateEngagementRate` |
| W-9 contents never in UI/Help | Status label only |
| No bank routing/account storage | Confirmed in schema |
| Signal RLS own rows only | Confirmed |
| Staff tables revoke authenticated | Confirmed |

---

## 9. Failure / reconnection

Unchanged architecture: DB write authoritative; channel error → focus fallback; reconnect refreshes.

| Test | Result |
|------|--------|
| Disconnect does not lose submitted work | **Not Tested** (requires live browser) |
| Duplicate signal idempotency | **Passed** (unit: stable event ids + upsert conflict) |

---

## 10. Concurrency

| Test | Result |
|------|--------|
| Status guards on approve (`.eq("status","submitted")`) | Implemented |
| `checkRecordVersion` helper | **Passed** (unit) |
| Dual-user stale open conflict UI | **Not Tested** |

---

## 11. Realtime / feature tests

| Test | Result |
|------|--------|
| Domain events / notify subset / paths / concurrency units | **Passed** (7/7 realtime) |
| Money: 26×$16.75=$435.50; split-rate periods; biweekly Nov 2–15 | **Passed** (+4 → **11/11** combined) |
| Dual-session Ava Time → Jason approve → Paid | **Blocked** — needs Ava/Jason staging sessions |
| Dual-session Ryan hours / check-in / assignment | **Blocked** — needs Ryan/Ava/Jason staging |
| Growth initiative dual-session | **Blocked** |
| Admin View-As live update while Ava mutates | **Blocked** |
| Mobile/desktop cross-device | **Blocked** |
| Messaging regression | **Not Tested** this pass (no Messaging code changes) |

---

## 12. Intentional refresh-on-focus surfaces

| Surface | Why |
|---------|-----|
| Static Help article bodies | Personalization comes from live context queries on Manager Help |
| Native mobile Manager Time | Screens not shipped; when added, use `useWorkspaceLiveSync` |

---

## Schema applied

- `20261027_sitguru_live_signals.sql` — SitGuru + Staging  
- `20261027_staff_timekeeper_payments.sql` — SitGuru + Staging  

---

## Production readiness (this PR slice)

**Integrated feature set for Manager Time/Payments is implemented and unit-tested.**  
**Full dual-session staging matrix remains Blocked** until Ava / Jason / Ryan accounts are exercised.  
Do **not** claim the entire SitGuru internal platform production-ready until that matrix is Passed.

**Production merge performed: NO**  
**Status: READY FOR STAGING ACCEPTANCE**
