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

To add Rogue compatibility tables/columns on top of production, apply:

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260802_structural_schema_alignment_rogue.sql
```

Do **not** run `prisma migrate` against production.
