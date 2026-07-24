-- SitGuru shared payout schema alignment
-- Adds the canonical payout fields used by Guru, Ambassador, web, and mobile
-- while preserving the existing legacy columns and data.

begin;

-- ---------------------------------------------------------------------------
-- 1. Guru / marketplace payout accounts
-- ---------------------------------------------------------------------------

alter table public.user_payout_accounts
  add column if not exists account_purpose text,
  add column if not exists provider_payer_id text,
  add column if not exists provider_email text,
  add column if not exists onboarding_status text not null default 'not_started',
  add column if not exists account_status text not null default 'pending',
  add column if not exists country_code text not null default 'US',
  add column if not exists default_currency text not null default 'USD',
  add column if not exists is_default boolean not null default false,
  add column if not exists is_live boolean not null default false,
  add column if not exists requirements_currently_due jsonb not null default '[]'::jsonb,
  add column if not exists requirements_eventually_due jsonb not null default '[]'::jsonb,
  add column if not exists capabilities jsonb not null default '{}'::jsonb,
  add column if not exists connected_at timestamptz,
  add column if not exists disabled_at timestamptz,
  add column if not exists last_synced_at timestamptz;

update public.user_payout_accounts
set
  account_purpose = coalesce(
    nullif(btrim(account_purpose), ''),
    case
      when lower(coalesce(workspace_role, '')) = 'ambassador'
        then 'ambassador_reward'
      else 'guru_marketplace_seller'
    end
  ),
  onboarding_status = case
    when lower(coalesce(status, '')) in (
      'ready',
      'active',
      'connected',
      'complete',
      'completed'
    ) then 'ready'
    when lower(coalesce(status, '')) in ('restricted', 'limited')
      then 'restricted'
    when lower(coalesce(status, '')) in ('disabled', 'disconnected')
      then 'disabled'
    when lower(coalesce(status, '')) in ('pending_review', 'review')
      then 'pending_review'
    when lower(coalesce(status, '')) in ('pending', 'in_progress', 'started')
      then 'in_progress'
    else coalesce(nullif(onboarding_status, ''), 'not_started')
  end,
  account_status = case
    when lower(coalesce(status, '')) in (
      'ready',
      'active',
      'connected',
      'complete',
      'completed'
    ) then 'active'
    when lower(coalesce(status, '')) in ('restricted', 'limited')
      then 'restricted'
    when lower(coalesce(status, '')) = 'disconnected'
      then 'disconnected'
    when lower(coalesce(status, '')) = 'disabled'
      then 'disabled'
    else coalesce(nullif(account_status, ''), 'pending')
  end,
  is_default = coalesce(is_default, false) or coalesce(is_primary, false),
  connected_at = coalesce(
    connected_at,
    onboarding_completed_at,
    case
      when nullif(provider_account_id, '') is not null
        or nullif(provider_merchant_id, '') is not null
      then onboarding_started_at
      else null
    end
  ),
  last_synced_at = coalesce(
    last_synced_at,
    last_checked_at,
    updated_at,
    created_at,
    now()
  ),
  country_code = coalesce(nullif(country_code, ''), 'US'),
  default_currency = coalesce(nullif(default_currency, ''), 'USD'),
  requirements_currently_due = coalesce(
    requirements_currently_due,
    '[]'::jsonb
  ),
  requirements_eventually_due = coalesce(
    requirements_eventually_due,
    '[]'::jsonb
  ),
  capabilities = coalesce(capabilities, '{}'::jsonb);

-- ---------------------------------------------------------------------------
-- 2. Shared payout preferences
-- ---------------------------------------------------------------------------

alter table public.user_payout_preferences
  add column if not exists role_context text not null default 'unknown',
  add column if not exists booking_payout_provider text not null default 'set_up_later',
  add column if not exists reward_payout_provider text not null default 'set_up_later',
  add column if not exists booking_setup_requirement text not null default 'before_first_paid_booking',
  add column if not exists reward_setup_requirement text not null default 'before_first_reward_payout',
  add column if not exists financial_onboarding_status text not null default 'deferred',
  add column if not exists onboarding_deferred boolean not null default true,
  add column if not exists profile_completion_requires_payout boolean not null default false,
  add column if not exists search_visibility_requires_payout boolean not null default false,
  add column if not exists accepting_paid_work_requires_payout boolean not null default true,
  add column if not exists reward_release_requires_destination boolean not null default true,
  add column if not exists can_accept_paid_bookings boolean not null default false,
  add column if not exists can_receive_reward_payouts boolean not null default false,
  add column if not exists selected_at timestamptz,
  add column if not exists setup_started_at timestamptz,
  add column if not exists last_verified_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.user_payout_preferences
set
  role_context = case
    when lower(coalesce(workspace_role, '')) = 'guru' then 'guru'
    when lower(coalesce(workspace_role, '')) = 'ambassador' then 'ambassador'
    when lower(coalesce(workspace_role, '')) in ('multi_role', 'multi-role', 'both')
      then 'multi_role'
    else coalesce(nullif(role_context, ''), 'unknown')
  end,
  booking_payout_provider = case
    when lower(coalesce(workspace_role, '')) in ('guru', 'multi_role', 'multi-role', 'both')
      and lower(coalesce(preferred_provider, '')) in ('stripe', 'stripe_connect')
      then 'stripe'
    when lower(coalesce(workspace_role, '')) in ('guru', 'multi_role', 'multi-role', 'both')
      and lower(coalesce(preferred_provider, '')) = 'paypal'
      then 'paypal'
    else coalesce(nullif(booking_payout_provider, ''), 'set_up_later')
  end,
  reward_payout_provider = case
    when lower(coalesce(workspace_role, '')) in ('ambassador', 'multi_role', 'multi-role', 'both')
      and lower(coalesce(preferred_provider, '')) in ('stripe', 'stripe_connect')
      then 'stripe'
    when lower(coalesce(workspace_role, '')) in ('ambassador', 'multi_role', 'multi-role', 'both')
      and lower(coalesce(preferred_provider, '')) in ('paypal', 'venmo')
      then lower(preferred_provider)
    else coalesce(nullif(reward_payout_provider, ''), 'set_up_later')
  end,
  financial_onboarding_status = case
    when coalesce(setup_completed, false) then 'ready'
    when coalesce(setup_required, false) then 'in_progress'
    when coalesce(allow_setup_later, true) then 'deferred'
    else coalesce(nullif(financial_onboarding_status, ''), 'not_started')
  end,
  onboarding_deferred = case
    when coalesce(setup_completed, false) then false
    else coalesce(allow_setup_later, true)
  end,
  selected_at = coalesce(
    selected_at,
    case
      when nullif(preferred_provider, '') is not null then created_at
      else null
    end
  ),
  setup_started_at = coalesce(
    setup_started_at,
    case
      when lower(coalesce(preferred_provider, '')) not in (
        '',
        'none',
        'later',
        'set_up_later',
        'setup_later'
      ) then created_at
      else null
    end
  ),
  last_verified_at = coalesce(
    last_verified_at,
    case
      when coalesce(setup_completed, false)
        then coalesce(setup_completed_at, updated_at, created_at)
      else null
    end
  ),
  metadata = coalesce(metadata, '{}'::jsonb);

-- ---------------------------------------------------------------------------
-- 3. Ambassador payout destinations
-- ---------------------------------------------------------------------------

alter table public.user_payout_destinations
  add column if not exists destination_purpose text not null default 'ambassador_reward',
  add column if not exists destination_type text,
  add column if not exists destination_value text,
  add column if not exists display_value text,
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists destination_status text not null default 'active',
  add column if not exists is_default boolean not null default false,
  add column if not exists is_live boolean not null default false,
  add column if not exists last_used_at timestamptz;

-- Backfill legacy destination fields only when those columns exist.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_payout_destinations'
      and column_name = 'recipient_type'
  ) then
    execute $sql$
      update public.user_payout_destinations
      set destination_type = coalesce(
        nullif(destination_type, ''),
        nullif(recipient_type, '')
      )
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_payout_destinations'
      and column_name = 'recipient_value'
  ) then
    execute $sql$
      update public.user_payout_destinations
      set destination_value = coalesce(
        nullif(destination_value, ''),
        nullif(recipient_value, '')
      )
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_payout_destinations'
      and column_name = 'masked_value'
  ) then
    execute $sql$
      update public.user_payout_destinations
      set display_value = coalesce(
        nullif(display_value, ''),
        nullif(masked_value, '')
      )
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_payout_destinations'
      and column_name = 'status'
  ) then
    execute $sql$
      update public.user_payout_destinations
      set verification_status = case
        when lower(coalesce(status, '')) in ('ready', 'verified', 'active')
          then case
            when lower(coalesce(status, '')) = 'ready' then 'ready'
            else 'verified'
          end
        when lower(coalesce(status, '')) in ('pending', 'in_progress')
          then 'pending'
        when lower(coalesce(status, '')) in ('failed', 'rejected')
          then 'failed'
        else coalesce(nullif(verification_status, ''), 'unverified')
      end
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_payout_destinations'
      and column_name = 'is_primary'
  ) then
    execute $sql$
      update public.user_payout_destinations
      set is_default = coalesce(is_default, false) or coalesce(is_primary, false)
    $sql$;
  end if;
end
$$;

update public.user_payout_destinations
set
  destination_purpose = coalesce(
    nullif(destination_purpose, ''),
    'ambassador_reward'
  ),
  destination_status = case
    when disabled_at is not null then 'disabled'
    else coalesce(nullif(destination_status, ''), 'active')
  end;

-- ---------------------------------------------------------------------------
-- 4. Indexes used by the shared payout API
-- ---------------------------------------------------------------------------

create index if not exists user_payout_accounts_user_provider_idx
  on public.user_payout_accounts (user_id, provider);

create index if not exists user_payout_accounts_user_purpose_idx
  on public.user_payout_accounts (user_id, account_purpose);

create index if not exists user_payout_destinations_user_provider_idx
  on public.user_payout_destinations (user_id, provider);

create index if not exists user_payout_destinations_user_purpose_idx
  on public.user_payout_destinations (user_id, destination_purpose);

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'user_payout_preferences_user_id_key'
  )
  and not exists (
    select 1
    from public.user_payout_preferences
    group by user_id
    having count(*) > 1
  ) then
    execute '
      create unique index user_payout_preferences_user_id_key
      on public.user_payout_preferences (user_id)
    ';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 5. Shared readiness function used by desktop, web app, and mobile
-- ---------------------------------------------------------------------------

create or replace function public.sitguru_refresh_user_payout_readiness(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_guru boolean := false;
  v_has_ambassador boolean := false;
  v_guru_ready boolean := false;
  v_ambassador_account_ready boolean := false;
  v_ambassador_destination_ready boolean := false;
  v_ambassador_ready boolean := false;
  v_any_started boolean := false;
  v_overall_ready boolean := false;
  v_role_context text := 'unknown';
begin
  -- Keep canonical account fields aligned with legacy SitGuru fields.
  update public.user_payout_accounts
  set
    account_purpose = coalesce(
      nullif(account_purpose, ''),
      case
        when lower(coalesce(workspace_role, '')) = 'ambassador'
          then 'ambassador_reward'
        else 'guru_marketplace_seller'
      end
    ),
    onboarding_status = case
      when lower(coalesce(status, '')) in (
        'ready',
        'active',
        'connected',
        'complete',
        'completed'
      ) then 'ready'
      when lower(coalesce(status, '')) in ('restricted', 'limited')
        then 'restricted'
      when lower(coalesce(status, '')) in ('disabled', 'disconnected')
        then 'disabled'
      when lower(coalesce(status, '')) in ('pending_review', 'review')
        then 'pending_review'
      when lower(coalesce(status, '')) in ('pending', 'in_progress', 'started')
        then 'in_progress'
      else coalesce(nullif(onboarding_status, ''), 'not_started')
    end,
    account_status = case
      when lower(coalesce(status, '')) in (
        'ready',
        'active',
        'connected',
        'complete',
        'completed'
      ) then 'active'
      when lower(coalesce(status, '')) in ('restricted', 'limited')
        then 'restricted'
      when lower(coalesce(status, '')) = 'disconnected'
        then 'disconnected'
      when lower(coalesce(status, '')) = 'disabled'
        then 'disabled'
      else coalesce(nullif(account_status, ''), 'pending')
    end,
    is_default = coalesce(is_default, false) or coalesce(is_primary, false),
    last_synced_at = coalesce(
      last_checked_at,
      last_synced_at,
      updated_at,
      created_at,
      now()
    )
  where user_id = p_user_id;

  -- Keep canonical preference fields aligned with the legacy preference row.
  update public.user_payout_preferences
  set
    role_context = case
      when lower(coalesce(workspace_role, '')) = 'guru' then 'guru'
      when lower(coalesce(workspace_role, '')) = 'ambassador' then 'ambassador'
      when lower(coalesce(workspace_role, '')) in (
        'multi_role',
        'multi-role',
        'both'
      ) then 'multi_role'
      else coalesce(nullif(role_context, ''), 'unknown')
    end,
    booking_payout_provider = case
      when booking_payout_provider = 'set_up_later'
        and lower(coalesce(workspace_role, '')) in (
          'guru',
          'multi_role',
          'multi-role',
          'both'
        )
        and lower(coalesce(preferred_provider, '')) in (
          'stripe',
          'stripe_connect'
        )
        then 'stripe'
      when booking_payout_provider = 'set_up_later'
        and lower(coalesce(workspace_role, '')) in (
          'guru',
          'multi_role',
          'multi-role',
          'both'
        )
        and lower(coalesce(preferred_provider, '')) = 'paypal'
        then 'paypal'
      else booking_payout_provider
    end,
    reward_payout_provider = case
      when reward_payout_provider = 'set_up_later'
        and lower(coalesce(workspace_role, '')) in (
          'ambassador',
          'multi_role',
          'multi-role',
          'both'
        )
        and lower(coalesce(preferred_provider, '')) in (
          'stripe',
          'stripe_connect'
        )
        then 'stripe'
      when reward_payout_provider = 'set_up_later'
        and lower(coalesce(workspace_role, '')) in (
          'ambassador',
          'multi_role',
          'multi-role',
          'both'
        )
        and lower(coalesce(preferred_provider, '')) in ('paypal', 'venmo')
        then lower(preferred_provider)
      else reward_payout_provider
    end
  where user_id = p_user_id;

  select exists (
    select 1
    from public.gurus
    where user_id = p_user_id
  )
  into v_has_guru;

  select exists (
    select 1
    from public.ambassadors
    where user_id = p_user_id
  )
  into v_has_ambassador;

  if exists (
    select 1
    from public.user_roles
    where user_id = p_user_id
      and lower(role) in ('guru', 'pet_guru', 'provider', 'sitter')
  ) then
    v_has_guru := true;
  end if;

  if exists (
    select 1
    from public.user_roles
    where user_id = p_user_id
      and lower(role) in (
        'ambassador',
        'community_ambassador',
        'student_ambassador',
        'veteran_ambassador'
      )
  ) then
    v_has_ambassador := true;
  end if;

  if exists (
    select 1
    from public.user_payout_preferences
    where user_id = p_user_id
      and (
        lower(coalesce(workspace_role, '')) = 'guru'
        or role_context in ('guru', 'multi_role')
      )
  ) then
    v_has_guru := true;
  end if;

  if exists (
    select 1
    from public.user_payout_preferences
    where user_id = p_user_id
      and (
        lower(coalesce(workspace_role, '')) = 'ambassador'
        or role_context in ('ambassador', 'multi_role')
      )
  ) then
    v_has_ambassador := true;
  end if;

  select exists (
    select 1
    from public.user_payout_accounts account
    where account.user_id = p_user_id
      and (
        lower(coalesce(account.account_purpose, '')) in (
          'guru_marketplace_seller',
          'guru_payout'
        )
        or lower(coalesce(account.workspace_role, '')) = 'guru'
      )
      and lower(coalesce(account.provider, '')) in ('stripe', 'paypal')
      and coalesce(account.payouts_enabled, false)
      and coalesce(account.charges_enabled, false)
      and lower(
        coalesce(account.onboarding_status, account.status, '')
      ) in ('ready', 'active', 'connected', 'complete', 'completed')
      and lower(coalesce(account.account_status, 'active')) not in (
        'restricted',
        'disabled',
        'disconnected'
      )
  )
  into v_guru_ready;

  select exists (
    select 1
    from public.user_payout_accounts account
    where account.user_id = p_user_id
      and (
        lower(coalesce(account.account_purpose, '')) = 'ambassador_reward'
        or lower(coalesce(account.workspace_role, '')) = 'ambassador'
      )
      and lower(coalesce(account.provider, '')) = 'stripe'
      and coalesce(account.payouts_enabled, false)
      and lower(
        coalesce(account.onboarding_status, account.status, '')
      ) in ('ready', 'active', 'connected', 'complete', 'completed')
      and lower(coalesce(account.account_status, 'active')) not in (
        'restricted',
        'disabled',
        'disconnected'
      )
  )
  into v_ambassador_account_ready;

  select exists (
    select 1
    from public.user_payout_destinations destination
    where destination.user_id = p_user_id
      and (
        lower(coalesce(destination.destination_purpose, '')) in (
          'ambassador_reward',
          'general_payout'
        )
        or lower(coalesce(destination.workspace_role, '')) = 'ambassador'
      )
      and lower(coalesce(destination.provider, '')) in ('paypal', 'venmo')
      and lower(coalesce(destination.destination_status, 'active')) = 'active'
      and lower(coalesce(destination.verification_status, '')) in (
        'verified',
        'ready'
      )
  )
  into v_ambassador_destination_ready;

  v_ambassador_ready :=
    v_ambassador_account_ready or v_ambassador_destination_ready;

  select exists (
    select 1
    from public.user_payout_accounts
    where user_id = p_user_id
      and (
        nullif(provider_account_id, '') is not null
        or nullif(provider_merchant_id, '') is not null
        or lower(coalesce(onboarding_status, status, '')) not in (
          '',
          'not_started'
        )
      )
  )
  or exists (
    select 1
    from public.user_payout_destinations
    where user_id = p_user_id
      and (
        nullif(destination_value, '') is not null
        or lower(coalesce(verification_status, '')) not in (
          '',
          'unverified'
        )
      )
  )
  or exists (
    select 1
    from public.user_payout_preferences
    where user_id = p_user_id
      and (
        booking_payout_provider <> 'set_up_later'
        or reward_payout_provider <> 'set_up_later'
      )
  )
  into v_any_started;

  v_role_context := case
    when v_has_guru and v_has_ambassador then 'multi_role'
    when v_has_guru then 'guru'
    when v_has_ambassador then 'ambassador'
    else 'unknown'
  end;

  v_overall_ready := case
    when v_has_guru and v_has_ambassador
      then v_guru_ready and v_ambassador_ready
    when v_has_guru then v_guru_ready
    when v_has_ambassador then v_ambassador_ready
    else false
  end;

  update public.user_payout_preferences
  set
    role_context = v_role_context,
    financial_onboarding_status = case
      when v_overall_ready then 'ready'
      when v_any_started then 'in_progress'
      else 'deferred'
    end,
    onboarding_deferred = not v_any_started and not v_overall_ready,
    profile_completion_requires_payout = false,
    search_visibility_requires_payout = false,
    accepting_paid_work_requires_payout = v_has_guru,
    reward_release_requires_destination = v_has_ambassador,
    can_accept_paid_bookings = v_guru_ready,
    can_receive_reward_payouts = v_ambassador_ready,
    setup_required = not v_overall_ready,
    setup_completed = v_overall_ready,
    setup_completed_at = case
      when v_overall_ready
        then coalesce(setup_completed_at, now())
      else setup_completed_at
    end,
    last_verified_at = case
      when v_guru_ready or v_ambassador_ready then now()
      else last_verified_at
    end,
    updated_at = now()
  where user_id = p_user_id;
end;
$$;

revoke all on function public.sitguru_refresh_user_payout_readiness(uuid)
from public;

grant execute
on function public.sitguru_refresh_user_payout_readiness(uuid)
to authenticated, service_role;

comment on function public.sitguru_refresh_user_payout_readiness(uuid)
is 'Refreshes shared Guru and Ambassador payout readiness across SitGuru web and mobile clients.';

notify pgrst, 'reload schema';

commit;