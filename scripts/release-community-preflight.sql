-- Read-only schema checks. Does not apply a migration or copy user records.
\set ON_ERROR_STOP on
begin read only;
do $$
declare tbl text;
begin
  foreach tbl in array array['internship_interns','internship_tasks','internship_content','bookings'] loop
    if not exists(select 1 from information_schema.columns where table_schema='public' and table_name=tbl and column_name='id' and udt_name='uuid') then
      raise exception 'Prerequisite %.id must exist and be UUID',tbl;
    end if;
  end loop;
  if to_regclass('auth.users') is null or to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null then
    raise exception 'Supabase Auth/Storage prerequisites missing';
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name in ('customer_id','pet_owner_id','user_id') and udt_name='uuid') then
    raise exception 'Booking Pet Parent UUID ownership mapping must be verified';
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name in ('guru_id','provider_id','sitter_id') and udt_name='uuid') then
    raise exception 'Booking Guru UUID assignment mapping must be verified';
  end if;
end $$;
select table_name,column_name,data_type from information_schema.columns
where table_schema='public' and table_name in ('bookings','community_studio_submissions')
order by table_name,ordinal_position;
select id,public,file_size_limit from storage.buckets where id='sitguru-community-private';
rollback;
