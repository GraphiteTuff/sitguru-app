-- SitGuru AI Companions: durable conversations + explicit user memory.
-- Additive / reversible. Service-role API writes; RLS for owner access.
-- Does not mutate pets, bookings, or profile tables.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Conversations (one active thread per user + companion by default)
-- ---------------------------------------------------------------------------
create table if not exists public.companion_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  companion_id text not null
    check (companion_id in ('rogue', 'scout', 'taco', 'delilah')),
  title text,
  workspace_role text,
  client_key text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index if not exists companion_conversations_active_uidx
  on public.companion_conversations (user_id, companion_id)
  where archived_at is null;

create index if not exists companion_conversations_user_idx
  on public.companion_conversations (user_id, updated_at desc);

create index if not exists companion_conversations_companion_idx
  on public.companion_conversations (companion_id, updated_at desc);

comment on table public.companion_conversations is
  'Per-user SitGuru AI companion chat threads (Rogue/Scout/Taco/Delilah).';

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
create table if not exists public.companion_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.companion_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  companion_id text not null
    check (companion_id in ('rogue', 'scout', 'taco', 'delilah')),
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  client_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists companion_messages_idempotency_uidx
  on public.companion_messages (conversation_id, client_message_id)
  where client_message_id is not null;

create index if not exists companion_messages_conversation_idx
  on public.companion_messages (conversation_id, created_at asc);

create index if not exists companion_messages_user_idx
  on public.companion_messages (user_id, created_at desc);

comment on table public.companion_messages is
  'Durable companion chat messages owned by the authenticated user.';

-- ---------------------------------------------------------------------------
-- Explicit memories (user-directed preferences — not a second profile store)
-- ---------------------------------------------------------------------------
create table if not exists public.companion_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  companion_id text
    check (
      companion_id is null
      or companion_id in ('rogue', 'scout', 'taco', 'delilah')
    ),
  scope text not null default 'shared'
    check (scope in ('shared', 'companion')),
  category text not null default 'preference'
    check (
      category in (
        'preference',
        'care',
        'location',
        'schedule',
        'communication',
        'other'
      )
    ),
  key text not null,
  value text not null,
  source text not null default 'explicit_user'
    check (
      source in (
        'explicit_user',
        'user_correction',
        'user_forget',
        'system'
      )
    ),
  source_conversation_id uuid
    references public.companion_conversations (id) on delete set null,
  source_message_id uuid
    references public.companion_messages (id) on delete set null,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  forgotten_at timestamptz
);

create unique index if not exists companion_memories_active_key_uidx
  on public.companion_memories (
    user_id,
    coalesce(companion_id, ''),
    lower(key)
  )
  where is_active = true;

create index if not exists companion_memories_user_active_idx
  on public.companion_memories (user_id, is_active, updated_at desc);

comment on table public.companion_memories is
  'Explicit user-directed companion memories. Canonical profile/pet/booking data stays in application tables.';

-- ---------------------------------------------------------------------------
-- Per-user memory privacy settings
-- ---------------------------------------------------------------------------
create table if not exists public.companion_memory_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  memory_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.companion_memory_settings is
  'User control for whether companions may store and retrieve explicit memories.';

-- ---------------------------------------------------------------------------
-- RLS — owners only; APIs may also use service role
-- ---------------------------------------------------------------------------
alter table public.companion_conversations enable row level security;
alter table public.companion_messages enable row level security;
alter table public.companion_memories enable row level security;
alter table public.companion_memory_settings enable row level security;

drop policy if exists companion_conversations_select_own on public.companion_conversations;
create policy companion_conversations_select_own
  on public.companion_conversations
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists companion_conversations_insert_own on public.companion_conversations;
create policy companion_conversations_insert_own
  on public.companion_conversations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists companion_conversations_update_own on public.companion_conversations;
create policy companion_conversations_update_own
  on public.companion_conversations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists companion_messages_select_own on public.companion_messages;
create policy companion_messages_select_own
  on public.companion_messages
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists companion_messages_insert_own on public.companion_messages;
create policy companion_messages_insert_own
  on public.companion_messages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists companion_memories_select_own on public.companion_memories;
create policy companion_memories_select_own
  on public.companion_memories
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists companion_memories_insert_own on public.companion_memories;
create policy companion_memories_insert_own
  on public.companion_memories
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists companion_memories_update_own on public.companion_memories;
create policy companion_memories_update_own
  on public.companion_memories
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists companion_memory_settings_select_own on public.companion_memory_settings;
create policy companion_memory_settings_select_own
  on public.companion_memory_settings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists companion_memory_settings_upsert_own on public.companion_memory_settings;
create policy companion_memory_settings_upsert_own
  on public.companion_memory_settings
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.companion_conversations from anon;
revoke all on public.companion_messages from anon;
revoke all on public.companion_memories from anon;
revoke all on public.companion_memory_settings from anon;

grant select, insert, update on public.companion_conversations to authenticated;
grant select, insert on public.companion_messages to authenticated;
grant select, insert, update on public.companion_memories to authenticated;
grant select, insert, update, delete on public.companion_memory_settings to authenticated;
