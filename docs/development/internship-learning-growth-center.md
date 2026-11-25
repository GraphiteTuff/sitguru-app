# Internship Learning & Growth Center 2.0

## Starting point

- PR [#308](https://github.com/GraphiteTuff/sitguru-app/pull/308) was open, draft, and unmerged at `8fd34d01700717f0955908f949de6d95a8427d12` on November 25, 2026.
- Vercel's preview for that SHA was canceled. The latest ready production deployment at the start of this work was `dpl_5RX2XtrwoyQvG1nRWQkyg24CYjpn` at `ef4bc34ef46fef4c021708b500a52f2ddc08dd02`.
- The Supabase account has separate SitGuru and SitGuru Staging projects. The production schema already contains internship tasks, milestones, work comments, attachments, time logs, review events, evaluations, and referral tables. The internship tables inspected have RLS enabled and no browser-role policies. Existing server code uses service-role queries after application-level authorization.
- The native Expo source is in `sitguru-mobile/` in this checkout.
- No dashboard reference was attached. Use the existing SitGuru logo, paw treatment, and brand assets.

## Implementation checklist

| Phase | Status | Evidence and outstanding work |
| --- | --- | --- |
| 1. Intern dashboard | Partial | Dashboard uses the authenticated intern workspace. The progress cards show completed versus assigned work for clear legacy categories, alongside separate 50/50 planned workload. Deadlines come from open assigned tasks and applicable milestones. My Files lists the intern's assignment folders. The final project route uses the existing project board. Private announcements and the gradebook are linked. The Training board shows resources without fabricated completion percentages. Authenticated acceptance checks and a dedicated discussion forum remain outstanding. Discussions use the existing staff inbox and Teams workflow. |
| 2. Instructor and supervisor | Partial | Shared workspace is wired into Manager Portal and Admin HQ. It uses the existing authorized roster and review queue, review events, hours workflow, and student preview. The instructor can publish recipient-specific announcements. The staff roster links to midpoint and final employer evaluations. Assignment rows display recorded status, and upcoming deadlines use open work with future dates. Dedicated module authoring remains outstanding. |
| 3. Syllabus and growth pillars | Partial | The current syllabus stays in place. The existing assignment brief now stores one primary pillar, target audiences, syllabus objective, estimated hours and expected outcomes. Approved time logs linked to an owned assignment contribute once to its primary pillar. Verified outcome attribution and enrollment acceptance remain outstanding. |
| 4. Assignment workspace and Speed Review | Partial | The assigned-intern review queue filters by intern, cohort, assignment, milestone and pillar. Drafts support extra links and a SharePoint upload. New submissions get a separate SharePoint document and a Postgres snapshot. Both assignment detail screens can read the snapshots. Hosted Microsoft upload and authenticated end-to-end verification remain outstanding. |
| 5. Private gradebooks | Partial | Versioned assignment rubrics, private notes, release, individual gradebooks, pillar grades and employer evaluation exports are wired. Existing program evaluation records serve midpoint and final reviews. Hosted Supabase verified draft visibility, release and cross-intern isolation. Authenticated browser acceptance remains outstanding. |
| 6. Partnerships and sponsorships | Partial | Proposed pilot records, scoped prospect and activity screens, evidence verification, financial approval records and scoped marketing ZIPs are implemented. Payment approval requires a supervisor, an accepted paid agreement and verified evidence. The workspace links to existing referrals and does not create payouts. Hosted integration and partner attribution acceptance checks remain outstanding. |
| 7. Native and responsive verification | Partial | Expo has an intern learning screen and a scoped instructor queue. The web and mobile assignment forms now use the same server workflow for drafts, supporting documents and submission. Mobile instructor actions and partnership edits open the web portal. Expo exported iOS and Android bundles. Signed builds, device checks and live role tests are pending. |
| 8. Release | Blocked | Repository-wide lint and the desk regression pass. The four migrations are applied in staging. Authenticated staging and production verification and signed native builds remain outstanding. |

## Enrollment records

The production read-only audit returned Ryan at 150 hours and Lola at 150 hours, both with pending requirements and student-reported verification. Lalita was prospective with no recorded hour total. The planning request is 75 hours per pillar for Ryan and 150 per pillar for Lalita. Lola’s allocation needs the approved agreement. The dashboard only calculates hour targets from confirmed program records. This work did not change enrollment or university approval fields.

## Verification

| Check | Result |
| --- | --- |
| Internship, Community Studio, Microsoft Graph, Teams, SharePoint and regression suite | `npm run test:sitguru3` passed 73 tests, including 6 preview policy tests. Integration calls use fixtures. |
| Targeted internship, access, rubric and Microsoft tests | 36 passed, including manager scope, cross-intern access decisions, revision transitions and rubric validation. |
| Desk regression | `npm run test:desks` passed all 20 tests. The preservation test now asserts Content Studio, Reads & Media, and Community Studio in their existing order and covers the full intern sidebar. |
| Repository-wide lint | ESLint reports zero errors. The last pass resolved all 138 remaining `react-hooks/set-state-in-effect` findings by deriving state from inputs, handling browser persistence as external state, and moving request updates to asynchronous completions. All source rules remain enabled. |
| Web TypeScript and build | Web TypeScript and the isolated production-mode Next.js build passed with fixture credentials. Production credential and authenticated portal tests are pending. |
| Desktop/mobile browser | The dashboard fixture passed at 320, 390, 768 and 1440 CSS pixels. The document matched each viewport width, and the floating chat control cleared the mobile navigation. |
| Anonymous authorization | New Intern and Admin pages redirected to login. Manager pages rendered the default access denial. Native learning/work and protected exports denied unauthenticated access. The local smoke suite passed, including the exact Pack submit redirect in HTTP or streamed HTML. |
| Native | Expo TypeScript and iOS, Android, and web bundle exports passed. Signed IPA, APK and AAB artifacts still require an EAS release build and signing configuration. |
| Vercel baseline logs | The 30-minute error/fatal query for the existing production deployment returned no grouped results. |

### Migration verification

Run `node scripts/internship-migration-smoke.mjs` with Docker and Postgres 17. The script creates a disposable fixture database and applies the four migrations in order.

SitGuru Staging (`ehdvngkqddttcwhjubwu`) received a schema-only baseline at `20261125132156`. The baseline added 64 missing tables from production definitions, including the foreign-key dependencies, indexes, row policies and necessary grants. It left the 21 existing public tables intact. Production data and side-effect triggers and webhooks were excluded. Local Postgres restored this baseline and the four feature migrations, with RLS enabled on all 69 restored or added tables. Hosted staging reported RLS enabled on all 90 public tables after migration.

The Supabase connector assigned staging ledger versions `20261125132239`, `20261125132244`, `20261125132249`, and `20261125132254` respectively. These entries contain the SQL from the repository files below. Account for the ledger version differences before using the Supabase CLI to push migrations to this existing staging project. Rolled-back staging transactions tested submission snapshots, revision and resubmission, draft and private-note visibility, released evaluations, cross-intern isolation, and sponsorship approval requiring verified evidence and supervisor authority. The tests left no approval records and made no payments. Live account provisioning, SharePoint upload permissions, and referral and payment workflow acceptance still need end-to-end verification. Production has received none of the four migrations.

| Migration | Verified behavior |
| --- | --- |
| `20261125102545_internship_announcements.sql` | Service-only, append-only announcements, idempotent retries, and rejection of invalid publisher roles. |
| `20261125103107_internship_assignment_submission_history.sql` | Submit, request revision, edit a draft, resubmit and approve. Both submitted versions stayed intact. Direct client reads and service-role updates or deletions were blocked. |
| `20261125103512_internship_private_assignment_evaluations.sql` | Two linked synthetic intern accounts saw only their own released scores. Drafts, cross-intern access, private note reads, and client deletions were blocked. The database rejected a task/evaluation owner mismatch. |
| `20261125104036_growth_partner_proposals.sql` | The two proposed terms total $180. Agreement acceptance is retry-safe. A manager can verify evidence. Payment approval requires a supervisor, accepted paid terms, and verification. The test records approval in the internal activity log. |

### Production audit

The `www.sitguru.com` alias resolved to Vercel deployment `dpl_5RX2XtrwoyQvG1nRWQkyg24CYjpn`, built from `sitguru-main` at `ef4bc34ef46fef4c021708b500a52f2ddc08dd02`. Remote PR #308 remained draft at `8fd34d0`. All implementation commits are local. Hosted databases and deployment settings were read-only during the audit.

| Production page | Anonymous result |
| --- | --- |
| [Intern Portal](https://www.sitguru.com/intern) | 307 to Intern login |
| [Intern Growth](https://www.sitguru.com/intern/growth) | 307 to Intern login |
| [Intern Assignments](https://www.sitguru.com/intern/assignments) | 307 to Intern login |
| [Intern Milestones](https://www.sitguru.com/intern/milestones) | 307 to Intern login |
| [Manager Portal](https://www.sitguru.com/manager) | 200 with Access Restricted |
| [Manager Assignments](https://www.sitguru.com/manager/assignments) | 200 with Access Restricted |
| [Manager Milestones](https://www.sitguru.com/manager/milestones) | 200 with Access Restricted |
| [Manager Community Studio](https://www.sitguru.com/manager/community-studio) | 200 with Access Restricted |
| [Admin Internship Program](https://www.sitguru.com/admin/internship) | 307 to Admin login |
| [Admin Syllabus](https://www.sitguru.com/admin/internship/playbook) | 307 to Admin login |

## Changed areas

- Intern entry points, portal shell, home, syllabus link, files, final project, announcements, assignment details, and gradebook are in `app/intern` and `components/internship`.
- Staff instructor and evaluation routes are in `app/manager/instructor`, `app/manager/speed-review`, and `app/admin/internship/instructor`. Assignment actions and review helpers are in `lib/internship`.
- SharePoint submission storage is in `lib/microsoft/assignment-sharepoint.ts`. The web and Expo form entry points use `lib/internship/assignment-progress-service.ts`.
- Partnership screens share `components/admin/growth/PartnerProposalWorkspace.tsx`. Access and mutations are in `lib/admin/growth/partner-proposal-*.ts`. The marketing-kit ZIP and employer evaluation export are in `app/api`.
- Expo UI is in `sitguru-mobile/src/app/intern-learning.tsx`, `intern-portal.tsx`, and `growth-insights.tsx`. The native API is in `app/api/internship`.
- Migrations are in `supabase/migrations`. Repeatable smoke checks are in `scripts/local-smoke.mjs` and `scripts/internship-migration-smoke.mjs`.

## Resume and release

1. Use isolated staging intern accounts and assigned manager and Super Admin accounts for browser and API acceptance tests. Check live SharePoint document permissions, staging referral attribution, and partner financial approval without creating a payout. Check the staging migration ledger before any CLI migration push.
2. Close the remaining product gaps before release. These include module authoring, verified business-outcome attribution by pillar, inline document previews, partner-specific reporting and full native instructor and partner editing. Confirm the approved Spring 2027 enrollment records and Lola’s agreement.
3. When all gates pass, update PR #308, merge to `sitguru-main`, apply the verified additive migrations to the confirmed production project, then verify the Vercel deployment SHA, authenticated portals, and runtime logs.
4. Prepare signed native artifacts through the existing Expo EAS profiles. The current exports verify bundle creation. Store distribution requires separate signed builds and release acceptance.

## Rollback

The rollback candidate verified during this work is Vercel deployment `dpl_5RX2XtrwoyQvG1nRWQkyg24CYjpn` at `ef4bc34ef46fef4c021708b500a52f2ddc08dd02`. If a later release needs to be withdrawn and this is still the last verified deployment, use Vercel Instant Rollback to restore it and confirm the custom domain, current SHA and portal sign-in. For newer releases, use the last verified production deployment recorded immediately before promotion. Retain additive database tables that have collected data and use a forward correction if schema changes need to be reversed.

## Staff and intern workflow after release

- **Ava** opens Instructor Center in the Manager Portal to assign work, post announcements and review the assigned team. Speed Review filters the pending assignment queue.
- **Jason** opens Instructor & Supervisor Center in Admin HQ to oversee reviews, release final employer evaluations and record sponsorship approval after verification.
- **Interns** open Learning & Growth Center to see due work and hours, submit assignment files through the existing SharePoint connection, and see released grades and announcements.

## Spring 2027 Pre-Launch release checklist

The existing cohort's official dates are January 12 through May 7, 2027. The independent academic state defaults to Pre-Launch with activation OFF. Applying the migration does not activate the cohort or change an enrollment, assignment, timesheet, pay agreement, or milestone.

| Item | Status |
| --- | --- |
| Cohort Program Controls | Implemented in Admin HQ and Manager Portal using shared persistent state. Changes require a current revision, an authorized role, and explicit confirmation. A database transaction records the actor, timestamp, and transition together. |
| Gradebook and academic release | Gradebook shell, instructor draft preparation, and release guards are implemented. The database blocks assignment and program evaluation release while the cohort is inactive. Grades and exports require separate release verification. |
| Official weekly check-ins and reminders | Visible with server-side gates for semester status and independent verification. Existing check-in history stays available. |
| Assignment submissions | Existing SharePoint work links and the draft, submit, review, and revision flow remain available. Postgres records a snapshot per submission. New upload and SharePoint file-versioning controls await verification. |
| Community and media pilots | The two proposed six-month pilots remain proposals. Existing Community Studio, Campus Growth, Content Studio, and referral paths remain available. The proposal pipeline, administrative approval, and kit ZIP are gated pending authenticated verification. |
| Verification | Run the internship GitHub workflow and confirm the exact head. Local suites cover deployment policy, intern authorization, the existing desks, and all five migration files. |
| Release and acceptance | Use the existing production configuration. Verify the deployment SHA, domain, role-based sign-in, operational work, runtime errors, and the Program Controls OFF state. Authenticated testing requires access to each corresponding role. |
| Native | Run native type checking and Expo bundle exports. TestFlight and Android distribution require separately signed artifacts and device acceptance. |
| Outstanding | Approved early-work credit designation, official 15-week schedule and progress tracking, richer module and discussion workflows, analytics attribution, full native instructor editing and deployment acceptance. |

### Routes and enrollment

- Learning & Growth Center `/intern`
- Instructor & Supervisor Center `/manager/instructor` and `/admin/internship/instructor`
- SitGuru Speed Review `/manager/speed-review`
- Private gradebook `/intern/grades`
- Manager Program Controls `/manager/internship/program-controls`
- Admin Program Controls `/admin/internship/program-controls`
- Partner workspace `/manager/partners` and `/intern/growth/partners`. The ZIP handler has a per-proposal URL displayed inside the authorized workspace when available.

Use the existing approved cohort and university records. Ryan's workload plan is 75 hours in each pillar. Lalita's proposed plan is 150 in each pillar once documented. Use Lola's approved agreement for any allocation. Leave pre-launch and paid work in its existing workflow until academic eligibility is reviewed.

### Release controls and rollback

Keep `SITGURU_INTERNSHIP_PROGRAM_CONTROLS_VERIFIED`, `SITGURU_INTERNSHIP_GRADING_VERIFIED`, `SITGURU_INTERNSHIP_CHECK_INS_VERIFIED`, `SITGURU_INTERNSHIP_DEADLINES_VERIFIED`, `SITGURU_ASSIGNMENT_FILES_VERIFIED`, and `SITGURU_PARTNER_PROPOSALS_VERIFIED` disabled until each corresponding workflow passes acceptance. Enabling the Program Controls flag makes the authorized UI available and leaves the cohort in its existing state. Activation remains a manual action in Program Controls. Ava must be the cohort's assigned manager. Jason uses his Super Admin account. To activate once approved, choose the cohort, review readiness, check the confirmation, and select Activate semester. Pause and complete also require confirmation.

The isolated Preview allowlist requires the exact release SHA through `SITGURU_PREVIEW_RELEASE_SHA`, SitGuru Staging (`ehdvngkqddttcwhjubwu`), branch-scoped staging credentials, the existing safe Preview opt-ins, and no outbound credentials. It never substitutes production credentials.

The migration `20261125152918_internship_program_controls.sql` follows the private assignment evaluation table. Apply the five additive migrations in filename order when absent on the target project. Apply before starting a production build from the merged source. In a rollback, restore the previously verified Vercel deployment, keep additive tables and audit history, and verify the domain and role sign-in. Keep independent gates off while the issue is diagnosed.
