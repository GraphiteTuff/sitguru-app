-- SitGuru email suppressions for hard bounces / spam complaints (Resend webhooks).
-- Used to block future MARKETING sends only — never blocks auth/security mail.

create table if not exists public.email_suppressions (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null,
  reason text not null
    check (reason in ('hard_bounce', 'complaint', 'manual', 'provider_suppressed')),
  source_event text null,
  provider_message_id text null,
  provider_event_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_suppressions_email_normalized_key unique (email_normalized)
);

create index if not exists email_suppressions_reason_idx
  on public.email_suppressions (reason, updated_at desc);

create index if not exists email_suppressions_provider_event_id_idx
  on public.email_suppressions (provider_event_id)
  where provider_event_id is not null;

alter table public.email_suppressions enable row level security;

-- Service role only (webhooks / server). No authenticated client policies.
comment on table public.email_suppressions is
  'Hard-bounce and spam-complaint suppressions from Resend webhooks. Blocks marketing email only.';
