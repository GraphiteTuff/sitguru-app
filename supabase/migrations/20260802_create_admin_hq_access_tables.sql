-- SitGuru HQ admin access control tables.
-- Service-role reads/writes from Admin Settings; RLS denies client access.

begin;

create extension if not exists pgcrypto;

create table if not exists public.admin_departments (
  id uuid primary key default gen_random_uuid(),
  department_key text not null unique,
  name text not null,
  description text null,
  display_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  role_key text not null unique,
  department_key text not null references public.admin_departments(department_key) on update cascade,
  name text not null,
  description text null,
  access_level text not null default 'viewer',
  is_super_user boolean not null default false,
  can_manage_users boolean not null default false,
  can_manage_roles boolean not null default false,
  can_reset_passwords boolean not null default false,
  can_reset_mfa boolean not null default false,
  can_access_financials boolean not null default false,
  can_access_admin boolean not null default true,
  display_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_key text not null references public.admin_roles(role_key) on update cascade on delete cascade,
  permission_key text not null,
  access_level text not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (role_key, permission_key)
);

create table if not exists public.admin_user_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  email text not null,
  department_key text not null references public.admin_departments(department_key) on update cascade,
  role_key text not null references public.admin_roles(role_key) on update cascade,
  access_level text not null default 'viewer',
  is_active boolean not null default true,
  notes text null,
  assigned_by uuid null,
  assigned_by_email text null,
  assigned_at timestamptz null,
  deactivated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_user_access_email_idx
  on public.admin_user_access (lower(email));

create index if not exists admin_user_access_active_idx
  on public.admin_user_access (is_active, role_key);

create index if not exists admin_roles_department_idx
  on public.admin_roles (department_key, display_order);

insert into public.admin_departments (department_key, name, description, display_order)
values
  ('executive', 'Executive / Founder', 'Founder, CEO, owner, and super-user access across SitGuru.', 10),
  ('operations', 'Operations', 'Bookings, Gurus, Pet Parents, programs, and day-to-day workflows.', 20),
  ('hr_people', 'HR / People', 'User access, internal people support, roles, password support, and MFA workflows.', 30),
  ('finance', 'Billing & Finance', 'Financial statements, Stripe, payouts, billing, reconciliation, and accounting controls.', 40),
  ('sales_marketing', 'Sales & Marketing', 'Growth, sales, campaigns, partners, affiliates, referrals, and PawPerks programs.', 50),
  ('customer_service', 'Customer Service', 'Support for Gurus, Pet Parents, bookings, messages, and customer issues.', 60),
  ('trust_safety', 'Trust & Safety', 'Guru approvals, Checkr/background checks, screening plans, and safety readiness.', 70),
  ('tech_support', 'Tech Support', 'System issues, login support, platform health, webhooks, integrations, and troubleshooting.', 80),
  ('viewer', 'Viewer / Read-Only', 'Read-only access roles for leadership and department visibility.', 90)
on conflict (department_key) do nothing;

insert into public.admin_roles (
  role_key, department_key, name, description, access_level,
  is_super_user, can_manage_users, can_manage_roles, can_reset_passwords, can_reset_mfa,
  can_access_financials, can_access_admin, display_order
)
values
  ('founder', 'executive', 'Founder / CEO', 'Full super-user access for SitGuru founders and CEO.', 'super_user', true, true, true, true, true, true, true, 10),
  ('owner', 'executive', 'Owner', 'Full super-user owner access across SitGuru Admin.', 'super_user', true, true, true, true, true, true, true, 20),
  ('super_admin', 'executive', 'Super Admin', 'Platform super-user for Admin operations.', 'super_user', true, true, true, true, true, true, true, 30),
  ('admin', 'operations', 'Operations Admin', 'General operations Admin access.', 'full', false, false, false, false, false, true, true, 40),
  ('finance_admin', 'finance', 'Finance Admin', 'Billing, statements, payouts, and reconciliation.', 'full', false, false, false, false, false, true, true, 50),
  ('hr_admin', 'hr_people', 'HR Admin', 'People and Admin access assignment support.', 'full', false, true, false, true, true, false, true, 60),
  ('support_admin', 'customer_service', 'Support Admin', 'Customer service and support workflows.', 'full', false, false, false, true, false, false, true, 70),
  ('tech_support_admin', 'tech_support', 'Tech Support Admin', 'Platform troubleshooting and login support.', 'full', false, true, false, true, true, false, true, 80)
on conflict (role_key) do nothing;

alter table public.admin_departments enable row level security;
alter table public.admin_roles enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_user_access enable row level security;

comment on table public.admin_departments is 'SitGuru HQ departments for Admin Settings. Service-role only.';
comment on table public.admin_roles is 'SitGuru HQ roles for Admin Settings. Service-role only.';
comment on table public.admin_role_permissions is 'SitGuru HQ role permission matrix. Service-role only.';
comment on table public.admin_user_access is 'SitGuru HQ user-to-role assignments. Service-role only.';

commit;
