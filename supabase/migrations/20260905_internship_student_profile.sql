-- Student identity fields on intern assignment (school ID, school email, class standing).
-- Phone already exists on internship_interns.

alter table public.internship_interns
  add column if not exists student_id text not null default '',
  add column if not exists student_email text not null default '',
  add column if not exists academic_level text not null default '';
