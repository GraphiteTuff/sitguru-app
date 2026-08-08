import { useCallback, useEffect, useState } from 'react';

import {
  bookingAssignedGuruId,
  bookingParentUserId,
  customerOwnsBookingRow,
  resolveBookingParticipantRole,
  type BookingAccessRow,
} from '@/lib/data/booking-access';
import { sitguruApiFetch } from '@/lib/data/api';
import {
  asString,
  firstString,
  getErrorMessage,
  normalizeStatus,
  type RecordRow,
} from '@/lib/data/fields';
import {
  API_PATHS,
  BOOKING_GURU_ID_FIELDS,
  BOOKING_PARENT_ID_FIELDS,
  REALTIME_CHANNELS,
  TABLES,
} from '@/lib/data/schema';
import { useRealtimeSubscription } from '@/hooks/data/useRealtimeSubscription';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type SitGuruBooking = {
  id: string;
  status: string;
  paymentStatus: string;
  petId: string;
  petName: string;
  guruId: string;
  guruSlug: string;
  guruName: string;
  parentUserId: string;
  serviceType: string;
  requestedStartDate: string;
  notes: string;
  raw: BookingAccessRow;
};

export type CreateBookingInput = {
  guruId?: string;
  guruSlug?: string;
  petId?: string;
  petName?: string;
  requestedStartDate: string;
  requestedEndDate?: string;
  dateSelectionMode?: 'single' | 'range';
  selectedDates?: string[];
  serviceType?: string;
  serviceKey?: string;
  timeWindow?: string;
  visitLength?: string;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
  subtotalAmount?: number;
  marketplaceFeePercent?: number;
  tipAmount?: number;
  customerTotalAmount?: number;
};

function bookingFromRow(row: RecordRow): SitGuruBooking | null {
  const id = asString(row.id);
  if (!id) return null;

  return {
    id,
    status: normalizeStatus(row.status || row.booking_status),
    paymentStatus: normalizeStatus(
      row.payment_status || row.paymentStatus || row.paid_status,
    ),
    petId: firstString(row, ['pet_id', 'petId']),
    petName: firstString(row, ['pet_name', 'petName'], 'Pet'),
    guruId: bookingAssignedGuruId(row),
    guruSlug: firstString(row, ['guru_slug', 'slug', 'guruSlug']),
    guruName: firstString(row, ['guru_name', 'provider_name', 'guruName'], 'Guru'),
    parentUserId: bookingParentUserId(row),
    serviceType: firstString(
      row,
      ['service_type', 'serviceType', 'service'],
      'Pet Care',
    ),
    requestedStartDate: firstString(row, [
      'requested_start_date',
      'requestedStartDate',
      'booking_date',
      'start_date',
      'date',
    ]),
    notes: firstString(row, ['notes', 'care_notes', 'booking_notes']),
    raw: row,
  };
}

async function queryBookingsForUser(
  userId: string,
  role: 'pet_parent' | 'guru' | 'any' = 'any',
): Promise<{ bookings: SitGuruBooking[]; error: string | null }> {
  const fields =
    role === 'guru'
      ? BOOKING_GURU_ID_FIELDS
      : role === 'pet_parent'
        ? BOOKING_PARENT_ID_FIELDS
        : [...BOOKING_PARENT_ID_FIELDS, ...BOOKING_GURU_ID_FIELDS];

  const collected = new Map<string, SitGuruBooking>();

  for (const field of fields) {
    const result = await supabase
      .from(TABLES.bookings)
      .select('*')
      .eq(field, userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (result.error) continue;

    for (const row of result.data ?? []) {
      const booking = bookingFromRow(row as RecordRow);
      if (booking) collected.set(booking.id, booking);
    }
  }

  return {
    bookings: Array.from(collected.values()),
    error: null,
  };
}

export function useBookings(options?: {
  role?: 'pet_parent' | 'guru' | 'any';
  enabled?: boolean;
  realtime?: boolean;
}) {
  const { user, isAuthenticated, primaryRole, roles } = useAuth();
  const role = options?.role ?? 'any';
  const enabled = options?.enabled ?? true;
  const realtime = options?.realtime ?? true;

  const [bookings, setBookings] = useState<SitGuruBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !isAuthenticated || !user?.id || !isSupabaseConfigured) {
      setBookings([]);
      setError(null);
      return;
    }

    setLoading(true);
    const result = await queryBookingsForUser(user.id, role);
    setBookings(result.bookings);
    setError(result.error);
    setLoading(false);
  }, [enabled, isAuthenticated, role, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtimeSubscription({
    channelName: user?.id
      ? `sitguru-bookings-${user.id}-${role}`
      : 'sitguru-bookings-idle',
    table: TABLES.bookings,
    filter: user?.id
      ? role === 'guru'
        ? `guru_id=eq.${user.id}`
        : role === 'pet_parent'
          ? `customer_id=eq.${user.id}`
          : undefined
      : undefined,
    enabled: Boolean(realtime && enabled && user?.id),
    onChange: () => {
      void refresh();
    },
  });

  const createBooking = useCallback(
    async (input: CreateBookingInput) => {
      setMutating(true);

      const result = await sitguruApiFetch<{
        success?: boolean;
        booking?: RecordRow;
        bookingId?: string;
        id?: string;
        checkoutUrl?: string;
        url?: string;
        error?: string;
      }>(API_PATHS.createBooking, {
        body: {
          ...input,
          guruId: input.guruId,
          guru_id: input.guruId,
          guruSlug: input.guruSlug,
          guru_slug: input.guruSlug,
          petId: input.petId,
          pet_id: input.petId,
          petName: input.petName,
          pet_name: input.petName,
          requestedStartDate: input.requestedStartDate,
          requested_start_date: input.requestedStartDate,
          requestedEndDate: input.requestedEndDate,
          dateSelectionMode: input.dateSelectionMode ?? 'single',
          selectedDates: input.selectedDates,
          serviceType: input.serviceType,
          service_type: input.serviceType,
          serviceKey: input.serviceKey,
          timeWindow: input.timeWindow,
          visitLength: input.visitLength,
          notes: input.notes,
          customerName: input.customerName,
          customerEmail: input.customerEmail || user?.email || '',
          client: 'sitguru-mobile',
          platform: 'mobile',
        },
      });

      setMutating(false);

      if (result.error) {
        return {
          booking: null as SitGuruBooking | null,
          checkoutUrl: null as string | null,
          error: result.error,
        };
      }

      const payload = result.data ?? {};
      const bookingRow =
        (payload.booking as RecordRow | undefined) ??
        (payload as RecordRow);
      const booking =
        bookingFromRow(bookingRow) ||
        (asString(payload.bookingId || payload.id)
          ? bookingFromRow({
              id: payload.bookingId || payload.id,
              status: 'pending',
              payment_status: 'unpaid',
            })
          : null);

      await refresh();

      return {
        booking,
        checkoutUrl:
          asString(payload.checkoutUrl) || asString(payload.url) || null,
        error: null as string | null,
      };
    },
    [refresh, user?.email],
  );

  const startCheckout = useCallback(
    async (
      bookingId: string,
      options?: {
        tipCents?: number;
        tipPercent?: number;
        tipAmount?: number;
        promoCode?: string;
        applyCredits?: boolean;
        returnUrl?: string;
        cancelUrl?: string;
      },
    ) => {
      setMutating(true);
      const result = await sitguruApiFetch<{
        checkoutUrl?: string;
        url?: string;
        error?: string;
      }>(API_PATHS.mobileCheckout, {
        body: {
          bookingId,
          booking_id: bookingId,
          client: 'sitguru-mobile',
          platform: 'mobile',
          tipCents: options?.tipCents,
          tip_cents: options?.tipCents,
          tipPercent: options?.tipPercent,
          tipAmount: options?.tipAmount,
          promoCode: options?.promoCode,
          applyCredits: options?.applyCredits,
          returnUrl: options?.returnUrl,
          cancelUrl: options?.cancelUrl,
        },
      });
      setMutating(false);

      if (result.error) {
        return { checkoutUrl: null as string | null, error: result.error };
      }

      return {
        checkoutUrl:
          asString(result.data?.checkoutUrl) ||
          asString(result.data?.url) ||
          null,
        error: null as string | null,
      };
    },
    [],
  );

  const getBookingAccess = useCallback(
    (booking: SitGuruBooking) => {
      if (!user?.id) {
        return {
          role: 'none' as const,
          canRead: false,
          canWriteCare: false,
        };
      }

      return resolveBookingParticipantRole({
        booking: booking.raw,
        userId: user.id,
        email: user.email,
        isAdmin: roles.includes('admin') || primaryRole === 'admin',
      });
    },
    [primaryRole, roles, user?.email, user?.id],
  );

  return {
    bookings,
    loading,
    mutating,
    error,
    refresh,
    createBooking,
    startCheckout,
    getBookingAccess,
    customerOwnsBookingRow,
    bookingAssignedGuruId,
  };
}

export function useBooking(
  bookingId: string | null | undefined,
  options?: { realtime?: boolean },
) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<SitGuruBooking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const id = asString(bookingId);
    if (!id || !isSupabaseConfigured) {
      setBooking(null);
      setError(null);
      return;
    }

    setLoading(true);
    const result = await supabase
      .from(TABLES.bookings)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (result.error) {
      setBooking(null);
      setError(getErrorMessage(result.error));
      setLoading(false);
      return;
    }

    setBooking(bookingFromRow((result.data as RecordRow) ?? null));
    setError(null);
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtimeSubscription({
    channelName: bookingId
      ? REALTIME_CHANNELS.bookingRoom(asString(bookingId))
      : 'booking-idle',
    table: TABLES.bookings,
    filter: bookingId ? `id=eq.${asString(bookingId)}` : undefined,
    enabled: Boolean(options?.realtime !== false && bookingId && user?.id),
    onChange: () => {
      void refresh();
    },
  });

  return { booking, loading, error, refresh };
}
