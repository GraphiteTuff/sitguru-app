-- Run ONLY in the disposable local Supabase stack after the two migrations.
-- All test mutations roll back. Requires the authenticated workflow's local row.
begin;
do $$
declare u uuid; p uuid; b uuid; first_id uuid := gen_random_uuid();
begin
  select submitter_user_id,parent_user_id,booking_id into u,p,b from public.community_studio_submissions limit 1;
  if u is null then raise exception 'Run local authenticated workflow first'; end if;
  if has_table_privilege('anon','public.community_studio_submissions','SELECT') or
     has_table_privilege('authenticated','public.community_studio_submissions','SELECT') or
     has_table_privilege('authenticated','public.community_studio_uploads','INSERT') then
    raise exception 'Private table permissions are too broad';
  end if;
  if exists(select 1 from storage.buckets where id='sitguru-community-private' and (public or file_size_limit<>26214400)) then
    raise exception 'Private bucket configuration failed';
  end if;
  insert into public.community_studio_submissions(id,submitter_user_id,kind,title,consent,consent_at,public_consent,status,approved_by,approved_at,publish_at,week_of)
  values(first_id,u,'pet_of_week','Local database constraint test',true,now(),true,'scheduled',p,now(),now(),'2030-01-07');
  begin
    insert into public.community_studio_submissions(submitter_user_id,kind,title,consent,consent_at,public_consent,status,approved_by,approved_at,publish_at,week_of)
    values(u,'pet_of_week','Duplicate local edition',true,now(),true,'scheduled',p,now(),now(),'2030-01-07');
    raise exception 'Duplicate edition unexpectedly allowed';
  exception when unique_violation then null; end;
  begin
    update public.community_studio_submissions set public_consent=false where id=first_id;
    raise exception 'Missing website rights unexpectedly allowed';
  exception when raise_exception then
    if SQLERRM not like 'Verified media%' then raise; end if;
  end;
  begin
    update public.community_studio_submissions set image_path='fixture/unsafe.jpg',media_safe=false where id=first_id;
    raise exception 'Unsafe media unexpectedly allowed';
  exception when raise_exception then
    if SQLERRM not like 'Verified media%' then raise; end if;
  end;
  begin
    update public.community_studio_submissions set features_client_pet=true,parent_user_id=p,parent_permission_status='pending',booking_id=b where id=first_id;
    raise exception 'Unverified parent unexpectedly allowed';
  exception when raise_exception then
    if SQLERRM not like 'Verified media%' then raise; end if;
  end;
  if not exists(select 1 from public.community_studio_events where submission_id=first_id) then raise exception 'Audit event missing'; end if;
end $$;
rollback;
select 'PASS: private grants, bucket, edition uniqueness, website/media/parent guards, audit trigger; rolled back' as result;
