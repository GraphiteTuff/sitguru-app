# SitGuru Content Studio — Social & Growth Intelligence

**Purpose:** Give the SitGuru team a familiar Meta Insights-style view of its published content, with SitGuru-specific traffic and registration/booking event attribution. All percentages, totals and ranks must reflect measured data. Never seed fictional analytics.

## Entry points

- Manager Content Studio: `/manager/campaigns-content` (review/approve/publish workflow remains unchanged)
- Manager analytics: `/manager/metrics?view=social-intelligence`
- Manager existing Overview/Insights: `/manager/metrics`, `/manager/insights`, `/manager/results` (do not duplicate social KPI cards)
- Admin: `/admin/growth/social-intelligence` (superuser only)
- Intern: `/intern/social-intelligence` (only own published posts, their tracking keys and events)
- Native Expo: `sitguru-mobile/src/app/social-intelligence.tsx`, linked from Growth Insights
- Cookie/native bearer API: `/api/social-intelligence/snapshot`
- Authenticated CSV: `/api/social-intelligence/export`

## What is measured

- All five official social channels (Facebook, Instagram, TikTok, X, YouTube) appear in a unified published-content section with role-scoped post counts for the selected period, regardless of the active platform filter; clicking a channel filters posts. Meta post syncing is explicitly labeled as Facebook/Instagram only. A follower connection must not be represented as a verified post import.
- Rankings: most watched, clicked, shared, saved, engaged, followed, site visits, signup events and booking events. Switch Top 10/25/All, date range, audience, platform and campaign.
- Provider media metrics: cumulative post views/reach/likes/comments/shares/saves/follows, when permitted and verified. Missing values are null, **not zero**. Provider samples are historical snapshots; views are not unique people.
- SitGuru first-party: timestamped social-attributed page views, tracking-link clicks, signup events and booking events from `growth_campaign_events`. Events do **not** prove verified new customers, successful paid bookings or causation.
- Paid booking count and post-attributed net revenue intentionally show unavailable until payment data and provider post-to-conversion IDs are robustly connected.
- Video watch time/retention, Meta hook rate and revenue attribution require further permissions/implementation. Never infer unavailable metrics.

## Data ownership and API access

Migration `supabase/migrations/20261122_social_intelligence.sql` adds two **service-role-only** RLS tables:

- `growth_social_publications`: approved official account posts with pinned provider ID/platform, permalink, title, linked Content Studio ID and unique tracking key.
- `growth_social_post_metrics`: timestamped verified provider-statistics snapshots.

Never expose social access tokens or provider API raw error payloads in an endpoint, client response or log. Only production-authorized official account data is imported.

## Provider integration

- Instagram & Facebook use official Meta Graph API assets verified in `lib/meta/social-analytics.ts`. Meta's `META_SYSTEM_USER_ACCESS_TOKEN` and/or `META_INSTAGRAM_ACCESS_TOKEN` must be valid with approved media and insight permissions. Facebook post engagement and Instagram owned media counts can import; video views/retention may be unavailable. Account mismatch fails closed.
- TikTok Display API requires **production** Login Kit OAuth including approved `video.list` scope. Request this extra scope only when `TIKTOK_VIDEO_LIST_SCOPE_APPROVED=true` and the provider has granted it. Previously authorized sandbox `user.info.stats` / `video.upload` scopes alone are **not enough** for video rankings.
- X: status is visible; paid/rate-limited API post polling intentionally remains off until budget and permissions are approved.
- YouTube: status is visible; post/Shorts insights require a verified and authorized YouTube Analytics connector and are not imported yet.
- Rate limits, OAuth expiration, unsupported metrics and owner mismatches should report unavailable states, not fake totals.

## Activate after technical review

1. Run the migration against the correct **SitGuru Production** project with Supabase migration tooling after staging verification and release approval. Never run it against a different tenant by accident.
2. Verify tables exist, RLS is enabled, anon/authenticated grants are absent, official social access tokens and required account scopes are correct. Do not print tokens.
3. Deploy the tested Git branch through the normal `sitguru-main` production release process; preserve Content Studio approval and notification logic.
4. Enable `SOCIAL_INTELLIGENCE_SYNC_ENABLED=true` on Vercel *only after* database/permissions validation. Protected route `/api/cron/social-intelligence-sync` requires `CRON_SECRET`. Keep TikTok video scope flag false until approved and reauthorized. Cron is scheduled hourly, 20 minutes after the hour.
5. Use real SitGuru published media and click a tracked CTA. Verify a provider post row and snapshot, then a matching event `metadata.utm_content=sg_<studioContentId>` for the same post.
6. Confirm member access: Admin can inspect full reports; manager sees team growth; intern cannot view any other intern's content or conversions; unauthorized users get 403.
7. Test desktop at 100% zoom, narrow web layout, Expo iOS/Android and the first-party export. No production metrics should ever be inferred from demo screenshot numbers.

## Unique post CTA links

Once Ava approves a content item, Content Studio offers a copyable URL:

`https://www.sitguru.com/go/post/<studioContentId>?platform=instagram`

Use the CTA in the matching approved post or biography link. It redirects to the allowlisted SitGuru destination, sets `utm_source`, `utm_medium=social`, `utm_campaign` and `utm_content=sg_<studioContentId>`, and logs a first-party click. Share the network-specific link for each channel when repurposing a creative.

### Caveats

- Prior posts without post-specific CTAs cannot automatically acquire historical conversion attribution.
- Signup/booking events attributed only by a campaign or a social referrer are **not** safely attributable to an individual video.
- Click totals can include repeat users, link previews and bots. Add deduplication and quality controls before treating clicks as unique leads.
- A 10,000-view post with no tracked CTA is an awareness result; it is not proof of 10,000 leads.
- The first implementation's provider snapshot history is limited to recent imported content and existing provider permissions. Enrich with more provider metrics only after verifying API support.

## Release safety

Vercel's project normally uses `vercel.json` `ignoreCommand` to build **only** `sitguru-main`. Any temporary feature-branch preview exception must be removed before merging. Preview assets and database credentials are not production authorization.
