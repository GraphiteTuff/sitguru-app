-- Guru Stripe Connect uses transfers-only Express accounts (platform charges).
-- Readiness must not require charges_enabled. Prefer freshly synced
-- onboarding_status / payouts_enabled over a stale legacy status column.

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
      when lower(coalesce(onboarding_status, '')) in (
        'ready',
        'active',
        'connected',
        'complete',
        'completed'
      ) then 'ready'
      when lower(coalesce(status, '')) in (
        'ready',
        'active',
        'connected',
        'complete',
        'completed'
      ) then 'ready'
      when lower(coalesce(onboarding_status, status, '')) in ('restricted', 'limited')
        then 'restricted'
      when lower(coalesce(onboarding_status, status, '')) in ('disabled', 'disconnected')
        then 'disabled'
      when lower(coalesce(onboarding_status, status, '')) in ('pending_review', 'review')
        then 'pending_review'
      when lower(coalesce(onboarding_status, status, '')) in (
        'pending',
        'in_progress',
        'started',
        'pending_verification'
      ) then coalesce(nullif(onboarding_status, ''), 'in_progress')
      else coalesce(nullif(onboarding_status, ''), 'not_started')
    end,
    account_status = case
      when lower(coalesce(account_status, '')) in (
        'ready',
        'active',
        'connected',
        'complete',
        'completed'
      ) then 'active'
      when lower(coalesce(status, '')) in (
        'ready',
        'active',
        'connected',
        'complete',
        'completed'
      ) then 'active'
      when lower(coalesce(account_status, status, '')) in ('restricted', 'limited')
        then 'restricted'
      when lower(coalesce(account_status, status, '')) = 'disconnected'
        then 'disconnected'
      when lower(coalesce(account_status, status, '')) = 'disabled'
        then 'disabled'
      else coalesce(nullif(account_status, ''), 'pending')
    end,
    status = case
      when coalesce(payouts_enabled, false)
        and lower(coalesce(onboarding_status, status, '')) in (
          'ready',
          'active',
          'connected',
          'complete',
          'completed'
        )
        then 'ready'
      else coalesce(nullif(status, ''), onboarding_status, 'pending')
    end,
    is_default = coalesce(is_default, false) or coalesce(is_primary, false),
    last_synced_at = coalesce(
      last_synced_at,
      last_checked_at,
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

  -- Transfers-only Guru Express accounts may keep charges_enabled=false.
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

  if not v_guru_ready then
    select exists (
      select 1
      from public.gurus guru
      where guru.user_id = p_user_id
        and nullif(guru.stripe_account_id, '') is not null
        and (
          coalesce(guru.stripe_onboarding_complete, false)
          or coalesce(guru.payouts_enabled, false)
        )
    )
    into v_guru_ready;
  end if;

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


comment on function public.sitguru_refresh_user_payout_readiness(uuid)
is 'Refresh Guru/Ambassador payout readiness. Guru Stripe transfers-only accounts do not require charges_enabled.';

notify pgrst, 'reload schema';
