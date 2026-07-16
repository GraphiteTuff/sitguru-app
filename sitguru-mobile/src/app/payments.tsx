import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  AlertTriangle,
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ExternalLink,
  Gift,
  Home,
  Landmark,
  Link2,
  MessageCircle,
  Receipt,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Tag,
  UserRound,
  XCircle,
} from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruRoleStatus from '@/components/SitGuruRoleStatus';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { AppFonts } from '@/constants/fonts';
import { getAppTheme } from '@/constants/theme';
import {
  setThemePreference,
  useColorScheme,
  useThemePreference,
  type SitGuruThemePreference,
} from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { roleLabel, type AppRole } from '@/types/auth';

type RecordRow = Record<string, unknown>;

type Feedback = {
  tone: 'success' | 'warning' | 'error';
  title: string;
  message: string;
};

type BookingSummary = {
  id: string;
  petParentUserId: string;
  guruUserId: string;
  petName: string;
  guruName: string;
  serviceName: string;
  status: string;
  subtotalCents: number;
  additionalPetCents: number;
  discountCents: number;
  marketplaceSupportCents: number;
  creditsCents: number;
  tipCents: number;
  totalCents: number;
  currency: string;
  acceptedAt: string;
  completedAt: string;
  createdAt: string;
};

type PaymentSummary = {
  id: string;
  bookingId: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentMethodType: string;
  cardBrand: string;
  cardLast4: string;
  receiptUrl: string;
  stripePaymentIntentId: string;
  createdAt: string;
  paidAt: string;
  refundedAt: string;
};

type CreditSummary = {
  availableCents: number;
  pawPerksCents: number;
  referralCents: number;
  giftCents: number;
};

type PayoutSummary = {
  connected: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  stripeAccountId: string;
  pendingCents: number;
  paidCents: number;
  currency: string;
  status: string;
};

type CheckoutResponse = {
  url?: string;
  checkoutUrl?: string;
  returnUrl?: string;
  status?: string;
  message?: string;
  error?: string;
  paymentIntentId?: string;
  sessionId?: string;
};

type PaymentMethodDefinition = {
  key: string;
  name: string;
  description: string;
  availability: string;
  icon: ComponentType<{
    color?: string;
    size?: number;
    strokeWidth?: number;
  }>;
};

const THEME_OPTIONS: {
  icon: 'sun' | 'moon';
  label: string;
  value: SitGuruThemePreference;
}[] = [
  { icon: 'sun', label: 'Light', value: 'light' },
  { icon: 'moon', label: 'Dark', value: 'dark' },
];

const PAYMENT_TABLES = [
  'booking_payments',
  'payments',
  'payment_transactions',
  'transactions',
] as const;

const CREDIT_TABLES = [
  'user_credits',
  'wallet_balances',
  'credit_balances',
  'pawpoints_wallets',
] as const;

const PAYOUT_TABLES = [
  'stripe_accounts',
  'connected_accounts',
  'guru_payout_accounts',
  'guru_profiles',
] as const;

const ACCEPTED_BOOKING_STATUSES = new Set([
  'accepted',
  'approved',
  'confirmed',
  'booked',
  'scheduled',
  'awaiting_payment',
  'payment_pending',
  'payment_required',
  'in_progress',
  'active',
  'completed',
  'complete',
  'fulfilled',
  'finished',
]);

const PAID_STATUSES = new Set([
  'paid',
  'succeeded',
  'successful',
  'complete',
  'completed',
  'captured',
]);

const PROCESSING_STATUSES = new Set([
  'processing',
  'pending',
  'requires_action',
  'requires_confirmation',
  'authorized',
]);

const FAILED_STATUSES = new Set([
  'failed',
  'canceled',
  'cancelled',
  'declined',
  'expired',
  'void',
  'voided',
]);

const REFUNDED_STATUSES = new Set([
  'refunded',
  'partially_refunded',
  'refund_pending',
]);

const paymentMethods: PaymentMethodDefinition[] = [
  {
    key: 'card',
    name: 'Credit or debit card',
    description:
      'Visa, Mastercard, American Express, Discover, and eligible debit cards.',
    availability: 'Available at SitGuru Checkout',
    icon: CreditCard,
  },
  {
    key: 'apple_pay',
    name: 'Apple Pay',
    description:
      'Fast wallet checkout on eligible Apple devices without re-entering card details.',
    availability: 'Shown on eligible Apple devices',
    icon: Smartphone,
  },
  {
    key: 'google_pay',
    name: 'Google Pay',
    description:
      'Fast wallet checkout on eligible Android devices and supported browsers.',
    availability: 'Shown on eligible devices',
    icon: Smartphone,
  },
  {
    key: 'link',
    name: 'Link',
    description:
      'Accelerated checkout using a saved Link payment method when eligible.',
    availability: 'Eligibility determined at checkout',
    icon: Link2,
  },
  {
    key: 'cash_app',
    name: 'Cash App Pay',
    description:
      'Eligible U.S. customers can authorize payment through Cash App.',
    availability: 'Eligibility determined at checkout',
    icon: CircleDollarSign,
  },
  {
    key: 'bank',
    name: 'Bank payment',
    description:
      'Eligible bank payments remain processing until SitGuru receives confirmed payment status.',
    availability: 'Eligibility determined at checkout',
    icon: Landmark,
  },
  {
    key: 'credits',
    name: 'SitGuru credits',
    description:
      'PawPerks, referral, promotional, and gift credits apply before the remaining payment.',
    availability: 'Applied by SitGuru before checkout',
    icon: Gift,
  },
  {
    key: 'tips',
    name: 'Post-care tips',
    description:
      'Optional tips may be added after completed care and remain recorded inside SitGuru.',
    availability: 'Available after eligible care',
    icon: Star,
  },
];

function asText(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const parsed = Number(asText(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function asBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;

  const normalized = asText(value).toLowerCase();
  return ['true', '1', 'yes', 'enabled', 'complete', 'completed'].includes(
    normalized,
  );
}

function firstText(row: RecordRow | null | undefined, keys: string[]) {
  if (!row) return '';

  for (const key of keys) {
    const value = asText(row[key]);
    if (value) return value;
  }

  return '';
}

function firstNumber(row: RecordRow | null | undefined, keys: string[]) {
  if (!row) return 0;

  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      const value = asNumber(row[key]);
      if (Number.isFinite(value)) return value;
    }
  }

  return 0;
}

function firstBoolean(row: RecordRow | null | undefined, keys: string[]) {
  if (!row) return false;

  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return asBoolean(row[key]);
    }
  }

  return false;
}

function normalizeStatus(value: unknown) {
  return asText(value)
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .trim();
}

function titleCase(value: unknown) {
  const normalized = normalizeStatus(value).replace(/_/g, ' ');
  if (!normalized) return 'Unknown';

  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCurrency(cents: number, currency = 'usd') {
  const safeCurrency = asText(currency).toUpperCase() || 'USD';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
    }).format((Number.isFinite(cents) ? cents : 0) / 100);
  } catch {
    return `$${((Number.isFinite(cents) ? cents : 0) / 100).toFixed(2)}`;
  }
}

function formatDate(value: unknown) {
  const text = asText(value);
  if (!text) return 'Date unavailable';

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function valueAsCents(row: RecordRow, centKeys: string[], dollarKeys: string[]) {
  for (const key of centKeys) {
    if (row[key] !== undefined && row[key] !== null) {
      return Math.round(asNumber(row[key]));
    }
  }

  for (const key of dollarKeys) {
    if (row[key] !== undefined && row[key] !== null) {
      return Math.round(asNumber(row[key]) * 100);
    }
  }

  return 0;
}

function bookingFromRow(row: RecordRow | null): BookingSummary | null {
  if (!row) return null;

  const id = firstText(row, ['id', 'booking_id']);
  if (!id) return null;

  const subtotalCents = valueAsCents(
    row,
    [
      'subtotal_cents',
      'service_subtotal_cents',
      'service_amount_cents',
      'base_amount_cents',
    ],
    ['subtotal', 'service_subtotal', 'service_amount', 'base_amount'],
  );

  const additionalPetCents = valueAsCents(
    row,
    ['additional_pet_fee_cents', 'additional_pets_cents'],
    ['additional_pet_fee', 'additional_pets_fee'],
  );

  const discountCents = valueAsCents(
    row,
    ['discount_cents', 'discount_amount_cents', 'savings_cents'],
    ['discount', 'discount_amount', 'savings'],
  );

  const marketplaceSupportCents = valueAsCents(
    row,
    [
      'marketplace_support_cents',
      'platform_fee_cents',
      'application_fee_cents',
      'service_fee_cents',
    ],
    [
      'marketplace_support',
      'platform_fee',
      'application_fee',
      'service_fee',
    ],
  );

  const creditsCents = valueAsCents(
    row,
    [
      'credits_applied_cents',
      'credit_amount_cents',
      'pawperks_credit_cents',
      'referral_credit_cents',
    ],
    [
      'credits_applied',
      'credit_amount',
      'pawperks_credit',
      'referral_credit',
    ],
  );

  const tipCents = valueAsCents(
    row,
    ['tip_cents', 'tip_amount_cents'],
    ['tip', 'tip_amount'],
  );

  const explicitTotalCents = valueAsCents(
    row,
    [
      'total_cents',
      'amount_due_cents',
      'final_total_cents',
      'price_cents',
      'amount_cents',
    ],
    ['total', 'amount_due', 'final_total', 'price', 'amount'],
  );

  const calculatedTotalCents = Math.max(
    0,
    subtotalCents +
      additionalPetCents +
      marketplaceSupportCents +
      tipCents -
      discountCents -
      creditsCents,
  );

  return {
    id,
    petParentUserId: firstText(row, [
      'customer_id',
      'pet_parent_id',
      'owner_id',
      'client_id',
      'booked_by',
      'user_id',
    ]),
    guruUserId: firstText(row, [
      'guru_id',
      'provider_id',
      'sitter_id',
      'caregiver_id',
    ]),
    petName:
      firstText(row, ['pet_name', 'animal_name', 'pet_display_name']) ||
      'Your pet',
    guruName:
      firstText(row, [
        'guru_name',
        'provider_name',
        'sitter_name',
        'caregiver_name',
      ]) || 'Your Guru',
    serviceName:
      firstText(row, [
        'service_name',
        'service',
        'service_type',
        'booking_type',
      ]) || 'Pet care',
    status:
      firstText(row, ['booking_status', 'status', 'request_status']) ||
      'unknown',
    subtotalCents,
    additionalPetCents,
    discountCents,
    marketplaceSupportCents,
    creditsCents,
    tipCents,
    totalCents: explicitTotalCents || calculatedTotalCents,
    currency: firstText(row, ['currency', 'currency_code']) || 'usd',
    acceptedAt: firstText(row, [
      'accepted_at',
      'approved_at',
      'confirmed_at',
    ]),
    completedAt: firstText(row, [
      'completed_at',
      'service_completed_at',
      'ended_at',
      'end_time',
    ]),
    createdAt: firstText(row, ['created_at', 'requested_at']),
  };
}

function paymentFromRow(row: RecordRow, index: number): PaymentSummary {
  const amountCents = valueAsCents(
    row,
    ['amount_cents', 'total_cents', 'paid_amount_cents'],
    ['amount', 'total', 'paid_amount'],
  );

  return {
    id:
      firstText(row, ['id', 'payment_id', 'transaction_id']) ||
      `payment-${index}`,
    bookingId: firstText(row, ['booking_id', 'care_booking_id']),
    amountCents,
    currency: firstText(row, ['currency', 'currency_code']) || 'usd',
    status:
      firstText(row, [
        'payment_status',
        'status',
        'transaction_status',
      ]) || 'unknown',
    paymentMethodType: firstText(row, [
      'payment_method_type',
      'method_type',
      'payment_method',
      'type',
    ]),
    cardBrand: firstText(row, ['card_brand', 'brand']),
    cardLast4: firstText(row, ['card_last4', 'last4']),
    receiptUrl: firstText(row, [
      'receipt_url',
      'stripe_receipt_url',
      'hosted_invoice_url',
    ]),
    stripePaymentIntentId: firstText(row, [
      'stripe_payment_intent_id',
      'payment_intent_id',
    ]),
    createdAt: firstText(row, [
      'created_at',
      'submitted_at',
      'authorized_at',
    ]),
    paidAt: firstText(row, [
      'paid_at',
      'succeeded_at',
      'captured_at',
      'completed_at',
    ]),
    refundedAt: firstText(row, [
      'refunded_at',
      'refund_completed_at',
    ]),
  };
}

function paymentStatusTone(status: string) {
  const normalized = normalizeStatus(status);

  if (PAID_STATUSES.has(normalized)) return 'success';
  if (PROCESSING_STATUSES.has(normalized)) return 'processing';
  if (FAILED_STATUSES.has(normalized)) return 'error';
  if (REFUNDED_STATUSES.has(normalized)) return 'warning';

  return 'neutral';
}

function paymentStatusLabel(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === 'requires_action') return 'Action required';
  if (normalized === 'partially_refunded') return 'Partially refunded';
  if (normalized === 'refund_pending') return 'Refund pending';

  return titleCase(status);
}

function isBookingAccepted(booking: BookingSummary | null) {
  if (!booking) return false;

  return (
    ACCEPTED_BOOKING_STATUSES.has(normalizeStatus(booking.status)) ||
    Boolean(booking.acceptedAt) ||
    Boolean(booking.completedAt)
  );
}

function isPaymentPaid(payment: PaymentSummary | null) {
  return payment
    ? PAID_STATUSES.has(normalizeStatus(payment.status))
    : false;
}

function getApiBaseUrl() {
  const candidates = [
    process.env.EXPO_PUBLIC_SITGURU_API_URL,
    process.env.EXPO_PUBLIC_SITGURU_WEB_URL,
    process.env.EXPO_PUBLIC_APP_URL,
    process.env.EXPO_PUBLIC_SITE_URL,
  ];

  const selected = candidates
    .map((value) => value?.trim())
    .find(Boolean);

  return selected?.replace(/\/+$/, '') || '';
}

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) return {} as CheckoutResponse;

  try {
    return JSON.parse(text) as CheckoutResponse;
  } catch {
    return {
      error: text,
    } as CheckoutResponse;
  }
}

async function loadLatestBooking(
  userId: string,
  role: AppRole | null,
  requestedBookingId: string,
) {
  if (requestedBookingId) {
    const requested = await supabase
      .from('bookings')
      .select('*')
      .eq('id', requestedBookingId)
      .maybeSingle();

    if (!requested.error && requested.data) {
      return bookingFromRow(requested.data as RecordRow);
    }
  }

  const fields =
    role === 'guru'
      ? ['guru_id', 'provider_id', 'sitter_id', 'caregiver_id']
      : [
          'customer_id',
          'pet_parent_id',
          'owner_id',
          'client_id',
          'booked_by',
          'user_id',
        ];

  for (const field of fields) {
    const result = await supabase
      .from('bookings')
      .select('*')
      .eq(field, userId)
      .limit(100);

    if (result.error) continue;

    const bookings = ((result.data || []) as RecordRow[])
      .map(bookingFromRow)
      .filter((item): item is BookingSummary => Boolean(item))
      .sort((left, right) => {
        const leftTime = new Date(
          left.completedAt ||
            left.acceptedAt ||
            left.createdAt ||
            0,
        ).getTime();

        const rightTime = new Date(
          right.completedAt ||
            right.acceptedAt ||
            right.createdAt ||
            0,
        ).getTime();

        return rightTime - leftTime;
      });

    const accepted = bookings.find(isBookingAccepted);
    if (accepted) return accepted;
    if (bookings[0]) return bookings[0];
  }

  return null;
}

async function loadPayments(userId: string, bookingId: string) {
  for (const table of PAYMENT_TABLES) {
    const result = await supabase.from(table).select('*').limit(200);

    if (result.error) continue;

    const rows = (result.data || []) as RecordRow[];

    return rows
      .filter((row) => {
        const rowBookingId = firstText(row, [
          'booking_id',
          'care_booking_id',
        ]);

        const ownerId = firstText(row, [
          'user_id',
          'customer_id',
          'pet_parent_id',
          'payer_user_id',
          'guru_id',
          'provider_id',
          'payee_user_id',
        ]);

        return (
          (bookingId && rowBookingId === bookingId) ||
          (!bookingId && ownerId === userId)
        );
      })
      .map(paymentFromRow)
      .sort((left, right) => {
        const leftTime = new Date(
          left.paidAt || left.createdAt || 0,
        ).getTime();

        const rightTime = new Date(
          right.paidAt || right.createdAt || 0,
        ).getTime();

        return rightTime - leftTime;
      });
  }

  return [];
}

async function loadCredits(userId: string): Promise<CreditSummary> {
  for (const table of CREDIT_TABLES) {
    const result = await supabase.from(table).select('*').limit(100);

    if (result.error) continue;

    const rows = (result.data || []) as RecordRow[];

    const row = rows.find((item) => {
      const rowUserId = firstText(item, [
        'user_id',
        'profile_id',
        'customer_id',
        'pet_parent_id',
      ]);

      return !rowUserId || rowUserId === userId;
    });

    if (!row) continue;

    const pawPerksCents = valueAsCents(
      row,
      ['pawperks_cents', 'paw_points_credit_cents'],
      ['pawperks', 'paw_points_credit'],
    );

    const referralCents = valueAsCents(
      row,
      ['referral_credit_cents', 'referral_cents'],
      ['referral_credit', 'referral_balance'],
    );

    const giftCents = valueAsCents(
      row,
      ['gift_credit_cents', 'gift_balance_cents'],
      ['gift_credit', 'gift_balance'],
    );

    const explicitAvailableCents = valueAsCents(
      row,
      [
        'available_cents',
        'balance_cents',
        'credit_balance_cents',
      ],
      ['available', 'balance', 'credit_balance'],
    );

    return {
      availableCents:
        explicitAvailableCents ||
        pawPerksCents + referralCents + giftCents,
      pawPerksCents,
      referralCents,
      giftCents,
    };
  }

  return {
    availableCents: 0,
    pawPerksCents: 0,
    referralCents: 0,
    giftCents: 0,
  };
}

async function loadPayoutSummary(userId: string): Promise<PayoutSummary> {
  for (const table of PAYOUT_TABLES) {
    const result = await supabase.from(table).select('*').limit(100);

    if (result.error) continue;

    const rows = (result.data || []) as RecordRow[];

    const row = rows.find((item) => {
      const rowUserId = firstText(item, [
        'user_id',
        'profile_id',
        'guru_id',
        'provider_id',
      ]);

      return rowUserId === userId;
    });

    if (!row) continue;

    const stripeAccountId = firstText(row, [
      'stripe_account_id',
      'connected_account_id',
      'account_id',
    ]);

    return {
      connected: Boolean(stripeAccountId),
      detailsSubmitted: firstBoolean(row, [
        'details_submitted',
        'stripe_details_submitted',
      ]),
      chargesEnabled: firstBoolean(row, [
        'charges_enabled',
        'stripe_charges_enabled',
      ]),
      payoutsEnabled: firstBoolean(row, [
        'payouts_enabled',
        'stripe_payouts_enabled',
      ]),
      stripeAccountId,
      pendingCents: valueAsCents(
        row,
        ['pending_payout_cents', 'pending_balance_cents'],
        ['pending_payout', 'pending_balance'],
      ),
      paidCents: valueAsCents(
        row,
        ['paid_out_cents', 'lifetime_payout_cents'],
        ['paid_out', 'lifetime_payout'],
      ),
      currency: firstText(row, ['currency', 'currency_code']) || 'usd',
      status:
        firstText(row, [
          'payout_status',
          'stripe_status',
          'status',
        ]) || (stripeAccountId ? 'connected' : 'not_connected'),
    };
  }

  return {
    connected: false,
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    stripeAccountId: '',
    pendingCents: 0,
    paidCents: 0,
    currency: 'usd',
    status: 'not_connected',
  };
}

function SectionCard({
  eyebrow,
  title,
  children,
  styles,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Button({
  label,
  onPress,
  styles,
  primary = false,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  primary?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primaryButton : null,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressed : null,
      ]}>
      {icon}
      <Text
        style={[
          styles.buttonText,
          primary ? styles.primaryButtonText : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function InfoRow({
  label,
  value,
  styles,
  emphasize = false,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
  emphasize?: boolean;
}) {
  return (
    <View style={[styles.infoRow, emphasize ? styles.infoRowEmphasis : null]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          emphasize ? styles.infoValueEmphasis : null,
        ]}>
        {value}
      </Text>
    </View>
  );
}

function StatusBadge({
  status,
  styles,
}: {
  status: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const tone = paymentStatusTone(status);

  return (
    <View
      style={[
        styles.statusBadge,
        tone === 'success'
          ? styles.statusBadgeSuccess
          : tone === 'processing'
            ? styles.statusBadgeProcessing
            : tone === 'error'
              ? styles.statusBadgeError
              : tone === 'warning'
                ? styles.statusBadgeWarning
                : styles.statusBadgeNeutral,
      ]}>
      {tone === 'success' ? (
        <CheckCircle2 size={14} strokeWidth={2.4} />
      ) : tone === 'processing' ? (
        <Clock3 size={14} strokeWidth={2.4} />
      ) : tone === 'error' ? (
        <XCircle size={14} strokeWidth={2.4} />
      ) : tone === 'warning' ? (
        <AlertTriangle size={14} strokeWidth={2.4} />
      ) : (
        <CircleDollarSign size={14} strokeWidth={2.4} />
      )}
      <Text style={styles.statusBadgeText}>
        {paymentStatusLabel(status)}
      </Text>
    </View>
  );
}

export default function PaymentsScreen() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    checkout?: string;
  }>();

  const colorScheme = useColorScheme();
  const themePreference = useThemePreference();
  const theme = getAppTheme(colorScheme === 'dark' ? 'dark' : 'light');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const isWebPreview = Platform.OS === 'web';

  const {
    user,
    profile,
    primaryRole,
    roles,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const requestedBookingId =
    typeof params.bookingId === 'string' ? params.bookingId : '';

  const checkoutResult =
    typeof params.checkout === 'string' ? params.checkout : '';

  const effectiveRole = primaryRole || roles[0] || null;
  const activeRole: AppRole = effectiveRole || 'pet_parent';

  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [payments, setPayments] = useState<PaymentSummary[]>([]);
  const [credits, setCredits] = useState<CreditSummary>({
    availableCents: 0,
    pawPerksCents: 0,
    referralCents: 0,
    giftCents: 0,
  });
  const [payout, setPayout] = useState<PayoutSummary>({
    connected: false,
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    stripeAccountId: '',
    pendingCents: 0,
    paidCents: 0,
    currency: 'usd',
    status: 'not_connected',
  });

  const [promoCode, setPromoCode] = useState('');
  const [applyCredits, setApplyCredits] = useState(true);
  const [loading, setLoading] = useState(true);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadError, setLoadError] = useState('');
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);

  const currentUserName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'SitGuru member';

  const firstName =
    currentUserName.split(/\s+/).filter(Boolean)[0] || 'Member';

  const profileRecord = (profile ?? {}) as RecordRow;
  const metadata = (user?.user_metadata ?? {}) as RecordRow;
  const rawAvatar =
    firstText(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
    ]) || firstText(metadata, ['avatar_url', 'picture']);

  const avatarUrl = rawAvatar
    ? resolveSupabaseStorageUrl(rawAvatar)
    : null;

  const latestPayment = payments[0] || null;
  const accepted = isBookingAccepted(booking);
  const alreadyPaid = isPaymentPaid(latestPayment);
  const isWide = width >= 760;

  const canOpenCheckout =
    isAuthenticated &&
    effectiveRole === 'pet_parent' &&
    Boolean(booking?.id) &&
    accepted &&
    !alreadyPaid &&
    (booking?.totalCents ?? 0) > 0;

  const refresh = useCallback(async () => {
    if (authLoading) return;

    if (!isSupabaseConfigured) {
      setLoading(false);
      setLoadError(
        'The mobile app is not connected to Supabase in this environment.',
      );
      return;
    }

    if (!user?.id) {
      setBooking(null);
      setPayments([]);
      setLoading(false);
      setLoadError('');
      return;
    }

    setLoading(true);
    setLoadError('');

    try {
      const nextBooking = await loadLatestBooking(
        user.id,
        effectiveRole,
        requestedBookingId,
      );

      setBooking(nextBooking);

      const [nextPayments, nextCredits, nextPayout] = await Promise.all([
        loadPayments(user.id, nextBooking?.id || ''),
        effectiveRole === 'pet_parent'
          ? loadCredits(user.id)
          : Promise.resolve({
              availableCents: 0,
              pawPerksCents: 0,
              referralCents: 0,
              giftCents: 0,
            }),
        effectiveRole === 'guru'
          ? loadPayoutSummary(user.id)
          : Promise.resolve({
              connected: false,
              detailsSubmitted: false,
              chargesEnabled: false,
              payoutsEnabled: false,
              stripeAccountId: '',
              pendingCents: 0,
              paidCents: 0,
              currency: 'usd',
              status: 'not_connected',
            }),
      ]);

      setPayments(nextPayments);
      setCredits(nextCredits);
      setPayout(nextPayout);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'SitGuru could not load payment information.',
      );
    } finally {
      setLoading(false);
    }
  }, [
    authLoading,
    effectiveRole,
    requestedBookingId,
    user?.id,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!checkoutResult) return;

    const normalized = normalizeStatus(checkoutResult);

    if (['success', 'complete', 'completed'].includes(normalized)) {
      setFeedback({
        tone: 'warning',
        title: 'Payment submitted for confirmation',
        message:
          'SitGuru is checking the payment status. The booking will show Paid only after the server receives confirmed payment status.',
      });
      void refresh();
      return;
    }

    if (['cancel', 'canceled', 'cancelled'].includes(normalized)) {
      setFeedback({
        tone: 'warning',
        title: 'Checkout closed',
        message:
          'No payment confirmation was recorded. You can return to SitGuru Checkout when ready.',
      });
    }
  }, [checkoutResult, refresh]);

  async function openExternalUrl(url: string) {
    if (!Linking.canOpenURL(url)) {
      throw new Error('The SitGuru checkout link could not be opened.');
    }

    if (Platform.OS === 'web') {
      await Linking.openURL(url);
      return;
    }

    const returnUrl = Linking.createURL('/payments', {
      queryParams: {
        checkout: 'complete',
        bookingId: booking?.id || '',
      },
    });

    const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);

    if (result.type === 'success') {
      setFeedback({
        tone: 'warning',
        title: 'Confirming payment',
        message:
          'SitGuru is checking the final payment status. Paid will appear only after server confirmation.',
      });
      await refresh();
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      setFeedback({
        tone: 'warning',
        title: 'Checkout closed',
        message:
          'No payment confirmation was recorded. You can reopen checkout when ready.',
      });
    }
  }

  async function startCheckout() {
    setFeedback(null);

    if (!isAuthenticated || !user?.id) {
      setFeedback({
        tone: 'warning',
        title: 'Sign in required',
        message:
          'Sign in as the Pet Parent connected to this booking before opening SitGuru Checkout.',
      });
      return;
    }

    if (effectiveRole !== 'pet_parent') {
      setFeedback({
        tone: 'warning',
        title: 'Pet Parent checkout',
        message:
          'Switch to the Pet Parent workspace to pay for Guru services.',
      });
      return;
    }

    if (!booking?.id) {
      setFeedback({
        tone: 'warning',
        title: 'Booking required',
        message:
          'Open Payments from a booking so SitGuru can calculate the correct amount.',
      });
      return;
    }

    if (!accepted) {
      setFeedback({
        tone: 'warning',
        title: 'Waiting for Guru acceptance',
        message:
          'SitGuru Checkout opens after the Guru accepts and the booking price is finalized.',
      });
      return;
    }

    if (alreadyPaid) {
      setFeedback({
        tone: 'success',
        title: 'Payment already confirmed',
        message:
          'This booking already has a confirmed successful payment.',
      });
      return;
    }

    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl) {
      setFeedback({
        tone: 'error',
        title: 'Checkout is not configured',
        message:
          'Add EXPO_PUBLIC_SITGURU_API_URL or EXPO_PUBLIC_SITGURU_WEB_URL to the mobile environment before using checkout.',
      });
      return;
    }

    setStartingCheckout(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Your session expired. Sign in again before paying.');
      }

      const returnUrl = Linking.createURL('/payments', {
        queryParams: {
          checkout: 'complete',
          bookingId: booking.id,
        },
      });

      const response = await fetch(
        `${apiBaseUrl}/api/mobile/payments/checkout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: booking.id,
            promoCode: promoCode.trim() || undefined,
            applyCredits,
            returnUrl,
            cancelUrl: Linking.createURL('/payments', {
              queryParams: {
                checkout: 'cancelled',
                bookingId: booking.id,
              },
            }),
            platform: Platform.OS,
            requestedPaymentMethods: [
              'card',
              'apple_pay',
              'google_pay',
              'link',
              'cashapp',
              'us_bank_account',
            ],
          }),
        },
      );

      const body = await readJson(response);

      if (!response.ok) {
        throw new Error(
          body.error ||
            body.message ||
            'SitGuru Checkout could not be started.',
        );
      }

      const checkoutUrl = body.checkoutUrl || body.url;

      if (!checkoutUrl) {
        throw new Error(
          'The payment server did not return a SitGuru Checkout URL.',
        );
      }

      await openExternalUrl(checkoutUrl);
    } catch (error) {
      setFeedback({
        tone: 'error',
        title: 'Checkout did not open',
        message:
          error instanceof Error
            ? error.message
            : 'SitGuru Checkout could not be started.',
      });
    } finally {
      setStartingCheckout(false);
    }
  }

  async function openReceipt(payment: PaymentSummary) {
    if (!payment.receiptUrl) {
      router.push({
        pathname: '/support',
        params: {
          topic: 'Payment receipt',
          reference: payment.id,
        },
      });
      return;
    }

    try {
      await Linking.openURL(payment.receiptUrl);
    } catch {
      setFeedback({
        tone: 'error',
        title: 'Receipt could not open',
        message:
          'Open Support and include the payment reference so SitGuru can provide the receipt.',
      });
    }
  }

  function openPayoutSetup() {
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl) {
      setFeedback({
        tone: 'error',
        title: 'Payout setup is not configured',
        message:
          'Add the SitGuru web or API URL before opening Stripe Connect onboarding.',
      });
      return;
    }

    void Linking.openURL(
      `${apiBaseUrl}/guru/payouts?returnTo=${encodeURIComponent(
        '/payments',
      )}`,
    );
  }

  const bookingPaymentStatus = latestPayment
    ? paymentStatusLabel(latestPayment.status)
    : accepted
      ? 'Ready for checkout'
      : 'Waiting for Guru acceptance';

  const amountAfterAvailableCredits = Math.max(
    0,
    (booking?.totalCents || 0) -
      (applyCredits ? credits.availableCents : 0),
  );

  return (
    <>
      <SitGuruScreen center={isWebPreview} maxWidth={620}>
        <View
          style={[
            styles.previewCanvas,
            !isWebPreview ? styles.previewCanvasNative : null,
          ]}>
          <View
            style={[
              styles.deviceFrame,
              !isWebPreview ? styles.deviceFrameNative : null,
            ]}>
            {isWebPreview ? <View style={styles.deviceTopSpeaker} /> : null}

            <View
              style={[
                styles.phoneShell,
                !isWebPreview ? styles.phoneShellNative : null,
              ]}>
              <View
                style={[
                  styles.screen,
                  !isWebPreview ? styles.screenNative : null,
                ]}>
                {isWebPreview ? (
                  <View style={styles.statusBar}>
                    <Text style={styles.statusTime}>9:41</Text>
                    <View style={styles.statusIcons}>
                      <View style={styles.signalBars}>
                        <View style={[styles.signalBar, { height: 5 }]} />
                        <View style={[styles.signalBar, { height: 7 }]} />
                        <View style={[styles.signalBar, { height: 9 }]} />
                      </View>
                      <Text style={styles.wifiText}>⌁</Text>
                      <View style={styles.batteryWrap}>
                        <View style={styles.batteryBody}>
                          <View style={styles.batteryFill} />
                        </View>
                        <View style={styles.batteryCap} />
                      </View>
                    </View>
                  </View>
                ) : null}

                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  <View style={styles.page}>
                    <View style={styles.header}>
                      <View style={styles.headerCopy}>
                        <Text style={styles.headerTitle}>
                          Payments & Payouts
                        </Text>
                        <Text style={styles.headerWelcome}>
                          Welcome back, {firstName}!{' '}
                          <Text style={styles.wave}>👋</Text>
                        </Text>
                        <SitGuruRoleStatus role={activeRole} />
                      </View>

                      <View style={styles.headerActions}>
                        <Pressable
                          accessibilityLabel="Open notifications"
                          accessibilityRole="button"
                          onPress={() => router.push('/notifications')}
                          style={styles.headerIconButton}>
                          <Bell
                            color={theme.colors.text}
                            size={18}
                            strokeWidth={2.3}
                          />
                        </Pressable>

                        <View style={styles.modeToggle}>
                          {THEME_OPTIONS.map((option) => {
                            const active = themePreference === option.value;

                            return (
                              <Pressable
                                key={option.value}
                                accessibilityLabel={`Switch to ${option.label} mode`}
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                                onPress={() => setThemePreference(option.value)}
                                style={[
                                  styles.modeButton,
                                  active ? styles.modeButtonActive : null,
                                ]}>
                                <SitGuruIcon
                                  color={
                                    active
                                      ? option.value === 'light'
                                        ? '#F3AA1F'
                                        : theme.mode === 'dark'
                                          ? '#F0CF62'
                                          : theme.colors.primary
                                      : theme.colors.muted
                                  }
                                  name={option.icon}
                                  size={15}
                                  strokeWidth={2.4}
                                />
                              </Pressable>
                            );
                          })}
                        </View>

                        <Pressable
                          accessibilityLabel="Switch workspace"
                          accessibilityRole="button"
                          onPress={() => setWorkspaceSwitcherOpen(true)}
                          style={styles.profileButton}>
                          <HeaderAvatar
                            fallback={initials(currentUserName)}
                            imageUrl={avatarUrl}
                            styles={styles}
                          />
                        </Pressable>
                      </View>
                    </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <ShieldCheck
              color="#FFFFFF"
              size={28}
              strokeWidth={2.3}
            />
          </View>
          <Text style={styles.heroEyebrow}>SitGuru money hub</Text>
          <Text style={styles.title}>Payments & Payouts</Text>
          <Text style={styles.subtitle}>
            Fast, secure payment choices for Pet Parents and clear payout
            readiness for Gurus—all kept inside the SitGuru booking record.
          </Text>

          <View style={styles.memberStrip}>
            <View>
              <Text style={styles.memberName}>{currentUserName}</Text>
              <Text style={styles.memberRole}>
                {effectiveRole ? roleLabel(effectiveRole) : 'Member'}
              </Text>
            </View>
            <View style={styles.securePill}>
              <ShieldCheck
                color="#FFFFFF"
                size={14}
                strokeWidth={2.4}
              />
              <Text style={styles.securePillText}>Secure checkout</Text>
            </View>
          </View>
        </View>

        {loadError ? (
          <View style={styles.errorCard}>
            <AlertTriangle
              color={theme.colors.danger}
              size={21}
              strokeWidth={2.4}
            />
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : null}

        {feedback ? (
          <View
            style={[
              styles.feedbackCard,
              feedback.tone === 'success'
                ? styles.feedbackSuccess
                : feedback.tone === 'warning'
                  ? styles.feedbackWarning
                  : styles.feedbackError,
            ]}>
            {feedback.tone === 'success' ? (
              <CheckCircle2
                color={theme.colors.success}
                size={21}
                strokeWidth={2.4}
              />
            ) : (
              <AlertTriangle
                color={
                  feedback.tone === 'warning'
                    ? theme.colors.warning
                    : theme.colors.danger
                }
                size={21}
                strokeWidth={2.4}
              />
            )}
            <View style={styles.feedbackCopy}>
              <Text style={styles.feedbackTitle}>{feedback.title}</Text>
              <Text style={styles.feedbackMessage}>
                {feedback.message}
              </Text>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.roleGrid,
            isWide ? styles.roleGridWide : null,
          ]}>
          <View style={styles.bookingCard}>
            <View style={styles.bookingCardTop}>
              <View style={styles.bookingIcon}>
                <UserRound
                  color={theme.colors.primary}
                  size={23}
                  strokeWidth={2.3}
                />
              </View>
              <StatusBadge
                status={
                  latestPayment?.status ||
                  (accepted ? 'payment_required' : 'pending')
                }
                styles={styles}
              />
            </View>

            <Text style={styles.bookingEyebrow}>
              {booking?.id ? 'Booking connected' : 'No booking selected'}
            </Text>
            <Text style={styles.bookingTitle}>
              {booking?.petName || 'Open a booking'}
            </Text>
            <Text style={styles.bookingMeta}>
              {booking
                ? `${booking.serviceName} with ${booking.guruName}`
                : 'Payment details appear after a SitGuru booking is selected.'}
            </Text>
            <Text style={styles.bookingMeta}>
              {booking
                ? `Booking status: ${titleCase(booking.status)}`
                : 'Waiting for booking information'}
            </Text>
            <Text style={styles.bookingAmount}>
              {booking
                ? formatCurrency(booking.totalCents, booking.currency)
                : '—'}
            </Text>
            <Text style={styles.bookingStatusText}>
              {bookingPaymentStatus}
            </Text>
          </View>

          <View style={styles.safetyCard}>
            <ShieldCheck
              color={theme.colors.primary}
              size={28}
              strokeWidth={2.2}
            />
            <Text style={styles.safetyTitle}>Stay protected in SitGuru</Text>
            <Text style={styles.body}>
              Keep booking payments, credits, tips, receipts, refunds, and
              payout records inside SitGuru. Do not send cash, checks, Zelle,
              or direct off-platform transfers for Guru services.
            </Text>
          </View>
        </View>

        {effectiveRole === 'pet_parent' ? (
          <>
            <SectionCard
              eyebrow="Final booking amount"
              title="SitGuru Checkout"
              styles={styles}>
              {!isAuthenticated && !authLoading ? (
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeTitle}>Sign in to pay</Text>
                  <Text style={styles.body}>
                    Sign in as the Pet Parent connected to the booking.
                  </Text>
                  <Button
                    label="Sign in"
                    onPress={() => router.push('/login')}
                    styles={styles}
                    primary
                  />
                </View>
              ) : null}

              <InfoRow
                label="Service subtotal"
                value={
                  booking
                    ? formatCurrency(
                        booking.subtotalCents,
                        booking.currency,
                      )
                    : 'Not available'
                }
                styles={styles}
              />
              <InfoRow
                label="Additional pet charges"
                value={
                  booking
                    ? formatCurrency(
                        booking.additionalPetCents,
                        booking.currency,
                      )
                    : 'Not available'
                }
                styles={styles}
              />
              <InfoRow
                label="Discounts"
                value={
                  booking
                    ? `-${formatCurrency(
                        booking.discountCents,
                        booking.currency,
                      )}`
                    : 'Not available'
                }
                styles={styles}
              />
              <InfoRow
                label="SitGuru marketplace support"
                value={
                  booking
                    ? formatCurrency(
                        booking.marketplaceSupportCents,
                        booking.currency,
                      )
                    : 'Not available'
                }
                styles={styles}
              />
              <InfoRow
                label="Booking credits already applied"
                value={
                  booking
                    ? `-${formatCurrency(
                        booking.creditsCents,
                        booking.currency,
                      )}`
                    : 'Not available'
                }
                styles={styles}
              />
              <InfoRow
                label="Optional tip"
                value={
                  booking
                    ? formatCurrency(
                        booking.tipCents,
                        booking.currency,
                      )
                    : 'Not available'
                }
                styles={styles}
              />

              <View style={styles.creditToggleCard}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: applyCredits }}
                  onPress={() => setApplyCredits((current) => !current)}
                  style={[
                    styles.checkbox,
                    applyCredits ? styles.checkboxActive : null,
                  ]}>
                  {applyCredits ? (
                    <CheckCircle2
                      color="#FFFFFF"
                      size={17}
                      strokeWidth={2.4}
                    />
                  ) : null}
                </Pressable>
                <View style={styles.creditToggleCopy}>
                  <Text style={styles.creditToggleTitle}>
                    Apply available SitGuru credits
                  </Text>
                  <Text style={styles.creditToggleText}>
                    {formatCurrency(
                      credits.availableCents,
                      booking?.currency || 'usd',
                    )}{' '}
                    available across PawPerks, referral, and gift credits.
                  </Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Promo code</Text>
              <View style={styles.promoRow}>
                <Tag
                  color={theme.colors.primary}
                  size={18}
                  strokeWidth={2.3}
                />
                <TextInput
                  autoCapitalize="characters"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  placeholder="Enter eligible code"
                  placeholderTextColor={theme.colors.inputPlaceholder}
                  style={styles.promoInput}
                />
              </View>

              <InfoRow
                label="Estimated amount remaining"
                value={
                  booking
                    ? formatCurrency(
                        amountAfterAvailableCredits,
                        booking.currency,
                      )
                    : 'Not available'
                }
                styles={styles}
                emphasize
              />

              <Button
                label={
                  startingCheckout
                    ? 'Opening secure checkout…'
                    : alreadyPaid
                      ? 'Payment confirmed'
                      : 'Continue to SitGuru Checkout'
                }
                onPress={() => void startCheckout()}
                styles={styles}
                primary
                disabled={startingCheckout || !canOpenCheckout}
                icon={
                  startingCheckout ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <CreditCard
                      color="#FFFFFF"
                      size={18}
                      strokeWidth={2.4}
                    />
                  )
                }
              />

              {!accepted && booking ? (
                <Text style={styles.footnote}>
                  Checkout opens after the Guru accepts and SitGuru confirms
                  the final booking amount.
                </Text>
              ) : alreadyPaid ? (
                <Text style={styles.footnote}>
                  SitGuru received confirmed successful payment status for
                  this booking.
                </Text>
              ) : (
                <Text style={styles.footnote}>
                  The checkout shows only payment methods eligible for the
                  device, account, currency, and transaction. SitGuru does not
                  label a payment Paid until server confirmation is recorded.
                </Text>
              )}
            </SectionCard>

            <SectionCard
              eyebrow="Flexible and fast"
              title="Ways to pay"
              styles={styles}>
              <View style={styles.methodGrid}>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;

                  return (
                    <View key={method.key} style={styles.methodCard}>
                      <View style={styles.methodIcon}>
                        <Icon
                          color={theme.colors.primary}
                          size={23}
                          strokeWidth={2.2}
                        />
                      </View>
                      <Text style={styles.methodTitle}>{method.name}</Text>
                      <Text style={styles.methodDescription}>
                        {method.description}
                      </Text>
                      <Text style={styles.methodAvailability}>
                        {method.availability}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </SectionCard>

            <SectionCard
              eyebrow="SitGuru balance"
              title="Credits and savings"
              styles={styles}>
              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <Gift
                    color={theme.colors.primary}
                    size={20}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.metricValue}>
                    {formatCurrency(
                      credits.availableCents,
                      booking?.currency || 'usd',
                    )}
                  </Text>
                  <Text style={styles.metricLabel}>Available credit</Text>
                </View>
                <View style={styles.metric}>
                  <Star
                    color={theme.colors.primary}
                    size={20}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.metricValue}>
                    {formatCurrency(
                      credits.pawPerksCents,
                      booking?.currency || 'usd',
                    )}
                  </Text>
                  <Text style={styles.metricLabel}>PawPerks</Text>
                </View>
                <View style={styles.metric}>
                  <Link2
                    color={theme.colors.primary}
                    size={20}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.metricValue}>
                    {formatCurrency(
                      credits.referralCents,
                      booking?.currency || 'usd',
                    )}
                  </Text>
                  <Text style={styles.metricLabel}>Referral credit</Text>
                </View>
                <View style={styles.metric}>
                  <Gift
                    color={theme.colors.primary}
                    size={20}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.metricValue}>
                    {formatCurrency(
                      credits.giftCents,
                      booking?.currency || 'usd',
                    )}
                  </Text>
                  <Text style={styles.metricLabel}>Gift credit</Text>
                </View>
              </View>
            </SectionCard>
          </>
        ) : null}

        {effectiveRole === 'guru' ? (
          <>
            <SectionCard
              eyebrow="Stripe Connect"
              title="Guru payout readiness"
              styles={styles}>
              <InfoRow
                label="Connection status"
                value={titleCase(payout.status)}
                styles={styles}
              />
              <InfoRow
                label="Identity and bank details"
                value={
                  payout.detailsSubmitted
                    ? 'Submitted'
                    : 'Needs completion'
                }
                styles={styles}
              />
              <InfoRow
                label="Payments enabled"
                value={payout.chargesEnabled ? 'Enabled' : 'Not enabled'}
                styles={styles}
              />
              <InfoRow
                label="Payouts enabled"
                value={payout.payoutsEnabled ? 'Enabled' : 'Not enabled'}
                styles={styles}
              />
              <InfoRow
                label="Pending payout"
                value={formatCurrency(
                  payout.pendingCents,
                  payout.currency,
                )}
                styles={styles}
              />
              <InfoRow
                label="Paid out"
                value={formatCurrency(payout.paidCents, payout.currency)}
                styles={styles}
              />

              <View style={styles.buttonRow}>
                <Button
                  label={
                    payout.connected
                      ? 'Manage payout account'
                      : 'Set up payouts'
                  }
                  onPress={openPayoutSetup}
                  styles={styles}
                  primary
                  icon={
                    <Banknote
                      color="#FFFFFF"
                      size={18}
                      strokeWidth={2.3}
                    />
                  }
                />
                <Button
                  label="Guru earnings"
                  onPress={() => router.push('/guru-earnings')}
                  styles={styles}
                />
                <Button
                  label="Guru pricing"
                  onPress={() => router.push('/guru-pricing')}
                  styles={styles}
                />
              </View>

              <Text style={styles.footnote}>
                SitGuru never labels earnings Paid Out until a successful
                transfer or payout reference is recorded.
              </Text>
            </SectionCard>
          </>
        ) : null}

        <SectionCard
          eyebrow="Receipts and status"
          title="Payment activity"
          styles={styles}>
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator
                color={theme.colors.primary}
                size="small"
              />
              <Text style={styles.body}>Loading payment activity…</Text>
            </View>
          ) : payments.length ? (
            <View style={styles.paymentList}>
              {payments.map((payment) => (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.paymentCardTop}>
                    <View style={styles.paymentIcon}>
                      <Receipt
                        color={theme.colors.primary}
                        size={21}
                        strokeWidth={2.3}
                      />
                    </View>
                    <StatusBadge status={payment.status} styles={styles} />
                  </View>

                  <Text style={styles.paymentAmount}>
                    {formatCurrency(
                      payment.amountCents,
                      payment.currency,
                    )}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    {payment.paymentMethodType
                      ? titleCase(payment.paymentMethodType)
                      : 'Payment method recorded by SitGuru'}
                    {payment.cardLast4
                      ? ` • ${
                          payment.cardBrand
                            ? titleCase(payment.cardBrand)
                            : 'Card'
                        } ending ${payment.cardLast4}`
                      : ''}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    {formatDate(
                      payment.paidAt ||
                        payment.refundedAt ||
                        payment.createdAt,
                    )}
                  </Text>
                  <Text style={styles.paymentReference}>
                    Reference: {payment.id}
                  </Text>

                  <Button
                    label={
                      payment.receiptUrl
                        ? 'View receipt'
                        : 'Request receipt'
                    }
                    onPress={() => void openReceipt(payment)}
                    styles={styles}
                    icon={
                      <ExternalLink
                        color={theme.colors.primary}
                        size={15}
                        strokeWidth={2.3}
                      />
                    }
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Receipt
                color={theme.colors.primary}
                size={28}
                strokeWidth={2.2}
              />
              <Text style={styles.emptyTitle}>No payment activity yet</Text>
              <Text style={styles.emptyText}>
                Confirmed payments, processing bank payments, refunds, and
                receipts will appear here.
              </Text>
            </View>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Payment support"
          title="Refunds, failures, and adjustments"
          styles={styles}>
          <Text style={styles.body}>
            SitGuru Support can help with declined payments, processing bank
            payments, refund requests, duplicate charges, payout delays,
            credits, receipts, and price adjustments.
          </Text>
          <View style={styles.buttonRow}>
            <Button
              label="Payment support"
              onPress={() =>
                router.push({
                  pathname: '/support',
                  params: {
                    topic: 'Payments',
                    reference:
                      latestPayment?.id || booking?.id || undefined,
                  },
                })
              }
              styles={styles}
              primary
            />
            <Button
              label="Booking details"
              onPress={() =>
                router.push({
                  pathname: '/booking-details',
                  params: booking?.id
                    ? { bookingId: booking.id }
                    : undefined,
                })
              }
              styles={styles}
            />
            <Button
              label="Notifications"
              onPress={() => router.push('/notifications')}
              styles={styles}
            />
          </View>
        </SectionCard>

                  </View>
                </ScrollView>

                <View style={styles.bottomNav}>
                  <BottomNavItem
                    label="Home"
                    icon={
                      <Home
                        color={theme.colors.textSecondary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    onPress={() =>
                      router.push(
                        activeRole === 'guru'
                          ? '/guru-dashboard'
                          : activeRole === 'ambassador'
                            ? '/ambassador-dashboard'
                            : activeRole === 'admin'
                              ? '/admin-dashboard'
                              : '/pet-parent-dashboard',
                      )
                    }
                    styles={styles}
                  />
                  <BottomNavItem
                    label="Explore"
                    icon={
                      <Search
                        color={theme.colors.textSecondary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    onPress={() => router.push('/find-care')}
                    styles={styles}
                  />
                  <BottomNavItem
                    label="Bookings"
                    icon={
                      <CalendarDays
                        color={theme.colors.textSecondary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    onPress={() => router.push('/booking-details')}
                    styles={styles}
                  />
                  <BottomNavItem
                    label="Messages"
                    icon={
                      <MessageCircle
                        color={theme.colors.textSecondary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    onPress={() => router.push('/conversation')}
                    styles={styles}
                  />
                  <BottomNavItem
                    active
                    label="Profile"
                    icon={
                      <UserRound
                        color={theme.colors.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    }
                    onPress={() => router.push('/account')}
                    styles={styles}
                  />
                </View>

                {isWebPreview ? <View style={styles.homeIndicator} /> : null}
              </View>
            </View>
          </View>
        </View>
      </SitGuruScreen>

      <SitGuruWorkspaceSwitcher
        currentRole={activeRole}
        onClose={() => setWorkspaceSwitcherOpen(false)}
        profileHref="/account"
        profileLabel="Manage account"
        visible={workspaceSwitcherOpen}
      />
    </>
  );
}


function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'SG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function HeaderAvatar({
  fallback,
  imageUrl,
  styles,
}: {
  fallback: string;
  imageUrl: string | null;
  styles: ReturnType<typeof createStyles>;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <View style={styles.avatarFrame}>
      {showImage ? (
        <Image
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={{ uri: imageUrl as string }}
          style={styles.avatarImage}
        />
      ) : (
        <Text style={styles.avatarInitials}>{fallback}</Text>
      )}
    </View>
  );
}

function BottomNavItem({
  active = false,
  icon,
  label,
  onPress,
  styles,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bottomNavItem,
        pressed ? styles.pressed : null,
      ]}>
      {icon}
      <Text
        style={[
          styles.bottomNavText,
          active ? styles.bottomNavTextActive : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof getAppTheme>) {
  const dark = theme.mode === 'dark';

  return StyleSheet.create({
    previewCanvas: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: 930,
      paddingHorizontal: 16,
      paddingVertical: 22,
      width: '100%',
    },
    previewCanvasNative: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    deviceFrame: {
      backgroundColor: '#111713',
      borderColor: '#2E3631',
      borderRadius: 42,
      borderWidth: 2,
      maxWidth: 430,
      overflow: 'hidden',
      paddingBottom: 15,
      paddingHorizontal: 8,
      paddingTop: 10,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.27,
      shadowRadius: 28,
      width: '100%',
    },
    deviceFrameNative: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      borderWidth: 0,
      flex: 1,
      maxWidth: '100%',
      overflow: 'visible',
      paddingBottom: 0,
      paddingHorizontal: 0,
      paddingTop: 0,
      shadowOpacity: 0,
    },
    deviceTopSpeaker: {
      alignSelf: 'center',
      backgroundColor: '#303832',
      borderRadius: 999,
      height: 6,
      marginBottom: 9,
      width: 86,
    },
    phoneShell: {
      backgroundColor: dark ? '#06140F' : '#FFF9F1',
      borderColor: theme.colors.border,
      borderRadius: 34,
      borderWidth: 1,
      height: 844,
      overflow: 'hidden',
      width: '100%',
    },
    phoneShellNative: {
      borderRadius: 0,
      borderWidth: 0,
      flex: 1,
      height: '100%',
    },
    screen: {
      backgroundColor: dark ? '#06140F' : '#FFF9F1',
      flex: 1,
      position: 'relative',
      width: '100%',
    },
    screenNative: {
      minHeight: '100%',
    },
    statusBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 31,
      paddingHorizontal: 16,
      paddingTop: 7,
    },
    statusTime: {
      color: theme.colors.text,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    statusIcons: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    signalBars: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 2,
    },
    signalBar: {
      backgroundColor: theme.colors.text,
      borderRadius: 2,
      width: 3,
    },
    wifiText: {
      color: theme.colors.text,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    batteryWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
    },
    batteryBody: {
      borderColor: theme.colors.text,
      borderRadius: 3,
      borderWidth: 1,
      height: 9,
      padding: 1,
      width: 17,
    },
    batteryFill: {
      backgroundColor: theme.colors.text,
      borderRadius: 2,
      flex: 1,
    },
    batteryCap: {
      backgroundColor: theme.colors.text,
      height: 4,
      width: 2,
    },
    scrollContent: {
      paddingBottom: 112,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 13,
    },
    headerCopy: {
      flex: 1,
      gap: 2,
      paddingRight: 8,
    },
    headerTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.4,
      lineHeight: 24,
    },
    headerWelcome: {
      color: theme.colors.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
    },
    wave: {
      fontSize: 11,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    modeToggle: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: dark ? '#B9831B' : '#F2822E',
      borderRadius: 13,
      borderWidth: 1.2,
      flexDirection: 'row',
      gap: 2,
      padding: 2,
    },
    modeButton: {
      alignItems: 'center',
      borderRadius: 10,
      height: 28,
      justifyContent: 'center',
      width: 31,
    },
    modeButtonActive: {
      backgroundColor: dark ? 'rgba(226,170,45,0.18)' : '#FFF4D8',
    },
    profileButton: {
      borderRadius: 999,
    },
    avatarFrame: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderColor: dark ? '#2E6C4B' : '#FFFFFF',
      borderRadius: 21,
      borderWidth: 2,
      height: 42,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 42,
    },
    avatarImage: {
      height: '100%',
      width: '100%',
    },
    avatarInitials: {
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    page: {
      gap: 16,
      paddingBottom: 8,
    },
    topBar: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
    },
    backButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 7,
      minHeight: 42,
      paddingHorizontal: 13,
    },
    backButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    refreshButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 6,
      minHeight: 42,
      paddingHorizontal: 12,
    },
    refreshButtonText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.76,
    },
    hero: {
      backgroundColor: dark ? '#0D2A1C' : '#0F563E',
      borderRadius: 30,
      gap: 10,
      padding: 22,
    },
    heroIcon: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: 18,
      height: 52,
      justifyContent: 'center',
      width: 52,
    },
    heroEyebrow: {
      color: dark ? '#A6E9C2' : '#C9F26D',
      fontSize: 11,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    },
    title: {
      color: '#FFFFFF',
      fontSize: 36,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: -1.1,
      lineHeight: 41,
    },
    subtitle: {
      color: '#E4F5EB',
      fontSize: 15,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 23,
    },
    memberStrip: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderColor: 'rgba(255,255,255,0.14)',
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      marginTop: 4,
      padding: 12,
    },
    memberName: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    memberRole: {
      color: '#D7EADF',
      fontSize: 12,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
    },
    securePill: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 7,
    },
    securePillText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    errorCard: {
      alignItems: 'flex-start',
      backgroundColor: dark ? '#321713' : '#FEF2F2',
      borderColor: dark ? '#6D3027' : '#FECACA',
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 13,
    },
    errorText: {
      color: theme.colors.danger,
      flex: 1,
      fontSize: 12,
      fontFamily: AppFonts.bold,
      fontWeight: '800',
      lineHeight: 19,
    },
    feedbackCard: {
      alignItems: 'flex-start',
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 13,
    },
    feedbackSuccess: {
      backgroundColor: dark ? '#123122' : '#ECFDF3',
      borderColor: dark ? '#28583E' : '#BBF7D0',
    },
    feedbackWarning: {
      backgroundColor: dark ? '#302611' : '#FFFBEB',
      borderColor: dark ? '#6A5422' : '#FDE68A',
    },
    feedbackError: {
      backgroundColor: dark ? '#321713' : '#FEF2F2',
      borderColor: dark ? '#6D3027' : '#FECACA',
    },
    feedbackCopy: {
      flex: 1,
      gap: 3,
    },
    feedbackTitle: {
      color: theme.colors.text,
      fontSize: 14,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    feedbackMessage: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 19,
    },
    roleGrid: {
      gap: 12,
    },
    roleGridWide: {
      flexDirection: 'row',
    },
    bookingCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 25,
      borderWidth: 1,
      flex: 1,
      gap: 8,
      padding: 17,
    },
    bookingCardTop: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    bookingIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 15,
      height: 43,
      justifyContent: 'center',
      width: 43,
    },
    bookingEyebrow: {
      color: theme.colors.primary,
      fontSize: 10,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    bookingTitle: {
      color: theme.colors.text,
      fontSize: 22,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    bookingMeta: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 18,
    },
    bookingAmount: {
      color: theme.colors.primaryDark,
      fontSize: 29,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: -0.7,
      marginTop: 3,
    },
    bookingStatusText: {
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    safetyCard: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.borderStrong,
      borderRadius: 25,
      borderWidth: 1,
      flex: 1,
      gap: 10,
      padding: 17,
    },
    safetyTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    body: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 21,
    },
    card: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 28,
      borderWidth: 1,
      gap: 12,
      padding: 18,
    },
    eyebrow: {
      color: theme.colors.primary,
      fontSize: 10,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: 22,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: -0.4,
      lineHeight: 28,
    },
    noticeCard: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.borderStrong,
      borderRadius: 18,
      borderWidth: 1,
      gap: 9,
      padding: 14,
    },
    noticeTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    infoRow: {
      alignItems: 'flex-start',
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 17,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      padding: 13,
    },
    infoRowEmphasis: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.borderStrong,
    },
    infoLabel: {
      color: theme.colors.textSecondary,
      flex: 1,
      fontSize: 12,
      fontFamily: AppFonts.bold,
      fontWeight: '800',
    },
    infoValue: {
      color: theme.colors.text,
      fontSize: 12,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      maxWidth: '50%',
      textAlign: 'right',
    },
    infoValueEmphasis: {
      color: theme.colors.primaryDark,
      fontSize: 17,
    },
    creditToggleCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 11,
      padding: 13,
    },
    checkbox: {
      alignItems: 'center',
      borderColor: theme.colors.primary,
      borderRadius: 8,
      borderWidth: 2,
      height: 25,
      justifyContent: 'center',
      width: 25,
    },
    checkboxActive: {
      backgroundColor: theme.colors.primary,
    },
    creditToggleCopy: {
      flex: 1,
      gap: 2,
    },
    creditToggleTitle: {
      color: theme.colors.text,
      fontSize: 13,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    creditToggleText: {
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 17,
    },
    fieldLabel: {
      color: theme.colors.text,
      fontSize: 10,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    promoRow: {
      alignItems: 'center',
      backgroundColor: theme.colors.input,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      paddingHorizontal: 13,
    },
    promoInput: {
      color: theme.colors.inputText,
      flex: 1,
      fontSize: 14,
      fontFamily: AppFonts.bold,
      fontWeight: '800',
      minHeight: 49,
    },
    button: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.primary,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      flexGrow: 1,
      gap: 8,
      justifyContent: 'center',
      minHeight: 49,
      minWidth: 150,
      paddingHorizontal: 15,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    disabledButton: {
      opacity: 0.48,
    },
    buttonText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      textAlign: 'center',
    },
    primaryButtonText: {
      color: '#FFFFFF',
    },
    footnote: {
      color: theme.colors.muted,
      fontSize: 11,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 17,
      textAlign: 'center',
    },
    methodGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    methodCard: {
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 20,
      borderWidth: 1,
      flexBasis: 205,
      flexGrow: 1,
      gap: 8,
      padding: 14,
    },
    methodIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 14,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    methodTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    methodDescription: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 18,
    },
    methodAvailability: {
      color: theme.colors.primary,
      fontSize: 9,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    metrics: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    metric: {
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      flex: 1,
      gap: 5,
      minWidth: 135,
      padding: 13,
    },
    metricValue: {
      color: theme.colors.primaryDark,
      fontSize: 20,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    metricLabel: {
      color: theme.colors.textSecondary,
      fontSize: 9,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    buttonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
    },
    loadingState: {
      alignItems: 'center',
      gap: 9,
      justifyContent: 'center',
      minHeight: 110,
    },
    paymentList: {
      gap: 10,
    },
    paymentCard: {
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 8,
      padding: 14,
    },
    paymentCardTop: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    paymentIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 14,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    statusBadge: {
      alignItems: 'center',
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    statusBadgeSuccess: {
      backgroundColor: dark ? '#123122' : '#DCFCE7',
    },
    statusBadgeProcessing: {
      backgroundColor: dark ? '#1C2A3B' : '#DBEAFE',
    },
    statusBadgeError: {
      backgroundColor: dark ? '#321713' : '#FEE2E2',
    },
    statusBadgeWarning: {
      backgroundColor: dark ? '#302611' : '#FEF3C7',
    },
    statusBadgeNeutral: {
      backgroundColor: theme.colors.primarySoft,
    },
    statusBadgeText: {
      color: theme.colors.text,
      fontSize: 9,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    paymentAmount: {
      color: theme.colors.primaryDark,
      fontSize: 23,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    paymentMeta: {
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 17,
    },
    paymentReference: {
      color: theme.colors.muted,
      fontSize: 9,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      borderColor: theme.colors.border,
      borderRadius: 20,
      borderStyle: 'dashed',
      borderWidth: 1,
      gap: 7,
      padding: 22,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      textAlign: 'center',
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 19,
      textAlign: 'center',
    },
    bottomDockSpacer: {
      height: 86,
    },
    bottomDock: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: dark ? 'rgba(10,20,14,0.96)' : 'rgba(255,255,255,0.97)',
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      bottom: 16,
      elevation: 8,
      flexDirection: 'row',
      gap: 6,
      left: 16,
      padding: 8,
      position: 'absolute',
      right: 16,
    },
    dockButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      flex: 1,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 8,
    },
    dockButtonPressed: {
      opacity: 0.78,
    },
    dockButtonText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    bottomNav: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 22,
      borderWidth: 1,
      bottom: 12,
      flexDirection: 'row',
      left: 12,
      paddingHorizontal: 6,
      paddingVertical: 8,
      position: 'absolute',
      right: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: dark ? 0.22 : 0.08,
      shadowRadius: 10,
    },
    bottomNavItem: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
      justifyContent: 'center',
      minHeight: 49,
    },
    bottomNavText: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    bottomNavTextActive: {
      color: theme.colors.primary,
    },
    homeIndicator: {
      alignSelf: 'center',
      backgroundColor: dark ? '#E7EFEA' : '#101612',
      borderRadius: 999,
      bottom: 2,
      height: 4,
      position: 'absolute',
      width: 116,
    },
  });
}