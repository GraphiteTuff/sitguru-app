-- Fully executed intern onboarding: file hash, agreement snapshots, and audit fields.

alter table public.internship_onboarding_acknowledgments
  add column if not exists onboarding_status text not null default 'pending',
  add column if not exists intern_name_snapshot text not null default '',
  add column if not exists intern_university_snapshot text not null default '',
  add column if not exists intern_program_snapshot text not null default '',
  add column if not exists intern_email_snapshot text not null default '',
  add column if not exists access_rules_accepted_ip text not null default '',
  add column if not exists access_rules_session_id text not null default '',
  add column if not exists electronic_signed_ip text not null default '',
  add column if not exists electronic_signed_session_id text not null default '',
  add column if not exists wet_ink_file_hash text not null default '',
  add column if not exists wet_ink_uploaded_ip text not null default '',
  add column if not exists wet_ink_uploaded_session_id text not null default '',
  add column if not exists wet_ink_submitted_ip text not null default '',
  add column if not exists wet_ink_submitted_session_id text not null default '',
  add column if not exists offboarding_certified_at timestamptz,
  add column if not exists offboarding_certified_ip text not null default '',
  add column if not exists offboarding_certified_session_id text not null default '';
