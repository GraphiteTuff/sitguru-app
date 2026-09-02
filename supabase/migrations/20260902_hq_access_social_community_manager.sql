-- Persist SitGuru HQ departments/roles and the Social & Community Manager hire role.
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

create unique index if not exists admin_user_access_email_unique
  on public.admin_user_access (lower(email));

create index if not exists admin_user_access_email_idx
  on public.admin_user_access (lower(email));

create index if not exists admin_user_access_active_idx
  on public.admin_user_access (is_active, role_key);

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
  ('owner', 'executive', 'Owner', 'Full owner-level access across SitGuru.', 'super_user', true, true, true, true, true, true, true, 20),
  ('super_admin', 'executive', 'Super Admin', 'Full operational and system access across SitGuru.', 'super_user', true, true, true, true, true, true, true, 30),
  ('operations_admin', 'operations', 'Operations Admin', 'Bookings, customers, Gurus, programs, and support workflows.', 'manager', false, false, false, false, false, false, true, 100),
  ('hr_admin', 'hr_people', 'HR Admin', 'Internal access support, password reset, and MFA workflows.', 'manager', false, true, false, true, true, false, true, 110),
  ('finance_admin', 'finance', 'Finance Admin', 'Financial statements, billing, payouts, Stripe, and reconciliation.', 'manager', false, false, false, false, false, true, true, 120),
  ('billing_admin', 'finance', 'Billing Admin', 'Billing, payment, invoice, and payout support.', 'manager', false, false, false, false, false, true, true, 130),
  ('sales_admin', 'sales_marketing', 'Sales Admin', 'Sales channels, partners, affiliates, referrals, and campaigns.', 'manager', false, false, false, false, false, false, true, 200),
  ('marketing_admin', 'sales_marketing', 'Marketing Admin', 'Marketing programs, campaign reporting, analytics, and growth content.', 'manager', false, false, false, false, false, false, true, 210),
  ('social_community_manager', 'sales_marketing', 'Social & Community Manager', 'Remote social and community growth. Promotes Gurus, events, and partners. Measures Pet Parent and Guru registrations. No payments, IDs, or private messages.', 'editor', false, false, false, false, false, false, true, 220),
  ('support_admin', 'customer_service', 'Support Admin', 'Customer service across Gurus, Pet Parents, bookings, and messages.', 'manager', false, false, false, true, false, false, true, 300),
  ('customer_service', 'customer_service', 'Customer Service', 'Support for Pet Parents, Gurus, bookings, disputes, and messages.', 'editor', false, false, false, true, false, false, true, 310),
  ('trust_safety_admin', 'trust_safety', 'Trust & Safety Admin', 'Guru approvals, Checkr, and background check management.', 'manager', false, false, false, false, false, false, true, 400),
  ('tech_support_admin', 'tech_support', 'Tech Support Admin', 'Logins, integrations, webhooks, system health, and MFA support.', 'manager', false, true, false, true, true, false, true, 500),
  ('technical_support', 'tech_support', 'Technical Support', 'Platform support for login issues, bugs, and integrations.', 'editor', false, false, false, true, false, false, true, 510),
  ('systems_admin', 'tech_support', 'Systems Admin', 'Webhooks, integrations, health checks, and platform configuration.', 'manager', false, false, false, true, true, false, true, 520),
  ('executive_viewer', 'viewer', 'Executive Viewer', 'Read-only executive view across major operating areas.', 'viewer', false, false, false, false, false, false, true, 900),
  ('finance_viewer', 'viewer', 'Finance Viewer', 'Read-only financial access.', 'viewer', false, false, false, false, false, true, true, 910)
on conflict (role_key) do update set
  name = excluded.name,
  description = excluded.description,
  department_key = excluded.department_key,
  access_level = excluded.access_level,
  display_order = excluded.display_order,
  updated_at = now();

insert into public.admin_role_permissions (role_key, permission_key, access_level)
values
  ('social_community_manager', 'growth.read', 'editor'),
  ('social_community_manager', 'campaign.create', 'editor'),
  ('social_community_manager', 'campaign.edit', 'editor'),
  ('social_community_manager', 'content.create', 'editor'),
  ('social_community_manager', 'content.edit', 'editor'),
  ('social_community_manager', 'guru.marketing.read', 'viewer'),
  ('social_community_manager', 'event.marketing.read', 'viewer'),
  ('social_community_manager', 'partner.marketing.read', 'viewer'),
  ('social_community_manager', 'media.upload', 'editor'),
  ('social_community_manager', 'analytics.growth.read', 'viewer'),
  ('social_community_manager', 'marketing.manage', 'editor'),
  ('social_community_manager', 'analytics.marketing_view', 'viewer')
on conflict (role_key, permission_key) do nothing;

alter table public.admin_departments enable row level security;
alter table public.admin_roles enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_user_access enable row level security;

commit;
