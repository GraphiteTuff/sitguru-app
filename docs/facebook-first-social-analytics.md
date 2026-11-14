# Facebook-first social analytics rollout

This branch integrates **only the SitGuru Facebook Page**, without using, unlinking, or changing Instagram. Keep the Instagram Meta Support ticket open.

## What is implemented
- A server-only Meta Graph API Page reader (Page ID/name, follower count when available, likes when available).
- The protected `/api/cron/facebook-page-metrics` endpoint that stores only verified Page data.
- Existing `growth_social_connections` metadata identifies verified Facebook records.
- Brand-only verified follower count in the Manager Metrics/Reports snapshot, and a separate Facebook Page panel in Live Results.
- The old social-metrics-baseline cron no longer writes simulated/fallback counts to Supabase.
- No Facebook post publishing, ad spend, comments, Messenger, or Instagram API calls in this phase.

## Prerequisites (operator action required)
1. On Meta Developers, choose the already-created **SitGuru Social Analytics** app.
2. Verify that the personal Facebook profile performing authorization has sufficient access to the SitGuru Facebook Page. The Meta business portfolio must actually grant access; a selected testing permission does not grant business control.
3. Use Meta Graph API Explorer to request a user token with `pages_show_list`, `pages_read_engagement`, and `read_insights` for authorized testing. Query `/me/accounts`; select the real SitGuru Page, recording its numeric Page ID. Obtain a Page access token authorized for this Page. If unavailable, resolve Page/business access rather than inventing or using an Instagram token.
4. Store the Page token securely in Vercel server-side **Production** environment variables, not in source control or ChatGPT:
   - `FACEBOOK_PAGE_ID` = numeric SitGuru Page ID
   - `FACEBOOK_PAGE_ACCESS_TOKEN` = authorized SitGuru Page access token
   - `META_GRAPH_API_VERSION` = `v24.0` or another currently supported version
   - `CRON_SECRET` = existing random server-only cron authentication secret
5. Never place any of those credential values in `NEXT_PUBLIC_*`, the client browser, screenshots, reports, or GitHub commits. Check Page token expiry/rotation; this proof-of-concept is **not** yet an OAuth connection manager.
6. Verify existing migrations `20260802_social_metrics.sql` and `20261111_growth_center_v2.sql` are applied to the intended isolated backend before enabling the new endpoint.
7. Test against an isolated non-production database and credentials first. Invoke the protected endpoint via a backend/operator environment with `Authorization: Bearer <CRON_SECRET>`. Check that the response returns a matching SitGuru Page ID and `source: meta_graph_api`.
8. Verify `/manager/metrics`, `/manager/reports`, and `/manager/results` show official Facebook values and timestamps (or a dash where the provider did not return a field). Do not represent website referral clicks as Facebook audience reach.
9. After manual testing and approval, configure the cron schedule in Vercel. Until then, this branch deliberately does **not** add a cron schedule or activate production.

## Caveats
- Graph API Page fields depend on authorization and Meta's current support. `followers_count` may be unavailable; in that case do not show zero.
- The first verified read replaces the old **brand Facebook** synthetic baseline, without changing Rogue/Delilah or other platform records. Subsequent reads retain that verified baseline.
- Meta permissions marked **Ready for testing** are not proof that production Page data is accessible. App review/access verification may be necessary.
- If the Meta token expires, the sync safely fails without replacing the most recent stored count; the dashboard's last-successful-sync timestamp provides freshness.
- No automated Page publishing is added yet. Facebook post publishing from Reads & Listens, Community Studio, and Content Studio should be a separately audited, consent-aware, manager-approved phase.
- Instagram account linkage, Instagram tester token, and the open support case are deliberately unchanged.
