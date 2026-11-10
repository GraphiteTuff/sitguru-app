# SitGuru 3.0 development milestone report

Latest verification: [local visual QA and Preview preparation](visual-verification-2026-11-09.md)
supersedes the older build/test counts and unverified browser status below.

Date: November 9, 2026. Workspace: `C:\Users\jason\projects\pawnecto-sitguru3`.
Branch: `feature/sitguru3-manager-community`.

All changes are local source changes. No push, deployment, migration, production
database write, real email, Teams message, or other outbound integration dispatch
was performed. Original worktrees and production Vercel settings were not edited.

## 1. Safe development and Preview build preparation

Implemented a reproducible lockfile installation with lifecycle scripts disabled,
a checkout-local ignored npm cache, an isolated build runner, a local fixture
runner, focused regression tests, and a loopback HTTP smoke test.

The existing production `vercel.json` remains unchanged. A separate
`vercel.preview.json` and tested ignore/prebuild guards support an explicitly
enabled feature Preview on a separate project with an explicitly selected
isolated Supabase backend. The configuration excludes cron definitions and
rejects production database references and outbound service credentials.

The first production-mode build compiled and exposed one new typing error,
which was corrected. A subsequent build passed TypeScript and exposed a baseline
checkout route that eagerly required a Stripe secret during page collection.
That route now calls the existing lazy `getStripeServer()` helper after user
authentication. Payment logic, API version, and database behavior are preserved.
A regression test verifies importing the route and validating an incomplete
request without a Stripe key or any outbound request.

Files: `package.json`, `.gitignore`, `scripts/safe-next.mjs`,
`scripts/local-smoke.mjs`, `scripts/preview-policy.mjs`,
`scripts/preview-policy.test.mjs`, `scripts/vercel-preview-ignore.mjs`,
`scripts/verify-preview-environment.mjs`, `vercel.preview.json`,
`app/api/stripe/checkout/route.ts`, `app/api/stripe/checkout/route.test.ts`.

No package versions or lockfile changed. Existing dependency audit findings
remain documented in `sitguru3-isolated-development.md` and need compatibility
review before deployment.

## 2. Community Studio and Pet of the Week

Implemented Manager and Intern Community Studio, signed-in member submissions,
and the public Pack. Collections cover The SitGuru Pack, Pet of the Week,
Community Gallery, and Guru Spotlights. The manager menu places Community Studio
immediately after Content Studio. Existing menus, branding, routes, and shells
are retained, with the new destinations also available from mobile navigation.

The responsive board supports story search, collection/status filters, private
drafts, photo uploads, consent, linked existing work, manager feedback, returned
drafts, approvals, declines, scheduling, immediate publication, archiving, and
sharing. Pet of the Week uses one Monday edition per week, a New York business
week, a current spotlight, and past editions. Public due publications refresh
while the page is visible.

Database changes are additive and **unapplied**:

- `community_studio_submissions` with lifecycle, consent, approval, schedule,
  assignment/content references, and optimistic concurrency timestamps.
- `community_studio_events` with database-triggered audit history.
- Private `sitguru-community-private` image bucket, 4 MB limit, permitted image
  types, signature validation, short-lived signed media delivery, restrictive
  storage fence, and service-only access through authenticated server code.
- Unique Pet of the Week edition and database publication approval constraints.

Server operations verify ownership and existing manager assignments. Other
users' private drafts and photos are excluded from moderation. Public payloads
exclude submitter identities, internal feedback, and assignment/content IDs.
Cookie server actions and cookie/Bearer APIs share the same operations and
existing account/role resolution. Development writes reject the known production
backend and require `SITGURU_ISOLATED_BACKEND=true`.

Files: `app/manager/community-studio/page.tsx`,
`app/intern/community-studio/page.tsx`, `app/pack/{page.tsx,submit/page.tsx}`,
`app/dev/community-studio/page.tsx`, `app/api/community-studio/route.ts`,
`app/api/community-studio/media/[id]/route.ts`,
`components/community-studio/*`, `lib/community-studio/*`,
`supabase/migrations/20261109_community_studio.sql`,
`lib/admin/access.ts`, manager/intern route and navigation files and shell icon maps.

## 3. Real-time work and Microsoft 365 continuity

Reused recipient-filtered `sitguru_live_signals` and existing in-app notifications.
Community mutations refresh the relevant workspace paths. Existing Manager and
Intern live sync now coalesces bursts, recovers after reconnect, and defers remote
refresh while a form contains unsaved edits. Manager path revalidation was added
to the existing workspace path groups. Native refresh bypasses its short browse
cache and resumes when the app returns to the foreground.

Existing Content and Social Teams channel, manager-review SharePoint folder,
and Community OneNote section are reused through their established deep-link
resolvers. Community submissions reference existing Content Studio drafts and
internship assignments. Assignment pages retain existing Planner/Graph sync.
Published/scheduled manager stories can download an Outlook-compatible calendar
reminder; the download creates no invitation or external resource.

Files: `hooks/useWorkspaceLiveSync.ts`, `lib/realtime/{query-keys,events.test}.ts`,
`lib/admin/growth/{teams-access,sharepoint-files,onenote-notebook}.ts`,
`components/community-studio/{CommunityWorkLinks,CommunityCalendarButton}.tsx`,
`lib/community-studio/{calendar,calendar.test}.ts`, native live-sync/API helpers.

External Graph, Planner, Outlook, Teams, SharePoint, and OneNote runtime
verification remains pending an isolated tenant and synthetic test accounts.
The new feature does not provision or duplicate Microsoft resources.

## 4. Standalone Market Density and dashboard heatmaps

Added `/manager/market-density` immediately after Campus Growth, using existing
Growth Portal access and the Admin density loader/board. Geographic intensity
layers show actual Pet Parent counts, bookable Guru supply, and booking activity,
alongside the existing readiness view, market search, and filters. Manager map
coordinates are approximate and counts are aggregated. Shared loading paginates
up to 20,000 records per source, handles optional schema columns, and reports
unavailable/truncated sources. Existing launch-readiness criteria are retained.

Manager's Desk and Metrics now include an eight-week activity heatmap from the
existing assigned-intern dashboard data: submitted/approved hours and assignment,
content, and weekly check-in submissions. Managers can switch measures and inspect
a date. Empty periods show zero activity. No mock data is used in application
dashboards; example stories exist only on the explicitly labeled local fixture.

Files: `app/manager/{market-density,metrics}/page.tsx`,
`components/admin/{MarketDensityHeatLayer,MarketDensityLeaflet,MarketGrowthBoard}`,
`components/manager/{ManagerActivityHeatmap,ManagerDeskHome}.tsx`,
`lib/admin/load-market-density.ts`, `lib/admin/growth/manager-desk-{data,model}.ts`,
`lib/internship/{manager-data,activity-heatmap,activity-heatmap.test}.ts`.

## 5. Expo Community Studio

Added a native Community Studio screen with public stories, member drafts,
photo-library uploads, consent, existing task/content references, manager
moderation, feedback, scheduling, publication, archiving, and native sharing.
Controls use native components and 48 dp targets, a sticky primary action, and
existing theme/safe-area behavior. The Intern Portal links to the screen, and
community web URLs resolve to the native destination. Bearer authentication
protects private API requests and media. Development requires an explicitly
isolated API origin and blocks production community requests.

Native scheduling uses a friendly date grid, time choices, and Monday edition
choices. The public feed refreshes quietly while the screen is focused and the
app is active; backgrounding or leaving the screen stops its timer.

Files: `sitguru-mobile/src/app/{community-studio,intern-portal}.tsx`,
`sitguru-mobile/src/lib/data/{community-studio,api}.ts`,
`sitguru-mobile/src/hooks/data/useWorkspaceLiveSync.ts`,
`sitguru-mobile/src/lib/navigation/deep-links.ts`,
`sitguru-mobile/src/components/community/CommunitySchedulePicker.tsx`.

The Expo source typecheck passed using the existing compatible Expo 56 dependency
installation read-only and a temporary workspace-only config, subsequently
removed. Device/emulator tests have not been run.

## Verification and handoff limits

The focused workflow, auth/assignment regression, API boundary, calendar,
editorial-week, navigation, realtime, heatmap, and Preview-policy tests pass.
The existing Teams/OneNote/SharePoint shortcut regression tests also pass.
The API boundary tests explicitly mock all external fetches and assert zero
outbound calls. `git diff --check` passes.

Local HTTP smoke checks confirmed fixture 200, the existing Manager access-denial
screen, the Intern login redirect, and anonymous Community API rejection.
Final results:

- `npm run test:sitguru3`: **53 passed, 0 failed** (3 Preview-policy tests,
  50 TypeScript workflow/API/regression tests).
- `npm run build:isolated`: **passed**, Next 16.2.6 compilation, TypeScript,
  210 static pages generated, and final optimization. No Stripe or outbound
  integration credentials supplied. Existing missing-Plaid/edge-generation
  warnings did not fail the build.
- `npm run test:local-smoke`: **6 passed**, including public Pack and protected
  member submissions in addition to the existing portal gates.
- Full Expo source typecheck: **passed again after the scheduling update**,
  using compatible installed Expo 56 dependencies read-only.
- `git diff --check`: **passed**.

Earlier build failures (the new environment typing mismatch and the baseline
eager Stripe initialization) were corrected before the final successful build.

Local preview: `http://127.0.0.1:3100/dev/community-studio` while `dev:fixture` is
running. It contains labeled example stories and disables all mutations.
Computer Use ended because it could not verify the browser URL with sufficient
confidence; desktop/phone visual QA is unverified. Native device QA is unverified.

Authenticated end-to-end database/storage/realtime tests require isolated
Supabase credentials and the migration. The local Docker daemon was unavailable;
no database was started or migrated. Existing authenticated production behavior
was not exercised with real personnel or accounts. The original baseline was
not separately rebuilt before feature source changes; validation covers this
feature checkout and existing pure regression suites.

Vercel Preview URL: **none**. No deployment was attempted. Follow
`sitguru3-isolated-development.md` for the isolated setup and opt-in Preview path.
