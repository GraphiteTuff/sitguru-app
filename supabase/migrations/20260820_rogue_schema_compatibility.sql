-- Rogue / admin reporting schema compatibility.
-- Fixes false "missing schema" sniff flags when columns exist under different names,
-- and restores a customers surface for Customer Intelligence registry reads.

begin;

-- 1) Marketing campaigns: Rogue/admin often select `title`; live table uses `name`.
alter table public.admin_marketing_campaigns
  add column if not exists title text;

update public.admin_marketing_campaigns
set title = name
where title is null
  and name is not null;

-- 2) Signup leads: Rogue selects `status`; live table uses `lead_status`.
alter table public.admin_marketing_signup_leads
  add column if not exists status text;

update public.admin_marketing_signup_leads
set status = lead_status
where status is null
  and lead_status is not null;

-- 3) Referral codes: Rogue selects `program`; live table uses `program_type`.
alter table public.referral_codes
  add column if not exists program text;

update public.referral_codes
set program = program_type
where program is null
  and program_type is not null;

-- Keep aliases in sync on write.
create or replace function public.sync_marketing_campaign_title()
returns trigger
language plpgsql
as $$
begin
  if new.title is null or btrim(new.title) = '' then
    new.title := new.name;
  elsif new.name is null or btrim(new.name) = '' then
    new.name := new.title;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_marketing_campaign_title
  on public.admin_marketing_campaigns;
create trigger trg_sync_marketing_campaign_title
before insert or update of name, title
on public.admin_marketing_campaigns
for each row
execute function public.sync_marketing_campaign_title();

create or replace function public.sync_marketing_lead_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status is null or btrim(new.status) = '' then
      new.status := new.lead_status;
    end if;
    if new.lead_status is null or btrim(new.lead_status) = '' then
      new.lead_status := new.status;
    end if;
    return new;
  end if;

  if new.status is distinct from old.status
     and (new.lead_status is not distinct from old.lead_status) then
    new.lead_status := new.status;
  elsif new.lead_status is distinct from old.lead_status
     and (new.status is not distinct from old.status) then
    new.status := new.lead_status;
  elsif new.status is null or btrim(new.status) = '' then
    new.status := new.lead_status;
  elsif new.lead_status is null or btrim(new.lead_status) = '' then
    new.lead_status := new.status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_marketing_lead_status
  on public.admin_marketing_signup_leads;
create trigger trg_sync_marketing_lead_status
before insert or update of status, lead_status
on public.admin_marketing_signup_leads
for each row
execute function public.sync_marketing_lead_status();

create or replace function public.sync_referral_code_program()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.program is null or btrim(new.program) = '' then
      new.program := new.program_type;
    end if;
    if new.program_type is null or btrim(new.program_type) = '' then
      new.program_type := new.program;
    end if;
    return new;
  end if;

  if new.program is distinct from old.program
     and (new.program_type is not distinct from old.program_type) then
    new.program_type := new.program;
  elsif new.program_type is distinct from old.program_type
     and (new.program is not distinct from old.program) then
    new.program := new.program_type;
  elsif new.program is null or btrim(new.program) = '' then
    new.program := new.program_type;
  elsif new.program_type is null or btrim(new.program_type) = '' then
    new.program_type := new.program;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_referral_code_program
  on public.referral_codes;
create trigger trg_sync_referral_code_program
before insert or update of program, program_type
on public.referral_codes
for each row
execute function public.sync_referral_code_program();

-- 4) Customer Intelligence registry surface.
-- Prefer a view over pet-parent profiles so PostgREST schema cache exposes `customers`.
create or replace view public.customers
with (security_invoker = true)
as
select
  p.id,
  p.id as user_id,
  p.email,
  p.full_name,
  coalesce(
    nullif(btrim(p.full_name), ''),
    nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), ''),
    nullif(btrim(p.email), ''),
    'Pet Parent'
  ) as display_name,
  coalesce(
    nullif(btrim(p.full_name), ''),
    nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), '')
  ) as name,
  p.first_name,
  p.last_name,
  p.phone,
  p.phone as phone_number,
  coalesce(p.profile_photo_url, p.avatar_url, p.photo_url, p.image_url) as avatar_url,
  p.role,
  p.account_type,
  p.city,
  p.state,
  p.zip_code,
  coalesce(
    nullif(btrim(p.account_status), ''),
    nullif(btrim(p.admin_status), ''),
    case when coalesce(p.is_active, true) then 'active' else 'inactive' end
  ) as status,
  p.signup_source as source,
  p.signup_source,
  p.created_at,
  p.updated_at
from public.profiles p
where coalesce(p.is_test_account, false) = false
  and coalesce(p.is_archived, false) = false
  and p.archived_at is null
  and lower(coalesce(p.role, '')) not in (
    'guru',
    'admin',
    'ambassador',
    'partner',
    'sitter',
    'provider'
  )
  and (
    p.role is null
    or btrim(coalesce(p.role, '')) = ''
    or lower(p.role) in (
      'customer',
      'pet_parent',
      'pet-parent',
      'pet parent',
      'parent',
      'client',
      'user',
      'both'
    )
    or lower(coalesce(p.account_type, '')) similar to
      '%(customer|pet[_ ]?parent|parent|client)%'
  );

comment on view public.customers is
  'Pet Parent registry projection for Admin Rogue / Customer Intelligence. Backed by profiles.';

grant select on public.customers to authenticated, service_role, anon;

notify pgrst, 'reload schema';

commit;
