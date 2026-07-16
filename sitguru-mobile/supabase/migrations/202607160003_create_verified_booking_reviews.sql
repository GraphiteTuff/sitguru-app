begin;

create extension if not exists pgcrypto;

create or replace function public.try_review_uuid(
  p_value text
)
returns uuid
language plpgsql
immutable
as $$
begin
  if nullif(trim(coalesce(p_value, '')), '') is null then
    return null;
  end if;

  return trim(p_value)::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function public.review_auth_user_id(
  p_value text
)
returns uuid
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  v_user_id := public.try_review_uuid(p_value);

  if v_user_id is null then
    return null;
  end if;

  if exists (
    select 1
    from auth.users
    where id = v_user_id
  ) then
    return v_user_id;
  end if;

  return null;
end;
$$;

revoke all on function public.review_auth_user_id(text) from public;
grant execute on function public.review_auth_user_id(text) to authenticated;
grant execute on function public.review_auth_user_id(text) to service_role;

create table if not exists public.booking_reviews (
  id uuid primary key default gen_random_uuid(),

  booking_id uuid not null,
  care_booking_id uuid,

  reviewer_user_id uuid references auth.users(id) on delete set null,
  reviewer_id uuid,
  customer_id uuid,
  pet_parent_id uuid,
  author_id uuid,
  user_id uuid,

  guru_user_id uuid references auth.users(id) on delete set null,
  guru_id uuid,
  provider_id uuid,
  reviewee_id uuid,
  subject_user_id uuid,

  reviewer_name text,
  customer_name text,
  pet_parent_name text,
  author_name text,

  guru_name text,
  provider_name text,
  reviewee_name text,

  rating smallint not null,
  overall_rating smallint,
  stars smallint,
  score smallint,

  review_text text not null,
  review text,
  comment text,
  body text,
  message text,
  content text,

  category_ratings jsonb not null default '{}'::jsonb,
  category_scores jsonb not null default '{}'::jsonb,
  ratings_breakdown jsonb not null default '{}'::jsonb,
  details jsonb not null default '{}'::jsonb,

  praise_tags jsonb not null default '[]'::jsonb,
  praise jsonb not null default '[]'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,

  verified_booking boolean not null default false,
  is_verified boolean not null default false,
  verified boolean not null default false,

  status text not null default 'published',
  review_status text not null default 'published',
  moderation_status text not null default 'published',
  moderation_notes text,
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,

  guru_response text,
  guru_response_at timestamptz,
  guru_response_by uuid references auth.users(id) on delete set null,

  provider_response text,
  provider_response_at timestamptz,
  provider_response_by uuid references auth.users(id) on delete set null,

  response text,
  response_at timestamptz,
  responded_by uuid references auth.users(id) on delete set null,

  source text not null default 'sitguru_mobile_app',
  metadata jsonb not null default '{}'::jsonb,

  submitted_at timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,

  legacy_source_table text,
  legacy_source_id text,

  constraint booking_reviews_rating_check
    check (rating between 1 and 5),

  constraint booking_reviews_status_check
    check (
      status in (
        'draft',
        'pending',
        'published',
        'flagged',
        'hidden',
        'removed',
        'rejected'
      )
    )
);

alter table public.booking_reviews
  add column if not exists booking_id uuid,
  add column if not exists care_booking_id uuid,
  add column if not exists reviewer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewer_id uuid,
  add column if not exists customer_id uuid,
  add column if not exists pet_parent_id uuid,
  add column if not exists author_id uuid,
  add column if not exists user_id uuid,
  add column if not exists guru_user_id uuid references auth.users(id) on delete set null,
  add column if not exists guru_id uuid,
  add column if not exists provider_id uuid,
  add column if not exists reviewee_id uuid,
  add column if not exists subject_user_id uuid,
  add column if not exists reviewer_name text,
  add column if not exists customer_name text,
  add column if not exists pet_parent_name text,
  add column if not exists author_name text,
  add column if not exists guru_name text,
  add column if not exists provider_name text,
  add column if not exists reviewee_name text,
  add column if not exists rating smallint,
  add column if not exists overall_rating smallint,
  add column if not exists stars smallint,
  add column if not exists score smallint,
  add column if not exists review_text text,
  add column if not exists review text,
  add column if not exists comment text,
  add column if not exists body text,
  add column if not exists message text,
  add column if not exists content text,
  add column if not exists category_ratings jsonb,
  add column if not exists category_scores jsonb,
  add column if not exists ratings_breakdown jsonb,
  add column if not exists details jsonb,
  add column if not exists praise_tags jsonb,
  add column if not exists praise jsonb,
  add column if not exists highlights jsonb,
  add column if not exists tags jsonb,
  add column if not exists verified_booking boolean,
  add column if not exists is_verified boolean,
  add column if not exists verified boolean,
  add column if not exists status text,
  add column if not exists review_status text,
  add column if not exists moderation_status text,
  add column if not exists moderation_notes text,
  add column if not exists moderated_by uuid references auth.users(id) on delete set null,
  add column if not exists moderated_at timestamptz,
  add column if not exists guru_response text,
  add column if not exists guru_response_at timestamptz,
  add column if not exists guru_response_by uuid references auth.users(id) on delete set null,
  add column if not exists provider_response text,
  add column if not exists provider_response_at timestamptz,
  add column if not exists provider_response_by uuid references auth.users(id) on delete set null,
  add column if not exists response text,
  add column if not exists response_at timestamptz,
  add column if not exists responded_by uuid references auth.users(id) on delete set null,
  add column if not exists source text,
  add column if not exists metadata jsonb,
  add column if not exists submitted_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists legacy_source_table text,
  add column if not exists legacy_source_id text;

create unique index if not exists booking_reviews_one_per_booking_uidx
  on public.booking_reviews(booking_id);

create unique index if not exists booking_reviews_legacy_source_uidx
  on public.booking_reviews(legacy_source_table, legacy_source_id)
  where legacy_source_table is not null
    and legacy_source_id is not null;

create index if not exists booking_reviews_guru_created_idx
  on public.booking_reviews(guru_user_id, created_at desc);

create index if not exists booking_reviews_reviewer_created_idx
  on public.booking_reviews(reviewer_user_id, created_at desc);

create index if not exists booking_reviews_status_created_idx
  on public.booking_reviews(status, created_at desc);

create index if not exists booking_reviews_verified_idx
  on public.booking_reviews(verified_booking, status, created_at desc);

create table if not exists public.booking_review_audit_log (
  id uuid primary key default gen_random_uuid(),
  booking_review_id uuid,
  booking_id uuid,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_source text not null default 'database',
  operation text not null,
  old_record jsonb,
  new_record jsonb,
  created_at timestamptz not null default now()
);

create index if not exists booking_review_audit_review_idx
  on public.booking_review_audit_log(booking_review_id, created_at desc);

create index if not exists booking_review_audit_booking_idx
  on public.booking_review_audit_log(booking_id, created_at desc);

create or replace function public.booking_review_profile_name(
  p_user_id uuid,
  p_fallback text
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile jsonb;
  v_name text;
begin
  if p_user_id is null or to_regclass('public.profiles') is null then
    return nullif(p_fallback, '');
  end if;

  begin
    execute
      'select to_jsonb(p) from public.profiles p where p.id::text = $1 limit 1'
      into v_profile
      using p_user_id::text;
  exception
    when others then
      return nullif(p_fallback, '');
  end;

  v_name := coalesce(
    nullif(v_profile->>'full_name', ''),
    nullif(v_profile->>'display_name', ''),
    nullif(v_profile->>'name', ''),
    nullif(
      trim(
        concat_ws(
          ' ',
          nullif(v_profile->>'first_name', ''),
          nullif(v_profile->>'last_name', '')
        )
      ),
      ''
    ),
    nullif(split_part(v_profile->>'email', '@', 1), ''),
    nullif(p_fallback, '')
  );

  return v_name;
end;
$$;

create or replace function public.normalize_booking_review()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_booking jsonb;
  v_booking_status text;
  v_booking_completed_at text;
  v_booking_pet_parent_id text;
  v_booking_guru_id text;
  v_authenticated_user uuid := auth.uid();
  v_backfill boolean :=
    coalesce(
      current_setting('sitguru.review_backfill', true),
      'false'
    ) = 'true';
  v_admin boolean := false;
begin
  begin
    v_admin := public.is_sitguru_admin();
  exception
    when undefined_function then
      v_admin := false;
  end;

  if tg_op = 'INSERT' then
    new.id := coalesce(new.id, gen_random_uuid());
    new.reviewer_user_id := coalesce(
      new.reviewer_user_id,
      public.review_auth_user_id(new.reviewer_id::text),
      public.review_auth_user_id(new.customer_id::text),
      public.review_auth_user_id(new.pet_parent_id::text),
      public.review_auth_user_id(new.author_id::text),
      public.review_auth_user_id(new.user_id::text),
      v_authenticated_user
    );

    new.created_at := coalesce(new.created_at, now());
    new.submitted_at := coalesce(new.submitted_at, new.created_at, now());
  end if;

  new.booking_id := coalesce(new.booking_id, new.care_booking_id);
  new.care_booking_id := coalesce(new.care_booking_id, new.booking_id);

  new.reviewer_id := coalesce(new.reviewer_id, new.reviewer_user_id);
  new.customer_id := coalesce(new.customer_id, new.reviewer_user_id);
  new.pet_parent_id := coalesce(new.pet_parent_id, new.reviewer_user_id);
  new.author_id := coalesce(new.author_id, new.reviewer_user_id);
  new.user_id := coalesce(new.user_id, new.reviewer_user_id);

  new.guru_user_id := coalesce(
    public.review_auth_user_id(new.guru_user_id::text),
    public.review_auth_user_id(new.guru_id::text),
    public.review_auth_user_id(new.provider_id::text),
    public.review_auth_user_id(new.reviewee_id::text),
    public.review_auth_user_id(new.subject_user_id::text)
  );

  new.guru_id := coalesce(new.guru_id, new.guru_user_id);
  new.provider_id := coalesce(new.provider_id, new.guru_user_id);
  new.reviewee_id := coalesce(new.reviewee_id, new.guru_user_id);
  new.subject_user_id := coalesce(new.subject_user_id, new.guru_user_id);

  new.rating := coalesce(
    new.rating,
    new.overall_rating,
    new.stars,
    new.score
  );
  new.overall_rating := coalesce(new.overall_rating, new.rating);
  new.stars := coalesce(new.stars, new.rating);
  new.score := coalesce(new.score, new.rating);

  if new.rating is null or new.rating < 1 or new.rating > 5 then
    raise exception
      'A verified SitGuru review requires a rating from 1 through 5.';
  end if;

  new.review_text := coalesce(
    nullif(new.review_text, ''),
    nullif(new.review, ''),
    nullif(new.comment, ''),
    nullif(new.body, ''),
    nullif(new.message, ''),
    nullif(new.content, ''),
    ''
  );

  if length(trim(new.review_text)) < 10 and not v_backfill then
    raise exception
      'A verified SitGuru review requires at least 10 characters.';
  end if;

  new.review := coalesce(nullif(new.review, ''), new.review_text);
  new.comment := coalesce(nullif(new.comment, ''), new.review_text);
  new.body := coalesce(nullif(new.body, ''), new.review_text);
  new.message := coalesce(nullif(new.message, ''), new.review_text);
  new.content := coalesce(nullif(new.content, ''), new.review_text);

  new.category_ratings := coalesce(
    new.category_ratings,
    new.category_scores,
    new.ratings_breakdown,
    new.details,
    '{}'::jsonb
  );
  new.category_scores := coalesce(
    new.category_scores,
    new.category_ratings,
    '{}'::jsonb
  );
  new.ratings_breakdown := coalesce(
    new.ratings_breakdown,
    new.category_ratings,
    '{}'::jsonb
  );
  new.details := coalesce(
    new.details,
    new.category_ratings,
    '{}'::jsonb
  );

  new.praise_tags := coalesce(
    new.praise_tags,
    new.praise,
    new.highlights,
    new.tags,
    '[]'::jsonb
  );
  new.praise := coalesce(new.praise, new.praise_tags, '[]'::jsonb);
  new.highlights := coalesce(
    new.highlights,
    new.praise_tags,
    '[]'::jsonb
  );
  new.tags := coalesce(new.tags, new.praise_tags, '[]'::jsonb);

  new.status := lower(
    coalesce(
      nullif(new.status, ''),
      nullif(new.review_status, ''),
      nullif(new.moderation_status, ''),
      'published'
    )
  );

  if new.status not in (
    'draft',
    'pending',
    'published',
    'flagged',
    'hidden',
    'removed',
    'rejected'
  ) then
    new.status := 'published';
  end if;

  new.review_status := new.status;
  new.moderation_status := new.status;

  new.source := coalesce(nullif(new.source, ''), 'sitguru_mobile_app');
  new.metadata := coalesce(new.metadata, '{}'::jsonb);
  new.updated_at := now();
  new.updated_by := coalesce(v_authenticated_user, new.updated_by);

  if new.status = 'published' then
    new.published_at := coalesce(new.published_at, now());
  end if;

  if not v_backfill and tg_op = 'INSERT' then
    if new.booking_id is null then
      raise exception
        'A completed SitGuru booking is required before a review can be submitted.';
    end if;

    if to_regclass('public.bookings') is null then
      raise exception
        'The bookings table is unavailable, so SitGuru cannot verify this review.';
    end if;

    begin
      execute
        'select to_jsonb(b) from public.bookings b where b.id::text = $1 limit 1'
        into v_booking
        using new.booking_id::text;
    exception
      when others then
        raise exception
          'SitGuru could not verify the booking connected to this review.';
    end;

    if v_booking is null then
      raise exception
        'The booking connected to this review could not be found.';
    end if;

    v_booking_status := lower(
      coalesce(
        nullif(v_booking->>'booking_status', ''),
        nullif(v_booking->>'status', ''),
        nullif(v_booking->>'request_status', ''),
        ''
      )
    );

    v_booking_completed_at := coalesce(
      nullif(v_booking->>'completed_at', ''),
      nullif(v_booking->>'service_completed_at', ''),
      nullif(v_booking->>'ended_at', ''),
      nullif(v_booking->>'end_time', '')
    );

    if v_booking_status not in (
      'completed',
      'complete',
      'fulfilled',
      'finished',
      'closed'
    ) and v_booking_completed_at is null then
      raise exception
        'This booking must be completed before a verified review can be submitted.';
    end if;

    v_booking_pet_parent_id := coalesce(
      nullif(v_booking->>'customer_id', ''),
      nullif(v_booking->>'pet_parent_id', ''),
      nullif(v_booking->>'owner_id', ''),
      nullif(v_booking->>'client_id', ''),
      nullif(v_booking->>'booked_by', ''),
      nullif(v_booking->>'user_id', '')
    );

    v_booking_guru_id := coalesce(
      nullif(v_booking->>'guru_id', ''),
      nullif(v_booking->>'provider_id', ''),
      nullif(v_booking->>'sitter_id', ''),
      nullif(v_booking->>'caregiver_id', '')
    );

    if not v_admin then
      if v_authenticated_user is null then
        raise exception
          'Sign in as the Pet Parent connected to this booking.';
      end if;

      if new.reviewer_user_id is distinct from v_authenticated_user then
        raise exception
          'The reviewer must match the signed-in Pet Parent.';
      end if;

      if v_booking_pet_parent_id is not null
        and v_booking_pet_parent_id <> v_authenticated_user::text then
        raise exception
          'This booking belongs to a different Pet Parent account.';
      end if;
    end if;

    if v_booking_guru_id is not null then
      if new.guru_user_id is null then
        new.guru_user_id :=
          public.review_auth_user_id(v_booking_guru_id);
      elsif new.guru_user_id::text <> v_booking_guru_id then
        raise exception
          'The selected Guru does not match this booking.';
      end if;
    end if;

    new.guru_id := coalesce(new.guru_id, new.guru_user_id);
    new.provider_id := coalesce(new.provider_id, new.guru_user_id);
    new.reviewee_id := coalesce(new.reviewee_id, new.guru_user_id);
    new.subject_user_id := coalesce(
      new.subject_user_id,
      new.guru_user_id
    );

    new.verified_booking := true;
    new.is_verified := true;
    new.verified := true;
  else
    new.verified_booking := coalesce(new.verified_booking, false);
    new.is_verified := coalesce(new.is_verified, new.verified_booking);
    new.verified := coalesce(new.verified, new.verified_booking);
  end if;

  new.reviewer_name := coalesce(
    nullif(new.reviewer_name, ''),
    nullif(new.customer_name, ''),
    nullif(new.pet_parent_name, ''),
    nullif(new.author_name, ''),
    public.booking_review_profile_name(
      new.reviewer_user_id,
      'Pet Parent'
    )
  );
  new.customer_name := coalesce(
    nullif(new.customer_name, ''),
    new.reviewer_name
  );
  new.pet_parent_name := coalesce(
    nullif(new.pet_parent_name, ''),
    new.reviewer_name
  );
  new.author_name := coalesce(
    nullif(new.author_name, ''),
    new.reviewer_name
  );

  new.guru_name := coalesce(
    nullif(new.guru_name, ''),
    nullif(new.provider_name, ''),
    nullif(new.reviewee_name, ''),
    public.booking_review_profile_name(
      new.guru_user_id,
      'SitGuru Guru'
    )
  );
  new.provider_name := coalesce(
    nullif(new.provider_name, ''),
    new.guru_name
  );
  new.reviewee_name := coalesce(
    nullif(new.reviewee_name, ''),
    new.guru_name
  );

  if tg_op = 'UPDATE'
    and not v_admin
    and v_authenticated_user = old.guru_user_id then
    if (
      to_jsonb(new) - array[
        'guru_response',
        'guru_response_at',
        'guru_response_by',
        'provider_response',
        'provider_response_at',
        'provider_response_by',
        'response',
        'response_at',
        'responded_by',
        'updated_at',
        'updated_by'
      ]
    ) is distinct from (
      to_jsonb(old) - array[
        'guru_response',
        'guru_response_at',
        'guru_response_by',
        'provider_response',
        'provider_response_at',
        'provider_response_by',
        'response',
        'response_at',
        'responded_by',
        'updated_at',
        'updated_by'
      ]
    ) then
      raise exception
        'Gurus may respond to reviews but may not change Pet Parent feedback.';
    end if;

    new.guru_response := coalesce(
      nullif(new.guru_response, ''),
      nullif(new.provider_response, ''),
      nullif(new.response, '')
    );

    if new.guru_response is null then
      new.guru_response_at := null;
      new.guru_response_by := null;
      new.provider_response := null;
      new.provider_response_at := null;
      new.provider_response_by := null;
      new.response := null;
      new.response_at := null;
      new.responded_by := null;
    else
      new.guru_response_at := coalesce(new.guru_response_at, now());
      new.guru_response_by := v_authenticated_user;
      new.provider_response := new.guru_response;
      new.provider_response_at := new.guru_response_at;
      new.provider_response_by := v_authenticated_user;
      new.response := new.guru_response;
      new.response_at := new.guru_response_at;
      new.responded_by := v_authenticated_user;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists booking_reviews_normalize_before_write
  on public.booking_reviews;

create trigger booking_reviews_normalize_before_write
before insert or update on public.booking_reviews
for each row
execute function public.normalize_booking_review();

create or replace function public.audit_booking_review()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_review_id uuid;
  v_booking_id uuid;
begin
  v_review_id := coalesce(new.id, old.id);
  v_booking_id := coalesce(new.booking_id, old.booking_id);

  insert into public.booking_review_audit_log (
    booking_review_id,
    booking_id,
    actor_user_id,
    actor_source,
    operation,
    old_record,
    new_record
  )
  values (
    v_review_id,
    v_booking_id,
    auth.uid(),
    case
      when auth.uid() is null then 'database_or_service'
      else 'authenticated_user'
    end,
    lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists booking_reviews_audit_after_write
  on public.booking_reviews;

create trigger booking_reviews_audit_after_write
after insert or update or delete on public.booking_reviews
for each row
execute function public.audit_booking_review();

do $$
declare
  v_row jsonb;
  v_source_id text;
  v_booking_id uuid;
  v_reviewer_user_id uuid;
  v_guru_user_id uuid;
  v_rating integer;
  v_created_at timestamptz;
begin
  if to_regclass('public.reviews') is null then
    return;
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'reviews'
      and c.relkind in ('r', 'p')
  ) then
    return;
  end if;

  perform set_config('sitguru.review_backfill', 'true', true);

  for v_row in execute
    'select to_jsonb(r) from public.reviews r'
  loop
    begin
      v_source_id := coalesce(
        nullif(v_row->>'id', ''),
        nullif(v_row->>'review_id', ''),
        gen_random_uuid()::text
      );

      v_booking_id := public.try_review_uuid(
        coalesce(
          v_row->>'booking_id',
          v_row->>'care_booking_id',
          ''
        )
      );

      if v_booking_id is null then
        continue;
      end if;

      v_reviewer_user_id := public.review_auth_user_id(
        coalesce(
          v_row->>'reviewer_user_id',
          v_row->>'reviewer_id',
          v_row->>'customer_id',
          v_row->>'pet_parent_id',
          v_row->>'author_id',
          v_row->>'user_id',
          ''
        )
      );

      v_guru_user_id := public.review_auth_user_id(
        coalesce(
          v_row->>'guru_user_id',
          v_row->>'guru_id',
          v_row->>'provider_id',
          v_row->>'reviewee_id',
          v_row->>'subject_user_id',
          ''
        )
      );

      v_rating := greatest(
        1,
        least(
          5,
          coalesce(
            nullif(v_row->>'rating', '')::integer,
            nullif(v_row->>'overall_rating', '')::integer,
            nullif(v_row->>'stars', '')::integer,
            nullif(v_row->>'score', '')::integer,
            5
          )
        )
      );

      begin
        v_created_at := coalesce(
          nullif(v_row->>'created_at', '')::timestamptz,
          nullif(v_row->>'submitted_at', '')::timestamptz,
          nullif(v_row->>'published_at', '')::timestamptz,
          now()
        );
      exception
        when others then
          v_created_at := now();
      end;

      insert into public.booking_reviews (
        booking_id,
        care_booking_id,

        reviewer_user_id,
        reviewer_id,
        customer_id,
        pet_parent_id,
        author_id,
        user_id,

        guru_user_id,
        guru_id,
        provider_id,
        reviewee_id,
        subject_user_id,

        reviewer_name,
        customer_name,
        pet_parent_name,
        author_name,

        guru_name,
        provider_name,
        reviewee_name,

        rating,
        overall_rating,
        stars,
        score,

        review_text,
        review,
        comment,
        body,
        message,
        content,

        category_ratings,
        category_scores,
        ratings_breakdown,
        details,

        praise_tags,
        praise,
        highlights,
        tags,

        verified_booking,
        is_verified,
        verified,

        status,
        review_status,
        moderation_status,

        guru_response,
        guru_response_at,
        guru_response_by,

        provider_response,
        provider_response_at,
        provider_response_by,

        response,
        response_at,
        responded_by,

        source,
        metadata,

        submitted_at,
        published_at,
        created_at,
        updated_at,

        legacy_source_table,
        legacy_source_id
      )
      values (
        v_booking_id,
        v_booking_id,

        v_reviewer_user_id,
        v_reviewer_user_id,
        v_reviewer_user_id,
        v_reviewer_user_id,
        v_reviewer_user_id,
        v_reviewer_user_id,

        v_guru_user_id,
        v_guru_user_id,
        v_guru_user_id,
        v_guru_user_id,
        v_guru_user_id,

        coalesce(
          v_row->>'reviewer_name',
          v_row->>'customer_name',
          v_row->>'pet_parent_name',
          v_row->>'author_name',
          'Pet Parent'
        ),
        coalesce(
          v_row->>'customer_name',
          v_row->>'reviewer_name',
          'Pet Parent'
        ),
        coalesce(
          v_row->>'pet_parent_name',
          v_row->>'reviewer_name',
          'Pet Parent'
        ),
        coalesce(
          v_row->>'author_name',
          v_row->>'reviewer_name',
          'Pet Parent'
        ),

        coalesce(
          v_row->>'guru_name',
          v_row->>'provider_name',
          v_row->>'reviewee_name',
          'SitGuru Guru'
        ),
        coalesce(
          v_row->>'provider_name',
          v_row->>'guru_name',
          'SitGuru Guru'
        ),
        coalesce(
          v_row->>'reviewee_name',
          v_row->>'guru_name',
          'SitGuru Guru'
        ),

        v_rating,
        v_rating,
        v_rating,
        v_rating,

        coalesce(
          v_row->>'review_text',
          v_row->>'review',
          v_row->>'comment',
          v_row->>'body',
          v_row->>'message',
          v_row->>'content',
          'Legacy SitGuru review'
        ),
        coalesce(v_row->>'review', v_row->>'review_text'),
        coalesce(v_row->>'comment', v_row->>'review_text'),
        coalesce(v_row->>'body', v_row->>'review_text'),
        coalesce(v_row->>'message', v_row->>'review_text'),
        coalesce(v_row->>'content', v_row->>'review_text'),

        coalesce(
          v_row->'category_ratings',
          v_row->'category_scores',
          v_row->'ratings_breakdown',
          v_row->'details',
          '{}'::jsonb
        ),
        coalesce(
          v_row->'category_scores',
          v_row->'category_ratings',
          '{}'::jsonb
        ),
        coalesce(
          v_row->'ratings_breakdown',
          v_row->'category_ratings',
          '{}'::jsonb
        ),
        coalesce(
          v_row->'details',
          v_row->'category_ratings',
          '{}'::jsonb
        ),

        coalesce(
          v_row->'praise_tags',
          v_row->'praise',
          v_row->'highlights',
          v_row->'tags',
          '[]'::jsonb
        ),
        coalesce(
          v_row->'praise',
          v_row->'praise_tags',
          '[]'::jsonb
        ),
        coalesce(
          v_row->'highlights',
          v_row->'praise_tags',
          '[]'::jsonb
        ),
        coalesce(
          v_row->'tags',
          v_row->'praise_tags',
          '[]'::jsonb
        ),

        coalesce(
          (v_row->>'verified_booking')::boolean,
          (v_row->>'is_verified')::boolean,
          (v_row->>'verified')::boolean,
          false
        ),
        coalesce(
          (v_row->>'is_verified')::boolean,
          (v_row->>'verified_booking')::boolean,
          false
        ),
        coalesce(
          (v_row->>'verified')::boolean,
          (v_row->>'verified_booking')::boolean,
          false
        ),

        coalesce(
          nullif(lower(v_row->>'status'), ''),
          nullif(lower(v_row->>'review_status'), ''),
          nullif(lower(v_row->>'moderation_status'), ''),
          'published'
        ),
        coalesce(
          nullif(lower(v_row->>'review_status'), ''),
          nullif(lower(v_row->>'status'), ''),
          'published'
        ),
        coalesce(
          nullif(lower(v_row->>'moderation_status'), ''),
          nullif(lower(v_row->>'status'), ''),
          'published'
        ),

        coalesce(
          v_row->>'guru_response',
          v_row->>'provider_response',
          v_row->>'response'
        ),
        case
          when nullif(
            coalesce(
              v_row->>'guru_response_at',
              v_row->>'provider_response_at',
              v_row->>'response_at'
            ),
            ''
          ) is null then null
          else coalesce(
            v_row->>'guru_response_at',
            v_row->>'provider_response_at',
            v_row->>'response_at'
          )::timestamptz
        end,
        public.review_auth_user_id(
          coalesce(
            v_row->>'guru_response_by',
            v_row->>'provider_response_by',
            v_row->>'responded_by',
            ''
          )
        ),

        coalesce(
          v_row->>'provider_response',
          v_row->>'guru_response',
          v_row->>'response'
        ),
        null,
        public.review_auth_user_id(
          coalesce(
            v_row->>'provider_response_by',
            v_row->>'guru_response_by',
            v_row->>'responded_by',
            ''
          )
        ),

        coalesce(
          v_row->>'response',
          v_row->>'guru_response',
          v_row->>'provider_response'
        ),
        null,
        public.review_auth_user_id(
          coalesce(
            v_row->>'responded_by',
            v_row->>'guru_response_by',
            v_row->>'provider_response_by',
            ''
          )
        ),

        coalesce(v_row->>'source', 'legacy_reviews'),
        coalesce(v_row->'metadata', '{}'::jsonb),

        v_created_at,
        v_created_at,
        v_created_at,
        coalesce(
          nullif(v_row->>'updated_at', '')::timestamptz,
          v_created_at
        ),

        'reviews',
        v_source_id
      )
      on conflict (booking_id)
      do nothing;
    exception
      when others then
        raise warning
          'Skipped legacy reviews row % because: %',
          v_source_id,
          sqlerrm;
    end;
  end loop;

  perform set_config('sitguru.review_backfill', 'false', true);
end;
$$;

alter table public.booking_reviews enable row level security;
alter table public.booking_review_audit_log enable row level security;

drop policy if exists booking_reviews_select_visible
  on public.booking_reviews;

create policy booking_reviews_select_visible
on public.booking_reviews
for select
to authenticated
using (
  public.is_sitguru_admin()
  or reviewer_user_id = auth.uid()
  or guru_user_id = auth.uid()
  or status = 'published'
);

drop policy if exists booking_reviews_insert_pet_parent
  on public.booking_reviews;

create policy booking_reviews_insert_pet_parent
on public.booking_reviews
for insert
to authenticated
with check (
  auth.uid() is not null
  and reviewer_user_id = auth.uid()
  and status in ('pending', 'published')
);

drop policy if exists booking_reviews_update_guru_or_admin
  on public.booking_reviews;

create policy booking_reviews_update_guru_or_admin
on public.booking_reviews
for update
to authenticated
using (
  public.is_sitguru_admin()
  or guru_user_id = auth.uid()
)
with check (
  public.is_sitguru_admin()
  or guru_user_id = auth.uid()
);

drop policy if exists booking_reviews_delete_admin
  on public.booking_reviews;

create policy booking_reviews_delete_admin
on public.booking_reviews
for delete
to authenticated
using (public.is_sitguru_admin());

drop policy if exists booking_review_audit_select_admin
  on public.booking_review_audit_log;

create policy booking_review_audit_select_admin
on public.booking_review_audit_log
for select
to authenticated
using (public.is_sitguru_admin());

grant select, insert, update, delete
  on public.booking_reviews
  to authenticated;

grant select
  on public.booking_review_audit_log
  to authenticated;

grant all
  on public.booking_reviews
  to service_role;

grant all
  on public.booking_review_audit_log
  to service_role;

create or replace view public.public_guru_booking_reviews
with (security_invoker = true)
as
select
  r.id,
  r.booking_id,
  r.guru_user_id,
  r.guru_name,
  r.reviewer_name,
  r.rating,
  r.review_text,
  r.category_ratings,
  r.praise_tags,
  r.verified_booking,
  r.guru_response,
  r.guru_response_at,
  r.published_at,
  r.created_at
from public.booking_reviews r
where r.status = 'published';

grant select
  on public.public_guru_booking_reviews
  to authenticated;

grant select
  on public.public_guru_booking_reviews
  to service_role;

create or replace view public.guru_review_summaries
with (security_invoker = true)
as
select
  r.guru_user_id,
  max(r.guru_name) as guru_name,
  count(*)::bigint as review_count,
  count(*) filter (
    where r.verified_booking
  )::bigint as verified_review_count,
  round(avg(r.rating)::numeric, 2) as average_rating,
  count(*) filter (
    where nullif(trim(r.guru_response), '') is not null
  )::bigint as guru_response_count,
  max(r.created_at) as latest_review_at
from public.booking_reviews r
where r.status = 'published'
group by r.guru_user_id;

grant select
  on public.guru_review_summaries
  to authenticated;

grant select
  on public.guru_review_summaries
  to service_role;

create or replace view public.my_booking_reviews
with (security_invoker = true)
as
select *
from public.booking_reviews
where
  reviewer_user_id = auth.uid()
  or guru_user_id = auth.uid();

grant select
  on public.my_booking_reviews
  to authenticated;

grant select
  on public.my_booking_reviews
  to service_role;

do $$
begin
  if to_regclass('public.reviews') is null then
    execute $view$
      create view public.reviews
      with (security_invoker = true)
      as
      select *
      from public.booking_reviews
    $view$;

    execute
      'grant select, insert, update, delete on public.reviews to authenticated';

    execute
      'grant all on public.reviews to service_role';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'booking_reviews'
  ) then
    alter publication supabase_realtime
      add table public.booking_reviews;
  end if;
exception
  when others then
    raise warning
      'Could not add booking_reviews to supabase_realtime: %',
      sqlerrm;
end;
$$;

comment on table public.booking_reviews is
  'Canonical verified SitGuru Pet Parent reviews tied to completed bookings, with one review per booking and optional Guru responses.';

comment on column public.booking_reviews.verified_booking is
  'True only after SitGuru verifies that the referenced booking is completed and belongs to the signed-in Pet Parent.';

comment on column public.booking_reviews.guru_response is
  'Public response written by the Guru connected to the reviewed booking.';

comment on table public.booking_review_audit_log is
  'Immutable database audit history for review inserts, responses, moderation changes, and deletions.';

commit;