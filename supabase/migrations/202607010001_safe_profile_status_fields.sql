-- Adds non-destructive admin/status/diagnostic fields used to gate public
-- visibility and bookability without deleting or overwriting profile data.
do $$
declare
  target_table text;
begin
  foreach target_table in array array['gurus', 'profiles', 'pet_parents', 'ambassadors'] loop
    execute format('alter table if exists public.%I add column if not exists admin_status text', target_table);
    execute format('alter table if exists public.%I add column if not exists profile_quality_status text', target_table);
    execute format('alter table if exists public.%I add column if not exists is_public_visible boolean not null default false', target_table);
    execute format('alter table if exists public.%I add column if not exists is_bookable boolean not null default false', target_table);
    execute format('alter table if exists public.%I add column if not exists is_archived boolean not null default false', target_table);
    execute format('alter table if exists public.%I add column if not exists is_test_account boolean not null default false', target_table);
    execute format('alter table if exists public.%I add column if not exists missing_requirements text[] not null default ''{}''::text[]', target_table);
    execute format('alter table if exists public.%I add column if not exists review_notes text', target_table);
  end loop;
end $$;
