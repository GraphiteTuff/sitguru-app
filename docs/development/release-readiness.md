# SitGuru 3.0 release checkpoint — NO-GO

Feature work is frozen. The user subsequently authorized committing and
deployment. This local feature-branch commit checkpoints the reviewed work;
production remains NO-GO because the verified release blockers are unresolved.
No push, PR, production migration, production environment change, Vercel setting
change or deployment has been performed. No approval has been treated as evidence
that an unsafe Preview or an unverified production release is ready.

## Verified release facts

- Repository: `GraphiteTuff/sitguru-app`; current branch
  `feature/sitguru3-manager-community`.
- At the release fetch, HEAD and `origin/sitguru-main` were both
  `d8e2fcf7ba88e03b100edf9bb52d5f59e65c9795`; ahead/behind was 0/0.
  The local checkpoint adds the reviewed feature changes to that base.
  No newly introduced upstream conflict was found.
- Read-only authenticated Vercel dashboard confirms project `sitguru_main`,
  team `jason-graffs-projects`, project ID
  `prj_fa3TnhjSSV3QH4iKIxOLvdGBfLsb`, connected to this GitHub repository.
  **Production tracks `main`, not `sitguru-main`.** The screenshot's
  `sitguru-main` deployment was Preview and its Production counterpart was a
  separate rebuild. A PR to `sitguru-main` alone is not a verified automatic
  production release path.
- Dashboard Ignored Build Step:
  `if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi`.
  The repository has a separate branch-based skip rule. Do not change either
  production setting merely to enable feature previews.
- Vercel Authentication is enabled with Standard Protection. Several sensitive
  integrations are scoped to both Production and Preview, including
  `RESEND_API_KEY`, `QUICKBOOKS_CLIENT_SECRET` and `WAVE_CLIENT_SECRET`.
  Values were not revealed, copied or changed. This project is unsafe for
  experimental Preview writes/messages without separately isolated configuration.
- Existing Vercel CLI credentials return HTTP 403. Browser verification succeeded;
  no credential rotation or reauthentication was attempted. No safe feature
  Preview URL exists. Existing baseline deployment URLs are not SitGuru 3.0.

See [Vercel evidence](release-vercel-verification.json).

## Checks completed on the release candidate

| Gate | Result |
| --- | --- |
| Full web isolated production build | PASS, Next 16.4.6, compilation/TypeScript/prerender/optimization. Existing missing-Plaid and deprecated runtime/config warnings remain. |
| Web typecheck | PASS. |
| Focused workflow/API/Preview tests | PASS, 70 tests. These remain unit/synthetic tests, separately identified from real integration checks below. |
| Desk/role/navigation regression | PASS, 16 tests. No Manager, Intern or Admin redesign. |
| Production-mode fixture/cron smoke | PASS, four fixture routes 404; three cron routes 401 without a secret. |
| Release source pattern scan | 124 changed/untracked candidate files at scan time, zero private-key/provider-secret/AWS-key pattern findings. Not a comprehensive secret-scanner certification. |
| Web dependency audit | 0 critical, 14 high, 9 moderate. |
| Expo dependency audit after fixes | 0 critical, 12 high, 14 moderate, 2 low. |
| Expo full-source typecheck | PASS against the feature workspace's newly installed lockfile, no borrowed dependencies. |
| Expo web export | PASS, 53 routes and web bundles exported. MapLibre's exported ESM subpath resolves without the initial Metro fallback warning after the compatibility fix. Existing web notification and color-environment warnings remain. Physical-device rendering and camera tests are not implied. |
| Whitespace validation | `git diff --check` PASS. |

Temporary reference screenshots, generated browser captures, local test keys,
test exports and CLI caches are ignored by Git and excluded from Vercel source
uploads. No real `.env` files are present in this checkout. Fixtures remain
development-only and retain the production 404 gate.

### Release-only fixes

Expo's MapLibre dependency is pinned to patched 6.17.0, matching the already
patched web dependency; both Expo web-map CSS URLs match it, and web-only runtime
loading uses its exported ESM bundle. Its lockfile's
critical `shell-quote` command-injection advisory was removed with a compatible
transitive update. No AI SDK major migration or feature expansion was attempted.
The [MapLibre publisher advisory](https://github.com/maplibre/maplibre-gl-js/security/advisories/GHSA-jrc7-96c5-q579)
and [shell-quote advisory](https://github.com/advisories/GHSA-pqg4-j6r4-53mv)
describe the critical fixes.

Remaining high findings include AI SDK file-part handling, constrained collection
validation in Zod, and SheetJS parsing. The existing officer route forwards
client-supplied message arrays to the SDK; exploitability of non-text parts is
not ruled out and needs focused mitigation or a tested SDK upgrade before
security sign-off. Inspected SheetJS usage includes authenticated financial
exports, not evidence that every parsing path is unreachable. These are existing
risks, not resolved by a green build or by the zero-critical count.

## Real isolated database and authenticated tests

Created a disposable local Supabase CLI 3.1 stack in ignored `.release-local`
with project ID `release-local`. It has no production project link. Production's
existing repository `.temp/project-ref` was identified and never used for a
database command. No hosted Supabase resources were created.

Applied the existing `20260905_internship_program.sql` baseline and BOTH new
community migrations successfully to local Postgres 17.11. For missing original
booking DDL the test uses a minimal, explicitly test-only UUID booking table.
This does **not** verify compatibility with the actual production booking schema.

Ten actual checks passed with four newly created local Auth users/password
sessions, real JWT verification, real server endpoints, real storage and real DB:

1. Four local Auth sessions were issued successfully.
2. An unprivileged user's JWT cannot open the Manager moderation queue.
3. Anonymous member access is denied.
4. Signed upload, sanitization and private storage succeed; another user's
   upload receipt is rejected.
5. A Guru's checkbox alone cannot authorize manager approval.
6. Pending media is not anonymously retrievable.
7. Only the booking's verified Pet Parent can approve; social refusal is separate.
8. Manager approval/publication works and the public response hides identity.
9. Parent revocation removes public visibility.
10. Direct Data API private-table reads fail for real authenticated JWTs.

The Manager test uses the existing trusted `ADMIN_EMAILS` server configuration
with `manager@example.test`, only in the scrubbed local test process. No editable
role metadata or mock actor is used. No emails, Teams messages or external
notifications were sent. [Actual result artifact](release-authenticated-results.json).

Additional transactional SQL checks passed for private grants, private bucket and
25 MB limit, unique Pet of the Week editions, website consent, unsafe media,
unverified parent publication, and audit triggers. Test mutations rolled back.
[SQL checks](../../scripts/release-community-constraints.sql).

Still missing: authenticated assigned/unassigned Intern and unrelated Manager
scoping, real realtime subscriptions, actual cookie-session avatar/complete role
dropdowns, video upload/device behavior, and production-schema compatibility.
The local tests must not be described as a complete hosted Preview acceptance.

Reproduction in a fresh local stack only: initialize `.release-local` with the
official CLI, start it, save `supabase status --workdir .release-local -o json`
to ignored `.release-local/status.json` without printing credentials, then run
`node scripts/prepare-community-local.mjs`,
`node scripts/start-community-local.mjs` and, in another terminal,
`node scripts/test-community-local.mjs`. Preparation requires the exact
`supabase_db_release-local` container and applies a test-only booking prerequisite.
These helpers are never production setup scripts. They require fresh synthetic
state and are not destructive resets of an existing project.

## Shortest safe route to a Preview and PR

1. Authorize an isolated hosted Supabase project (existing test project or new
   approved resource/budget) and a separate protected Vercel Preview project.
   Loopback Supabase cannot serve Vercel's remote functions. Do not inherit the
   live project's Production/Preview credentials or alter the production project.
2. Populate a reviewed schema-only baseline and synthetic accounts there. Verify
   read-only prerequisites and the actual booking ownership mappings, then apply
   only the two community migrations. Test the remaining role/realtime/cookie
   workflows there, including the existing Desks and unchanged Admin HQ.
3. Use `vercel.preview.json` only in the separate Preview project, with exact
   feature branch, Preview environment, isolated backend reference/public/service
   keys and the explicit safe-preview flags. No payment, cron, email, SMS,
   Microsoft or webhook credentials. Keep Vercel Authentication enabled.
4. Refresh authorized CLI/API access for that test project if needed. The current
   saved token's 403 cannot be treated as deployment authorization or bypassed.
5. Finish high-risk dependency disposition and Expo map runtime verification.
   A new Microsoft tenant is NOT required: `lib/microsoft` integration code is
   unchanged. Community additions only map existing shortcut destinations; they
   do not introduce Graph/Teams sends. Any new outbound path stays unconfigured.
6. The reviewed source/docs/test helpers are checkpointed on the feature branch.
   Once critical gates pass, push that reviewed branch and open a PR targeting
   `sitguru-main`. Verify an actual protected Preview of that exact commit.
   Stop for production approval; do not merge or promote as part of this step.

## Proposed production sequence — NOT EXECUTED

1. Obtain explicit approval for the final tested commit, database change and
   chosen Vercel branch/release mapping. Resolve `main` versus `sitguru-main`
   explicitly; never silently change the project's production tracking branch.
2. Confirm production backup/restore availability and record the current active
   deployment. Run the read-only
   [schema preflight](../../scripts/release-community-preflight.sql). Verify all
   UUID foreign-key types, booking Guru/parent mappings, existing community
   objects if any, and any triggers/integrations not represented locally.
3. Apply the [prepared atomic migration entry point](../../scripts/release-community-migrate.sql)
   only to the approved target. It includes `20261109_community_studio.sql`
   first, then `20261110_community_permissions_media.sql`, in one transaction
   with `ON_ERROR_STOP`. Do not run all pending historical migrations or the
   local schema-preparation helper on production.
4. Merge/promote the approved commit using the confirmed GitHub-to-Vercel path.
   If production requires manual promotion/rebuild today, that production action
   also waits for explicit approval. Preserve existing production credentials,
   domains, scheduled jobs and Microsoft resources.
5. Verify the live deployment corresponds to that commit, both Desks/Admin
   access gates, existing accounts/assignments/files, role menus and sessions,
   then the new community workflows. Do not create test content or send messages
   to Ava/interns. Use previously authorized test identities/resources only.
   Existing-user continuity has not yet been verified against a new live build.

Migration SHA-256:

```text
8F1018F1DBF805BC6FF9CAC249773948863A773095664B7214A48349C8A3A8F6  20261109_community_studio.sql
4812FCD3EB795454661EAE4FF7619E5A437A9CE04787353F864DB5034FAF26A4  20261110_community_permissions_media.sql
```

The migrations add community tables/columns/triggers and a private bucket. They
do not delete or rewrite existing accounts, bookings, assignments or files.
The refinement deliberately does not convert legacy combined consent into new
website/social grants; any partially migrated old community content requires
re-consent before republishing. Actual production compatibility is still a gate.

## Rollback

- Before transaction commit, any SQL error aborts the whole community change.
- After deployment, revert/promote back to the recorded last known good Vercel
  deployment with approval; preserve the Git commit and release log.
- Leave the additive community tables, uploaded media, permissions and audit
  records intact. Do not drop the bucket/tables or restore the entire live DB
  merely to roll back application code: that would risk losing active user work.
- If new publication needs containment, use an approved targeted rollback or
  moderation action; do not disable existing Desks, assignments or Microsoft
  resources. Review any data repair separately with backups and exact scope.
- Mobile app rollout is separate from Vercel. No signed iOS/Android build or
  store/OTA release was authorized or performed here.

Owned local app servers and the isolated Supabase stack were stopped after the
checks. Synthetic data is retained in local Docker volumes; no production data
was copied into them. No actual feature Preview URL, PR URL or new production
deployment exists.
