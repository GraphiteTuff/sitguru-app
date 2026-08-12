-- SitGuru email updates / newsletter subscribers
-- Public signup captures emails; admin manages list; users can unsubscribe via token or My Account.

create table if not exists public.email_update_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null,
  full_name text null,
  user_id uuid null references auth.users (id) on delete set null,
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed')),
  source text not null default 'footer',
  unsubscribe_token text not null,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_update_subscribers_email_normalized_key unique (email_normalized),
  constraint email_update_subscribers_unsubscribe_token_key unique (unsubscribe_token)
);

create index if not exists email_update_subscribers_status_idx
  on public.email_update_subscribers (status, subscribed_at desc);

create index if not exists email_update_subscribers_source_idx
  on public.email_update_subscribers (source);

create index if not exists email_update_subscribers_user_id_idx
  on public.email_update_subscribers (user_id);

alter table public.email_update_subscribers enable row level security;

-- Service role bypasses RLS. Authenticated users may update their own marketing
-- preference via profiles; this table stays admin/service managed.
drop policy if exists "email_update_subscribers_select_own" on public.email_update_subscribers;
create policy "email_update_subscribers_select_own"
  on public.email_update_subscribers
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.email_update_subscribers is
  'SitGuru email updates / newsletter opt-ins for news, offers, and announcements.';
