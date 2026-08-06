-- Support Management: assignee, user type, and reply thread for admin triage
alter table if exists public.support_intake_cases
  add column if not exists assigned_to text,
  add column if not exists user_type text default 'parent',
  add column if not exists reply_thread jsonb default '[]'::jsonb;

comment on column public.support_intake_cases.assigned_to is
  'Admin display name or email currently owning the support case.';

comment on column public.support_intake_cases.user_type is
  'Requester audience: parent | guru | ambassador.';

comment on column public.support_intake_cases.reply_thread is
  'JSON array of support thread messages for admin conversational history.';

create index if not exists support_intake_cases_assigned_to_idx
  on public.support_intake_cases (assigned_to);

create index if not exists support_intake_cases_user_type_idx
  on public.support_intake_cases (user_type);

create index if not exists support_intake_cases_status_updated_idx
  on public.support_intake_cases (status, updated_at desc);
