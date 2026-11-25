-- Keep announcement delivery private to the linked internship record.
begin;

create table public.internship_announcements (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  published_by uuid not null,
  publisher_role text not null check (publisher_role in ('manager', 'supervisor')),
  title text not null check (char_length(btrim(title)) between 1 and 140),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index internship_announcements_intern_created_idx
  on public.internship_announcements (intern_id, created_at desc);

alter table public.internship_announcements enable row level security;
revoke all on public.internship_announcements from public, anon, authenticated, service_role;
grant select, insert on public.internship_announcements to service_role;

commit;
