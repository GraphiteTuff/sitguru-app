# SitGuru 3.0 isolated development

Work only in `C:\Users\jason\projects\pawnecto-sitguru3`, branch
`feature/sitguru3-manager-community`. Do not copy production environment files,
run existing seed/journey scripts against production, deploy production, or push
to `sitguru-main`.

## Dependencies and local checks

Node 22 or 24 and the committed lockfile are supported. On Windows use `npm.cmd`
when PowerShell execution policy blocks `npm.ps1`.

```powershell
npm.cmd ci --ignore-scripts --cache .npm-cache
npm.cmd run test:sitguru3
npm.cmd run typecheck
npm.cmd run build:isolated
```

`--ignore-scripts` installs the existing dependency graph without third-party
lifecycle scripts. `.npm-cache` is checkout-local and ignored. Do not use `npm audit fix
--force`: existing audit findings need separate compatibility review.

The locked baseline installed on November 9, 2026 reports 31 audit findings
(2 critical, 18 high, 10 moderate, 1 low). The critical direct dependencies are
`next@16.2.6` and `maplibre-gl@5.24.0`; the registry reports a Next upgrade and a
MapLibre major upgrade as fixes. The visual-verification milestone updates Next
and eslint-config-next to 16.4.6, MapLibre to 6.17.0, and Sharp to 0.35.5 in the
web workspace. Its audit now reports 0 critical, 14 high and 9 moderate findings.
See the before/after audit JSON and `visual-verification-2026-11-09.md`.
Native dependencies are separate and need their own security verification.

`build:isolated` runs a full Next production-mode build with a loopback dummy
Supabase endpoint, no real credentials, and telemetry disabled. Backend calls
cannot reach production. It refuses environment files because Next loads them
itself. This checks compilation and prerendering; it does not validate database
policies or authenticated integration behavior.

The native Community Studio in `sitguru-mobile` uses the existing bearer-token
API. In Expo development it also requires
`EXPO_PUBLIC_SITGURU3_ISOLATED_DEVELOPMENT=true` and a non-production API origin.
The server independently enforces `SITGURU_ISOLATED_BACKEND=true`. Keep device
tests on the isolated backend; do not enable production origins in development.

```powershell
npm.cmd run dev:fixture
```

The read-only responsive UI fixture is available at
`http://127.0.0.1:3100/dev/community-studio`. Fixture content is explicitly
labeled and mutations are disabled. Existing portal routes keep their normal
authentication requirements; fixture mode does not bypass them.
With that fixture server running, `npm.cmd run test:local-smoke` checks its HTTP
response and verifies anonymous Manager, Intern, and Community API access gates.

## Functional development backend (not yet provisioned)

The user has confirmed that no isolated project or Microsoft testing tenant is
established. Do not create resources or apply either migration until approved.
Follow `isolated-integration-setup.md` for prerequisites, costs, permissions and
the acceptance test matrix. The configuration below is preparation only.

Provision a separate Supabase project containing only synthetic test accounts.
Apply the existing prerequisite migrations, then the Community Studio migration
in that project. No migrations have been applied by this implementation.
Configure these values in a local, ignored `.env.local` **only for that isolated
project** and run the normal `npm.cmd run dev`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<isolated-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<isolated-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<isolated-service-role-key>
SITGURU_ISOLATED_BACKEND=true
```

The publishable public key can replace `NEXT_PUBLIC_SUPABASE_ANON_KEY` using the
existing `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` variable. Never put a service role
key in a `NEXT_PUBLIC_` variable. New Community Studio writes fail closed without
the isolated-backend flag outside the production deployment environment.

Do not add live Resend, Twilio, Microsoft Graph, Teams webhook, Stripe, PayPal,
SMTP, or other outbound credentials to development. Existing Microsoft resources
and production settings remain unchanged. Validate those workflows later using
an isolated tenant and test recipients; no messages are sent by these checks.

## Vercel feature Preview blocker

The existing `vercel.json` intentionally skips every branch except
`sitguru-main`. It remains unchanged. The alternative `vercel.preview.json`
provides an isolated path for this feature branch using a **separate Preview
project**. It has no cron definitions and does not enable previews by default.
Vercel's [ignored build step](https://vercel.com/docs/project-configuration/vercel-json#ignorecommand)
uses exit 0 to skip and exit 1 to build; the separate pre-build check also blocks
unsafe environments if the ignored-build step is bypassed.

Only after a separate project/backend exists, select the alternative config
using the Vercel CLI's [`--local-config vercel.preview.json`](https://vercel.com/docs/cli/global-options#local-config) option. Do not link
this checkout to the production Vercel project. Required Preview-scoped values:

```dotenv
SITGURU_ENABLE_SAFE_PREVIEW=true
SITGURU_ISOLATED_BACKEND=true
SITGURU_PREVIEW_SUPABASE_REF=<isolated-20-character-project-ref>
NEXT_PUBLIC_SUPABASE_URL=https://<same-isolated-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<isolated-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<isolated-service-role-key>
```

Vercel must identify the environment as `preview` and the branch as
`feature/sitguru3-manager-community`. Production references, missing flags,
different branches, URL mismatches, and outbound service credentials fail
closed. No Vercel project, settings, environment variables, or deployment was
changed by the local implementation. An actual Preview URL remains pending
isolated infrastructure and deployment verification.

The baseline `/api/stripe/checkout` threw at module load without
`STRIPE_SECRET_KEY`. It now uses the existing lazy Stripe SDK helper after
authentication, allowing the full app to compile without payment credentials.
Payment processing still requires its normal credentials at request time.
