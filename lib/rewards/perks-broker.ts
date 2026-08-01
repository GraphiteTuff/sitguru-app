/**
 * PetPerks ↔ PawPerks synergy broker.
 * Captures public ?ref= tags, persists attribution, and shapes dashboard/checkout state.
 */

import { pointsToUsd } from "@/lib/pawperks/constants";

export const PETPERKS_REF_STORAGE_KEY = "sitguru.petperks.ref";
export const PETPERKS_REF_META_KEY = "sitguru.petperks.ref.meta";
export const PETPERKS_REF_QUERY_KEYS = [
  "ref",
  "referral",
  "petperks",
  "perk",
  "code",
] as const;

export type StoredPetPerksRef = {
  code: string;
  capturedAt: string;
  landingPath: string;
  source: "petperks" | "signup" | "other";
};

export type PawPerksDashboardState = {
  /** Credit ready to spend at checkout (redeemed cash / available vault). */
  redeemedCashCredits: number;
  /** Referrals still waiting on first eligible paid booking. */
  pendingReferrals: number;
  completedReferrals: number;
  referralCode: string;
  attributedRefCode: string | null;
  attributedFromPetPerks: boolean;
  welcomeCreditHintUsd: number;
};

export type ReferralLedgerLike = {
  referral_code?: string | null;
  pending_rewards?: number | null;
  available_credit?: number | null;
  completed_referrals?: number | null;
  earned_rewards?: number | null;
  paid_rewards?: number | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRefCode(raw: string) {
  return clean(raw).toUpperCase().replace(/\s+/g, "_");
}

export function readRefFromSearchParams(
  searchParams: URLSearchParams | null | undefined,
): string | null {
  if (!searchParams) return null;
  for (const key of PETPERKS_REF_QUERY_KEYS) {
    const value = searchParams.get(key);
    if (value && clean(value)) return normalizeRefCode(value);
  }
  return null;
}

/** Persist incoming PetPerks / referral query tags in localStorage. */
export function commitPetPerksRefToStorage(params: {
  code: string;
  landingPath?: string;
  source?: StoredPetPerksRef["source"];
}): StoredPetPerksRef | null {
  if (typeof window === "undefined") return null;
  const code = normalizeRefCode(params.code);
  if (!code) return null;

  const payload: StoredPetPerksRef = {
    code,
    capturedAt: new Date().toISOString(),
    landingPath: params.landingPath || window.location.pathname || "/petperks",
    source: params.source || "petperks",
  };

  try {
    window.localStorage.setItem(PETPERKS_REF_STORAGE_KEY, code);
    window.localStorage.setItem(PETPERKS_REF_META_KEY, JSON.stringify(payload));
  } catch {
    // private mode / blocked storage
  }

  return payload;
}

export function readStoredPetPerksRef(): StoredPetPerksRef | null {
  if (typeof window === "undefined") return null;

  try {
    const metaRaw = window.localStorage.getItem(PETPERKS_REF_META_KEY);
    if (metaRaw) {
      const parsed = JSON.parse(metaRaw) as StoredPetPerksRef;
      if (parsed?.code) {
        return {
          ...parsed,
          code: normalizeRefCode(parsed.code),
        };
      }
    }

    const code = window.localStorage.getItem(PETPERKS_REF_STORAGE_KEY);
    if (code) {
      return {
        code: normalizeRefCode(code),
        capturedAt: new Date().toISOString(),
        landingPath: "/petperks",
        source: "petperks",
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function clearStoredPetPerksRef() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PETPERKS_REF_STORAGE_KEY);
    window.localStorage.removeItem(PETPERKS_REF_META_KEY);
  } catch {
    // ignore
  }
}

/**
 * Map referral ledger + stored PetPerks tag into dashboard PawPerks state.
 * Pending referrals ≠ redeemed cash credits.
 */
export function buildPawPerksDashboardState(
  ledger: ReferralLedgerLike | null | undefined,
  storedRef: StoredPetPerksRef | null = null,
): PawPerksDashboardState {
  const pendingReferrals = Math.max(0, Number(ledger?.pending_rewards ?? 0) || 0);
  const redeemedCashCredits = Math.max(
    0,
    Number(ledger?.available_credit ?? 0) || 0,
  );
  const completedReferrals = Math.max(
    0,
    Number(ledger?.completed_referrals ?? 0) || 0,
  );

  const attributedRefCode = storedRef?.code || null;
  // Public PetPerks promo is Give $10 / Get $10 after first eligible booking.
  const welcomeCreditHintUsd = attributedRefCode ? 10 : 0;

  return {
    redeemedCashCredits,
    pendingReferrals,
    completedReferrals,
    referralCode: clean(ledger?.referral_code) || "COMMUNITY",
    attributedRefCode,
    attributedFromPetPerks: Boolean(attributedRefCode),
    welcomeCreditHintUsd,
  };
}

/** Checkout banner copy when a PawPerks / referral discount is active. */
export function formatPawPerksDiscountBanner(discountUsd: number) {
  const amount = Math.max(0, Number(discountUsd) || 0);
  const label = amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  return `🎉 PawPerks Discount Applied: Save ${label} on this booking!`;
}

export function discountUsdFromPawPerksPoints(points: number) {
  return pointsToUsd(points);
}

/** Track shared-link generation volume (client telemetry). */
export function bumpSharedLinkCounter(referralCode: string) {
  if (typeof window === "undefined") return;
  const code = normalizeRefCode(referralCode);
  if (!code) return;
  const key = `sitguru.petperks.shares.${code}`;
  try {
    const current = Number(window.localStorage.getItem(key) || 0) || 0;
    window.localStorage.setItem(key, String(current + 1));
  } catch {
    // ignore
  }
}
