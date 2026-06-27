-- Operational profile completion, outreach, and reminder support for SitGuru.com.

create table if not exists public.communication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  role_context text,
  channel text not null check (channel in ('internal_message', 'email', 'sms', 'phone_call_note')),
  direction text not null default 'outbound' check (direction in ('outbound', 'inbound')),
  subject text,
  body text,
  status text not null default 'queued' check (status in ('draft', 'queued', 'sent', 'failed', 'skipped', 'opted_out')),
  provider_message_id text,
  error_message text,
  sent_by_admin_id uuid,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  related_profile_completion_status text,
  related_missing_fields text[],
  automation_key text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists communication_logs_user_id_created_at_idx on public.communication_logs(user_id, created_at desc);
create index if not exists communication_logs_status_idx on public.communication_logs(status);
create index if not exists communication_logs_automation_key_idx on public.communication_logs(automation_key);

create table if not exists public.notification_preferences (
  user_id uuid primary key,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  transactional_enabled boolean not null default true,
  marketing_enabled boolean not null default false,
  profile_completion_reminders_enabled boolean not null default true,
  sms_opted_out_at timestamptz,
  email_opted_out_at timestamptz,
  last_sms_sent_at timestamptz,
  last_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_completion_reminder_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role_context text,
  reminder_stage text not null,
  scheduled_for timestamptz not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped', 'cancelled')),
  missing_required_fields text[],
  likely_issue_type text,
  communication_log_id uuid references public.communication_logs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, role_context, reminder_stage)
);

create index if not exists profile_completion_reminder_queue_due_idx on public.profile_completion_reminder_queue(status, scheduled_for);

create table if not exists public.message_templates (
  key text primary key,
  channel text not null,
  subject text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.message_templates (key, channel, subject, body) values
('guru_incomplete_profile_email','email','Finish setting up your SitGuru Guru profile','Hi [first_name], thanks for signing up to become a SitGuru Guru. Your account is created, but your Guru profile still needs: [missing_fields]. You can finish it here: [completion_link]. If anything on the site is not working or preventing you from finishing, please reply and let us know so we can help.'),
('pet_parent_incomplete_profile_email','email','Finish setting up your SitGuru Pet Parent profile','Hi [first_name], thanks for joining SitGuru. Your account is created, but your Pet Parent profile still needs: [missing_fields]. You can finish it here: [completion_link]. If you had trouble completing anything, please reply and we will help.'),
('ambassador_incomplete_profile_email','email','Finish activating your SitGuru Ambassador account','Hi [first_name], thanks for signing up as a SitGuru Ambassador. Your referral access is almost ready. Your account still needs: [missing_fields]. You can finish it here: [completion_link]. If anything is not working, reply and we will help.'),
('technical_issue_check_in_email','email','Need help finishing your SitGuru profile?','Hi [first_name], we noticed your SitGuru profile is not complete yet. Were you unable to finish because of a website issue, or did you just need more time? Reply and we will help you get set up.'),
('profile_sms_short_reminder','sms',null,'Hi [first_name], this is SitGuru. Your [role] profile is almost ready but still missing: [short_missing_fields]. Finish here: [short_link]. If the site is not working, reply HELP. Reply STOP to opt out.')
on conflict (key) do update set channel = excluded.channel, subject = excluded.subject, body = excluded.body, updated_at = now();
