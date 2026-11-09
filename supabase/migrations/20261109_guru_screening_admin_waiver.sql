-- Admin-only Trust & Safety screening waiver (not a verified Checkr clear).
alter table public.gurus
  add column if not exists screening_waiver_status text,
  add column if not exists screening_waived_at timestamptz,
  add column if not exists screening_waived_by uuid,
  add column if not exists screening_waiver_reason text,
  add column if not exists screening_waiver_scope text;

comment on column public.gurus.screening_waiver_status is
  'waived_by_admin when an authorized SitGuru admin waives screening. Never means Checkr verified.';
comment on column public.gurus.background_check_status is
  'Checkr/screening status. Use waived_by_admin for admin waiver; clear/passed only after real screening.';
