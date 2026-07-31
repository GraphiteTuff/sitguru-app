-- Extend PawPerks source enum for admin balance overrides.
-- Safe to re-run: ADD VALUE IF NOT EXISTS (Postgres 15+ / Supabase).

do $$
begin
  alter type public.pawperk_source_type add value if not exists 'ADMIN_DEBIT';
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;

do $$
begin
  alter type public.pawperk_source_type add value if not exists 'ADMIN_CREDIT';
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;
