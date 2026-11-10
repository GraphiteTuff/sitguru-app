# Vercel preparation — NO-GO pending isolated hosted backend

Release base: `0f9b5eba`, feature branch
`feature/sitguru3-manager-community`. No feature expansion or Desk redesign.

## Completed

- Authenticated CLI/API verification succeeded for `sitguru_main`, project
  `prj_fa3TnhjSSV3QH4iKIxOLvdGBfLsb`, connected to
  `GraphiteTuff/sitguru-app`. Workspace confirmed at
  `C:\Users\jason\projects\pawnecto-sitguru3` on
  `feature/sitguru3-manager-community` with base commit `0f9b5eba`.
- Live Production deployment source is `sitguru-main` at `d8e2fcf7`. Its URL
  and deployment remain unchanged. The API tracking field still says `main`;
  it was NOT changed. Preserve the working source/promotion workflow.
- Audited all 59 project environment records and attached team-shared variables
  by name/type/scope. No secret values were printed, decrypted or saved to Git.
- Removed only Preview scope from 53 Production-shared entries. All 59 Production
  records retain their scope, name, type and stored value; the API verification
  compared stored values in memory. Zero project variables and zero attached
  shared variables now target Preview. No dummy credentials were added.
- Re-verified live Preview isolation with `vercel env pull --environment=preview`:
  only Vercel system keys were present; no Supabase, Stripe, Resend, Twilio,
  accounting, Places/geocoding, cron, webhook or Microsoft credentials.
- Prepared feature-branch `vercel.json` fix: production `sitguru-main` builds
  remain allowed; the exact feature branch builds only in an explicitly opted-in,
  isolated Preview. Other branches are skipped. A second pre-build check rejects
  unsafe forced builds. Existing production cron definitions are unchanged.
  Official Vercel docs: commit `ignoreCommand` overrides the dashboard Ignored
  Build Step for that deployment, so the feature-branch guard applies on push.
- Kept remote deployment protections unchanged. No production migration, merge,
  or live Microsoft permission change was performed.
- Existing hosted Supabase project `SitGuru Staging` (`ehdvngkqddttcwhjubwu`)
  is available as a candidate isolated backend, but it currently has only a
  small companion/staff/growth schema and is NOT ready for SitGuru 3.0 Preview
  until an approved schema-only baseline and synthetic accounts are loaded.

Evidence: [scope changes and verification](preview-scope-isolation.json),
[complete pre-change name/scope audit](release-vercel-verification.json).
Existing deployments retain their previous environment until replaced ([Vercel
environment-variable documentation](https://vercel.com/docs/environment-variables/managing-environment-variables)); scope
changes secure future builds, not old Preview functions. Historical Previews
were not deleted or redeployed. Do not use them as isolated SitGuru 3.0 previews.

## Checks

- Full isolated Next 16.4.6 build and its TypeScript check: PASS again.
- Workflow suite: 66 existing tests PASS; deployment-policy suite now 6 PASS
  (72 total), including actual skip/pre-build exit codes.
- Desk/authorized-role/navigation regression: 16 PASS again.
- Current web audit: 0 critical, 14 high, 9 moderate; unchanged high-risk
  AI SDK/Zod/SheetJS disposition remains open. Expo's last verified audit has
  0 critical; its build/typecheck results remain in the release report.
- Application, migrations, UI and Microsoft implementation were not changed in
  this deployment-only follow-up. Prior real isolated database/Auth/storage checks
  and responsive screenshots remain valid within their documented limits.
- Actual isolated migration/Auth/storage results: 10 checks passed, plus SQL
  privacy/edition/rights/audit checks. Not a claim that missing Intern scoping,
  realtime subscribers or actual per-user browser menus have been verified.

## Dashboard re-check

The `sitguru_main` Deployments list still shows Ready Production and Preview
rows for `d8e2fcf` on `sitguru-main` (about 1d old). Those are baseline
`sitguru-main` deploys, not SitGuru 3.0. A Status: Error filter chip can stay
selected while Ready rows remain visible; do not treat that chip as a live
outage. Production URL and tracking branch were not changed.

Live `vercel env ls` still lists every project variable as Production only,
matching the Preview-scope removal. Historical Preview deployments were not
deleted; do not reuse them as isolated SitGuru 3.0 previews.

## Required before enabling Preview

1. Approve use of existing `SitGuru Staging` (`ehdvngkqddttcwhjubwu`) as the
   isolated hosted backend, or approve provisioning a different project with an
   owner and budget. The local test stack cannot serve Vercel remote functions.
   Do not reuse the live SitGuru project (`mmtjhxnzuglbyumbsjhs`) or copy its
   user data.
2. Load a reviewed schema-only prerequisite baseline and synthetic accounts.
   Run `scripts/release-community-preflight.sql`, then the two reviewed community
   migrations in order. Confirm real booking ownership/schema compatibility.
3. Configure real Preview-only values in Vercel's encrypted settings:
   `NEXT_PUBLIC_SUPABASE_URL`, either `NEXT_PUBLIC_SUPABASE_ANON_KEY` or
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SITGURU_PREVIEW_SUPABASE_REF`, `SITGURU_ISOLATED_BACKEND=true`, and
   `SITGURU_ENABLE_SAFE_PREVIEW=true`. The URL/ref must match the non-production
   project. Use Preview-specific application URLs/redirect allowlists as needed.
   Do not send service keys in chat or store them in Git. Keep the opt-in absent
   until the backend is ready. Do not restore outbound/payment/cron credentials.
4. Validate the resolved environment, preserve Vercel Authentication, then commit
   reviewed deployment fixes, push the feature branch and open a PR targeting
   `sitguru-main`. Prefer `vercel.preview.json` / `--local-config` on a separate
   Preview project after isolation checks. Do not weaken production dashboard
   settings merely to force a Preview on `sitguru_main`.
5. Verify an actual Preview for that commit: complete Intern/Manager isolation,
   parent permissions, uploads/video, live notifications, per-user cookie-session
   names/avatars/authorized-role menus and responsive flows. Do not substitute
   unit/synthetic success for these checks.

A GitHub PR may exist for review of the gated deployment fixes. A functional
SitGuru 3.0 Vercel Preview URL does not exist until the isolated backend and
Preview-only opt-in variables are approved and configured. Stop before enabling
an unsafe or nonfunctional Preview. Production migration/release/backup/rollback
steps remain in [release-readiness.md](release-readiness.md); production actions
require separate explicit approval. No production database or live user data
was modified.
