-- One Guru / profile row per auth user.
-- Ashley and Victoria are TWO auth users each, so this index does not
-- collapse them. It stops a second Guru row for the same auth.users.id
-- (double callback, retry, Strict Mode).
-- Skips creation when existing duplicate user_ids would make it fail.

do $$
begin
  if not exists (
    select 1
    from public.gurus
    where user_id is not null
    group by user_id
    having count(*) > 1
  ) then
    create unique index if not exists gurus_one_per_auth_user
      on public.gurus (user_id)
      where user_id is not null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from public.profiles
    where coalesce(user_id, id) is not null
    group by coalesce(user_id, id)
    having count(*) > 1
  ) then
    create unique index if not exists profiles_one_per_auth_user
      on public.profiles ((coalesce(user_id, id)))
      where coalesce(user_id, id) is not null;
  end if;
end $$;
