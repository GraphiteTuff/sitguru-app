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
| 1. Intern dashboard | Partial | Dashboard uses the authenticated intern workspace. The progress cards show completed versus assigned work for clear legacy categories, alongside separate 50/50 planned workload. Deadlines come from open assigned tasks and applicable milestones. My Files lists the intern's assignment folders. The final project route uses the existing project board. Dedicated announcements and gradebook access remain outstanding. |
| 2. Instructor and supervisor | Open | Audit found existing task creation, assignment review transitions, manager team scope, staff review events, and read-only student views. Confirm those paths and fill workflow gaps through shared components. |
| 3. Syllabus and growth pillars | Open | The previous branch adds both pillars to the existing syllabus. Persist assignment classification, validate approved program allocations, and attribute each approved time log and outcome once. |
| 4. Assignment workspace and Speed Review | Open | Existing SharePoint-backed draft handling and review events are available. Preserve submission versions and verify resubmission, secure previews, and role-scoped review. |
| 5. Private gradebooks | Open | Legacy employer grades and program evaluations exist. Implement versioned rubric and release handling with tested isolation. |
| 6. Partnerships and sponsorships | Open | The growth playbook lists two proposals. Verify persistence, outreach, asset, evidence, approval and referral workflows before enabling financial actions. |
| 7. Native and responsive verification | Open | Dashboard fixture passed at 320, 390, 768 and 1440 CSS pixels. Native authenticated workflows and builds remain unverified. |
| 8. Release | Blocked | The full verification gate must pass before merge, production migration or deployment. |

## Verification to date

- `npm run test:sitguru3` passed 66 tests, including internship, Graph, Teams and SharePoint tests with test fixtures.
- The new dashboard data test passed. It covers cross-intern and draft exclusion, school-specific dates, supervisor review still pending, and legacy categories without a clear primary pillar.
- `npm run test:desks` reported 19 passing and one failing. The unchanged desk-preservation test expects Community Studio immediately after Content Studio in Manager navigation, while the baseline also has Reads & Media between them. Preserve existing destinations and reconcile the expected menu order before release.
- Full repository lint reported 398 errors across the existing codebase. Retest the changed files and clear the release gate before merge.
- Chromium verified the dashboard fixture at 320, 390, 768 and 1440 CSS pixels with no horizontal overflow or overlap between the chat dock and mobile navigation. The two new routes and the Intern home redirected unauthenticated users to login locally. This did not exercise an authenticated production session.
- All ten requested production URLs responded to unauthenticated checks. Intern and Admin redirected to portal login. Manager URLs returned HTTP 200 and need content and role verification.
- No production changes or database migrations have been applied by this work.

## Resume

Start from the latest feature-branch commit and retain the draft PR. Reconcile the lint and navigation test failures and capture the build result. Verify the new routes using isolated intern, manager and Super Admin accounts. Continue through the checklist in order and record evidence with each phase's commit.

Keep the previous ready production deployment ID before any promotion. If a released web build needs to be withdrawn, reassign production traffic to the last verified deployment in Vercel, then verify the live SHA and the portal auth flows. Retain additive database structures during a web rollback and plan a forward correction for any migration with persisted new data.
