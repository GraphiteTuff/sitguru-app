-- Departments, assignment history, and manager notices.
-- Additive. Does not rewrite approved hour entries.

begin;

create table if not exists public.internship_departments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

insert into public.internship_departments (slug, name, sort_order) values
  ('marketing-community-growth', 'Marketing & Community Growth', 10),
  ('product', 'Product', 20),
  ('software-engineering', 'Software / Engineering', 30),
  ('partnerships', 'Partnerships', 40),
  ('business-development', 'Business Development', 50),
  ('operations', 'Operations', 60)
on conflict (slug) do update set name = excluded.name, is_active = true;

alter table public.internship_interns
  add column if not exists department_id uuid references public.internship_departments(id) on delete set null,
  add column if not exists internship_title text not null default '';

create table if not exists public.internship_assignment_events (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  old_manager_user_id uuid,
  new_manager_user_id uuid,
  old_supervisor_user_id uuid,
  new_supervisor_user_id uuid,
  old_department_id uuid,
  new_department_id uuid,
  changed_by uuid,
  reason text not null default '',
  summary text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists internship_assignment_events_intern_idx
  on public.internship_assignment_events (intern_id, created_at desc);

create table if not exists public.internship_staff_notices (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null,
  intern_id uuid not null references public.internship_interns(id) on delete cascade,
  kind text not null default 'new_team_member',
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists internship_staff_notices_recipient_idx
  on public.internship_staff_notices (recipient_user_id, created_at desc);

alter table public.internship_departments enable row level security;
alter table public.internship_assignment_events enable row level security;
alter table public.internship_staff_notices enable row level security;

revoke all on table public.internship_departments from anon, authenticated;
revoke all on table public.internship_assignment_events from anon, authenticated;
revoke all on table public.internship_staff_notices from anon, authenticated;

commit;
