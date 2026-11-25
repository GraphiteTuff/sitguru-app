begin;

create table public.internship_outlook_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version uuid not null default gen_random_uuid(),
  credentials text not null,
  updated_at timestamptz not null default now()
);

create table public.internship_calendar_subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  portal text not null check (portal in ('intern', 'manager')),
  secret_hash text not null unique check (length(secret_hash) = 64),
  encrypted_secret text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, portal)
);

alter table public.internship_outlook_connections enable row level security;
alter table public.internship_calendar_subscriptions enable row level security;
revoke all on public.internship_outlook_connections, public.internship_calendar_subscriptions
  from public, anon, authenticated;
grant select, insert, update, delete on public.internship_outlook_connections, public.internship_calendar_subscriptions
  to service_role;

commit;
