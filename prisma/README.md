# SitGuru schema notes

SitGuru production schema is **Supabase SQL**, not Prisma migrations.

Apply Rogue structural alignment with:

```bash
# Supabase SQL editor, or:
# supabase db push / psql against your DATABASE_URL
psql "$DATABASE_URL" -f supabase/migrations/20260802_structural_schema_alignment_rogue.sql
```

`schema.prisma` in this folder is a **reference model only** for the Rogue-facing tables/columns. Do not run `prisma migrate` against production.
