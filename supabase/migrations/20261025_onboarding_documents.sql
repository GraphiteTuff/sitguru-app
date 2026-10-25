-- Shared onboarding and document acknowledgment. Service-role only.
-- SitGuru stores workflow and status. Legal signatures stay with an approved provider.
-- Executed copies are references to a restricted personnel location, not public files.

begin;

create table if not exists public.onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'policy',
  audience text not null default 'staff',
  restricted boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.onboarding_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.onboarding_documents(id) on delete cascade,
  version_label text not null,
  effective_on date,
  published_at timestamptz not null default now(),
  status text not null default 'published',
  storage_ref text not null default '',
  change_summary text not null default '',
  reacknowledgment_required boolean not null default false,
  supersedes_version_id uuid,
  unique (document_id, version_label)
);

create table if not exists public.onboarding_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  role_key text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.onboarding_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.onboarding_templates(id) on delete cascade,
  document_id uuid not null references public.onboarding_documents(id),
  kind text not null,
  requirement text not null default 'required',
  sort_order integer not null default 100,
  feature_key text not null default '',
  unique (template_id, document_id)
);

create table if not exists public.onboarding_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.onboarding_templates(id),
  subject_user_id uuid not null,
  subject_role text not null,
  intern_id uuid,
  status text not null default 'assigned',
  assigned_by uuid,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  due_on date
);

create unique index if not exists onboarding_instances_open_idx
  on public.onboarding_instances (subject_user_id, template_id)
  where status <> 'complete';

create table if not exists public.onboarding_items (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.onboarding_instances(id) on delete cascade,
  document_id uuid not null references public.onboarding_documents(id),
  version_id uuid not null references public.onboarding_document_versions(id),
  kind text not null,
  requirement text not null default 'required',
  status text not null default 'assigned',
  sort_order integer not null default 100,
  provider text not null default '',
  external_request_id text not null default '',
  external_agreement_id text not null default '',
  signing_url text not null default '',
  provider_status text not null default '',
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  completed_at timestamptz,
  final_document_ref text not null default '',
  audit_certificate_ref text not null default '',
  referenced_versions jsonb not null default '[]'::jsonb,
  admin_note text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.onboarding_items(id),
  user_id uuid not null,
  role_at_time text not null default '',
  document_version_id uuid,
  referenced_versions jsonb not null default '[]'::jsonb,
  provider text not null default '',
  provider_ref text not null default '',
  acknowledged_at timestamptz not null default now(),
  final_document_ref text not null default ''
);

create table if not exists public.onboarding_audit_events (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid,
  item_id uuid,
  actor_id uuid,
  actor_role text not null default '',
  subject_user_id uuid,
  action text not null,
  previous_status text not null default '',
  new_status text not null default '',
  document_version_id uuid,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.onboarding_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.onboarding_documents enable row level security;
alter table public.onboarding_document_versions enable row level security;
alter table public.onboarding_templates enable row level security;
alter table public.onboarding_template_items enable row level security;
alter table public.onboarding_instances enable row level security;
alter table public.onboarding_items enable row level security;
alter table public.onboarding_acknowledgments enable row level security;
alter table public.onboarding_audit_events enable row level security;
alter table public.onboarding_settings enable row level security;

revoke all on table public.onboarding_documents from anon, authenticated;
revoke all on table public.onboarding_document_versions from anon, authenticated;
revoke all on table public.onboarding_templates from anon, authenticated;
revoke all on table public.onboarding_template_items from anon, authenticated;
revoke all on table public.onboarding_instances from anon, authenticated;
revoke all on table public.onboarding_items from anon, authenticated;
revoke all on table public.onboarding_acknowledgments from anon, authenticated;
revoke all on table public.onboarding_audit_events from anon, authenticated;
revoke all on table public.onboarding_settings from anon, authenticated;

insert into public.onboarding_settings (key, value) values
  ('timekeeper_orientation', 'false'),
  ('personnel_repository_label', 'Restricted personnel folder'),
  ('personnel_repository_url', ''),
  ('reminder_interval_days', '7')
on conflict (key) do nothing;

insert into public.onboarding_documents (slug, title, category, audience) values
  ('growth-manager-handbook', 'Growth Manager Onboarding Handbook', 'handbook', 'staff'),
  ('independent-contractor-agreement', 'Independent Contractor Services Agreement', 'agreement', 'staff'),
  ('intern-leadership-guide', 'Intern Leadership Guide', 'guide', 'staff'),
  ('approved-systems-policy', 'Approved Systems & Software Policy', 'policy', 'staff'),
  ('onboarding-policy-acknowledgment', 'Onboarding & Policy Acknowledgment', 'acknowledgment', 'staff'),
  ('messaging-communications-policy', 'SitGuru Messaging & Professional Communications', 'policy', 'staff'),
  ('timekeeper-orientation', 'SitGuru Timekeeper Orientation', 'orientation', 'staff')
on conflict (slug) do update set title = excluded.title, active = true;

insert into public.onboarding_document_versions (
  document_id, version_label, effective_on, storage_ref, change_summary, status
)
select d.id, 'v1.0', date '2026-10-25', v.storage_ref, 'Initial remote onboarding version', 'published'
from public.onboarding_documents d
join (values
  ('growth-manager-handbook', 'private/onboarding/growth-manager-handbook-v1.pdf'),
  ('independent-contractor-agreement', 'private/onboarding/independent-contractor-agreement-v1.pdf'),
  ('intern-leadership-guide', 'private/onboarding/intern-leadership-guide-v1.pdf'),
  ('approved-systems-policy', 'private/onboarding/approved-systems-policy-v1.pdf'),
  ('onboarding-policy-acknowledgment', 'private/onboarding/onboarding-policy-acknowledgment-v1.pdf'),
  ('messaging-communications-policy', ''),
  ('timekeeper-orientation', '')
) as v(slug, storage_ref) on v.slug = d.slug
where not exists (
  select 1 from public.onboarding_document_versions existing
  where existing.document_id = d.id and existing.version_label = 'v1.0'
);

insert into public.onboarding_templates (slug, name, role_key, description) values
  (
    'social-community-growth-manager',
    'Social Media & Community Growth Manager',
    'social_community_manager',
    'Remote onboarding for the Growth Manager contractor seat. Policies are reviewed once. The agreement and the acknowledgment are signed with an approved provider.'
  )
on conflict (slug) do update set name = excluded.name, active = true;

insert into public.onboarding_template_items (template_id, document_id, kind, requirement, sort_order, feature_key)
select t.id, d.id, item.kind, item.requirement, item.sort_order, item.feature_key
from public.onboarding_templates t
join (values
  ('independent-contractor-agreement', 'signature', 'required', 10, ''),
  ('growth-manager-handbook', 'review', 'required', 20, ''),
  ('intern-leadership-guide', 'review', 'required', 30, ''),
  ('approved-systems-policy', 'review', 'required', 40, ''),
  ('onboarding-policy-acknowledgment', 'acknowledgment', 'required', 50, ''),
  ('messaging-communications-policy', 'review', 'required', 45, ''),
  ('timekeeper-orientation', 'review', 'required', 60, 'timekeeper_orientation')
) as item(slug, kind, requirement, sort_order, feature_key) on true
join public.onboarding_documents d on d.slug = item.slug
where t.slug = 'social-community-growth-manager'
  and not exists (
    select 1 from public.onboarding_template_items existing
    where existing.template_id = t.id and existing.document_id = d.id
  );

commit;
