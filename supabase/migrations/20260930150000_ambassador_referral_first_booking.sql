-- Keep the first booking attached to an acquisition.
-- A later checkout cannot replace booking_id. This does not add creator_ambassador.

create or replace function public.ambassador_referrals_keep_first_booking()
returns trigger
language plpgsql
as $$
begin
  if old.booking_id is not null and new.booking_id is distinct from old.booking_id then
    new.booking_id := old.booking_id;
    new.booking_status := old.booking_status;
  end if;
  return new;
end;
$$;

drop trigger if exists ambassador_referrals_keep_first_booking on public.ambassador_referrals;

create trigger ambassador_referrals_keep_first_booking
before update on public.ambassador_referrals
for each row
execute function public.ambassador_referrals_keep_first_booking();

comment on function public.ambassador_referrals_keep_first_booking() is
  'Preserves the first booking_id on an Ambassador acquisition. Does not create a reward.';

revoke all on function public.ambassador_referrals_keep_first_booking() from public;
revoke all on function public.ambassador_referrals_keep_first_booking() from anon, authenticated;

-- Anonymous visitors keep the public card view only.
-- Authenticated Ambassadors still read their own rows through existing RLS.
revoke all on table public.ambassadors from anon;
revoke all on table public.ambassador_referrals from anon;
