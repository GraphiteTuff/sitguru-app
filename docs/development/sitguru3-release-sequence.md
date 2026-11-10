# SitGuru 3.0 release sequence — awaiting approval

Prepared commit: `f7868e96` on `feature/sitguru3-manager-community`
Base: `origin/sitguru-main` at `d8e2fcf7` (already included)
Workspace: `C:\Users\jason\projects\pawnecto-sitguru3`

This uses the existing GitHub → `sitguru-main` → Vercel production path.
No staging project, Preview opt-in, or credential changes.

## Already verified

- Feature work preserved (`0f9b5eba` and follow-ups).
- `vercel.json` restored to the established `sitguru-main` ignore rule.
- Desk / role / SitGuru 3.0 regression: PASS.
- Typecheck: PASS.
- Isolated production build: PASS (Next 16.4.6).
- Production DB (read-only): community tables and
  `sitguru-community-private` bucket are absent; internship + bookings
  prerequisites exist. `bookings.id` is UUID; parent ownership columns are UUID;
  `bookings.guru_id` is text (migration only FKs `bookings.id`, so OK).

Migration hashes:

```text
8F1018F1DBF805BC6FF9CAC249773948863A773095664B7214A48349C8A3A8F6  20261109_community_studio.sql
4812FCD3EB795454661EAE4FF7619E5A437A9CE04787353F864DB5034FAF26A4  20261110_community_permissions_media.sql
```

Both migrations are additive: new tables/columns/triggers + private bucket.
They do not rewrite accounts, bookings, desks, avatars, role switchers, or
Microsoft resources.

## Stop here until Jason approves

Do not run production SQL or merge until explicit approval.

## After approval — exact order

1. Confirm a current Supabase backup/restore point for project
   `mmtjhxnzuglbyumbsjhs` (SitGuru production).
2. Run read-only preflight against production:
   `psql ... -f scripts/release-community-preflight.sql`
3. Apply only the prepared atomic entry point against production:
   `psql ... -f scripts/release-community-migrate.sql`
   (`ON_ERROR_STOP`, one transaction: `20261109` then `20261110`).
4. Merge feature into production branch locally and push:
   ```powershell
   git checkout sitguru-main
   git pull origin sitguru-main
   git merge --ff-only feature/sitguru3-manager-community
   git push origin sitguru-main
   ```
5. Wait for the Vercel production deployment of that commit on `sitguru_main`.
   Do not change Production env vars, domains, or the tracking/branch setting.
6. Verify https://www.sitguru.com : homepage, login, Manager Desk, Intern Desk,
   Admin HQ, profile photos, role switcher, and one Community Studio smoke path
   with an approved test identity.

## Rollback

- Before SQL commit: transaction aborts on error.
- After app deploy: promote the previous Ready production deployment in Vercel.
- Leave additive community tables/bucket in place unless a separate approved
  data rollback is required. Do not drop live user tables or Microsoft setup.
