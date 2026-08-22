/**
 * Honest trust copy for discovery and booking.
 * Do not claim insurance or background checks that the Guru record does not have.
 */

export const MARKETPLACE_TRUST_LINES = [
  'All-in price shown before you book. Nothing is charged until the Guru accepts.',
  'Cancel free before they accept. After care, SitGuru holds a 48-hour review before payout.',
  'Book, message, and pay on SitGuru so Trust & Safety can help if anything goes wrong.',
] as const;

export const MARKETPLACE_BOOK_MICROCOPY =
  'Nothing charged until they accept · Cancel free before accept';

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
}

function isTruthyFlag(value: unknown) {
  return (
    value === true ||
    value === 1 ||
    value === '1' ||
    String(value).toLowerCase() === 'true'
  );
}

export function getGuruVerification(guru: Record<string, unknown>) {
  const status = firstString(guru, [
    'background_check_status',
    'background_status',
    'check_status',
  ]).toLowerCase();

  const backgroundChecked =
    [
      guru.background_checked,
      guru.is_background_checked,
      guru.background_check_complete,
      guru.background_check_passed,
      guru.background_check_verified,
    ].some(isTruthyFlag) ||
    ['approved', 'complete', 'completed', 'passed', 'verified'].includes(status);

  const identityVerified =
    isTruthyFlag(guru.is_verified) || isTruthyFlag(guru.verified);

  const label = backgroundChecked
    ? 'Background checked'
    : identityVerified
      ? 'Identity verified'
      : '';

  return { backgroundChecked, identityVerified, label };
}

export function getCompletedBookingCount(guru: Record<string, unknown>) {
  return firstNumber(guru, [
    'completed_bookings',
    'completed_booking_count',
    'booking_count',
    'total_completed_bookings',
    'completed_visits',
  ]);
}
