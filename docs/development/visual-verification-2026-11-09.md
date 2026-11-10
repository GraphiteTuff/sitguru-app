# Visual verification and safe Preview preparation

## Follow-up: Desk and Admin header captures

Reference-file handoff update: the subsequently supplied
`docs/production-references` path also returned `PathNotFound`, including an
unrestricted read. Created that destination locally; it currently contains zero
PNGs. Added `/docs/production-references/` to `.gitignore` and the matching
directory to `.vercelignore`. `git check-ignore` confirms the Git exclusion;
no files in that directory are tracked. No deployment was run. Production image
comparison cannot proceed until the actual PNG bytes are accessible here.

Rechecked the user-supplied production reference path; it still returns
`PathNotFound` in this accessible filesystem. Production screenshot comparison
remains pending. No production files or settings were accessed or modified.

Added Admin to the existing guarded local verification chooser, reusing
`app/admin/layout.tsx` directly rather than the older `components/AdminShell`
or either Desk shell. Only header/navigation chrome is shown; no dashboard
records are loaded and its anonymous account fallback is not a verified identity.
The actual Admin layout and account-menu source remain unchanged.

Found and corrected a fixture limitation: InternPortalShell intentionally omits
chrome outside `/intern`, so prior `/dev` captures showed only its content.
A development-only `localVerification` prop now selects the existing Intern
chrome for the guarded fixture. Default routing, production rendering, account
resolution and authentication remain unchanged. This does not load private data
or grant a role. No replacement header or sidebar was added.

New actual Edge captures (1440 CSS-pixel iframe at 75% browser zoom to fit the
display; phone captures also use the specified inner CSS viewport):

- [Manager desktop](verification-screenshots/manager-desktop-1440.png): existing
  logo, search, notification bell, sidebar and Manager's Desk layout.
- [Intern desktop with existing chrome](verification-screenshots/intern-desktop-1440.png):
  existing blue Intern navigation, search, notification bell and dashboard.
- [Intern phone with existing chrome](verification-screenshots/intern-phone-with-chrome-390.png):
  existing compact header and stacked dashboard content.
- [Admin desktop chrome](verification-screenshots/admin-chrome-desktop-1440.png):
  distinct Admin logo/navigation, search/actions, bell and account control.
- [Admin phone chrome](verification-screenshots/admin-chrome-phone-390.png):
  existing mobile navigation. The crowded header clips the account control at
  this width; recorded for comparison and a targeted follow-up. No Admin header
  redesign was made without the production reference or authenticated state.

Real profile photos, names, complete authorized-role dropdowns and permissions
remain unverified without isolated accounts. This follow-up supersedes the older
statement below that Admin chrome had not been rendered; Admin authentication
and actual HQ dashboard data are still not tested. Desk regression tests pass
again (16/16). Web typecheck passes. No complete rebuild or full workflow rerun
was necessary for these fixture-only additions and development-gated shell prop.

Local review: `/dev/verification?page=admin&width=390` (or `width=1440`).
The same launcher and environment protections described below apply.

Workspace: `C:\Users\jason\projects\pawnecto-sitguru3`.
Branch: `feature/sitguru3-manager-community`. All prior unfinished changes remain
local. No push, deployment, production migration, external test message or cloud
resource creation occurred. This report supersedes earlier verification counts
and dependency-security statements, without replacing the earlier implementation.

## Completed changes

- Added guarded `/dev/verification` fixtures with actual existing Manager Desk,
  Intern home, Market Density and Community Studio components, and the public
  Pack. Select 320, 390, 768 or 1440 pixel iframe viewports. Synthetic identity
  is explicitly labeled; authenticated headers and role resolution are not
  bypassed. Added a client wrapper for the existing Intern home callbacks.
- Limited only the new Pack desktop hero image to 560px high, correcting the
  oversized natural portrait image observed in the browser. Existing Manager,
  Intern and Admin layouts were not redesigned.
- Restricted the older `/dev/portal-mockups` page to explicit local development;
  development fixtures cannot render from the compiled production-mode app.
- Updated web dependencies to Next/eslint-config-next 16.4.6, MapLibre 6.17.0
  and Sharp 0.35.5. Web audit changed from 31 findings (2 critical) to 23 findings
  (0 critical, 14 high, 9 moderate). Saved both full audit JSON files. Critical
  Next fixes are documented in the publisher's
  [SVG optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw)
  and [cache advisory](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr).
  Remaining findings still require review; this is not a clean security bill.
- Tightened Preview environment rejection for known production backend aliases,
  cron and Supabase management credentials; added a regression case. Existing
  production Vercel configuration remains unchanged. No actual Vercel settings
  or protection controls have been verified in an account.
- Added Graph transport tests using entirely intercepted fetch: synthetic token
  request, Planner ETags, 409/412 concurrency, 403/404 access, 500 failure, absent
  credentials and forbidden app-only Teams posting. Added the existing Teams
  notification-mode suite to the main focused test command.
- Made safe local server ports selectable and output directories distinct for
  concurrent fixture development; added a credential-scrubbed local start mode
  to check the compiled app. Smoke testing accepts only a numeric loopback port.
- Corrected the Community Studio design fixture to explicitly display granted
  website consent and refused social reuse instead of omitted legacy fields.
- Prepared [isolated setup instructions](isolated-integration-setup.md) with
  resource choices, costs, permissions, configuration and actual test matrix.

## Actual browser captures

Edge rendered these local pages. The screenshots include browser chrome and an
outer fixture chooser; widths refer to the actual inner iframe viewport. They
are not device emulator captures or production captures.

| Capture | Observed result |
| --- | --- |
| [Pack desktop](verification-screenshots/pack-desktop-after.png) | Desktop heading, submission entry and two-column Pet of the Week; image height corrected. |
| [Pack tablet 768](verification-screenshots/pack-tablet-768.png) | Stacked feature, large imagery and accessible submission entry. |
| [Pack phone 390](verification-screenshots/pack-phone-390.png) | Wrapped heading, full photo and prominent contribution button. |
| [Gallery phone 320](verification-screenshots/pack-gallery-phone-320.png) | Single-column story cards, legible captions and sharing controls, no observed inner horizontal overflow. |
| [Submission phone 390](verification-screenshots/pack-phone-submission.png) | Three-step form and explicit private-review/separate-social explanation fit narrow width. |
| [Community Studio phone 390](verification-screenshots/community-phone-390.png) | Existing Manager shell, stacked controls and clearly disabled design-fixture mutations. |
| [Manager tablet 768](verification-screenshots/manager-tablet-768.png) | Existing Manager's Desk title, banner, notification control and team cards rendered. Synthetic account cannot verify avatar/menu. |
| [Intern phone 390](verification-screenshots/intern-phone-390.png) | Existing welcome panel and progress cards stack at phone width. Synthetic account cannot verify profile/header. |
| [Market tablet 768](verification-screenshots/market-tablet-768.png) | Readiness cards, map layer control and Leaflet geography render with synthetic market counts. Public map tiles are external resources; no live market records loaded. |

The supplied production reference folder was not present at
`C:\Users\jason\projects\sitguru3-production-references`. The user confirmed a
different path exists, but has not provided that path yet. No production parity
claim is made. Inspected repository historical captures including
`docs/intern-guide/screenshots/01-home-welcome.png` and
`docs/growth-responsive/growth-desktop-1280.png`; these show older portal and
growth surfaces and are not evidence of current authenticated Desk parity.
Admin HQ was not rendered as an authenticated user. Its live identity/menu,
Manager and Intern profile pictures, search, notification states and complete
role dropdowns remain pending isolated authenticated verification and the
correct production screenshot location. No Admin page source was changed.

## Test results

| Check | Result |
| --- | --- |
| `npm.cmd run test:sitguru3` | PASS: 4 Preview-policy + 66 workflow/API/Graph tests = 70, no failures. Backend workflow tests are synthetic/mocked, not real database tests. |
| `npm.cmd run test:desks` | PASS: 16 tests, no failures; rerun for dependency regression, no repeat preservation audit. |
| `npm.cmd run typecheck` | PASS. |
| `npm.cmd run build:isolated` | PASS on retry, Next 16.4.6 compilation, TypeScript, page generation and optimization. First attempt failed with Windows resource error 1450; retry after stopping the owned fixture server succeeded. Existing Plaid-missing and runtime/config deprecation warnings remain. |
| Expo full-source TypeScript | PASS using compatible installed Expo 56 / TypeScript 6 dependencies from the original checkout read-only and a temporary config in this workspace. Initial config resolution errors were corrected; temporary config removed. No source/dependency writes to the original checkout. |
| `node scripts/local-smoke.mjs 3101` | PASS: 8 loopback checks, including fixture/public pages, submit redirect, Manager access-denial page, Intern login redirect and anonymous API 401. |
| Compiled app access checks | PASS: `/dev/verification`, `/dev/pack`, `/dev/community-studio`, `/dev/portal-mockups` return 404; three existing cron endpoints return 401 without a cron secret. Tested credential-scrubbed production-mode app on loopback 3102, not production hosting. |
| `git diff --check` | PASS. |

The native package graph still declares MapLibre 5.x and its web screens refer
to 5.24.0 CSS; the web workspace upgrade does not fix that separate manifest.
The publisher's [MapLibre advisory](https://github.com/maplibre/maplibre-gl-js/security/advisories/GHSA-jrc7-96c5-q579)
covers these older versions. A native/web-map dependency upgrade and rendered
map regression pass are still required before releasing that app. No Expo
emulator, physical camera, native share sheet, installed PWA, codec playback or
signed binary was tested in this milestone.

## Remaining integration gates

No isolated Supabase or Microsoft tenant is established. Consequently actual
JWT role enforcement, storage/RLS, migration execution, two-account parent
approval/revocation, realtime delivery and authenticated M365 resource creation
are **not verified**. Existing synthetic workflow tests do not replace them.
Both community migrations remain unapplied. See the setup document rather than
using the live environment. No Vercel Preview URL exists; deployment is still
unapproved and blocked on isolated resources, access protection and integration
verification. Remaining high dependency advisories need compatibility review.

## Files and local review

This milestone changes `package.json`/lock, `next.config.ts`, `.gitignore`,
`app/dev/portal-mockups/page.tsx`, `app/dev/community-studio/page.tsx`,
`components/community-studio/PackCommunityPage.tsx`, the safe-next, local-smoke,
Preview policy/tests scripts, and adds `app/dev/verification/page.tsx`,
`components/dev/InternDeskVerification.tsx`, `lib/microsoft/graph.test.ts`, audit
JSON, this report, setup instructions and screenshot artifacts. Earlier feature
files remain preserved. No new migration or production integration configuration
was changed during this verification milestone.

Owned test servers were stopped after testing. To review locally:

```powershell
node scripts/safe-next.mjs dev 3101
```

Then open `http://127.0.0.1:3101/dev/verification?page=pack&width=390`,
`http://127.0.0.1:3101/dev/pack`, or
`http://127.0.0.1:3101/dev/community-studio`. The safe launcher refuses `.env`
files, scrubs provider credentials, and uses dummy loopback backend values.
Fixtures never submit, request real permission, or publish. Existing authenticated
portal routes retain their normal access gates.
