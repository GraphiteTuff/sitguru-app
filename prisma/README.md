# SitGuru schema notes

SitGuru production schema is **Supabase SQL**, not Prisma migrations.

## Align local Prisma bindings with live production

```bash
# Requires DATABASE_URL (direct or pooler Postgres URI with password)
npx prisma db pull --force
npx prisma generate
npm run build
```

This cloud environment did **not** have `DATABASE_URL`. `schema.prisma` was therefore
reflected from the live Supabase project (`mmtjhxnzuglbyumbsjhs`) via PostgREST
column probes against the public API.

## Key live vs aspirational differences

| Rogue / local expectation | Live production |
| --- | --- |
| `payments` | `booking_payments` (`amount_cents`, no `amount`) |
| `payouts` | missing — use `guru_payouts` |
| `guru_payouts.amount` / `amount_cents` / `status` | `net_amount`, `gross_amount`, `payout_status` |
| `admin_audit_logs.entity_type` | `target_type` only |
| `live_walks` / `gps_events` | `booking_walk_tracks` / `booking_walk_track_points` |
| `moderation_flags` | `support_intake_cases` (admin moderation queue) |
| `fraud_flags` | `dispute_cases` (admin fraud / dispute queue) |
| `financial_audit_logs` | may be missing — fall back to `admin_audit_logs` |
| `admin_marketing_campaigns.title` | often missing — fall back to `name` |
| `admin_marketing_signup_leads.status` | live column is `lead_status` |
| `referral_codes.program` | live columns are `program_type` / `program_context` |

## Accessory Prisma models

| Model | `@@map` table | Notes |
| --- | --- | --- |
| `FinancialAuditLog` | `financial_audit_logs` | Access-layer fallback: `admin_audit_logs` |
| `ModerationFlag` | `moderation_flags` | Access-layer routes natively via `support_intake_cases` |
| `FraudFlag` | `fraud_flags` | Access-layer routes natively via `dispute_cases` |
| `AdminMarketingCampaign` | `admin_marketing_campaigns` | Includes string `title` (+ live `name`) |
| `AdminMarketingSignupLead` | `admin_marketing_signup_leads` | Includes string `status` (+ live `lead_status`) |
| `ReferralCode` | `referral_codes` | Includes string `program` (+ live `program_type`) |
| `AnalyticsEvent` | `analytics_events` | Funnel diagnostics: session/user + event_name/type |
| `GlobalChatInsight` | `global_chat_insights` | Friction flags (`is_friction_flag`) for Help briefs |

To add Rogue compatibility tables/columns on top of production, apply:

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260802_structural_schema_alignment_rogue.sql
```

Do **not** run `prisma migrate` against production.
