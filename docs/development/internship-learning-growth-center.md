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
| 1. Intern dashboard | Partial | Dashboard uses the authenticated intern workspace. The progress cards show completed versus assigned work for clear legacy categories, alongside separate 50/50 planned workload. Deadlines come from open assigned tasks and applicable milestones. My Files lists the intern's assignment folders. The final project route uses the existing project board. A private Announcements destination is in the Phase 2 changes. Gradebook access and authenticated acceptance checks remain outstanding. |
| 2. Instructor and supervisor | Partial | Shared workspace is wired into Manager Portal and Admin HQ. It uses the existing authorized roster and review queue, review events, hours workflow, and student preview. The instructor can publish recipient-specific announcements. Dedicated module management and midpoint/final grading controls remain outstanding. |
| 3. Syllabus and growth pillars | Partial | The current syllabus stays in place. The existing assignment brief now stores one primary pillar, target audiences, syllabus objective, estimated hours and expected outcomes. Approved time logs linked to an owned assignment contribute once to its primary pillar. Verified outcome attribution and enrollment acceptance remain outstanding. |
| 4. Assignment workspace and Speed Review | Partial | The assigned-intern review queue filters by intern, cohort, assignment, milestone and pillar. Drafts support extra links and a SharePoint upload. New submissions get a separate SharePoint document and a Postgres snapshot. Both assignment detail screens can read the snapshots. Hosted Microsoft upload and authenticated end-to-end verification remain outstanding. |
| 5. Private gradebooks | Partial | Versioned assignment rubrics, private notes, release, individual gradebooks, pillar grades and employer evaluation exports are wired. Existing program evaluation records serve midpoint and final reviews. Hosted Supabase role tests and end-to-end release acceptance remain outstanding. |
| 6. Partnerships and sponsorships | Open | The growth playbook lists two proposals. Verify persistence, outreach, asset, evidence, approval and referral workflows before enabling financial actions. |
| 7. Native and responsive verification | Open | Dashboard fixture passed at 320, 390, 768 and 1440 CSS pixels. Native authenticated workflows and builds remain unverified. |
| 8. Release | Blocked | The full verification gate must pass before merge, production migration or deployment. |

## Enrollment records

The production read-only audit returned Ryan at 150 hours and Lola at 150 hours, both with pending requirements and student-reported verification. Lalita was prospective with no recorded hour total. The planning request is 75 hours per pillar for Ryan and 150 per pillar for Lalita. Lola’s allocation needs the approved agreement. The dashboard only calculates hour targets from confirmed program records. This work did not change enrollment or university approval fields.

## Verification to date

- `npm run test:sitguru3` passed 66 tests, including internship, Graph, Teams and SharePoint tests with test fixtures.
- The new dashboard data test passed. It covers cross-intern and draft exclusion, school-specific dates, supervisor review still pending, and legacy categories without a clear primary pillar.
- `npm run test:desks` reported 19 passing and one failing. The unchanged desk-preservation test expects Community Studio immediately after Content Studio in Manager navigation, while the baseline also has Reads & Media between them. Preserve existing destinations and reconcile the expected menu order before release.
- Full repository lint reported 398 errors across the existing codebase. Retest the changed files and clear the release gate before merge.
- Chromium verified the dashboard fixture at 320, 390, 768 and 1440 CSS pixels with no horizontal overflow or overlap between the chat dock and mobile navigation. The two new routes and the Intern home redirected unauthenticated users to login locally. This did not exercise an authenticated production session.
- All ten requested production URLs responded to unauthenticated checks. Intern and Admin redirected to portal login. Manager URLs returned HTTP 200 and need content and role verification.
- An isolated production-mode web build compiled successfully. It ran using local placeholder credentials. Rebuild from the final release commit.
- Applied `20261125102545_internship_announcements.sql` to a disposable Postgres 17 database. RLS was enabled, direct anon/authenticated privileges were absent, service-role inserts were append-only, duplicate retries were idempotent, and invalid publisher roles were rejected. Hosted Supabase was used for read-only inspection.
- Applied `20261125103107_internship_assignment_submission_history.sql` to disposable Postgres. Tested submit, revision, draft edit, resubmit and approval. Both submitted versions stayed intact, and direct browser roles and service-role updates/deletes were denied by grants.
- Applied `20261125103512_internship_private_assignment_evaluations.sql` to disposable Postgres with two linked synthetic intern accounts. Each authenticated role could read its own released totals only. Drafts, cross-intern records, private note columns, and client deletions were blocked. Mismatched assignment ownership was rejected by the composite foreign key.
- No production changes or hosted database migrations have been applied by this work.

## Resume

Start from the latest feature-branch commit and retain the draft PR. Reconcile the lint and navigation test failures and capture the build result. Verify the new routes using isolated intern, manager and Super Admin accounts. Continue through the checklist in order and record evidence with each phase's commit.

Keep the previous ready production deployment ID before any promotion. If a released web build needs to be withdrawn, reassign production traffic to the last verified deployment in Vercel, then verify the live SHA and the portal auth flows. Retain additive database structures during a web rollback and plan a forward correction for any migration with persisted new data.
