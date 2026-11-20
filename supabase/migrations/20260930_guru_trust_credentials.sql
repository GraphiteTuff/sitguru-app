-- Optional Guru Trust & Credentials.
-- Credentials are highlights, not a booking requirement.
-- Private documents stay in a private bucket. Public reads use a column-limited view.

begin;

create table if not exists public.credential_providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  provider_name text not null,
  provider_type text not null default 'education',
  description text,
  public_url text,
  training_url text,
  partner_url text,
  affiliate_url text,
  promo_code text,
  logo_url text,
  logo_authorized boolean not null default false,
  is_partner boolean not null default false,
  is_featured boolean not null default false,
  referral_enabled boolean not null default false,
  affiliate_enabled boolean not null default false,
  active boolean not null default true,
  verification_method text not null default 'manual',
  verification_url_template text,
  sort_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credential_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  display_name text not null,
  short_display_name text not null,
  description text not null,
  icon text not null default 'paw',
  public_badge_label text not null,
  chip_label text not null,
  filter_key text not null,
  explore_label text,
  add_label text not null default 'Add to Profile',
  default_provider_slug text,
  requires_expiration boolean not null default false,
  supports_document boolean not null default true,
  supports_certificate_number boolean not null default true,
  supports_verification_url boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credential_settings (
  setting_key text primary key,
  setting_value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.guru_credentials (
  id uuid primary key default gen_random_uuid(),
  guru_id text,
  owner_user_id uuid not null,
  credential_type_id uuid not null references public.credential_types(id),
  provider_id uuid references public.credential_providers(id),
  custom_provider_name text,
  credential_name text not null,
  certificate_or_member_reference text,
  issue_date date,
  expiration_date date,
  verification_url text,
  storage_path text,
  submission_notes text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'submitted',
  verification_notes text,
  verified_at timestamptz,
  verified_by uuid,
  rejected_at timestamptz,
  rejection_reason text,
  revoked_at timestamptz,
  expiration_handled_at timestamptz,
  notify_60_sent_at timestamptz,
  notify_30_sent_at timestamptz,
  notify_7_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guru_credentials_status_check check (
    status in (
      'draft',
      'submitted',
      'under_review',
      'verified',
      'rejected',
      'expired',
      'revoked',
      'archived'
    )
  )
);

create index if not exists guru_credentials_owner_status_idx
  on public.guru_credentials (owner_user_id, status);

create index if not exists guru_credentials_guru_status_idx
  on public.guru_credentials (guru_id, status);

create index if not exists guru_credentials_review_idx
  on public.guru_credentials (status, created_at desc);

create index if not exists guru_credentials_expiration_idx
  on public.guru_credentials (status, expiration_date);

create index if not exists guru_credentials_public_idx
  on public.guru_credentials (guru_id)
  where status = 'verified';

create table if not exists public.guru_credential_events (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null references public.guru_credentials(id) on delete cascade,
  actor_user_id uuid,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists guru_credential_events_credential_idx
  on public.guru_credential_events (credential_id, created_at desc);

alter table public.credential_providers enable row level security;
alter table public.credential_types enable row level security;
alter table public.credential_settings enable row level security;
alter table public.guru_credentials enable row level security;
alter table public.guru_credential_events enable row level security;

drop policy if exists credential_providers_public_read on public.credential_providers;
create policy credential_providers_public_read
  on public.credential_providers
  for select
  to anon, authenticated
  using (active = true);

drop policy if exists credential_types_public_read on public.credential_types;
create policy credential_types_public_read
  on public.credential_types
  for select
  to anon, authenticated
  using (active = true);

drop policy if exists credential_settings_deny on public.credential_settings;
create policy credential_settings_deny
  on public.credential_settings
  for select
  to anon, authenticated
  using (false);

drop policy if exists guru_credentials_owner_select on public.guru_credentials;
create policy guru_credentials_owner_select
  on public.guru_credentials
  for select
  to authenticated
  using (owner_user_id = auth.uid());

drop policy if exists guru_credentials_owner_insert on public.guru_credentials;
create policy guru_credentials_owner_insert
  on public.guru_credentials
  for insert
  to authenticated
  with check (
    owner_user_id = auth.uid()
    and status in ('draft', 'submitted')
    and verified_by is null
    and verified_at is null
  );

drop policy if exists guru_credentials_owner_update on public.guru_credentials;
create policy guru_credentials_owner_update
  on public.guru_credentials
  for update
  to authenticated
  using (
    owner_user_id = auth.uid()
    and status in ('draft', 'submitted', 'rejected', 'expired')
  )
  with check (
    owner_user_id = auth.uid()
    and status in ('draft', 'submitted')
    and verified_by is null
    and verified_at is null
  );

drop policy if exists guru_credential_events_owner_select on public.guru_credential_events;
create policy guru_credential_events_owner_select
  on public.guru_credential_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.guru_credentials credential
      where credential.id = credential_id
        and credential.owner_user_id = auth.uid()
    )
  );

create or replace function public.prevent_guru_self_verification()
returns trigger
language plpgsql
as $$
declare
  jwt_role text := coalesce(auth.jwt() ->> 'role', '');
begin
  if jwt_role is distinct from 'authenticated' then
    new.updated_at := now();
    return new;
  end if;

  new.verified_by := null;
  new.verified_at := null;
  new.verification_notes := null;
  new.revoked_at := null;
  if new.status is null or new.status not in ('draft', 'submitted') then
    new.status := 'submitted';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guru_credentials_block_self_verify on public.guru_credentials;
create trigger guru_credentials_block_self_verify
  before insert or update on public.guru_credentials
  for each row
  execute function public.prevent_guru_self_verification();

create or replace view public.guru_public_credentials
with (security_invoker = true) as
select
  credential.id,
  credential.guru_id,
  credential.owner_user_id,
  credential_type.slug as type_slug,
  credential_type.filter_key,
  credential_type.chip_label,
  credential_type.public_badge_label,
  credential_type.icon,
  credential_type.sort_order,
  coalesce(
    provider.provider_name,
    credential.custom_provider_name
  ) as provider_name,
  credential.expiration_date,
  credential.status
from public.guru_credentials credential
join public.credential_types credential_type
  on credential_type.id = credential.credential_type_id
left join public.credential_providers provider
  on provider.id = credential.provider_id
where credential.status = 'verified'
  and credential.revoked_at is null
  and (
    credential.expiration_date is null
    or credential.expiration_date >= current_date
  );

comment on view public.guru_public_credentials is
  'Current verified credential highlights. Security invoker keeps private rows behind guru_credentials RLS. Public pages read a sanitized projection through the service role.';

insert into public.credential_providers (
  slug,
  provider_name,
  provider_type,
  description,
  public_url,
  training_url,
  active,
  sort_order
)
values
  (
    'american-health-training',
    'American Health Training',
    'training',
    'Training provider for Pet CPR and First Aid. Not a SitGuru partner unless later configured.',
    'https://www.americanhealthtraining.com/',
    'https://www.americanhealthtraining.com/pet-cpr/',
    true,
    10
  ),
  (
    'pet-sitters-international',
    'Pet Sitters International',
    'membership',
    'Professional membership and CPPS information. SitGuru does not award PSI credentials.',
    'https://www.petsit.com/',
    'https://www.petsit.com/',
    true,
    20
  ),
  (
    'business-insurers-of-the-carolinas',
    'Business Insurers of the Carolinas',
    'insurance',
    'Possible coverage resource. Hidden until SitGuru adds a public URL and marks it active.',
    null,
    null,
    false,
    30
  ),
  (
    'other-recognized-provider',
    'Other recognized provider',
    'other',
    'A Guru can name another training, insurance, bonding, or education provider.',
    null,
    null,
    true,
    90
  )
on conflict (slug) do update
set
  provider_name = excluded.provider_name,
  description = excluded.description,
  public_url = excluded.public_url,
  training_url = excluded.training_url,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.credential_types (
  slug,
  category,
  display_name,
  short_display_name,
  description,
  icon,
  public_badge_label,
  chip_label,
  filter_key,
  explore_label,
  add_label,
  default_provider_slug,
  requires_expiration,
  sort_order
)
values
  (
    'pet-cpr-first-aid',
    'training',
    'Pet CPR & First Aid',
    'Pet CPR & First Aid',
    'Ready for the unexpected? If you have completed Pet CPR or First Aid training, add it to your Guru profile.',
    'paw',
    'Pet CPR & First Aid Certified',
    'CPR & First Aid',
    'pet_cpr',
    'Explore Training',
    'Add Credential',
    'american-health-training',
    false,
    10
  ),
  (
    'liability-insurance',
    'insurance',
    'Pet-Care Insurance',
    'Insurance',
    'Already carry professional pet-care insurance? Add your current coverage and let Pet Parents know.',
    'shield',
    'Pet-Care Liability Insured',
    'Insured',
    'insured',
    'Explore Options',
    'Add Insurance',
    null,
    true,
    20
  ),
  (
    'bonding',
    'bonding',
    'Bonding',
    'Bonding',
    'If your pet-care business is bonded, you can add it to your SitGuru profile.',
    'lock',
    'Bonded Pet-Care Provider',
    'Bonded',
    'bonded',
    'Learn More',
    'Add Bond',
    null,
    true,
    30
  ),
  (
    'psi-membership',
    'membership',
    'Professional Memberships',
    'PSI Member',
    'Member of a recognized professional pet-care organization? Pet Sitters International membership can be added here.',
    'star',
    'Pet Sitters International Member',
    'PSI Member',
    'psi',
    'Explore PSI',
    'Add Membership',
    'pet-sitters-international',
    false,
    40
  ),
  (
    'cpps',
    'certification',
    'Professional Certifications',
    'CPPS',
    'Show Pet Parents recognized professional certifications you have earned, including Certified Professional Pet Sitter.',
    'cap',
    'Certified Professional Pet Sitter®',
    'CPPS',
    'professional',
    'Learn More',
    'Add Certification',
    'pet-sitters-international',
    false,
    50
  ),
  (
    'other-credential',
    'other',
    'Another Pet-Care Credential',
    'Other credential',
    'Add another pet-care credential you already have. SitGuru reviews it before anything appears on your public profile.',
    'plus',
    'Professional Credential',
    'Credential',
    'professional',
    'Learn More',
    'Add Credential',
    'other-recognized-provider',
    false,
    60
  )
on conflict (slug) do update
set
  display_name = excluded.display_name,
  description = excluded.description,
  public_badge_label = excluded.public_badge_label,
  chip_label = excluded.chip_label,
  filter_key = excluded.filter_key,
  explore_label = excluded.explore_label,
  add_label = excluded.add_label,
  default_provider_slug = excluded.default_provider_slug,
  requires_expiration = excluded.requires_expiration,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.credential_settings (setting_key, setting_value)
values
  ('guru_trust_credentials_enabled', 'true'),
  ('credential_homepage_section_enabled', 'true'),
  ('credential_search_filters_enabled', 'true'),
  ('credential_public_metrics_enabled', 'false'),
  ('credential_partner_links_enabled', 'true'),
  ('homepage_credential_metric_min_count', '12')
on conflict (setting_key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guru-credential-documents',
  'guru-credential-documents',
  false,
  8388608,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'guru_credential_docs_owner_read'
  ) then
    create policy guru_credential_docs_owner_read on storage.objects
      for select to authenticated
      using (
        bucket_id = 'guru-credential-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'guru_credential_docs_owner_insert'
  ) then
    create policy guru_credential_docs_owner_insert on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'guru-credential-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'guru_credential_docs_owner_update'
  ) then
    create policy guru_credential_docs_owner_update on storage.objects
      for update to authenticated
      using (
        bucket_id = 'guru-credential-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'guru-credential-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

commit;
