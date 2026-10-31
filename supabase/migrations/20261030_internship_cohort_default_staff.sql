alter table public.internship_cohorts
  add column if not exists default_manager_user_id uuid,
  add column if not exists default_supervisor_user_id uuid;
