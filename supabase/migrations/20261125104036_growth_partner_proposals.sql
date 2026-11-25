-- Internal engagement proposals sit alongside the approved partner and referral records.
begin;

create table public.growth_partner_proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_key text unique,
  name text not null check (char_length(btrim(name)) between 1 and 140),
  category text not null check (category in ('business', 'media', 'campus', 'community')),
  partner_id uuid references public.partners(id) on delete set null,
  intern_id uuid references public.internship_interns(id) on delete set null,
  owner_user_id uuid,
  contact_name text not null default '',
  contact_email text not null default '',
  deliverables text not null default '',
  status text not null default 'proposed' check (status in ('proposed','accepted','closed')),
  monthly_cents integer not null default 0 check (monthly_cents between 0 and 1000000),
  term_months integer not null default 6 check (term_months between 1 and 24),
  created_at timestamptz not null default now()
);

create table public.growth_partner_proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.growth_partner_proposals(id) on delete cascade,
  event_type text not null check (event_type in ('outreach','material','shipping','evidence','verified','accepted','payment_approved','midpoint','closeout')),
  actor_user_id uuid not null,
  actor_role text not null check (actor_role in ('intern','manager','supervisor')),
  month_number integer,
  note text not null default '' check (char_length(note) <= 4000),
  evidence_url text not null default '',
  created_at timestamptz not null default now()
);

create unique index growth_partner_proposal_month_decision_idx
  on public.growth_partner_proposal_events(proposal_id,month_number,event_type)
  where event_type in ('verified','payment_approved');

create index growth_partner_proposals_intern_idx on public.growth_partner_proposals(intern_id);
create index growth_partner_proposal_events_proposal_idx on public.growth_partner_proposal_events(proposal_id,created_at desc);

alter table public.growth_partner_proposals enable row level security;
alter table public.growth_partner_proposal_events enable row level security;
revoke all on public.growth_partner_proposals, public.growth_partner_proposal_events
  from public, anon, authenticated, service_role;
grant select, insert, update on public.growth_partner_proposals to service_role;
grant select, insert on public.growth_partner_proposal_events to service_role;

create function public.check_growth_partner_proposal_event()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare
  proposal public.growth_partner_proposals%rowtype;
begin
  select * into strict proposal from public.growth_partner_proposals where id = new.proposal_id for update;
  if exists (
    select 1 from public.growth_partner_proposal_events e
    where e.id = new.id and e.proposal_id = new.proposal_id and e.actor_user_id = new.actor_user_id
  ) then return null; end if;
  if proposal.status = 'closed' then raise exception 'Proposal is closed'; end if;

  if new.event_type in ('evidence','verified','payment_approved') and (
    new.month_number is null or new.month_number not between 1 and proposal.term_months
  ) then raise exception 'A month in the agreed term is required'; end if;

  if new.actor_role = 'intern' and new.event_type not in ('outreach','material','evidence','shipping') then
    raise exception 'This action requires staff';
  end if;

  if new.event_type = 'evidence' and exists (
    select 1 from public.growth_partner_proposal_events e
    where e.proposal_id = proposal.id and e.month_number = new.month_number and e.event_type = 'verified'
  ) then raise exception 'This month is already verified'; end if;

  if new.event_type = 'accepted' then
    if new.actor_role <> 'supervisor' or proposal.status <> 'proposed' or btrim(new.evidence_url) = '' then
      raise exception 'Supervisor approval and an agreement reference are required';
    end if;
    update public.growth_partner_proposals set status = 'accepted' where id = proposal.id;
  elsif new.event_type = 'verified' then
    if proposal.status <> 'accepted' or not exists (
      select 1 from public.growth_partner_proposal_events e
      where e.proposal_id = proposal.id and e.month_number = new.month_number and e.event_type = 'evidence'
    ) then raise exception 'Verify submitted evidence from an accepted agreement'; end if;
  elsif new.event_type = 'payment_approved' then
    if new.actor_role <> 'supervisor' or proposal.status <> 'accepted' or proposal.monthly_cents <= 0 or not exists (
      select 1 from public.growth_partner_proposal_events e
      where e.proposal_id = proposal.id and e.month_number = new.month_number and e.event_type = 'verified'
    ) then raise exception 'Supervisor approval requires a paid agreement and verified evidence'; end if;
  elsif new.event_type = 'closeout' then
    if new.actor_role <> 'supervisor' or proposal.status <> 'accepted' then
      raise exception 'An accepted agreement requires supervisor closeout';
    end if;
    update public.growth_partner_proposals set status = 'closed' where id = proposal.id;
  end if;

  return new;
end $$;

revoke all on function public.check_growth_partner_proposal_event() from public, anon, authenticated;

create trigger check_growth_partner_proposal_event
before insert on public.growth_partner_proposal_events
for each row execute function public.check_growth_partner_proposal_event();

with assigned_intern as (
  select case when count(*) = 1 then min(id::text)::uuid else null end as id
  from public.internship_interns
  where lower(trim(full_name)) = 'lola uhl' and status in ('accepted','active','approved')
)
insert into public.growth_partner_proposals
  (proposal_key,name,category,intern_id,deliverables,monthly_cents,term_months)
select seed.key,seed.name,seed.category,assigned_intern.id,seed.deliverables,1500,6
from assigned_intern
cross join (values
  ('baldwin-founding-pilot','Dr. Gracyn Baldwin','business',
   'Partner spotlight, website badge and banner, SitGuru referral QR, reception flyers, mailed materials, monthly social promotion and display photo. Exclude patient data and patient-referral compensation.'),
  ('coach-t-founding-pilot','Coach T (Tanikwa Matthews)','media',
   'Podcast and Read & Listen promotion, Linktree placement, SitGuru referral links, reciprocal social posts, video or interview content and monthly promotional evidence.')
) seed(key,name,category,deliverables)
on conflict (proposal_key) do nothing;

commit;
