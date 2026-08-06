-- Backfill and auto-clone profile city/state into service_city/service_state
-- when the service_* fields are null or blank.

-- 1) One-time repair for existing rows
UPDATE public.profiles
SET service_city = nullif(btrim(city), '')
WHERE (service_city is null or btrim(coalesce(service_city, '')) = '')
  and city is not null
  and btrim(city) <> '';

UPDATE public.profiles
SET service_state = nullif(btrim(state), '')
WHERE (service_state is null or btrim(coalesce(service_state, '')) = '')
  and state is not null
  and btrim(state) <> '';

-- 2) Keep future inserts/updates filled automatically
create or replace function public.clone_profile_service_location_from_city_state()
returns trigger
language plpgsql
as $$
begin
  -- Normalize blanks to null first
  new.service_city := nullif(btrim(coalesce(new.service_city, '')), '');
  new.service_state := nullif(btrim(coalesce(new.service_state, '')), '');
  new.city := nullif(btrim(coalesce(new.city, '')), '');
  new.state := nullif(btrim(coalesce(new.state, '')), '');

  if new.service_city is null and new.city is not null then
    new.service_city := new.city;
  end if;

  if new.service_state is null and new.state is not null then
    new.service_state := new.state;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_clone_profile_service_location
  on public.profiles;

create trigger trg_clone_profile_service_location
before insert or update of city, state, service_city, service_state
on public.profiles
for each row
execute function public.clone_profile_service_location_from_city_state();

comment on function public.clone_profile_service_location_from_city_state() is
  'Copies profiles.city/state into service_city/service_state when the service_* fields are empty.';
