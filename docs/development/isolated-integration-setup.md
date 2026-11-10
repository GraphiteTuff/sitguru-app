# Isolated integration setup — approval required before provisioning

Prepared November 9, 2026. Nothing in this document has been provisioned or run
against production. Do not copy live environment files, users, media, OAuth
credentials, database dumps containing records, Teams webhooks or notification
recipients. Existing Microsoft integrations and resources remain unchanged.

## Options and expected costs

| Resource | Proposed option | Expected cost and permission |
| --- | --- | --- |
| Local Supabase | Dedicated local CLI stack and synthetic records | No hosted Supabase charge; Docker/runtime disk and RAM needed. Local container-engine access required. |
| Hosted Supabase, if remote Preview is needed | Separate project, preferably separate organization | Free $0/month if available (2 active-project limit, pauses after inactivity); Pro from $25/month, additional projects from $10/month, plus usage. Organization owner/billing approval required. |
| Microsoft 365 | Separate developer tenant, never a production Team | Eligible Developer Program members can receive a free E5 sandbox with 25 licenses. Eligibility and renewal are not guaranteed. Otherwise obtain an approved paid tenant/license quote including Teams, SharePoint, Planner and Exchange before purchase. |
| Vercel | Separate restricted Preview project | Pro advertised at $20/month plus applicable usage; existing team entitlement may cover a project. Team owner must confirm billing/plan and reviewer access. No deployment authorized. |

Prices verified against [Supabase pricing](https://supabase.com/pricing),
[Microsoft developer FAQ](https://learn.microsoft.com/en-us/office/developer-program/microsoft-365-developer-program-faq)
and [Vercel pricing](https://vercel.com/pricing). They are planning estimates,
not an approved purchase. Prefer local testing first; remote reviewers need
approved hosted infrastructure. Do not add another paid project automatically.

## Supabase sequence

1. Approve local-only setup or a named new hosted test project, owner and budget.
   Record its non-secret project reference in the test report and verify it is
   different from production. Existing Docker Desktop is installed; local engine
   inspection encountered a permission restriction. No containers or schema were
   created. Obtain local engine access before following the
   [CLI setup guide](https://supabase.com/docs/guides/local-development).
2. Use a separate ignored test directory/config and unique project ID and ports.
   Do not link the repository CLI to the live project. Disable external SMTP,
   OAuth providers, webhooks and scheduled jobs. Use local mail capture or
   administrative synthetic-user creation, never test invitations to real users.
3. Prepare a reviewed schema-only baseline from repository migrations. A fresh
   project is not ready for the community migrations alone: they reference
   `auth.users`, `public.internship_interns`, `internship_content`,
   `internship_tasks`, `bookings` (UUID IDs), storage and existing identity/role,
   assignment, notification and real-time tables used by the application.
   Resolve prerequisite migration ordering in the empty isolated DB, without
   changing production or copying its records. Do not blindly reset an existing
   database. Save schema validation output before applying new migrations.
4. Apply `20261109_community_studio.sql`, then
   `20261110_community_permissions_media.sql` only to the verified test target.
   Review the new triggers, constraints, private bucket, service-only access,
   grants and realtime publication. The refinement does not backfill legacy
   combined consent into separate grants. Both migrations are still UNAPPLIED.
5. Create synthetic Manager A/B, assigned/unassigned Intern A/B, Pet Parent A/B,
   Guru A/B and Admin accounts with invented names and `example.test` addresses.
   Seed roles through existing trusted role tables and create only synthetic
   assignments, Content Studio entries, bookings and pets. Never grant roles
   through editable auth metadata. Keep the service key on the server.
6. Add the isolated URL, public key, server-only service key and
   `SITGURU_ISOLATED_BACKEND=true` to ignored local configuration. All other
   provider credentials stay absent. Run normal development mode for real
   authentication; `dev:fixture` intentionally refuses all `.env` files.
7. Execute the matrix below using real separate browser accounts and JWTs. Store
   sanitized results and request IDs, never tokens. Only after it passes consider
   the hosted Preview configuration. No production migration follows implicitly.

| Test | Required actual result |
| --- | --- |
| Submission/media | Phone library/camera -> caption -> separate consents -> private pending item; progress, cancellation, invalid MIME/size and retry work. Images lose EXIF; supported MP4/MOV loses container metadata; private raw media cannot be retrieved anonymously. |
| Parent authorization | Guru selects an owned booking; only its verified Pet Parent can approve. Another parent, unrelated Guru and forged booking fail. A Guru checkbox cannot approve permission. |
| Consent | Website required; social reuse optional and independently stored. Parent social refusal wins. Editing invalidates editorial approval. Revocation removes published content and prevents stale decisions from overwriting newer ones. |
| Review/publishing | Assigned intern drafts reach the established queue; manager approval/revisions/calendar retain task/content links. No early scheduled visibility. One Pet of the Week per edition. |
| Role/storage isolation | Anonymous, other intern, unrelated manager, another uploader and forged IDs cannot read private items/media, review or expand roles. Server endpoints, direct DB access and signed upload receipts checked separately. |
| Realtime | Two authenticated clients see approved assignment/community/dashboard changes, scoped to authorized recipients, without losing unfinished form state. No recipient is a real employee. |
| Identity/layout | Actual account avatar, name, full authorized-role menu, search and notification bells on Manager, Intern and Admin across widths; compare production screenshot files once available. |

## Microsoft 365 sequence

1. Approve a separate tenant and test identities. A Global Administrator or
   appropriately authorized application administrator must approve the test app
   and required admin consent; a test Team/site/Planner owner provisions only
   sandbox resources. No production admin consent, guest invitation or directory
   permission change is needed for this preparation.
2. Reuse the existing `lib/microsoft/{graph,assignment-sync,teams-notify}.ts`
   workflows. Register a separate single-tenant application. Current Graph code
   uses client credentials and `.default`; it does not implement delegated Teams
   posting. Do not repurpose or rotate the live app registration.
3. Create one test Team with matching category channels, one SharePoint document
   library/intern root, a Planner plan with Ready to Start bucket, a notebook,
   and test-only calendar/mailboxes. Record tenant/app/team/site/drive/root/plan/
   bucket/channel IDs. Scope all browser shortcuts to sandbox resources too.
4. For existing app-only Planner task creation Microsoft lists
   `Tasks.ReadWrite.All`; the folder endpoint lists `Files.ReadWrite.All`
   (or higher `Sites.ReadWrite.All`). Those are broad permissions: grant only in
   the isolated tenant, after admin review. A more restrictive selected-site
   approach needs explicit validation before substituting it. Read the
   [Planner permissions](https://learn.microsoft.com/en-us/graph/api/planner-post-tasks?view=graph-rest-1.0)
   and [folder permissions](https://learn.microsoft.com/en-us/graph/api/driveitem-post-children?view=graph-rest-1.0).
5. In a separate ignored LOCAL integration configuration set
   `MICROSOFT_GRAPH_TENANT_ID`, `MICROSOFT_GRAPH_CLIENT_ID`,
   `MICROSOFT_GRAPH_CLIENT_SECRET`, `SITGURU_MICROSOFT_TEAM_ID`,
   `SITGURU_PLANNER_GROWTH_PLAN_ID`, `SITGURU_PLANNER_BUCKET_READY_ID`,
   `SITGURU_SHAREPOINT_SITE_ID`, `SITGURU_SHAREPOINT_DRIVE_ID`,
   `SITGURU_SHAREPOINT_INTERNS_ROOT_ID` and the existing
   `SITGURU_TEAMS_CHANNEL_*_ID` values. Configure existing public shortcut URL
   variables to test-only Teams/SharePoint/Planner/OneNote resources.
6. Keep Teams in link-only mode first. Application Graph must never post Teams
   messages or request `Teamwork.Migrate.All` as a messaging workaround. A
   sandbox-only workflow webhook requires separate explicit approval before any
   actual message. Delegated posting is currently unavailable, not verified.
7. Publish a synthetic assignment and verify one linked folder/task, then retry
   and confirm existing integration records prevent duplicates. Test missing
   permissions, stale ETags and errors. Open sandbox notebook links and inspect
   generated Outlook calendar files without sending mail or invitations.
   Confirm that a missing notification poster does not fail an assignment.

Local tests mock Graph fetch completely; they test transport/error handling and
posting restrictions, not tenant authentication or remote resource behavior.
No real Graph, Teams, SharePoint, Planner, OneNote or Outlook integration passed
an authenticated external test in this milestone.

## Vercel preparation, still blocked

Use a separate project with no production domains or inherited secrets. Preserve
the existing production `vercel.json`. The alternative `vercel.preview.json`
requires the exact feature branch, Preview environment, explicit opt-in and a
matching non-production Supabase reference. It contains no cron schedules.
The pre-build guard blocks known live aliases, outbound credentials, database
URLs and `CRON_SECRET`; production-mode cron endpoints deny absent secrets.

Before any approved deployment, enable and verify
[Deployment Protection](https://vercel.com/docs/deployment-protection), restrict
reviewers, confirm isolated auth redirect URLs and storage, inspect resolved
environment keys without printing values, complete the real test matrix and
review remaining high advisories. Keep M365 integration credentials out of this
Preview; use the separate local sandbox test configuration above. The policy is
a build-time guard, not proof that dashboard settings are safe. Verify actual
project settings and runtime access after deployment is separately authorized.
Do not run `vercel`, `git push`, `supabase db push` or create cloud resources now.
