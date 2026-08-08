import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_GURU_ID_FIELDS,
  BOOKING_PARENT_ID_FIELDS,
} from '@/lib/data/schema';
import {
  asId,
  asString,
  firstId,
  normalizeStatus,
  type RecordRow,
} from '@/lib/data/fields';

export type BookingAccessRow = RecordRow & {
  id?: string | number | null;
  status?: string | null;
  customer_email?: string | null;
  email?: string | null;
};

/** Mirrors web `bookingAssignedGuruId`. */
export function bookingAssignedGuruId(booking: BookingAccessRow): string {
  return firstId(booking, BOOKING_GURU_ID_FIELDS);
}

/** Mirrors web `customerOwnsBookingRow` (+ pet_parent_id). */
export function customerOwnsBookingRow(
  booking: BookingAccessRow,
  userId: string,
  email?: string | null,
): boolean {
  const ownerIds = BOOKING_PARENT_ID_FIELDS.map((field) =>
    asId(booking[field]),
  ).filter(Boolean);

  if (ownerIds.includes(userId)) return true;

  const normalizedEmail = asString(email).toLowerCase();
  if (!normalizedEmail) return false;

  const emails = [
    asString(booking.customer_email).toLowerCase(),
    asString(booking.email).toLowerCase(),
  ].filter(Boolean);

  return emails.includes(normalizedEmail);
}

export function isBookingActiveForWrites(booking: BookingAccessRow): boolean {
  const status = normalizeStatus(booking.status);
  if (!status) return true;
  if (ACTIVE_BOOKING_STATUSES.has(status)) return true;

  if (
    [
      'completed',
      'canceled',
      'cancelled',
      'refunded',
      'declined',
    ].includes(status)
  ) {
    return false;
  }

  return true;
}

export function bookingParentUserId(booking: BookingAccessRow): string {
  return firstId(booking, BOOKING_PARENT_ID_FIELDS);
}

export type BookingParticipantRole =
  | 'pet_parent'
  | 'guru'
  | 'admin'
  | 'none';

export function resolveBookingParticipantRole(params: {
  booking: BookingAccessRow;
  userId: string;
  email?: string | null;
  isAdmin?: boolean;
}): {
  role: BookingParticipantRole;
  canRead: boolean;
  canWriteCare: boolean;
} {
  const { booking, userId, email, isAdmin = false } = params;

  if (isAdmin) {
    return { role: 'admin', canRead: true, canWriteCare: true };
  }

  const assignedGuruId = bookingAssignedGuruId(booking);
  if (assignedGuruId && assignedGuruId === userId) {
    return {
      role: 'guru',
      canRead: true,
      canWriteCare: isBookingActiveForWrites(booking),
    };
  }

  if (customerOwnsBookingRow(booking, userId, email)) {
    return {
      role: 'pet_parent',
      canRead: true,
      canWriteCare: false,
    };
  }

  return { role: 'none', canRead: false, canWriteCare: false };
}
