/**
 * Shared money formatting for Guru / Parent financial surfaces.
 */

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Always `$120.00` style — never drops cents for whole dollars. */
export function formatUsd(amountDollars: number | null | undefined) {
  if (typeof amountDollars !== 'number' || !Number.isFinite(amountDollars)) {
    return 'Not set';
  }

  return usdFormatter.format(amountDollars);
}

/** Convert cents → dollars safely. */
export function centsToDollars(cents: number | null | undefined) {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return 0;
  return cents / 100;
}

export function startOfWeek(reference = new Date()) {
  const date = new Date(reference);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
}

export function startOfMonth(reference = new Date()) {
  return new Date(reference.getFullYear(), reference.getMonth(), 1);
}
