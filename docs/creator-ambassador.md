# Creator Ambassador

Creator Ambassadors are Ambassadors with `ambassador_type = creator_ambassador`. They use the same login, the same `ambassadors` row, and the same `/r/{CODE}` link as every other Ambassador.

## Share link

`https://www.sitguru.com/r/ZIGGY`

The QR image encodes that URL only. It does not encode an internal id. Download it from the Ambassador dashboard or `GET /api/referrals/qr?code=ZIGGY&download=1`.

## Attribution

- A newer valid link can replace the code before the person creates an account.
- After signup locks a code on the account, a later link does not move it.
- An existing account is not a new Pet Parent acquisition.
- Phone and desktop do not share a cookie. Signup accepts an optional referral code.
- The Expo app stores `sitguru.ambassadorReferralCode` and sends it with a new signup.

## Mobile and web

The public page is a single column with one primary action, Find Pet Care (`/search?ref=CODE`). The Ambassador dashboard, including copy, share, and QR, is visible on phone widths. The Expo Ambassador home shares `sitguru.com/r/{CODE}`.

## Database

`supabase/migrations/20260930_creator_ambassador_type.sql` adds the creator subtype and optional social columns. It is not applied automatically. Existing Ambassador types stay valid.

## Not in this slice

Completed-booking rewards, payouts, and a public creator application stay on the existing rewards tables until the booking lifecycle writes `ambassador_referrals.completed_booking_at`. Do not pay for a click.
