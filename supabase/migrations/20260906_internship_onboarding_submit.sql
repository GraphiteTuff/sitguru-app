-- Record intern submit of the signed confidentiality page (email to intern@sitguru.com).

alter table public.internship_onboarding_acknowledgments
  add column if not exists wet_ink_submitted_at timestamptz,
  add column if not exists wet_ink_emailed_at timestamptz;
