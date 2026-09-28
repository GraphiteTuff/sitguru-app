-- Phone login OTP delivery via SitGuru Twilio (bypasses Auth built-in SMS).
create table if not exists public.phone_login_otps (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null,
  phone_digits text not null,
  code_hash text not null,
  user_id uuid null,
  allow_create_user boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists phone_login_otps_phone_created_idx
  on public.phone_login_otps (phone_digits, created_at desc);

alter table public.phone_login_otps enable row level security;

revoke all on table public.phone_login_otps from anon, authenticated;
grant all on table public.phone_login_otps to service_role;

create or replace function public.lookup_auth_user_by_phone(p_phone text)
returns table (id uuid, email text, phone text)
language sql
security definer
set search_path = auth, public
as $$
  with normalized as (
    select regexp_replace(coalesce(p_phone, ''), '\D', '', 'g') as digits
  )
  select u.id, u.email::text, u.phone::text
  from auth.users u, normalized n
  where nullif(n.digits, '') is not null
    and (
      regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') = n.digits
      or regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') = ('1' || right(n.digits, 10))
      or right(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), 10) = right(n.digits, 10)
    )
  order by u.created_at asc
  limit 1;
$$;

revoke all on function public.lookup_auth_user_by_phone(text) from public, anon, authenticated;
grant execute on function public.lookup_auth_user_by_phone(text) to service_role;
