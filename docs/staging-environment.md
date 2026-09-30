# SitGuru staging

Staging is a separate Supabase project, a separate web host, and Stripe **test** mode. It is where `npx tsx scripts/test-ambassador-referral.ts` is allowed to create users and bookings. Production stays `https://www.sitguru.com` and Supabase project `mmtjhxnzuglbyumbsjhs`.

SitGuru Staging exists and is empty. Project ref: `ehdvngkqddttcwhjubwu`, region `us-west-1`, same organization as production. Pawnecto is a different project. Do not point this app at Pawnecto or at production `mmtjhxnzuglbyumbsjhs`.

The first migration, `202601_account_status_and_deletion_flow.sql`, failed on that empty database because `public.profiles` does not exist. No migration in this repo creates `public.profiles`. Several later files are only `SELECT 1`. SitGuru cannot be rebuilt from these migration files alone. Do not import a production data dump to fill that gap. A schema-only baseline, reviewed so it contains no customer rows, has to be added before the rest of the migrations can run. `20260930_creator_ambassador_type.sql` stays unapplied.

The harness prints this before it writes anything, and exits if the checks fail:

```text
Environment: STAGING
Application: staging.sitguru.com
Supabase: <staging project ref>
Stripe: TEST
```

Allowed application hosts are localhost, `127.0.0.1`, `staging.sitguru.com`, and a Vercel host whose name contains both `sitguru` and `staging` or `preview`. `sitguru.com`, `www.sitguru.com`, the production project ref, and `sk_live_` keys are refused.

## Eight variables for the staging web host

Set these in the staging host's secret store. Names match the app. Leave them empty in git. A blank copy is `docs/staging.env.example`.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<staging-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging service role. Server only. |
| `NEXT_PUBLIC_APP_URL` | `https://staging.sitguru.com` |
| `NEXT_PUBLIC_SITE_URL` | Same as `NEXT_PUBLIC_APP_URL` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the staging webhook |

`REFERRAL_CAPTURE_SECRET` is optional. If it is empty, seals use the staging service role.

The QA command also needs `SITGURU_QA_ENV=staging`, `SITGURU_QA_BASE_URL` equal to the staging origin, and `SITGURU_QA_GURU_ID` once a bookable staging Guru exists. Put those in the shell or Cursor environment secrets, not in the repo.

## Supabase

The staging project is `ehdvngkqddttcwhjubwu`. Do not clone production data into it.

Apply the SQL files in `supabase/migrations` in filename order **except** `20260930_creator_ambassador_type.sql`. That Creator subtype file stays unapplied. One-off production person patches in that folder are updates and deletes aimed at existing ids. On an empty staging database they change nothing. Do not add a data dump.

After referral migrations `20260930140000` through `20260930180000` are applied, anonymous clients must be unable to insert `referral_events`. The click route still writes clicks with the service role.

Auth URL configuration for the staging project:

- Site URL: `https://staging.sitguru.com`
- Redirect allow list: `https://staging.sitguru.com/auth/callback` and `http://localhost:3000/auth/callback`

Email confirmation can stay on. The harness confirms a QA user with the staging service role, so it does not need a mailbox. Addresses look like `qa+ambassador-referral-{run}-{role}@example.com`. `example.com` does not deliver mail. Use it until SitGuru has a QA domain that supports plus addressing.

## Web host

Production Vercel deploys only the `sitguru-main` branch (`vercel.json`). Do not change that to deploy pull requests onto production.

Create a second Vercel project for staging, same repo, and set the eight variables there. Attach `staging.sitguru.com` when DNS is ready. Until DNS exists, a Vercel hostname containing `sitguru` and `staging` is an acceptable harness base URL. Deploy PR #167's branch to that project. Do not merge it to `main` or `sitguru-main` just to test.

## Stripe test mode

Use a Stripe **test** account that is not the live SitGuru account. Guru payouts are Stripe Connect **Express** accounts created by `GET /api/stripe/connect/onboard?role=guru`. Run that once while logged in as the staging QA Guru so `SITGURU_QA_GURU_ID` has a test connected account. Do not paste a live connected-account id into staging.

Webhook endpoint: `https://staging.sitguru.com/api/stripe/webhook`, events for payment success, failure, and refund. Card `4242 4242 4242 4242` is the success card. No live charge is possible while `STRIPE_SECRET_KEY` is `sk_test_`.

PayPal is not required for this referral proof. If `PAYPAL_ENV` is set on staging, keep it `sandbox`.

## Google and Apple

Google and Apple are not required for the first email/password run.

Google: create a separate OAuth client named SitGuru Staging. Do not edit the production client. In that client, add the authorized redirect URI:

`https://<staging-ref>.supabase.co/auth/v1/callback`

Then in the staging Supabase project, enable Google and add the same client id and secret. The app already sends users to `https://staging.sitguru.com/auth/callback`.

Apple Sign In for the web needs a Services ID, a key, the Team ID, and the same Supabase callback. The native bundle id is `com.sitguru.mobile`. The Team ID is not in this repo. Apple stays a follow-up. Email/password QA does not wait on it.

## Expo

EAS already has `development`, `preview`, and `production`. A `staging` profile now sets `EXPO_PUBLIC_SITGURU_APP_CHANNEL=staging` and `EXPO_PUBLIC_SITGURU_API_URL=https://staging.sitguru.com`. It still uses bundle id `com.sitguru.mobile`.

A separate id such as `com.sitguru.mobile.staging`, and the display name SitGuru Staging, lets the staging app sit beside production on one phone. That needs a new Apple App ID and a new Android application id. Do that when mobile QA starts, not before the web harness passes. Universal links and Android verified links stay a separate track.

## Fixtures and cleanup

The harness creates `QAAMBASSADOR1` and `QAAMBASSADOR2` if they are missing, then creates per-run users. Cleanup deletes only ids recorded for that run: auth users, profiles, pets, bookings, acquisitions, and clicks on the QA codes since the run started. It does not delete every parent created that day.

`SITGURU_QA_GURU_ID` must be a Guru that already exists in staging. The harness does not delete that Guru.

## What to run first

After the staging host is serving this branch:

```bash
SITGURU_QA_ENV=staging \
SITGURU_QA_BASE_URL=https://staging.sitguru.com \
npx tsx scripts/test-ambassador-referral.ts
```

Core order inside that command: new email through `QAAMBASSADOR1`, existing email through the same code, a second code after the lock, self-referral, Booking A, client tampering, Booking B. Google, Apple, and a device build come after those pass. Do not write a Creator payout.

## CI

There is no GitHub Actions workflow in this repo. Do not add one until the staging project exists. A later workflow can run the unit tests on every pull request and the harness only from a protected staging environment with the service role stored as a CI secret.
