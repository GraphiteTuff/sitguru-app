begin;

create extension if not exists pgcrypto;

create sequence if not exists public.support_ticket_number_seq
  as bigint
  start with 1000
  increment by 1
  minvalue 1000
  no maxvalue
  cache 20;

create or replace function public.generate_support_ticket_number()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  v_number bigint;
begin
  v_number := nextval('public.support_ticket_number_seq');

  return
    'SG-' ||
    to_char(current_date, 'YYYYMMDD') ||
    '-' ||
    lpad(v_number::text, 6, '0');
end;
$$;

create or replace function public.try_support_uuid(
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

create or replace function public.support_auth_user_id(
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
  v_user_id := public.try_support_uuid(p_value);

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

revoke all on function public.support_auth_user_id(text) from public;
grant execute on function public.support_auth_user_id(text) to authenticated;
grant execute on function public.support_auth_user_id(text) to service_role;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null default public.generate_support_ticket_number(),

  user_id uuid references auth.users(id) on delete set null,
  requester_user_id uuid references auth.users(id) on delete set null,
  customer_user_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,

  profile_id uuid,
  requester_profile_id uuid,

  requester_name text,
  full_name text,
  requester_email text,
  email text,
  requester_role text,
  role text,

  category text not null default 'other',
  topic text,
  request_type text,

  subject text not null default 'SitGuru support request',
  title text,
  summary text,

  description text not null default '',
  message text,
  details text,
  body text,

  reference text,
  booking_reference text,
  booking_id uuid,
  payment_id text,
  payout_id text,
  conversation_id uuid,

  status text not null default 'open',
  ticket_status text not null default 'open',
  request_status text not null default 'open',

  priority text not null default 'normal',
  urgency text not null default 'normal',
  severity text not null default 'normal',

  source text not null default 'sitguru_mobile_app',
  platform text,
  app_surface text not null default 'support_center',
  metadata jsonb not null default '{}'::jsonb,

  first_response_at timestamptz,
  last_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,

  submitted_at timestamptz not null default now(),
  opened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  legacy_source_table text,
  legacy_source_id text
);

alter table public.support_requests
  add column if not exists ticket_number text,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists requester_user_id uuid references auth.users(id) on delete set null,
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists profile_id uuid,
  add column if not exists requester_profile_id uuid,
  add column if not exists requester_name text,
  add column if not exists full_name text,
  add column if not exists requester_email text,
  add column if not exists email text,
  add column if not exists requester_role text,
  add column if not exists role text,
  add column if not exists category text,
  add column if not exists topic text,
  add column if not exists request_type text,
  add column if not exists subject text,
  add column if not exists title text,
  add column if not exists summary text,
  add column if not exists description text,
  add column if not exists message text,
  add column if not exists details text,
  add column if not exists body text,
  add column if not exists reference text,
  add column if not exists booking_reference text,
  add column if not exists booking_id uuid,
  add column if not exists payment_id text,
  add column if not exists payout_id text,
  add column if not exists conversation_id uuid,
  add column if not exists status text,
  add column if not exists ticket_status text,
  add column if not exists request_status text,
  add column if not exists priority text,
  add column if not exists urgency text,
  add column if not exists severity text,
  add column if not exists source text,
  add column if not exists platform text,
  add column if not exists app_surface text,
  add column if not exists metadata jsonb,
  add column if not exists first_response_at timestamptz,
  add column if not exists last_response_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists opened_at timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz,
  add column if not exists legacy_source_table text,
  add column if not exists legacy_source_id text;

update public.support_requests
set
  ticket_number = coalesce(
    nullif(ticket_number, ''),
    public.generate_support_ticket_number()
  ),
  category = coalesce(
    nullif(lower(category), ''),
    nullif(lower(topic), ''),
    nullif(lower(request_type), ''),
    'other'
  ),
  topic = coalesce(nullif(topic, ''), initcap(coalesce(category, 'other'))),
  request_type = coalesce(
    nullif(request_type, ''),
    lower(coalesce(category, 'other'))
  ),
  subject = coalesce(
    nullif(subject, ''),
    nullif(title, ''),
    nullif(summary, ''),
    'SitGuru support request'
  ),
  title = coalesce(nullif(title, ''), subject, 'SitGuru support request'),
  summary = coalesce(nullif(summary, ''), subject, 'SitGuru support request'),
  description = coalesce(
    nullif(description, ''),
    nullif(message, ''),
    nullif(details, ''),
    nullif(body, ''),
    ''
  ),
  message = coalesce(message, description, ''),
  details = coalesce(details, description, ''),
  body = coalesce(body, description, ''),
  status = coalesce(nullif(lower(status), ''), 'open'),
  ticket_status = coalesce(
    nullif(lower(ticket_status), ''),
    nullif(lower(status), ''),
    'open'
  ),
  request_status = coalesce(
    nullif(lower(request_status), ''),
    nullif(lower(status), ''),
    'open'
  ),
  priority = coalesce(nullif(lower(priority), ''), 'normal'),
  urgency = coalesce(
    nullif(lower(urgency), ''),
    nullif(lower(priority), ''),
    'normal'
  ),
  severity = coalesce(
    nullif(lower(severity), ''),
    case
      when lower(coalesce(priority, '')) = 'urgent' then 'high'
      else 'normal'
    end
  ),
  source = coalesce(nullif(source, ''), 'sitguru_mobile_app'),
  app_surface = coalesce(nullif(app_surface, ''), 'support_center'),
  metadata = coalesce(metadata, '{}'::jsonb),
  submitted_at = coalesce(submitted_at, created_at, now()),
  opened_at = coalesce(opened_at, created_at, now()),
  created_at = coalesce(created_at, submitted_at, now()),
  updated_at = coalesce(updated_at, created_at, now());

create unique index if not exists support_requests_ticket_number_uidx
  on public.support_requests(ticket_number);

create index if not exists support_requests_user_id_idx
  on public.support_requests(user_id, created_at desc);

create index if not exists support_requests_requester_user_id_idx
  on public.support_requests(requester_user_id, created_at desc);

create index if not exists support_requests_customer_user_id_idx
  on public.support_requests(customer_user_id, created_at desc);

create index if not exists support_requests_status_idx
  on public.support_requests(status, updated_at desc);

create index if not exists support_requests_priority_idx
  on public.support_requests(priority, updated_at desc);

create index if not exists support_requests_category_idx
  on public.support_requests(category, updated_at desc);

create index if not exists support_requests_assigned_to_idx
  on public.support_requests(assigned_to, updated_at desc);

create unique index if not exists support_requests_legacy_source_uidx
  on public.support_requests(legacy_source_table, legacy_source_id)
  where legacy_source_table is not null
    and legacy_source_id is not null;

create table if not exists public.support_request_updates (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null
    references public.support_requests(id)
    on delete cascade,

  author_user_id uuid references auth.users(id) on delete set null,
  author_role text,

  update_type text not null default 'message',
  message text not null default '',

  old_status text,
  new_status text,

  is_internal boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists support_request_updates_request_idx
  on public.support_request_updates(support_request_id, created_at asc);

create index if not exists support_request_updates_author_idx
  on public.support_request_updates(author_user_id, created_at desc);

create table if not exists public.support_request_audit_log (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_source text not null default 'database',
  operation text not null,
  old_record jsonb,
  new_record jsonb,
  created_at timestamptz not null default now()
);

create index if not exists support_request_audit_request_idx
  on public.support_request_audit_log(support_request_id, created_at desc);

create or replace function public.normalize_support_request()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_status text;
begin
  if tg_op = 'INSERT' then
    new.id := coalesce(new.id, gen_random_uuid());
    new.ticket_number := coalesce(
      nullif(new.ticket_number, ''),
      public.generate_support_ticket_number()
    );

    new.user_id := coalesce(
      new.user_id,
      new.requester_user_id,
      new.customer_user_id,
      v_auth_user_id
    );

    new.requester_user_id := coalesce(
      new.requester_user_id,
      new.user_id,
      v_auth_user_id
    );

    new.customer_user_id := coalesce(
      new.customer_user_id,
      new.user_id,
      new.requester_user_id,
      v_auth_user_id
    );

    new.created_by := coalesce(new.created_by, v_auth_user_id, new.user_id);
    new.created_at := coalesce(new.created_at, now());
    new.submitted_at := coalesce(new.submitted_at, new.created_at, now());
    new.opened_at := coalesce(new.opened_at, new.created_at, now());
  end if;

  new.updated_by := coalesce(v_auth_user_id, new.updated_by, new.created_by);
  new.updated_at := now();

  new.requester_name := coalesce(
    nullif(new.requester_name, ''),
    nullif(new.full_name, '')
  );
  new.full_name := coalesce(
    nullif(new.full_name, ''),
    nullif(new.requester_name, '')
  );

  new.requester_email := coalesce(
    nullif(new.requester_email, ''),
    nullif(new.email, '')
  );
  new.email := coalesce(
    nullif(new.email, ''),
    nullif(new.requester_email, '')
  );

  new.requester_role := lower(
    coalesce(
      nullif(new.requester_role, ''),
      nullif(new.role, ''),
      'pet_parent'
    )
  );
  new.role := lower(
    coalesce(
      nullif(new.role, ''),
      nullif(new.requester_role, ''),
      'pet_parent'
    )
  );

  new.category := lower(
    coalesce(
      nullif(new.category, ''),
      nullif(new.topic, ''),
      nullif(new.request_type, ''),
      'other'
    )
  );
  new.topic := coalesce(nullif(new.topic, ''), initcap(new.category));
  new.request_type := lower(
    coalesce(nullif(new.request_type, ''), new.category)
  );

  new.subject := coalesce(
    nullif(new.subject, ''),
    nullif(new.title, ''),
    nullif(new.summary, ''),
    'SitGuru support request'
  );
  new.title := coalesce(nullif(new.title, ''), new.subject);
  new.summary := coalesce(nullif(new.summary, ''), new.subject);

  new.description := coalesce(
    nullif(new.description, ''),
    nullif(new.message, ''),
    nullif(new.details, ''),
    nullif(new.body, ''),
    ''
  );
  new.message := coalesce(nullif(new.message, ''), new.description);
  new.details := coalesce(nullif(new.details, ''), new.description);
  new.body := coalesce(nullif(new.body, ''), new.description);

  v_status := lower(
    coalesce(
      nullif(new.status, ''),
      nullif(new.ticket_status, ''),
      nullif(new.request_status, ''),
      'open'
    )
  );

  if v_status not in (
    'open',
    'assigned',
    'in_progress',
    'waiting_on_member',
    'pending_member',
    'needs_information',
    'resolved',
    'closed',
    'cancelled',
    'canceled'
  ) then
    v_status := 'open';
  end if;

  new.status := v_status;
  new.ticket_status := v_status;
  new.request_status := v_status;

  new.priority := lower(coalesce(nullif(new.priority, ''), 'normal'));

  if new.priority not in ('low', 'normal', 'urgent', 'critical') then
    new.priority := 'normal';
  end if;

  new.urgency := lower(
    coalesce(nullif(new.urgency, ''), new.priority)
  );

  new.severity := lower(
    coalesce(
      nullif(new.severity, ''),
      case
        when new.priority in ('urgent', 'critical') then 'high'
        else 'normal'
      end
    )
  );

  new.source := coalesce(nullif(new.source, ''), 'sitguru_mobile_app');
  new.app_surface := coalesce(nullif(new.app_surface, ''), 'support_center');
  new.metadata := coalesce(new.metadata, '{}'::jsonb);

  if new.status = 'resolved' and new.resolved_at is null then
    new.resolved_at := now();
  end if;

  if new.status = 'closed' and new.closed_at is null then
    new.closed_at := now();
  end if;

  if new.status not in ('resolved', 'closed') then
    if tg_op = 'UPDATE' and old.status in ('resolved', 'closed') then
      new.resolved_at := null;
      new.closed_at := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists support_requests_normalize_before_write
  on public.support_requests;

create trigger support_requests_normalize_before_write
before insert or update on public.support_requests
for each row
execute function public.normalize_support_request();

create or replace function public.audit_support_request()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_request_id uuid;
begin
  v_request_id := coalesce(new.id, old.id);

  insert into public.support_request_audit_log (
    support_request_id,
    actor_user_id,
    actor_source,
    operation,
    old_record,
    new_record
  )
  values (
    v_request_id,
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

drop trigger if exists support_requests_audit_after_write
  on public.support_requests;

create trigger support_requests_audit_after_write
after insert or update or delete on public.support_requests
for each row
execute function public.audit_support_request();

create or replace function public.log_support_request_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.support_request_updates (
      support_request_id,
      author_user_id,
      author_role,
      update_type,
      message,
      old_status,
      new_status,
      is_internal,
      metadata
    )
    values (
      new.id,
      coalesce(auth.uid(), new.created_by, new.user_id),
      coalesce(new.requester_role, new.role, 'member'),
      'request_created',
      'Support request created.',
      null,
      new.status,
      false,
      jsonb_build_object(
        'source', new.source,
        'platform', new.platform,
        'ticket_number', new.ticket_number
      )
    );

    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.support_request_updates (
      support_request_id,
      author_user_id,
      author_role,
      update_type,
      message,
      old_status,
      new_status,
      is_internal,
      metadata
    )
    values (
      new.id,
      auth.uid(),
      case
        when public.is_sitguru_admin() then 'admin'
        else coalesce(new.requester_role, new.role, 'member')
      end,
      'status_changed',
      'Support request status changed to ' ||
        replace(new.status, '_', ' ') ||
        '.',
      old.status,
      new.status,
      false,
      jsonb_build_object(
        'ticket_number', new.ticket_number
      )
    );
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    insert into public.support_request_updates (
      support_request_id,
      author_user_id,
      author_role,
      update_type,
      message,
      old_status,
      new_status,
      is_internal,
      metadata
    )
    values (
      new.id,
      auth.uid(),
      'admin',
      'assignment_changed',
      case
        when new.assigned_to is null then 'Support assignment cleared.'
        else 'Support request assigned for review.'
      end,
      old.status,
      new.status,
      true,
      jsonb_build_object(
        'previous_assigned_to', old.assigned_to,
        'assigned_to', new.assigned_to,
        'ticket_number', new.ticket_number
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists support_requests_lifecycle_after_write
  on public.support_requests;

create trigger support_requests_lifecycle_after_write
after insert or update on public.support_requests
for each row
execute function public.log_support_request_lifecycle();

do $$
declare
  v_row jsonb;
  v_source_id text;
  v_user_id uuid;
  v_created_at timestamptz;
begin
  if to_regclass('public.support_tickets') is null then
    return;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'support_tickets'
      and c.relkind in ('r', 'p')
  ) then
    for v_row in execute
      'select to_jsonb(t) from public.support_tickets t'
    loop
      begin
        v_source_id := coalesce(
          nullif(v_row->>'id', ''),
          nullif(v_row->>'ticket_id', ''),
          gen_random_uuid()::text
        );

        v_user_id := public.support_auth_user_id(
          coalesce(
            v_row->>'user_id',
            v_row->>'requester_user_id',
            v_row->>'customer_user_id',
            v_row->>'created_by',
            ''
          )
        );

        begin
          v_created_at := coalesce(
            nullif(v_row->>'created_at', '')::timestamptz,
            nullif(v_row->>'submitted_at', '')::timestamptz,
            now()
          );
        exception
          when others then
            v_created_at := now();
        end;

        insert into public.support_requests (
          user_id,
          requester_user_id,
          customer_user_id,
          created_by,

          profile_id,
          requester_profile_id,

          requester_name,
          full_name,
          requester_email,
          email,
          requester_role,
          role,

          category,
          topic,
          request_type,

          subject,
          title,
          summary,

          description,
          message,
          details,
          body,

          reference,
          booking_reference,

          status,
          ticket_status,
          request_status,

          priority,
          urgency,
          severity,

          source,
          platform,
          app_surface,
          metadata,

          submitted_at,
          opened_at,
          created_at,
          updated_at,

          legacy_source_table,
          legacy_source_id
        )
        values (
          v_user_id,
          v_user_id,
          v_user_id,
          v_user_id,

          public.try_support_uuid(v_row->>'profile_id'),
          public.try_support_uuid(v_row->>'requester_profile_id'),

          coalesce(v_row->>'requester_name', v_row->>'full_name'),
          coalesce(v_row->>'full_name', v_row->>'requester_name'),
          coalesce(v_row->>'requester_email', v_row->>'email'),
          coalesce(v_row->>'email', v_row->>'requester_email'),
          coalesce(v_row->>'requester_role', v_row->>'role'),
          coalesce(v_row->>'role', v_row->>'requester_role'),

          coalesce(
            v_row->>'category',
            v_row->>'topic',
            v_row->>'request_type',
            'other'
          ),
          coalesce(
            v_row->>'topic',
            v_row->>'category',
            v_row->>'request_type',
            'Support'
          ),
          coalesce(
            v_row->>'request_type',
            v_row->>'category',
            v_row->>'topic',
            'other'
          ),

          coalesce(
            v_row->>'subject',
            v_row->>'title',
            v_row->>'summary',
            'SitGuru support request'
          ),
          coalesce(
            v_row->>'title',
            v_row->>'subject',
            v_row->>'summary',
            'SitGuru support request'
          ),
          coalesce(
            v_row->>'summary',
            v_row->>'subject',
            v_row->>'title',
            'SitGuru support request'
          ),

          coalesce(
            v_row->>'description',
            v_row->>'message',
            v_row->>'details',
            v_row->>'body',
            ''
          ),
          coalesce(
            v_row->>'message',
            v_row->>'description',
            v_row->>'details',
            v_row->>'body',
            ''
          ),
          coalesce(
            v_row->>'details',
            v_row->>'description',
            v_row->>'message',
            v_row->>'body',
            ''
          ),
          coalesce(
            v_row->>'body',
            v_row->>'description',
            v_row->>'message',
            v_row->>'details',
            ''
          ),

          coalesce(v_row->>'reference', v_row->>'booking_reference'),
          coalesce(v_row->>'booking_reference', v_row->>'reference'),

          coalesce(
            v_row->>'status',
            v_row->>'ticket_status',
            v_row->>'request_status',
            'open'
          ),
          coalesce(
            v_row->>'ticket_status',
            v_row->>'status',
            v_row->>'request_status',
            'open'
          ),
          coalesce(
            v_row->>'request_status',
            v_row->>'status',
            v_row->>'ticket_status',
            'open'
          ),

          coalesce(v_row->>'priority', v_row->>'urgency', 'normal'),
          coalesce(v_row->>'urgency', v_row->>'priority', 'normal'),
          coalesce(v_row->>'severity', 'normal'),

          coalesce(v_row->>'source', 'legacy_support_tickets'),
          v_row->>'platform',
          coalesce(v_row->>'app_surface', 'support_center'),
          coalesce(v_row->'metadata', '{}'::jsonb),

          v_created_at,
          v_created_at,
          v_created_at,
          coalesce(
            nullif(v_row->>'updated_at', '')::timestamptz,
            v_created_at
          ),

          'support_tickets',
          v_source_id
        )
        on conflict (
          legacy_source_table,
          legacy_source_id
        )
        where legacy_source_table is not null
          and legacy_source_id is not null
        do nothing;
      exception
        when others then
          raise warning
            'Skipped legacy support_tickets row % because: %',
            v_source_id,
            sqlerrm;
      end;
    end loop;
  end if;
end;
$$;

alter table public.support_requests enable row level security;
alter table public.support_request_updates enable row level security;
alter table public.support_request_audit_log enable row level security;

drop policy if exists support_requests_select_own_or_admin
  on public.support_requests;

create policy support_requests_select_own_or_admin
on public.support_requests
for select
to authenticated
using (
  public.is_sitguru_admin()
  or auth.uid() = user_id
  or auth.uid() = requester_user_id
  or auth.uid() = customer_user_id
  or auth.uid() = created_by
);

drop policy if exists support_requests_insert_own
  on public.support_requests;

create policy support_requests_insert_own
on public.support_requests
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    auth.uid() = user_id
    or auth.uid() = requester_user_id
    or auth.uid() = customer_user_id
    or auth.uid() = created_by
  )
);

drop policy if exists support_requests_update_admin
  on public.support_requests;

create policy support_requests_update_admin
on public.support_requests
for update
to authenticated
using (public.is_sitguru_admin())
with check (public.is_sitguru_admin());

drop policy if exists support_requests_delete_admin
  on public.support_requests;

create policy support_requests_delete_admin
on public.support_requests
for delete
to authenticated
using (public.is_sitguru_admin());

drop policy if exists support_updates_select_visible
  on public.support_request_updates;

create policy support_updates_select_visible
on public.support_request_updates
for select
to authenticated
using (
  public.is_sitguru_admin()
  or (
    is_internal = false
    and exists (
      select 1
      from public.support_requests r
      where r.id = support_request_id
        and (
          auth.uid() = r.user_id
          or auth.uid() = r.requester_user_id
          or auth.uid() = r.customer_user_id
          or auth.uid() = r.created_by
        )
    )
  )
);

drop policy if exists support_updates_insert_member_or_admin
  on public.support_request_updates;

create policy support_updates_insert_member_or_admin
on public.support_request_updates
for insert
to authenticated
with check (
  public.is_sitguru_admin()
  or (
    auth.uid() = author_user_id
    and is_internal = false
    and update_type in ('message', 'member_follow_up', 'attachment')
    and exists (
      select 1
      from public.support_requests r
      where r.id = support_request_id
        and (
          auth.uid() = r.user_id
          or auth.uid() = r.requester_user_id
          or auth.uid() = r.customer_user_id
          or auth.uid() = r.created_by
        )
    )
  )
);

drop policy if exists support_updates_update_admin
  on public.support_request_updates;

create policy support_updates_update_admin
on public.support_request_updates
for update
to authenticated
using (public.is_sitguru_admin())
with check (public.is_sitguru_admin());

drop policy if exists support_updates_delete_admin
  on public.support_request_updates;

create policy support_updates_delete_admin
on public.support_request_updates
for delete
to authenticated
using (public.is_sitguru_admin());

drop policy if exists support_audit_select_admin
  on public.support_request_audit_log;

create policy support_audit_select_admin
on public.support_request_audit_log
for select
to authenticated
using (public.is_sitguru_admin());

grant select, insert, update, delete
  on public.support_requests
  to authenticated;

grant select, insert, update, delete
  on public.support_request_updates
  to authenticated;

grant select
  on public.support_request_audit_log
  to authenticated;

grant all
  on public.support_requests
  to service_role;

grant all
  on public.support_request_updates
  to service_role;

grant all
  on public.support_request_audit_log
  to service_role;

grant usage, select
  on sequence public.support_ticket_number_seq
  to authenticated;

grant all
  on sequence public.support_ticket_number_seq
  to service_role;

create or replace view public.my_support_requests
with (security_invoker = true)
as
select
  r.*,
  (
    select count(*)
    from public.support_request_updates u
    where u.support_request_id = r.id
      and u.is_internal = false
  )::bigint as visible_update_count,
  (
    select max(u.created_at)
    from public.support_request_updates u
    where u.support_request_id = r.id
      and u.is_internal = false
  ) as latest_visible_update_at
from public.support_requests r
where
  auth.uid() = r.user_id
  or auth.uid() = r.requester_user_id
  or auth.uid() = r.customer_user_id
  or auth.uid() = r.created_by;

grant select on public.my_support_requests to authenticated;
grant select on public.my_support_requests to service_role;

create or replace view public.admin_support_requests
with (security_invoker = true)
as
select
  r.*,
  coalesce(
    (
      select count(*)
      from public.support_request_updates u
      where u.support_request_id = r.id
    ),
    0
  )::bigint as update_count,
  (
    select max(u.created_at)
    from public.support_request_updates u
    where u.support_request_id = r.id
  ) as latest_update_at,
  extract(
    epoch from (
      coalesce(r.first_response_at, now()) - r.created_at
    )
  )::bigint as first_response_seconds,
  extract(
    epoch from (
      coalesce(r.resolved_at, r.closed_at, now()) - r.created_at
    )
  )::bigint as age_seconds
from public.support_requests r;

grant select on public.admin_support_requests to authenticated;
grant select on public.admin_support_requests to service_role;

do $$
begin
  if to_regclass('public.support_tickets') is null then
    execute $view$
      create view public.support_tickets
      with (security_invoker = true)
      as
      select *
      from public.support_requests
    $view$;

    execute
      'grant select, insert, update, delete on public.support_tickets to authenticated';

    execute
      'grant all on public.support_tickets to service_role';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'support_requests'
    ) then
      alter publication supabase_realtime
        add table public.support_requests;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'support_request_updates'
    ) then
      alter publication supabase_realtime
        add table public.support_request_updates;
    end if;
  end if;
exception
  when others then
    raise warning
      'Could not add support tables to supabase_realtime publication: %',
      sqlerrm;
end;
$$;

comment on table public.support_requests is
  'Canonical SitGuru support requests created from mobile, web, Admin, booking, payment, payout, referral, review, account, notification, and safety workflows.';

comment on table public.support_request_updates is
  'Member-visible and internal lifecycle updates for SitGuru support requests.';

comment on table public.support_request_audit_log is
  'Immutable audit history for inserts, updates, and deletes on support requests.';

comment on column public.support_requests.status is
  'Operational support status. Mobile users may read their own status; only Admin may update it.';

comment on column public.support_requests.priority is
  'Member-selected or Admin-adjusted priority. Urgent does not replace local emergency services.';

comment on column public.support_request_updates.is_internal is
  'Internal updates are visible only to SitGuru Admin or service-role processes.';

commit;