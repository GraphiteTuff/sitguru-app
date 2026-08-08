import { useCallback, useEffect, useMemo, useState } from 'react';

import { sitguruApiFetch } from '@/lib/data/api';
import {
  asString,
  firstString,
  getErrorMessage,
  normalizeStatus,
  type RecordRow,
} from '@/lib/data/fields';
import {
  centsToDollars,
  startOfMonth,
  startOfWeek,
} from '@/lib/data/money';
import {
  API_PATHS,
  BOOKING_GURU_ID_FIELDS,
  PAID_PAYMENT_STATUSES,
  TABLES,
} from '@/lib/data/schema';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type GuruEarningsItem = {
  id: string;
  bookingId: string;
  serviceLabel: string;
  petName: string;
  parentName: string;
  netAmount: number;
  tipAmount?: number;
  status: string;
  completedAt: Date | null;
  isWalk: boolean;
  source: 'booking_payment' | 'booking' | 'guru_payout';
};

export type GuruEarningsSummary = {
  weekNetTotal: number;
  monthNetTotal: number;
  lifetimeNetTotal: number;
  pendingClearedBalance: number;
  paidOutTotal: number;
  completedCareWalks: number;
  completedCareTotal: number;
};

export type GuruPayoutSetup = {
  connected: boolean;
  actionRequired: boolean;
  disabledReason: string;
  available: number;
  pending: number;
};

const EMPTY_SUMMARY: GuruEarningsSummary = {
  weekNetTotal: 0,
  monthNetTotal: 0,
  lifetimeNetTotal: 0,
  pendingClearedBalance: 0,
  paidOutTotal: 0,
  completedCareWalks: 0,
  completedCareTotal: 0,
};

const EMPTY_PAYOUT: GuruPayoutSetup = {
  connected: false,
  actionRequired: false,
  disabledReason: '',
  available: 0,
  pending: 0,
};

const COMPLETED_BOOKING_STATUSES = new Set([
  'completed',
  'complete',
  'finished',
  'done',
]);

const PENDING_PAYMENT_STATUSES = new Set([
  'pending',
  'processing',
  'in_escrow',
  'held',
  'on_hold',
  'requires_capture',
  'authorized',
]);

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function readMoneyDollars(row: RecordRow, keys: string[]) {
  for (const key of keys) {
    const raw = row[key];
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      if (key.endsWith('_cents') || key.includes('cents')) {
        return centsToDollars(raw);
      }
      // Heuristic: large integers without decimals often stored as cents.
      if (Number.isInteger(raw) && Math.abs(raw) >= 1000 && !key.includes('amount')) {
        return centsToDollars(raw);
      }
      return raw;
    }
    if (typeof raw === 'string' && raw.trim()) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        if (key.endsWith('_cents') || key.includes('cents')) {
          return centsToDollars(parsed);
        }
        return parsed;
      }
    }
  }
  return 0;
}

function isWalkService(label: string) {
  return /walk|walking/i.test(label);
}

function itemFromPayment(row: RecordRow, index: number): GuruEarningsItem | null {
  const id = asString(row.id) || `payment-${index}`;
  const bookingId = firstString(row, ['booking_id', 'bookingId']);
  const status = normalizeStatus(
    row.status || row.payment_status || row.payout_status,
  );
  const net = readMoneyDollars(row, [
    'guru_payout_amount',
    'guru_payout_cents',
    'guru_net_amount',
    'net_amount',
    'payee_amount',
    'amount',
    'amount_cents',
    'subtotal_cents',
  ]);
  const tip = readMoneyDollars(row, [
    'tip_cents',
    'tip_amount',
    'guru_tip_amount',
    'guru_tip_cents',
  ]);

  if (!net && !tip && !status) return null;

  const serviceLabel =
    firstString(row, ['service_type', 'service_name', 'service', 'label'], 'Care') ||
    'Care';

  return {
    id,
    bookingId,
    serviceLabel,
    petName: firstString(row, ['pet_name', 'petName'], 'Pet'),
    parentName: firstString(
      row,
      ['customer_name', 'pet_parent_name', 'parent_name'],
      'Pet Parent',
    ),
    netAmount: net > 0 ? net : tip,
    tipAmount: tip,
    status: status || 'recorded',
    completedAt: parseDate(
      row.paid_at || row.completed_at || row.updated_at || row.created_at,
    ),
    isWalk: isWalkService(serviceLabel),
    source: 'booking_payment',
  };
}

function itemFromBooking(row: RecordRow, index: number): GuruEarningsItem | null {
  const id = asString(row.id) || `booking-${index}`;
  const status = normalizeStatus(row.status || row.booking_status);
  if (!COMPLETED_BOOKING_STATUSES.has(status) && status !== 'paid') {
    // Still include paid-but-not-marked-complete when payment_status is paid.
    const paymentStatus = normalizeStatus(row.payment_status);
    if (!PAID_PAYMENT_STATUSES.has(paymentStatus) && paymentStatus !== 'paid') {
      return null;
    }
  }

  const serviceLabel =
    firstString(row, ['service_type', 'service', 'service_name'], 'Care') || 'Care';
  const net = readMoneyDollars(row, [
    'guru_net_amount',
    'guru_estimated_base_payout',
    'earnings',
    'guru_earnings',
    'net_amount',
    'subtotal_amount',
    'service_price',
    'total_amount',
  ]);

  return {
    id,
    bookingId: id,
    serviceLabel,
    petName: firstString(row, ['pet_name', 'petName'], 'Pet'),
    parentName: firstString(
      row,
      ['customer_name', 'pet_parent_name', 'parent_name', 'owner_name'],
      'Pet Parent',
    ),
    netAmount: net,
    status: status || 'completed',
    completedAt: parseDate(
      row.completed_at || row.end_at || row.end_time || row.updated_at || row.created_at,
    ),
    isWalk: isWalkService(serviceLabel),
    source: 'booking',
  };
}

function itemFromGuruPayout(row: RecordRow, index: number): GuruEarningsItem | null {
  const id = asString(row.id) || `payout-${index}`;
  const net = readMoneyDollars(row, [
    'amount_cents',
    'amount',
    'net_amount',
    'payout_amount',
  ]);
  if (!net) return null;

  const status = normalizeStatus(row.status || row.payout_status) || 'pending';

  return {
    id,
    bookingId: firstString(row, ['booking_id', 'bookingId']),
    serviceLabel: firstString(row, ['label', 'description'], 'Payout') || 'Payout',
    petName: firstString(row, ['pet_name'], ''),
    parentName: '',
    netAmount: net,
    status,
    completedAt: parseDate(
      row.paid_at || row.released_at || row.scheduled_for || row.created_at,
    ),
    isWalk: false,
    source: 'guru_payout',
  };
}

function summarize(items: GuruEarningsItem[]): GuruEarningsSummary {
  const weekStart = startOfWeek().getTime();
  const monthStart = startOfMonth().getTime();

  let weekNetTotal = 0;
  let monthNetTotal = 0;
  let lifetimeNetTotal = 0;
  let pendingClearedBalance = 0;
  let paidOutTotal = 0;
  let completedCareWalks = 0;
  let completedCareTotal = 0;

  for (const item of items) {
    const amount = Math.max(0, item.netAmount);
    const at = item.completedAt?.getTime() ?? 0;
    const status = normalizeStatus(item.status);
    const isPending =
      PENDING_PAYMENT_STATUSES.has(status) ||
      status === 'pending' ||
      status.includes('hold');
    const isPaid =
      PAID_PAYMENT_STATUSES.has(status) ||
      status === 'paid' ||
      status === 'released' ||
      COMPLETED_BOOKING_STATUSES.has(status);

    if (item.source !== 'guru_payout') {
      lifetimeNetTotal += amount;
      if (at >= weekStart) weekNetTotal += amount;
      if (at >= monthStart) monthNetTotal += amount;
      completedCareTotal += 1;
      if (item.isWalk) completedCareWalks += 1;
    }

    if (isPending) {
      pendingClearedBalance += amount;
    } else if (item.source === 'guru_payout' && isPaid) {
      paidOutTotal += amount;
    }
  }

  return {
    weekNetTotal,
    monthNetTotal,
    lifetimeNetTotal,
    pendingClearedBalance,
    paidOutTotal,
    completedCareWalks,
    completedCareTotal,
  };
}

async function queryPaymentLedger(userId: string) {
  const fields = ['payee_user_id', 'guru_id', 'provider_id'] as const;
  for (const field of fields) {
    const result = await supabase
      .from(TABLES.bookingPayments)
      .select('*')
      .eq(field, userId)
      .order('created_at', { ascending: false })
      .limit(250);

    if (!result.error) {
      return (result.data ?? []) as RecordRow[];
    }
  }
  return [] as RecordRow[];
}

async function queryCompletedBookings(userId: string) {
  for (const field of BOOKING_GURU_ID_FIELDS) {
    const result = await supabase
      .from(TABLES.bookings)
      .select('*')
      .eq(field, userId)
      .order('updated_at', { ascending: false })
      .limit(250);

    if (!result.error) {
      return (result.data ?? []) as RecordRow[];
    }
  }
  return [] as RecordRow[];
}

async function queryGuruPayouts(userId: string) {
  const result = await supabase
    .from(TABLES.guruPayouts)
    .select('*')
    .eq('guru_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (result.error) return [] as RecordRow[];
  return (result.data ?? []) as RecordRow[];
}

async function loadPayoutSetup(): Promise<GuruPayoutSetup> {
  const result = await sitguruApiFetch<RecordRow>(
    `${API_PATHS.payoutSetup}?role=guru`,
    { method: 'GET' },
  );

  if (result.error || !result.data) {
    return EMPTY_PAYOUT;
  }

  const data = result.data;
  const account =
    (data.primaryAccount as RecordRow | undefined) ||
    (data.account as RecordRow | undefined) ||
    data;

  const detailsSubmitted = Boolean(
    account.details_submitted ?? account.detailsSubmitted ?? data.detailsSubmitted,
  );
  const payoutsEnabled = Boolean(
    account.payouts_enabled ?? account.payoutsEnabled ?? data.payoutsEnabled,
  );
  const chargesEnabled = Boolean(
    account.charges_enabled ?? account.chargesEnabled ?? data.chargesEnabled,
  );
  const disabledReason = firstString(
    account,
    ['disabled_reason', 'disabledReason', 'requirements_due'],
  );

  return {
    connected: Boolean(
      account.id ||
        account.stripe_account_id ||
        data.connected ||
        detailsSubmitted ||
        payoutsEnabled,
    ),
    actionRequired:
      Boolean(account.id || data.connected) &&
      (!detailsSubmitted || !payoutsEnabled || !chargesEnabled || Boolean(disabledReason)),
    disabledReason,
    available: readMoneyDollars(account, [
      'available_balance',
      'available',
      'available_amount',
    ]),
    pending: readMoneyDollars(account, [
      'pending_balance',
      'pending',
      'pending_amount',
    ]),
  };
}

/**
 * Canonical Guru earnings aggregation for mobile dashboards.
 * Prefers booking_payments ledger, falls back to completed bookings,
 * and hydrates payout readiness via `/api/payouts/setup?role=guru`.
 */
export function useGuruEarnings(options?: { enabled?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const [items, setItems] = useState<GuruEarningsItem[]>([]);
  const [payoutSetup, setPayoutSetup] = useState<GuruPayoutSetup>(EMPTY_PAYOUT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !isAuthenticated || !user?.id || !isSupabaseConfigured) {
      setItems([]);
      setPayoutSetup(EMPTY_PAYOUT);
      setError(null);
      return;
    }

    setLoading(true);

    try {
      const [payments, bookings, payouts, setup] = await Promise.all([
        queryPaymentLedger(user.id),
        queryCompletedBookings(user.id),
        queryGuruPayouts(user.id),
        loadPayoutSetup(),
      ]);

      const paymentItems = payments
        .map((row, index) => itemFromPayment(row, index))
        .filter((item): item is GuruEarningsItem => Boolean(item));

      const bookingItems = bookings
        .map((row, index) => itemFromBooking(row, index))
        .filter((item): item is GuruEarningsItem => Boolean(item));

      const payoutItems = payouts
        .map((row, index) => itemFromGuruPayout(row, index))
        .filter((item): item is GuruEarningsItem => Boolean(item));

      // Prefer ledger rows; fill gaps from completed bookings by booking id.
      const byBooking = new Map<string, GuruEarningsItem>();
      for (const item of bookingItems) {
        byBooking.set(item.bookingId || item.id, item);
      }
      for (const item of paymentItems) {
        const key = item.bookingId || item.id;
        byBooking.set(key, item);
      }

      const merged = [...byBooking.values(), ...payoutItems].sort(
        (a, b) =>
          (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
      );

      setItems(merged);
      setPayoutSetup(setup);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Earnings could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [enabled, isAuthenticated, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo(() => {
    const base = summarize(items);
    // Prefer Stripe/setup pending when ledger has no escrow rows yet.
    if (base.pendingClearedBalance <= 0 && payoutSetup.pending > 0) {
      return {
        ...base,
        pendingClearedBalance: payoutSetup.pending,
      };
    }
    return base;
  }, [items, payoutSetup.pending]);

  return {
    items,
    summary,
    payoutSetup,
    loading,
    error,
    refresh,
  };
}
