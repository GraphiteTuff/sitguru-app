-- Enable Supabase Realtime for public Guru live updates (status / pricing / photo).
-- Browser clients subscribe with the anon key; RLS still applies.

do $$
begin
  alter publication supabase_realtime add table public.gurus;
exception
  when duplicate_object then null;
  when undefined_table then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.guru_service_rates;
exception
  when duplicate_object then null;
  when undefined_table then null;
  when undefined_object then null;
end $$;
