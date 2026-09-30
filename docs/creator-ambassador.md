# Creator Ambassador

Creator Ambassadors are Ambassadors with `ambassador_type = creator_ambassador`. They use the same login, the same `ambassadors` row, and the same `/r/{CODE}` link as every other Ambassador.

## Share link

`https://www.sitguru.com/r/ZIGGY`

The QR image encodes that URL only. It does not encode an internal id. Download it from the Ambassador dashboard or `GET /api/referrals/qr?code=ZIGGY&download=1`.

## Attribution

- `/r/{CODE}` sets the attribution cookie only after the code is on the public Ambassador card. An invalid code does not replace a valid cookie.
- OAuth (Google, Apple, and email callback) reads that cookie. The lock is the authenticated user id, not the email address.
- A newer valid link can replace the code before the person creates an account.
- After signup locks a code on the account, a later link does not move it. Checkout and booking use that locked code.
- An account older than 15 minutes is not a new Pet Parent acquisition.
- Phone and desktop do not share a cookie. The Expo app stores `sitguru.ambassadorReferralCode` and sends it only when the Auth user was just created.
- A qualified conversion is the first completed, paid booking on that lock. This slice does not create a reward or payout.

## Public page

`/r/{CODE}` reads `ambassador_public_referrals` with the anon key. That view exposes display name, code, type, city, state, territory, and an approved photo. It does not expose email, phone, notes, payout data, or user id. The service role is not used to render the page.

## Mobile and web

The public page is a single column with one primary action, Find Pet Care (`/search?ref=CODE`). The Ambassador dashboard, including copy, share, and QR, is visible on phone widths. The Expo Ambassador home shares `sitguru.com/r/{CODE}`.

## Database

`supabase/migrations/20260930_creator_ambassador_type.sql` adds the creator subtype and optional social columns. It is not applied automatically. Existing Ambassador types stay valid.

`supabase/migrations/20260930140000_ambassador_public_referrals.sql` is the public card view plus one acquisition per referred user. It does not change Ambassador type values.

## Not in this slice

Completed-booking rewards, payouts, and a public creator application stay on the existing rewards tables until the booking lifecycle writes `ambassador_referrals.completed_booking_at`. Do not pay for a click.
