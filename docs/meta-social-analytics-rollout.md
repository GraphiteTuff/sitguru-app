# SitGuru Meta follower sync — gated rollout (November 2026)

## What this changes
- Read-only official Graph API requests to verified assets:
  - Facebook Page: `1115780798285628` (SitGuru)
  - Instagram professional account: `17841475074314025` (@sitgurupetcare)
- New secret-gated cron: `/api/cron/meta-social-sync`, scheduled hourly at minute 00 UTC.
- Official metrics are saved under `social_platform_metrics.entity_id = brand_meta_official`, **not** in the old seeded `brand`, `rogue`, or `delilah` rows.
- The first successful snapshot sets a baseline once; subsequent updates preserve it.
- Manager Metrics, Live Results and Growth Reports consume only recent official Meta snapshots. Missing, invalid or stale counts show as unavailable, never 1,250/980-style placeholders.
- The old `social-metrics-baseline` cron endpoint is retired to prevent fake values from overwriting results.
- These are scheduled follower snapshots, **not** streaming live Insights, ads performance, content publishing or webhooks.

## Prerequisites before production activation
1. Confirm Supabase migration `supabase/migrations/20260802_social_metrics.sql` is applied, including unique `(entity_id, platform)`. Do not apply unrelated migrations.
2. Run `npm run test:meta-social`, `npm run typecheck`, and a production build using a safe environment.
3. Review this branch/PR. Vercel's `ignoreCommand` skips non-`sitguru-main` builds; do not bypass Preview/Production isolation.
4. Rotate previously screenshot-exposed **personal user and Page tokens** in Meta. Never reuse exposed credentials.
5. Add the **new private system-user token** directly in Vercel project `sitguru_main` → Settings → Environment Variables:
   - `META_SYSTEM_USER_ACCESS_TOKEN`: **Secret**, Production only. This is the 60-day SitGuru Analytics Sync system-user token. Do not place in GitHub/chat, `NEXT_PUBLIC_*`, Preview or Development.
   - Optional `META_INSTAGRAM_ACCESS_TOKEN`: **Secret**, Production only, **only if** the system-user token cannot read Instagram. Use the separately authorized @sitgurupetcare token. Note its own expiration/renewal.
   - `META_SOCIAL_SYNC_ENABLED`: `true`, **Production only**, **only after** all preflight tests, database checks, and credential rotation succeed. Default is disabled if unset.
6. `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` are already configured for production (confirm names/scopes, do not expose values).

## Validation
- Before activation, the new endpoint responds `enabled:false` for an authorized cron request, and does not write any rows.
- After activation, the next hourly scheduled or explicitly authorized run should return two `ok:true` results. A Meta permissions/token/ID failure returns 502 and leaves old verified rows untouched.
- Verify two `social_platform_metrics` rows with `entity_id='brand_meta_official'`: `facebook` and `instagram`. Read their `updated_at` timestamps and counts.
- Compare the current counts with Meta's Graph API Explorer; the November 15 manual checks were Facebook 30 and Instagram 1, but these values can change.
- In `/manager/metrics`, `/manager/results` and `/manager/reports`, confirm labels, freshness and that seeded personas are not counted as SitGuru official followers.
- Once a follower snapshot is older than 36 hours, the dashboard marks Meta metrics stale/unavailable. Check Vercel function logs and token expiry.
- Vercel/environment variable changes take effect on a new deployment. Do not deploy before credentials and the production release checklist are satisfied.

## Security, ownership and limits
- HTTP Authorization Bearer headers carry tokens to Graph API; they are never embedded in request URLs or returned from endpoints.
- The cron requires `CRON_SECRET`; its job is opt-in via `META_SOCIAL_SYNC_ENABLED`.
- The Meta token expires about 60 days after generation. Plan credential rotation **before** expiry to avoid stale dashboards.
- API reads are limited to the two verified account IDs, and the Instagram username is validated.
- This does not implement the configured but presently absent `/api/integrations/meta/callback` endpoint; do not turn on public OAuth logins yet.
- This does not enable Facebook/Instagram advertising, Instagram messaging or publishing. Those require separate security/permission review.
