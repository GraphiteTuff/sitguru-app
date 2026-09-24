-- One profile and one Guru per auth user.
-- Different roles on the same user are valid and are NOT duplicates.
-- Ashley/Victoria are different auth ids, so they do not block these indexes.
-- If the same auth id already has two profile or Guru rows, this migration
-- fails with the duplicate ids instead of skipping the protection.

do $$
declare
  duplicate_profiles text;
  duplicate_gurus text;
begin
  select string_agg(auth_id || ' (' || row_count || ')', ', ')
  into duplicate_profiles
  from (
    select coalesce(user_id, id)::text as auth_id, count(*) as row_count
    from public.profiles
    where coalesce(user_id, id) is not null
    group by coalesce(user_id, id)
    having count(*) > 1
  ) duplicates;

  if duplicate_profiles is not null then
    raise exception
      'profiles unique index not created. Duplicate auth ids: %. Query: select coalesce(user_id, id), count(*) from public.profiles group by 1 having count(*) > 1',
      duplicate_profiles;
  end if;

  select string_agg(user_id::text || ' (' || row_count || ')', ', ')
  into duplicate_gurus
  from (
    select user_id, count(*) as row_count
    from public.gurus
    where user_id is not null
    group by user_id
    having count(*) > 1
  ) duplicates;

  if duplicate_gurus is not null then
    raise exception
      'gurus unique index not created. Duplicate auth ids: %. Query: select user_id, count(*) from public.gurus group by 1 having count(*) > 1',
      duplicate_gurus;
  end if;
end $$;

create unique index if not exists profiles_one_per_auth_user
  on public.profiles ((coalesce(user_id, id)))
  where coalesce(user_id, id) is not null;

create unique index if not exists gurus_one_per_auth_user
  on public.gurus (user_id)
  where user_id is not null;

create unique index if not exists user_roles_one_role_per_auth_user
  on public.user_roles (user_id, role);
