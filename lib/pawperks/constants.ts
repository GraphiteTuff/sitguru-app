/**
 * PawPerks loyalty math — 100 points = $1.00 USD.
 */

export const PAWPERKS_POINTS_PER_DOLLAR = 100;

export type PawPerkSourceType =
  | "GURU_REWARD"
  | "BOOKING_REDEMPTION"
  | "SIGNUP_BONUS"
  | "ADMIN_DEBIT"
  | "ADMIN_CREDIT";

export type PetParentPerksRow = {
  parent_id: string;
  points_balance: number;
  lifetime_earned: number;
  updated_at?: string | null;
  created_at?: string | null;
};

export type PawPerkTransactionRow = {
  transaction_id: string;
  parent_id: string;
  points_delta: number;
  source_type: PawPerkSourceType;
  booking_id?: string | null;
  memo?: string | null;
  awarded_by_guru_id?: string | null;
  payment_intent_id?: string | null;
  created_at: string;
};

export type PawPerkBadgeLevel = {
  id: "pup" | "scout" | "adventurer" | "legend";
  label: string;
  minLifetime: number;
  maxLifetime: number | null;
  emoji: string;
  blurb: string;
};

export const PAWPERK_BADGE_LEVELS: PawPerkBadgeLevel[] = [
  {
    id: "pup",
    label: "Pup",
    minLifetime: 0,
    maxLifetime: 99,
    emoji: "🐶",
    blurb: "Just getting started — every walk builds your vault.",
  },
  {
    id: "scout",
    label: "Scout",
    minLifetime: 100,
    maxLifetime: 499,
    emoji: "🧭",
    blurb: "Consistent care streaks unlock real checkout savings.",
  },
  {
    id: "adventurer",
    label: "Adventurer",
    minLifetime: 500,
    maxLifetime: 1499,
    emoji: "🏔️",
    blurb: "High-trust parents with serious redeemable value.",
  },
  {
    id: "legend",
    label: "Legend",
    minLifetime: 1500,
    maxLifetime: null,
    emoji: "👑",
    blurb: "Elite vault status — schedule often to stay on top.",
  },
];

export const GURU_REWARD_TEMPLATES = [
  {
    id: "good_manners",
    points: 25,
    label: "Good Manners",
    memo: "Awarded for excellent leash manners!",
  },
  {
    id: "great_potty",
    points: 50,
    label: "Great Potty Routine",
    memo: "Awarded for an excellent potty routine!",
  },
  {
    id: "superstar",
    points: 75,
    label: "Walk Superstar",
    memo: "Awarded for outstanding walk behavior!",
  },
] as const;

export function pointsToUsd(points: number): number {
  const safe = Math.max(0, Math.floor(Number(points) || 0));
  return Math.round((safe / PAWPERKS_POINTS_PER_DOLLAR) * 100) / 100;
}

export function usdToPoints(dollars: number): number {
  const safe = Math.max(0, Number(dollars) || 0);
  return Math.max(0, Math.floor(safe * PAWPERKS_POINTS_PER_DOLLAR));
}

export function formatPawPerks(points: number): string {
  return `${Math.max(0, Math.floor(points || 0)).toLocaleString("en-US")} PawPerks`;
}

export function resolveBadgeLevel(lifetimeEarned: number): PawPerkBadgeLevel {
  const lifetime = Math.max(0, Math.floor(lifetimeEarned || 0));
  for (let i = PAWPERK_BADGE_LEVELS.length - 1; i >= 0; i -= 1) {
    const level = PAWPERK_BADGE_LEVELS[i];
    if (lifetime >= level.minLifetime) return level;
  }
  return PAWPERK_BADGE_LEVELS[0];
}

export function nextBadgeProgress(lifetimeEarned: number): {
  current: PawPerkBadgeLevel;
  next: PawPerkBadgeLevel | null;
  progressPct: number;
  pointsToNext: number;
} {
  const current = resolveBadgeLevel(lifetimeEarned);
  const idx = PAWPERK_BADGE_LEVELS.findIndex((l) => l.id === current.id);
  const next = idx >= 0 ? PAWPERK_BADGE_LEVELS[idx + 1] || null : null;
  if (!next) {
    return { current, next: null, progressPct: 100, pointsToNext: 0 };
  }
  const span = next.minLifetime - current.minLifetime;
  const gained = Math.max(0, lifetimeEarned - current.minLifetime);
  const progressPct = span > 0 ? Math.min(100, Math.round((gained / span) * 100)) : 100;
  return {
    current,
    next,
    progressPct,
    pointsToNext: Math.max(0, next.minLifetime - lifetimeEarned),
  };
}

/**
 * Cap redeemable points so checkout remains chargeable (Stripe min ~$0.50)
 * and never exceeds the parent's balance or the payable subtotal.
 */
export function clampRedeemablePoints(params: {
  availablePoints: number;
  /** Cents remaining after other discounts, before PawPerks. */
  payableCentsBeforePerks: number;
  requestedPoints?: number;
  /** Keep at least this many cents on the PaymentIntent (default 50). */
  minPayableCents?: number;
}): number {
  const available = Math.max(0, Math.floor(params.availablePoints || 0));
  const payable = Math.max(0, Math.floor(params.payableCentsBeforePerks || 0));
  const minPayable = Math.max(0, Math.floor(params.minPayableCents ?? 50));
  const maxByTotal = Math.max(0, payable - minPayable);
  // 100 points = $1.00 = 100 cents → 1 point = 1 cent
  const maxPointsAffordable = Math.min(available, maxByTotal);

  if (params.requestedPoints == null) return maxPointsAffordable;
  return Math.min(maxPointsAffordable, Math.max(0, Math.floor(params.requestedPoints)));
}
