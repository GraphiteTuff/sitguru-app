/**
 * Tip / gratuity helpers for SitGuru Checkout.
 */

export const TIP_PERCENT_PRESETS = [15, 18, 20] as const;

export type TipPercentPreset = (typeof TIP_PERCENT_PRESETS)[number];
export type TipChoice = TipPercentPreset | 'custom' | 'none';

export function dollarsToCents(dollars: number) {
  if (!Number.isFinite(dollars) || dollars <= 0) return 0;
  return Math.round(dollars * 100);
}

export function parseCustomTipDollars(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function computeTipCents(
  serviceCents: number,
  choice: TipChoice,
  customDollars: string,
) {
  const base = Math.max(0, Math.round(serviceCents));

  if (choice === 'none') return 0;

  if (choice === 'custom') {
    return dollarsToCents(parseCustomTipDollars(customDollars));
  }

  return Math.round(base * (choice / 100));
}

export function computeProjectedTotalCents(
  serviceCents: number,
  tipCents: number,
  creditCents = 0,
) {
  return Math.max(
    0,
    Math.round(serviceCents) + Math.round(tipCents) - Math.max(0, Math.round(creditCents)),
  );
}
