-- Messaging engine: AI concierge, media, presence, SMS omnichannel
-- Safe / additive — uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- Conversations: AI assist + handoff + SMS binding
alter table public.conversations
  add column if not exists ai_assist_enabled boolean not null default false;

alter table public.conversations
  add column if not exists ai_handoff_at timestamptz;

alter table public.conversations
  add column if not exists ai_handoff_reason text;

alter table public.conversations
  add column if not exists ai_handoff_flagged boolean not null default false;

alter table public.conversations
  add column if not exists sms_phone_e164 text;

alter table public.conversations
  add column if not exists primary_channel text not null default 'in_app';

comment on column public.conversations.ai_assist_enabled is
  'When true, SitGuru AI concierge may auto-reply until human handoff.';

-- Messages: media + channel provenance
alter table public.messages
  add column if not exists is_ai boolean not null default false;

alter table public.messages
  add column if not exists channel text not null default 'in_app';

alter table public.messages
  add column if not exists media_urls jsonb not null default '[]'::jsonb;

alter table public.messages
  add column if not exists media_mime_types jsonb not null default '[]'::jsonb;

alter table public.messages
  add column if not exists external_sms_sid text;

alter table public.messages
  add column if not exists client_message_key text;

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

create index if not exists messages_external_sms_sid_idx
  on public.messages (external_sms_sid)
  where external_sms_sid is not null;

create unique index if not exists messages_client_message_key_uidx
  on public.messages (client_message_key)
  where client_message_key is not null;

-- Presence for offline SMS outfall
create table if not exists public.user_presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  is_online boolean not null default false,
  device_label text,
  updated_at timestamptz not null default now()
);

create index if not exists user_presence_last_seen_idx
  on public.user_presence (last_seen_at desc);

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- Optional SMS binding map (phone → user / active conversation)
create table if not exists public.messaging_sms_links (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null,
  user_id uuid references auth.users (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint messaging_sms_links_phone_unique unique (phone_e164)
);

create index if not exists messaging_sms_links_conversation_idx
  on public.messaging_sms_links (conversation_id);

-- Storage bucket note: create `chat-media` in Supabase dashboard (private or public read)
-- Path convention: chat-media/{conversationId}/{userId}/{uuid}.{ext}
