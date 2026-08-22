/**
 * Pet Parent PawPerks data.
 *
 * Balance + ledger mirror the web loyalty vault (`pet_parent_perks` /
 * `pawperk_transactions`, RLS: parent_id = auth.uid()). Referral identity
 * mirrors the web customer dashboard (`referral_profiles`), which is the row
 * `trackReferralSignup` looks up when a new account signs up with a code.
 *
 * Every value here comes from a real table. Sections without a readable source
 * report themselves as unavailable so screens can omit them.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import {
  asNumber,
  asString,
  firstString,
  getErrorMessage,
  type RecordRow,
} from '@/lib/data/fields';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const PET_PARENT_PERKS_TABLE = 'pet_parent_perks';
const PAWPERK_TRANSACTIONS_TABLE = 'pawperk_transactions';
const REFERRAL_PROFILES_TABLE = 'referral_profiles';
const REFERRALS_TABLE = 'referrals';

/** Web `lib/pawperks/constants.ts` — 100 points redeem for $1.00 at checkout. */
export const PAWPERKS_POINTS_PER_DOLLAR = 100;

export type PawPerkBadgeLevel = {
  id: 'pup' | 'scout' | 'adventurer' | 'legend';
  label: string;
  emoji: string;
  blurb: string;
  minLifetime: number;
};

export const PAWPERK_BADGE_LEVELS: PawPerkBadgeLevel[] = [
  {
    id: 'pup',
    label: 'Pup',
    emoji: '🐶',
    blurb: 'Just getting started — every walk builds your vault.',
    minLifetime: 0,
  },
  {
    id: 'scout',
    label: 'Scout',
    emoji: '🧭',
    blurb: 'Consistent care streaks unlock real checkout savings.',
    minLifetime: 100,
  },
  {
    id: 'adventurer',
    label: 'Adventurer',
    emoji: '🏔️',
    blurb: 'High-trust parents with serious redeemable value.',
    minLifetime: 500,
  },
  {
    id: 'legend',
    label: 'Legend',
    emoji: '👑',
    blurb: 'Elite vault status — schedule often to stay on top.',
    minLifetime: 1500,
  },
];

export function pointsToUsd(points: number) {
  const safe = Math.max(0, Math.floor(points || 0));
  return Math.round((safe / PAWPERKS_POINTS_PER_DOLLAR) * 100) / 100;
}

export function pawPerkSourceLabel(sourceType: string) {
  switch (sourceType) {
    case 'GURU_REWARD':
      return 'Guru reward';
    case 'BOOKING_REDEMPTION':
      return 'Checkout redemption';
    case 'SIGNUP_BONUS':
      return 'Signup bonus';
    case 'ADMIN_DEBIT':
      return 'Admin debit';
    case 'ADMIN_CREDIT':
      return 'Admin credit';
    default:
      return sourceType || 'Ledger entry';
  }
}

export type PawPerksVault = {
  pointsBalance: number;
  lifetimeEarned: number;
  usdValue: number;
  /** False when the parent has no vault row yet (server creates it on first award). */
  hasVaultRow: boolean;
};

export type PawPerkLedgerEntry = {
  id: string;
  pointsDelta: number;
  sourceType: string;
  sourceLabel: string;
  memo: string;
  createdAt: Date | null;
};

export type PawPerksReferralProfile = {
  referralCode: string;
  referralLink: string;
  totalInvites: number;
  completedReferrals: number;
  pendingRewards: number;
  earnedRewards: number;
  availableCredit: number;
};

export type PawPerksReferralActivity = {
  id: string;
  label: string;
  status: string;
  rewardAmount: number;
  referralType: string;
  createdAt: Date | null;
};

export type PawPerkBadgeProgress = {
  current: PawPerkBadgeLevel;
  next: PawPerkBadgeLevel | null;
  progressPct: number;
  pointsToNext: number;
};

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function errorCode(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error) {
    return asString((error as { code?: unknown }).code);
  }
  return '';
}

/** Same deterministic code the web customer dashboard persists. */
function buildCustomerReferralCode(userId: string) {
  return `CUST-${userId.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
}

function buildCustomerReferralLink(referralCode: string) {
  return `https://sitguru.com/signup?ref=${encodeURIComponent(
    referralCode,
  )}&type=customer`;
}

function mapReferralProfile(row: RecordRow): PawPerksReferralProfile | null {
  const referralCode = firstString(row, ['referral_code', 'code']);
  if (!referralCode) return null;

  return {
    referralCode,
    referralLink:
      firstString(row, ['referral_link', 'referral_url']) ||
      buildCustomerReferralLink(referralCode),
    totalInvites: Math.max(
      0,
      Math.round(asNumber(row.total_invites ?? row.invited_count)),
    ),
    completedReferrals: Math.max(
      0,
      Math.round(asNumber(row.completed_referrals)),
    ),
    pendingRewards: Math.max(0, asNumber(row.pending_rewards)),
    earnedRewards: Math.max(0, asNumber(row.earned_rewards)),
    availableCredit: Math.max(
      0,
      asNumber(row.available_credit ?? row.lifetime_credit),
    ),
  };
}

async function loadVault(userId: string) {
  const result = await supabase
    .from(PET_PARENT_PERKS_TABLE)
    .select('*')
    .eq('parent_id', userId)
    .maybeSingle();

  if (result.error) {
    return { vault: null, error: getErrorMessage(result.error) };
  }

  const row = (result.data ?? null) as RecordRow | null;
  const pointsBalance = Math.max(0, Math.round(asNumber(row?.points_balance)));
  const lifetimeEarned = Math.max(0, Math.round(asNumber(row?.lifetime_earned)));

  return {
    vault: {
      pointsBalance,
      lifetimeEarned,
      usdValue: pointsToUsd(pointsBalance),
      hasVaultRow: Boolean(row),
    } satisfies PawPerksVault,
    error: null,
  };
}

async function loadLedger(userId: string) {
  const result = await supabase
    .from(PAWPERK_TRANSACTIONS_TABLE)
    .select('*')
    .eq('parent_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (result.error) {
    return { entries: null };
  }

  const entries = ((result.data ?? []) as RecordRow[]).map((row, index) => {
    const sourceType = firstString(row, ['source_type']);

    return {
      id: firstString(row, ['transaction_id', 'id']) || `pawperk-${index}`,
      pointsDelta: Math.round(asNumber(row.points_delta)),
      sourceType,
      sourceLabel: pawPerkSourceLabel(sourceType),
      memo: firstString(row, ['memo']),
      createdAt: parseDate(row.created_at),
    } satisfies PawPerkLedgerEntry;
  });

  return { entries };
}

async function loadReferralProfile(userId: string) {
  const existing = await supabase
    .from(REFERRAL_PROFILES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing.error) {
    return { referral: null, error: getErrorMessage(existing.error) };
  }

  if (existing.data) {
    return {
      referral: mapReferralProfile(existing.data as RecordRow),
      error: null,
    };
  }

  /*
   * No row yet. Provision the same code the web dashboard would, because
   * signup attribution resolves the referrer by an exact referral_profiles
   * match — a code that is not stored here would never credit anyone.
   */
  const referralCode = buildCustomerReferralCode(userId);
  const created = await supabase
    .from(REFERRAL_PROFILES_TABLE)
    .insert({
      user_id: userId,
      role: 'customer',
      referral_code: referralCode,
      referral_link: buildCustomerReferralLink(referralCode),
      total_invites: 0,
      completed_referrals: 0,
      pending_rewards: 0,
      earned_rewards: 0,
      paid_rewards: 0,
      available_credit: 0,
    })
    .select('*')
    .maybeSingle();

  if (!created.error && created.data) {
    return {
      referral: mapReferralProfile(created.data as RecordRow),
      error: null,
    };
  }

  if (errorCode(created.error) === '23505') {
    const recovered = await supabase
      .from(REFERRAL_PROFILES_TABLE)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!recovered.error && recovered.data) {
      return {
        referral: mapReferralProfile(recovered.data as RecordRow),
        error: null,
      };
    }
  }

  return {
    referral: null,
    error: getErrorMessage(
      created.error,
      'Your referral link has not been created yet.',
    ),
  };
}

async function loadReferralActivity(userId: string) {
  const result = await supabase
    .from(REFERRALS_TABLE)
    .select('*')
    .eq('referrer_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (result.error) {
    return { activity: null };
  }

  const activity = ((result.data ?? []) as RecordRow[]).map((row, index) => ({
    id: firstString(row, ['id', 'referral_id']) || `referral-${index}`,
    label:
      firstString(row, ['referred_name', 'referred_email']) ||
      'Referred account',
    status: firstString(row, ['status', 'referral_status'], 'pending'),
    rewardAmount: Math.max(0, asNumber(row.reward_amount)),
    referralType: firstString(row, ['referral_type']),
    createdAt: parseDate(row.created_at ?? row.updated_at),
  })) satisfies PawPerksReferralActivity[];

  return { activity };
}

function resolveBadge(lifetimeEarned: number): PawPerkBadgeProgress {
  const lifetime = Math.max(0, Math.floor(lifetimeEarned || 0));

  let currentIndex = 0;
  for (let index = PAWPERK_BADGE_LEVELS.length - 1; index >= 0; index -= 1) {
    if (lifetime >= PAWPERK_BADGE_LEVELS[index].minLifetime) {
      currentIndex = index;
      break;
    }
  }

  const current = PAWPERK_BADGE_LEVELS[currentIndex];
  const next = PAWPERK_BADGE_LEVELS[currentIndex + 1] ?? null;

  if (!next) {
    return { current, next: null, progressPct: 100, pointsToNext: 0 };
  }

  const span = next.minLifetime - current.minLifetime;
  const gained = Math.max(0, lifetime - current.minLifetime);

  return {
    current,
    next,
    progressPct: span > 0 ? Math.min(100, Math.round((gained / span) * 100)) : 100,
    pointsToNext: Math.max(0, next.minLifetime - lifetime),
  };
}

export function usePawPerks() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? '';

  const [vault, setVault] = useState<PawPerksVault | null>(null);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [ledger, setLedger] = useState<PawPerkLedgerEntry[] | null>(null);
  const [referral, setReferral] = useState<PawPerksReferralProfile | null>(null);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [referralActivity, setReferralActivity] = useState<
    PawPerksReferralActivity[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (showRefresh: boolean) => {
      if (!userId || !isAuthenticated || !isSupabaseConfigured) {
        setVault(null);
        setVaultError(
          isSupabaseConfigured
            ? null
            : 'SitGuru is not connected to Supabase on this build.',
        );
        setLedger(null);
        setReferral(null);
        setReferralError(null);
        setReferralActivity(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [vaultResult, ledgerResult, referralResult, activityResult] =
        await Promise.all([
          loadVault(userId),
          loadLedger(userId),
          loadReferralProfile(userId),
          loadReferralActivity(userId),
        ]);

      setVault(vaultResult.vault);
      setVaultError(vaultResult.error);
      setLedger(ledgerResult.entries);
      setReferral(referralResult.referral);
      setReferralError(referralResult.error);
      setReferralActivity(activityResult.activity);

      setLoading(false);
      setRefreshing(false);
    },
    [isAuthenticated, userId],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const badge = useMemo(
    () => resolveBadge(vault?.lifetimeEarned ?? 0),
    [vault?.lifetimeEarned],
  );

  return {
    vault,
    vaultError,
    /** Null when `pawperk_transactions` could not be read — omit the section. */
    ledger,
    referral,
    referralError,
    /** Null when `referrals` could not be read — omit the section. */
    referralActivity,
    badge,
    loading,
    refreshing,
    refresh: () => load(true),
  };
}
