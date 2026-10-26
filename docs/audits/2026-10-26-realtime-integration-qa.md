# Real-Time Integration — SitGuru QA Report

**Date:** October 26, 2026 (America/New_York)  
**Branch:** `cursor/realtime-workspace-sync-69fa`  
**Principle:** One action → one authoritative update → all relevant authorized views refresh automatically.

---

## 1. Existing realtime architecture discovered

| Mechanism | Status | Primary surfaces |
|-----------|--------|------------------|
| Supabase Realtime `postgres_changes` | Production | Messaging threads/inbox, NotificationBell, Guru live profile/search, Admin live walks, Support inbox |
| SSE + in-process walk event bus | Production | PawReport live GPS (`/api/walk/stream/[bookingId]`) |
| Debounced `router.refresh()` | Production | MessageRealtimeRefresh, Guru bridges |
| Poll + visibility/focus fallback | Production | MessageAutoRefresh, GlobalMessageNotifier, Admin live walks (5s) |
| Mobile `useRealtimeSubscription` | Production | Messages, notifications, bookings, PawReport |
| TanStack Query / SWR | Installed, **unused** for app data | — |
| Kafka / Redis streams / microservices | **Not present** | — |

**Critical constraint:** Internship and Growth business tables are **service-role only** (`revoke all from anon, authenticated`). Browser clients cannot subscribe to those tables directly without breaking the security model.

---

## 2. Realtime architecture reused

- Extended the **Supabase Realtime + filtered channel + debounce + refresh** pattern from Messaging / Admin Live Walks / mobile `useRealtimeSubscription`.
- Did **not** introduce a second framework, Kafka, RabbitMQ, Redis streams, or TanStack Query wiring.
- Messaging realtime left intact (req 86, 111).
- Walk SSE left intact.

---

## 3. New subscriptions / events added

### Table: `sitguru_live_signals`
- Migration: `supabase/migrations/20261027_sitguru_live_signals.sql`
- RLS: `SELECT` only where `recipient_user_id = auth.uid()`
- Writes: service role only
- Added to `supabase_realtime` publication
- Payload: sync metadata only (event type, resource keys, path hints, actor attribution) — **never** W-9 contents, compensation, or tax docs

### Domain events (`lib/realtime/events.ts`)
Includes: `intern.hours.*`, `intern.checkin.*`, `intern.assignment.*`, `intern.milestone.completed`, `growth.initiative.*`, `growth.event.recorded`, `onboarding.item.completed`, `access.updated`, payment/timekeeper names reserved for future Ava Timekeeper modules, `message.created` (Messaging remains on its existing bus).

### Client
- Web: `hooks/useRealtimeSubscription.ts`, `hooks/useWorkspaceLiveSync.ts`, `hooks/useRefreshOnFocus.ts`
- Bridge: `components/realtime/WorkspaceLiveSyncMount.tsx` mounted on Intern layout, Admin layout, Admin Internship layout
- Mobile: `useWorkspaceLiveSync` + `REALTIME_CHANNELS.liveSignals` (parity)

---

## 4. Modules now synchronized

| Module | Sync path |
|--------|-----------|
| Intern Portal | Live signals + path revalidation after hours/check-in/questions/milestones |
| Manager Desk (`/intern/manage`) | Same bus; manager receives intern submission signals |
| Admin Internship / View Intern Portal (`?view=`) | Admin layout + internship layout subscribe; preview uses live `getInternWorkspace` data + refresh |
| Growth Workspace | Initiative / event / intelligence mutations publish growth-scoped signals |
| Onboarding | Submit publishes onboarding signals |
| Help | Covered by Intern layout mount + refresh-on-focus (Help re-queries server state) |
| Messaging | **Unchanged** existing realtime |
| Ava Timekeeper / contractor Payment periods | **Not built as product modules yet** — event names + query keys reserved; do not claim live Ava payroll sync |

---

## 5. Cache invalidation strategy

1. Authoritative mutation succeeds (DB write).
2. `revalidatePath` for relevant workspace routes (existing pattern, extended).
3. `publishLiveSignals` upserts recipient rows (idempotent on `event_id + recipient_user_id`).
4. Subscribed clients debounce → `router.refresh()` (web) or `onRefresh` (mobile).
5. Refresh-on-focus / visibility as missed-event fallback (**not** multi-second polling of every API).

Query-key conventions documented in `lib/realtime/query-keys.ts` for future optional React Query adoption.

---

## 6. Mobile / web synchronization

- Same authoritative tables and same `sitguru_live_signals` bus.
- Mobile hook mirrors web channel naming: `sitguru-live-signals:{userId}`.
- No separate web-only / mobile-only business copies.

---

## 7. Admin View-As synchronization

- Admin Intern Portal preview (`/intern?view={internId}`) already loads **live** workspace data via `getInternWorkspace` (not a screenshot).
- Admin sessions mount `WorkspaceLiveSyncMount`; when they are manager/supervisor/oversight recipients of a signal, the preview refreshes with normal realtime behavior.
- Actor attribution on signals uses the **actual admin/intern actor**, never the View-As target (req 101).

---

## 8. Authorization protection

- Clients only receive signal rows for `auth.uid() = recipient_user_id` (RLS).
- Business tables remain service-role; signals carry no sensitive document contents.
- Recipient fan-out is limited to intern + assigned manager + supervisor (+ scoped Growth oversight roles when requested).

---

## 9. Failure / reconnection behavior

- Mutations do not depend on realtime delivery; DB success is authoritative (req 104).
- Channel error / timeout → sync mode falls back to focus refresh; optional “Reconnecting…” label.
- On reconnect / focus, `router.refresh()` reconciles from server state.
- Typing in inputs does not force focus refresh (same guard as MessageAutoRefresh).

---

## 10. Concurrency handling

- Existing status guards retained (e.g. hour review `.eq("status", "submitted")`).
- Helper `checkRecordVersion` / `STALE_RECORD_MESSAGE` added for UI “record changed since you opened it” flows.
- Idempotent signal upserts prevent duplicate notify spam on retry (req 99).

---

## 11. Realtime tests performed

| Test | Result |
|------|--------|
| Unit: domain events notify subset, stable event ids, recipient dedupe, path conventions, concurrency guards | **Pass** (`tsx --test lib/realtime/events.test.ts`) |
| Dual-session Ava↔Jason / Intern↔Manager browser matrix (req 108 Tests 1–10) | **Not executed in this environment** — requires authenticated multi-role staging accounts; blocked on credentials + live migration apply verification |
| Messaging regression | Architecture preserved; no Messaging channel changes |

**Production-ready claim:** Core sync infrastructure + mutation publishers are implemented and unit-tested. Full dual-session acceptance (req 108) must be run on staging with Ava/Jason/Ryan accounts after migration apply before calling the entire matrix production-ready.

---

## 12. Intentional refresh-on-focus (not realtime) surfaces

| Surface | Why |
|---------|-----|
| Low-priority Help article static content | Content is CMS/static; personalization status comes from parent layout refresh |
| Ava contractor Timekeeper / Payment Queue | Modules not present; when built, wire to `sitguru_live_signals` + reserved event names |
| Global message unread poller | Existing Messaging fallback — left unchanged to avoid dual messaging frameworks |

---

## Build philosophy check

**Preserve → Enhance → Integrate → Synchronize → Beautify → Secure → Test → Deliver Once**

- Preserved Messaging + PawReport realtime
- Enhanced with one authorized sync bus
- Integrated Intern / Manager / Growth / Admin / Onboarding publishers
- Synchronized via Realtime + focus fallback
- Secured with recipient RLS
- Unit-tested; dual-session QA remaining before final production declaration
