-- Store every companion and live-agent chat, and hold FAQ drafts until an admin approves them into Help.

begin;

create table if not exists public.chat_transcripts (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'companion',
  companion text not null default '',
  conversation_id text not null default '',
  actor_user_id uuid,
  actor_name text not null default '',
  actor_role text not null default '',
  question text not null default '',
  answer text not null default '',
  page_path text not null default '',
  question_key text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists chat_transcripts_created_idx
  on public.chat_transcripts (created_at desc);

create table if not exists public.chat_faq_drafts (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid,
  question text not null,
  answer text not null,
  audience text not null default 'all',
  category text not null default 'Pet Parent Support',
  companion text not null default '',
  status text not null default 'pending',
  article_slug text,
  frequency integer not null default 1,
  question_key text not null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  constraint chat_faq_drafts_status_check check (status in ('pending', 'approved', 'rejected'))
);

create unique index if not exists chat_faq_drafts_pending_key
  on public.chat_faq_drafts (question_key)
  where status = 'pending';

create index if not exists chat_faq_drafts_status_idx
  on public.chat_faq_drafts (status, created_at desc);

alter table public.chat_transcripts enable row level security;
alter table public.chat_faq_drafts enable row level security;

revoke all on table public.chat_transcripts from anon, authenticated;
revoke all on table public.chat_faq_drafts from anon, authenticated;

commit;
