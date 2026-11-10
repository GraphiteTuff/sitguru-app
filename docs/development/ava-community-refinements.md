# Ava's Community Studio refinements

Work continues on `feature/sitguru3-manager-community`. Existing source changes
were retained. No production changes, pushes, deployments, or database migrations
were performed.

## Existing work recovered

The prior milestone's Community Studio, private storage, moderation, assignments,
Microsoft resource links, live sync, Market Density, heatmaps, and native screen
were present. The interrupted refinement pass had added a three-step web form,
browser/native upload helpers, native media preview and section helpers, and a
direct Sharp dependency. Its media upload and Pet Parent permission endpoints
were missing. The public page and active native screen still used the earlier
experience. Those gaps are now connected without a replacement review system.

## Implemented

- `/pack` is one public page: prominent Pet of the Week, one responsive gallery
  combining pet photos/videos/stories and Guru introductions, and inline submission.
  `/pack/submit` redirects to `/pack#submit` rather than a separate public dashboard.
- Three submission steps: media selection/camera, caption/story, then permissions.
  Private signed uploads bypass function-body file limits and show actual transfer
  progress, preview, validation, processing status, errors, and success confirmation.
- Separate `public_consent` and `social_consent`, with timestamps. Optional social
  permission starts unchecked. Legacy combined consent grants neither new right.
- Client-pet content requires an actual assigned care booking and its identified
  Pet Parent. Guru video submissions outside Guru introductions automatically
  require that process. A Guru checkbox cannot approve a parent's request.
- `/pack/permissions` and the native permission screen let the authenticated booking
  owner view the exact story/media, approve website display, separately allow social
  reuse, decline, or withdraw permission. Decisions use optimistic concurrency;
  edits reset parent approval and decisions invalidate earlier editorial approval.
- Publication gates run both in server operations and a database trigger. Pending,
  declined, revoked, unverified-media and missing-consent records remain private.
  Public media access rechecks rights. Previously issued storage links expire within
  60 seconds; already downloaded media cannot be recalled.
- Photo re-encoding strips EXIF/IPTC/XMP and applies orientation. Standard
  non-fragmented MP4/MOV container metadata/user-data and timestamps are removed
  while preserving offsets. Unsupported containers/codecs are rejected. Identifying
  content visible/audible in recordings still requires human moderation; this is
  not automatic face, audio, or encoded-bitstream redaction.
- Manager and intern editors reuse the new form. Manager previews support video
  and show website, effective social-reuse, and Pet Parent permission state.
  Existing reviews, feedback, scheduling, archiving, sharing, assigned work,
  Content Studio, Brand Kit, and Microsoft workflows are retained.
- Expo uses the same endpoints: photo/video library and camera, native playback,
  three steps, separate consents, verified booking choice, parent decisions,
  upload progress, and a simple featured-pet/gallery public view. Native controls
  and sticky actions retain existing theme/safe-area behavior.

## Main files

- Public: `app/pack/page.tsx`, `app/pack/submit/page.tsx`,
  `components/community-studio/PackCommunityPage.tsx`.
- Submission and Manager: `CommunitySubmissionFlow.tsx`, `community-upload.ts`,
  `CommunityStudioBoard.tsx` in `components/community-studio`.
- Parent decisions: `app/pack/permissions/page.tsx`,
  `components/community-studio/ParentPermissions.tsx`,
  `app/api/community-studio/permissions/route.ts`.
- Backend: `lib/community-studio/{operations,service,model,rights,parent-permissions,
  media-sanitize,api-access}.ts`, `app/api/community-studio/upload/route.ts`.
- Database: new **unapplied**
  `supabase/migrations/20261110_community_permissions_media.sql`; the original
  Community Studio migration is preserved and remains a prerequisite.
- Native: `sitguru-mobile/src/app/community-studio.tsx`,
  `community-permissions.tsx`, and the existing community media/data helpers.
- Fixtures: `app/dev/pack/page.tsx`. Existing Manager fixture is retained.

The new migration adds separate rights and parent-decision fields, upload receipts,
service-only RLS, a publication-rights trigger, and private storage support up to
25 MB. Supported upload types: JPG, PNG, WebP, standard MP4 and MOV. WebM and
fragmented/unsupported video formats need export to a standard MP4.

## Verification

The results below describe the earlier refinement milestone. For the subsequent
Next 16.4.6 build, 70-test suite, actual browser screenshots and current security
and integration blockers, see [visual verification](visual-verification-2026-11-09.md).

- Focused regression suite: 61 tests pass, including synthetic end-to-end server
  operations from submission through parent approval, manager review, scheduling,
  publication, and revocation. Fetch is intercepted and asserts only the synthetic
  test origin, so no production or external infrastructure is contacted.
- Image EXIF stripping, malformed movie rejection, container metadata stripping,
  rights/legacy-consent gates, and an existing repository MP4 compatibility check pass.
- Full isolated Next 16.2.6 production build passes: compilation, TypeScript,
  211 static pages and final optimization. Only existing Plaid/edge warnings remain.
- Full Expo source typecheck passes against compatible existing Expo 56 dependencies
  read-only, using a temporary local config removed after verification.
- Eight loopback HTTP checks pass: Manager fixture, public desktop/phone fixtures,
  public Pack, inline-submit redirect, existing Manager/Intern gates, anonymous API.
- `git diff --check` passes. Production `vercel.json` is unchanged.

## Previews and limits

The existing local fixture server on port 3100 was reused, not replaced:

- Desktop: `http://127.0.0.1:3100/dev/pack`
- Phone viewport: `http://127.0.0.1:3100/dev/pack?phone=1`
- Manager Studio: `http://127.0.0.1:3100/dev/community-studio`

Fixtures use labeled example content and never upload, request permission, or
publish anything. If the server is stopped, restart with `npm.cmd run dev:fixture`.

Not verified: real isolated Supabase migrations/RLS/storage transfer and actual
two-account authentication; device camera/library and codec playback on iOS,
Android, and installed PWAs; browser visual QA. These require the isolated backend
and devices. The synthetic workflow test is not a substitute for those checks.
No Vercel Preview URL or production deployment was created. Existing dependency
advisories from the earlier milestone remain; Sharp 0.34.5 is now explicitly
declared for metadata processing.
