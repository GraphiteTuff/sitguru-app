# Creator Ambassador

Creator Ambassadors are Ambassadors with `ambassador_type = creator_ambassador`. They use the same login, the same `ambassadors` row, and the same `/r/{CODE}` link as every other Ambassador.

## Share link

`https://www.sitguru.com/r/ZIGGY`

The QR image encodes that URL only. It does not encode an internal id. Download it from the Ambassador dashboard or `GET /api/referrals/qr?code=ZIGGY&download=1`.

## Attribution

- `/r/{CODE}` sets the attribution cookies only after the code is on the public Ambassador card. An invalid code does not replace a valid cookie.
- The server records the capture time and an HMAC of the code plus that time. A browser cannot backdate it. Opening the same code again keeps that original time. A different valid code may replace the pending seal before signup. Expo stores the same seal from `POST /api/ambassador/track-click` in AsyncStorage, so it survives backgrounding and the OAuth browser.
- A new acquisition is an Auth user created at or after that capture time, plus 15 seconds of clock skew. An account that already existed when the link was opened is not a new acquisition.
- A 15-minute fresh-session check still stops a returning Google or Apple login from being reprovisioned. That check is not the acquisition rule.
- The lock is the authenticated user id, not the email address.
- A newer valid link can replace the pending code before the person creates an account.
- After signup locks a code, a later link does not move it. Checkout and booking read the locked row and ignore a newer cookie or request body. The first booking id stays.
- Referral cookies last 30 days, `Path=/`, `SameSite=Lax`, and `Secure` in production. `sitguru_ambassador_code` is readable by the signup form. The capture time and HMAC are HttpOnly.
- A qualified conversion is the first completed, paid booking on that lock. Clicks, signups, and unfinished bookings do not create a reward or payout.

## Cookies

| Cookie | HttpOnly | Secure | SameSite | Max-Age |
| --- | --- | --- | --- | --- |
| `sitguru_ambassador_ref` | yes | production | Lax | 30 days |
| `sitguru_ambassador_code` | no | production | Lax | 30 days |
| `sitguru_ambassador_captured_at` | yes | production | Lax | 30 days |
| `sitguru_ambassador_capture_mac` | yes | production | Lax | 30 days |

## Public page

`/r/{CODE}` reads `ambassador_public_referrals` with the anon key. That view exposes display name, code, type, city, state, territory, and an approved photo. It does not expose email, phone, notes, payout data, or user id. The service role is not used to render the page.

## Mobile and web

The public page is a single column with one primary action, Find Pet Care (`/search?ref=CODE`). The Ambassador dashboard, including copy, share, and QR, is visible on phone widths. The Expo Ambassador home shares `sitguru.com/r/{CODE}`.

## Database

`supabase/migrations/20260930_creator_ambassador_type.sql` adds the creator subtype and optional social columns. It is not applied automatically. Existing Ambassador types stay valid.

`supabase/migrations/20260930140000_ambassador_public_referrals.sql` is the public card view plus one acquisition per referred user. It does not change Ambassador type values.

`supabase/migrations/20260930150000_ambassador_referral_first_booking.sql` keeps the first `booking_id` once it is set. It does not add the creator subtype.

`supabase/migrations/20260930170000_referral_public_id_and_events.sql` removes the referral-code row id from `referral_code_public` and drops the authenticated read-all policy on `referral_events`. Click tracking resolves the row id on the server from the public code. Pending referral cookies last `ATTRIBUTION_WINDOW_DAYS_DEFAULT` (30 days) and are cleared after a permanent acquisition is stored.

`supabase/migrations/20260930180000_referral_events_revoke_client_writes.sql` revokes insert, update, and delete on `referral_events` from anonymous and ordinary signed-in users. A browser cannot write a referral code, user id, email, IP address, or booking id into that table. `POST /api/ambassador/track-click` accepts the public code only. The server takes the IP address and user agent from the request and does not return the Ambassador row id. Clicks are analytics. They do not create an acquisition or a reward. The same code is tracked once per browser tab. There is no server rate limit yet.

Staging proof for signup and booking is `scripts/test-ambassador-referral.ts`. It refuses the production Supabase project, a dummy service role, live Stripe, and `www.sitguru.com`. Setup is in `docs/staging-environment.md`. The harness does not run until that staging project exists.

## Not in this slice

Completed-booking rewards, payouts, and a public creator application stay on the existing rewards tables until the booking lifecycle writes `ambassador_referrals.completed_booking_at`. Do not pay for a click.

## Follow-up before Creator rewards

The 15-minute fresh-session check only decides whether a returning Google or Apple login should skip workspace setup. It does not decide whether the account is a new acquisition.
