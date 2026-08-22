# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

Prefer Expo Router guidance for [route groups](https://docs.expo.dev/router/basics/notation/), [layouts](https://docs.expo.dev/router/basics/navigation-layouts/), and [common navigation patterns](https://docs.expo.dev/router/basics/common-navigation-patterns/) when regrouping `src/app`.

---

# Mobile-first layout (thumb-zone UX)

NativeWind/Tailwind is **not** installed. Use StyleSheet + shared primitives:

| Primitive | Path |
|-----------|------|
| Tokens (`TOUCH_MIN=48`, `ThumbZone`) | `src/constants/mobile-layout.ts` |
| Screen shell + locked footer | `src/components/mobile/MobileScreen.tsx` |
| Sticky primary CTA (bottom thumb zone) | `src/components/mobile/StickyActionBar.tsx` |
| ≥48×48dp pressables | `src/components/mobile/TouchTarget.tsx` |
| Swipe accept / decline rows | `src/components/mobile/SwipeableListItem.tsx` |
| Priority progressive-disclosure cards | `src/components/mobile/PriorityCarousel.tsx` |
| Multi-step forms | `src/components/mobile/MobileWizard.tsx` |
| Compact live map header | `src/components/mobile/LiveRouteHeader.tsx` |
| Potty / Water care actions | `src/components/mobile/CareQuickActions.tsx` |
| Chat photo + voice composer | `src/components/mobile/ChatComposerBar.tsx` |
| Vaccine paper camera scan | `src/components/mobile/VaccineScanStep.tsx` |
| Service core grid (Pet Parent) | `src/components/mobile/ServiceCoreGrid.tsx` |
| Cached live photo loader | `src/components/mobile/CachedRemoteImage.tsx` |

## SitGuru Mobile UX rules

1. **One-handed thumb zone** — Keep bottom tab nav locked. Primary actions (`Request Booking`, `Start Walk`, Accept/Decline) are large full-width sticky buttons in the footer (lower ~30%), never desktop-style top/left chrome.
2. **Gestures over tiny taps** — List approve/decline uses swipe: **right = accept**, **left = decline** (`guru-requests`). Hint text must remain: `Swipe right to accept · Swipe left to decline`.
3. **Card progressive disclosure** — Dashboards show a `PriorityCarousel` of highest-priority cards only; tap opens deep-dive routes instead of dumping analytics/history on one screen. AI Companions (Rogue / Taco / Scout) use the same carousel pattern.
4. No core-flow horizontal scroll except the intentional priority carousel. All interactive targets ≥ **48dp**.
5. **High-fidelity native surfaces** (desktop → mobile):
   - **Service core** — Thumb grid for Dog Walking / Pet Sitting / Boarding / Drop-In / Day Care / Training Support + sticky footer CTA.
   - **Live PawReport** — Walk snapshot via Bearer `GET /api/walk/stream/[bookingId]?format=json` (`usePawReportLive`).
   - **Live photo pipeline** — Guru camera capture uploads to `pawreport-photos` (fallback `provider-media` / `pet-media`) via `uploadSitGuruMedia`; Pet Parent feed uses `CachedRemoteImage` + dynamic `N new photos` badges. StickyActionBar owns capture on `guru-live-walk`.
   - **Live route** — Floating compact map (`LiveRouteHeader` + `expo-location`); oversized Potty / Water (`CareQuickActions`).
   - **Chat** — Photo bar + voice notes (`ChatComposerBar` + `expo-image-picker` / `expo-audio`) with `KeyboardAvoidingView`.
   - **Pet Passports** — Step wizard (`MobileWizard`) + vaccine camera scan (`VaccineScanStep` + `expo-camera`).
   - **Notifications** — Native push + lock-screen Accept Booking (`expo-notifications`, `src/lib/notifications/push.ts`).

Reference screens: `guru-requests.tsx`, `pet-parent-dashboard.tsx`, `pawreport-live.tsx`, `ai-companion.tsx`, `guru-live-walk.tsx`, `conversation.tsx`, `pet-passports.tsx`, `notifications.tsx`.

---

# Unified data layer (web ↔ mobile parity)

Prefer `@/hooks/data` + `@/lib/data` over screen-local `supabase.from(...)` loops.

## Rules

- **Anon client only** in the app (`@/lib/supabase`). Never ship `SUPABASE_SERVICE_ROLE_KEY`.
- **Canonical tables** match web production: `pets`, `gurus`, `bookings`, `conversations`, `messages`, `notifications`, `booking_visit_*` — not readiness aliases like `pet_profiles` / `booking_requests`.
- **Reads / mark-read / pet CRUD:** RLS-scoped Supabase via hooks (`usePets`, `useBookings`, `useConversation`, `useNotifications`, …).
- **Privileged mutations:** Bearer JWT → SitGuru web APIs via `sitguruApiFetch` so mobile hits the same service-role paths as desktop:
  - `POST /api/bookings/create`
  - `POST /api/messages/send`
  - `POST /api/messaging/ensure-booking-conversation`
  - `POST /api/walk/[bookingId]/actions`
  - `POST /api/mobile/payments/checkout`
- **Realtime:** `useRealtimeSubscription` with **filtered** channels; prefer web names (`chat:{id}`, `notifications:{userId}:…`, `room-{bookingId}`).
- **Booking ownership helpers:** `@/lib/data/booking-access` mirrors web `lib/pawreport/access.ts`.
- **Env:** `EXPO_PUBLIC_SUPABASE_*` + `EXPO_PUBLIC_SITGURU_API_URL` (or `EXPO_PUBLIC_SITGURU_WEB_URL`).

## Hook map

| Hook | Use for |
|------|---------|
| `usePets` | Pet Passport list/save/delete → `pets` |
| `useBookings` / `useBooking` | List + create booking API + checkout + realtime |
| `useConversations` / `useConversation` | Inbox, send via `/api/messages/send`, chat realtime |
| `useNotifications` | List + mark read + user-filtered realtime |
| `usePublicGurus` / `useGuruProfile` | Find Care / public profile |
| `useWalkSession` | Guru walk actions via web API |
| `useRealtimeSubscription` | Shared channel lifecycle |

Product note: web creates `bookings` as `pending`/`unpaid` and starts Stripe checkout; treat that as source of truth unless both platforms add an accept-first request flow later.

---

# SitGuru Mobile — remaining core work

## Current state (baseline)

- **Routing:** All product and internal screens live as a flat list under `src/app/*.tsx` (~45 files). Root `_layout.tsx` is a single `Stack` with `headerShown: false`. No `(groups)`, no role tabs, no dynamic `[id]` segments.
- **Auth / roles:** `AuthContext` + Supabase session, `profiles`, and `user_roles` are wired. `RoleGate` / `useRoleAccess` guard role dashboards. Workspace paths live in `src/constants/workspaces.ts` and `src/types/auth.ts`.
- **Data layer:** Shared hooks/helpers live under `src/hooks/data` and `src/lib/data`. Migrate screens off duplicated table-fallback helpers onto these hooks.
- **Supabase:** Shared backend via `@/lib/supabase` (anon key only). Mobile repo migrations today cover support tickets and verified booking reviews; marketplace tables come from the shared website project.
- **Already partially live:** login/signup, role selection, pet-parent/guru dashboards, find-care, guru profile/pricing/requests, request-booking, booking-details, conversation/messages, notifications, payments, reviews, support, care map / live walk screens.
- **Still visual / incomplete:** `SitGuruBottomNav` (non-navigating preview), several setup screens, ambassador/admin polish, and internal readiness/planning routes mixed into the same flat app tree. Pet Passports wizard persists via `usePets` + vaccine scan upload.

Core finish line for this checklist: **clean Expo Router groups + complete Pet Parent and Guru happy paths** (auth → setup → discovery/booking → care → pay/review). Ambassador, admin, and internal tooling stay deferred unless they block those two flows.

---

## Target route groups

Regroup without breaking public URLs where possible (parentheses do not appear in the path). Suggested tree:

```text
src/app/
  _layout.tsx                 # AuthProvider, fonts, root Stack/Slot
  index.tsx                   # Marketing / entry
  (public)/                   # No auth required
    find-care.tsx
    explore.tsx
    guru-profile.tsx          # later: guru-profile/[slug].tsx
  (auth)/
    login.tsx
    signup.tsx
    forgot-password.tsx
  (onboarding)/
    role-selection.tsx
    pet-parent-setup.tsx
    guru-setup.tsx
  (pet-parent)/
    _layout.tsx               # Tabs or role shell + RoleGate(pet_parent)
    pet-parent-dashboard.tsx
    pet-passports.tsx
    request-booking.tsx
    pawreport-live.tsx
  (guru)/
    _layout.tsx               # Tabs or role shell + RoleGate(guru)
    guru-dashboard.tsx
    guru-requests.tsx
    guru-pricing.tsx
    guru-earnings.tsx
    guru-live-walk.tsx
    guru-care-map.tsx
    guru-success-center.tsx
    guru-referrals.tsx
  (shared)/                   # Both roles + account utilities
    _layout.tsx
    account.tsx
    messages.tsx
    conversation.tsx          # later: conversation/[id].tsx
    booking-details.tsx       # later: booking/[id].tsx
    notifications.tsx
    payments.tsx
    reviews.tsx
    support.tsx
  (ambassador)/ …             # Defer after pet-parent + guru core
  (admin)/ …                  # Defer
  (internal)/ …               # readiness / QA / wiring-plan screens
```

Update every `Href`, `WORKSPACES.*.dashboardPath` / `setupPath`, `roleDashboardPath`, and `router.push(...)` after moves. Prefer stable public paths (`/find-care`, `/login`, …) over group-prefixed deep links unless a screen is intentionally role-scoped.

---

## Checklist A — Route grouping & navigation shell

- [ ] Inventory every file in `src/app` and assign it to `(public)`, `(auth)`, `(onboarding)`, `(pet-parent)`, `(guru)`, `(shared)`, `(ambassador)`, `(admin)`, or `(internal)`.
- [ ] Create group `_layout.tsx` files per Expo Router v56 (Stack/Tabs/`Slot`); keep root providers in `src/app/_layout.tsx`.
- [ ] Move screens into groups; keep URLs stable where product already deep-links to them.
- [ ] Replace visual-only `SitGuruBottomNav` with real Expo Router tabs (or pressable nav wired to `Href`s) for pet-parent and guru shells.
- [ ] Centralize path helpers (`workspaces.ts`, `roleDashboardPath`, support category hrefs) so regrouping is one source of truth.
- [ ] Add dynamic segments for entity screens: `booking/[id]`, `conversation/[id]`, optional `guru-profile/[slug]` — stop relying only on loose query params where ownership checks need a stable id.
- [ ] Gate groups: public stays open; auth/onboarding require session as appropriate; pet-parent/guru layouts enforce `RoleGate`; shared booking/message/payment screens verify participant ownership via Supabase RLS + client checks.
- [ ] Relocate readiness/QA/planning screens under `(internal)` and remove them from role dashboards / production nav.
- [ ] After regroup: `npx expo start --clear`, smoke-test deep links, and run `npm run typecheck`.

---

## Checklist B — Finish Pet Parent core flow

End-to-end: **sign up → choose Pet Parent → setup → passports → find care → request → message → accepted booking → pay → live PawReport → review**.

- [ ] **Onboarding:** `pet-parent-setup` writes profile completion flags / role row; incomplete users cannot skip into booking-critical screens.
- [ ] **Pet Passports:** Replace hardcoded Scout/Luna preview with Supabase CRUD on `pet_profiles` / care-note fields; enforce owner-only RLS; photo upload only after storage bucket + policies exist.
- [ ] **Find Care:** Keep public; signed-in parents can start a request with selected guru + pets; empty/error states when Supabase or geo data is missing.
- [ ] **Request booking:** Create `booking_requests` (or equivalent) with pet, guru, service, schedule, notes, estimate; block submit without passport + auth.
- [ ] **Messages:** Parent can open/create participant-scoped conversation tied to request/booking; realtime send/receive already started in `conversation.tsx` — finish unread, empty, and error paths.
- [ ] **Booking details:** Parent sees status history, payment CTA only after guru accept, links to chat / PawReport / review.
- [ ] **Payments:** Checkout only for accepted, participant-owned bookings; no charge-before-accept; surface clear failure when Stripe/session missing.
- [ ] **PawReport Live:** Parent read-only realtime for active visit; no location publish from parent client.
- [ ] **Reviews:** Submit only for completed, verified bookings (align with `booking_reviews` migration); prevent duplicate reviews.
- [ ] **Dashboard:** Pet-parent home loads real requests/bookings/notifications counts; every primary CTA routes into the grouped shell (not dead preview buttons).
- [ ] **Notifications:** Booking, message, payment, and care events create rows the parent can open to the correct screen.

---

## Checklist C — Finish Guru core flow

End-to-end: **sign up → choose Guru → setup → profile/pricing/area → requests → accept/decline → chat → live care → earnings/payout readiness → reviews**.

- [ ] **Onboarding:** `guru-setup` creates/updates `guru_profiles` (+ visibility defaults); incomplete gurus stay out of Find Care results.
- [ ] **Public profile:** Guru profile fields, services, and service area drive Find Care; slug/id resolution is deterministic.
- [ ] **Pricing & availability:** Persist `guru_pricing_rules` / availability from `guru-pricing`; validate before accepting paid requests.
- [ ] **Requests inbox:** `guru-requests` lists open requests for this guru only; accept/decline writes status events and notifies the pet parent.
- [ ] **Care map / live walk:** Start/pause/end visit session only for accepted active bookings; location writes only while session is active; parent subscribers are participant-scoped.
- [ ] **Messages:** Guru side of the same conversation model; no cross-booking leaks.
- [ ] **Earnings / payments:** Guru sees payout-oriented booking money state; Connect/payout wiring stays behind acceptance + completed care (do not invent payouts before Stripe Connect server path exists).
- [ ] **Success / referrals:** Keep non-blocking; do not block core accept → care → complete path on referral tooling.
- [ ] **Dashboard:** Guru home reflects real request, schedule, and earnings signals; tab/shell CTAs match grouped routes.
- [ ] **Reviews:** Guru can read reviews on completed care; no self-review.

---

## Checklist D — Shared Supabase / security work (blocks both flows)

- [ ] Confirm mobile env uses the same Supabase project as the website; never ship `SUPABASE_SERVICE_ROLE_KEY` in the app.
- [x] Stand up unified mobile data layer (`src/lib/data`, `src/hooks/data`) mirroring web tables + Bearer API mutations.
- [ ] Set `EXPO_PUBLIC_SITGURU_API_URL` in mobile env to the live SitGuru web origin.
- [ ] Migrate screens off local `*_TABLES` fallback loops onto `@/hooks/data` (pets, bookings, messages, notifications, gurus, walks first).
- [ ] Document which tables already exist in prod vs still “schema-readiness only”; add mobile migrations only for gaps that mobile owns (support/reviews pattern).
- [ ] Verify RLS for: `profiles`, `user_roles`, `pets`, `gurus`, bookings/status events, conversations/messages, visit sessions/locations/updates, notifications, payments, reviews, support.
- [ ] Align remaining screen queries with canonical column names from `@/lib/data/schema` and `@/lib/data/booking-access`.
- [ ] Ensure booking participant checks stay identical for parent and guru clients (select/update policies + access helpers).
- [x] PawReport live photo pipeline (`uploadSitGuruMedia` → `booking_visit_updates.photo_url`) with cached Pet Parent feed rendering.
- [ ] Storage buckets (avatars, passport photos, PawReport photos) only after RLS + signed URL plan; until then keep photo actions disabled with clear UI copy.
- [ ] Realtime channels: prefer filtered `useRealtimeSubscription` / `REALTIME_CHANNELS`; remove whole-table dashboard listeners as screens migrate.

---

## Checklist E — Definition of done (Pet Parent + Guru)

- [ ] Flat `src/app` root contains only `_layout`, `index`, and route-group folders (plus any Expo special files).
- [ ] Pet Parent can complete a real booking request against a visible guru using a real pet passport.
- [ ] Guru can accept/decline, message, run a live care session, and complete the booking path the parent observes.
- [ ] Payments and reviews only activate at the correct booking statuses.
- [ ] Role switching / workspace paths resolve into the new groups without broken hrefs.
- [ ] Internal readiness screens are not part of the customer or guru navigation.
- [ ] `npm run typecheck` passes; critical flows smoke-tested on iOS/Android (and web if still supported).

---

## Explicitly defer (do not block core)

- Ambassador command center, social, referral analytics, payouts polish.
- Admin operations / admin dashboard beyond role existence.
- Push notification device registration.
- Full Stripe Connect payout automation and webhook hardening (server-side).
- Image-heavy passport / PawReport galleries before storage policies land.
- Rewriting internal `*-readiness` / `wiring-start-plan` screens except relocating them under `(internal)`.
