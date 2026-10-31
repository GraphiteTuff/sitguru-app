alter table public.internship_interns
  add column if not exists requested_credits numeric,
  add column if not exists planned_total_hours numeric,
  add column if not exists hours_per_credit numeric,
  add column if not exists offer_status text not null default 'pending',
  add column if not exists work_email text not null default '',
  add column if not exists microsoft_readiness text not null default 'not_created';
