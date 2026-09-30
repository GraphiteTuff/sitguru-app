/**
 * Shared Creator Ambassador referral rules.
 * Extends the existing Ambassador code system. No second referral program.
 */

export const CREATOR_AMBASSADOR_TYPE = "creator_ambassador";

export const ATTRIBUTION_WINDOW_DAYS_DEFAULT = 30;

/**
 * OAuth login guard only. A returning Google or Apple login inside this window
 * is still treated as a fresh session so SitGuru can finish a signup that just
 * started. It is not the Ambassador acquisition rule.
 */
export const FRESH_AUTH_SESSION_MS = 15 * 60 * 1000;

/**
 * Clock skew between this server and Supabase Auth.
 * An account created before the referral was captured is an existing account.
 */
export const REFERRAL_CAPTURE_SKEW_MS = 15 * 1000;

export function isReferralAcquisition(input: {
  accountCreatedAt?: string | null;
  referralCapturedAt?: string | null;
  skewMs?: number;
}) {
  const created = Date.parse(String(input.accountCreatedAt || ""));
  const captured = Date.parse(String(input.referralCapturedAt || ""));
  if (!Number.isFinite(created) || !Number.isFinite(captured)) return false;
  const skew = input.skewMs ?? REFERRAL_CAPTURE_SKEW_MS;
  return created + skew >= captured;
}

/** Codes that would collide with SitGuru routes or API paths. */
export const RESERVED_REFERRAL_CODES = [
  "admin",
  "api",
  "ambassador",
  "book",
  "booking",
  "creator",
  "guru",
  "help",
  "login",
  "pet",
  "pets",
  "r",
  "search",
  "signup",
  "support",
] as const;

export function normalizeReferralCode(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

export function isReservedReferralCode(value: string | null | undefined) {
  const code = normalizeReferralCode(value);
  if (code.length < 2 || code.length > 32) return true;
  return RESERVED_REFERRAL_CODES.some((reserved) => reserved.toUpperCase() === code);
}

export function isCreatorAmbassadorType(value: string | null | undefined) {
  const raw = String(value || "").trim().toLowerCase();
  return raw === CREATOR_AMBASSADOR_TYPE || raw === "creator";
}

export function creatorRoleLabel(ambassadorType: string | null | undefined) {
  return isCreatorAmbassadorType(ambassadorType)
    ? "Creator Ambassador"
    : "Ambassador";
}

export function publicReferralPath(code: string) {
  const normalized = normalizeReferralCode(code);
  return normalized ? `/r/${encodeURIComponent(normalized)}` : "/search";
}

export function publicReferralUrl(origin: string, code: string) {
  const base = String(origin || "https://www.sitguru.com").replace(/\/$/, "");
  return `${base}${publicReferralPath(code)}`;
}

/**
 * Before registration, a newer valid click may replace the stored code.
 * After a valid code is locked onto the account, later clicks do not move it.
 */
export function resolveReferralAttribution(input: {
  lockedCode?: string | null;
  incomingCode?: string | null;
}) {
  const locked = normalizeReferralCode(input.lockedCode);
  const incoming = normalizeReferralCode(input.incomingCode);
  if (locked) {
    return { code: locked, locked: true as const, replaced: false };
  }
  if (incoming) {
    return { code: incoming, locked: false as const, replaced: true };
  }
  return { code: "", locked: false as const, replaced: false };
}

/**
 * Pending referral cookies and mobile storage are removed only after the
 * server has stored a permanent acquisition, or confirmed one already exists.
 * Existing-account, self-referral, and failed requests keep the pending seal.
 */
export function shouldClearPendingReferral(input: {
  applied?: boolean;
  status?: string | null;
}) {
  return input.applied === true || input.status === "already_locked";
}

/** Same acquisition rule as signup. Existing accounts are not new-customer rewards. */
export function existingAccountRewardEligible(input: {
  accountCreatedAt?: string | null;
  referralCapturedAt?: string | null;
}) {
  return isReferralAcquisition(input);
}

export function funnelRate(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function isFreshAuthSession(
  accountCreatedAt?: string | null,
  now = Date.now(),
) {
  const created = Date.parse(String(accountCreatedAt || ""));
  if (!Number.isFinite(created)) return false;
  return now >= created && now - created <= FRESH_AUTH_SESSION_MS;
}

/** @deprecated Use isFreshAuthSession. This does not decide referral acquisition. */
export const shouldLockAcquisition = isFreshAuthSession;

const QUALIFIED_BOOKING_STATUSES = new Set(["completed", "complete"]);
const QUALIFIED_PAYMENT_STATUSES = new Set([
  "paid",
  "succeeded",
  "complete",
  "completed",
]);

/**
 * A qualified Creator conversion is the first completed, paid booking
 * on a new account's locked Ambassador. It does not pay a reward by itself.
 */
export function isQualifiedCreatorConversion(input: {
  hasLockedReferral: boolean;
  isNewAccount: boolean;
  isSelfReferral: boolean;
  isFirstQualifyingBooking: boolean;
  bookingStatus?: string | null;
  paymentStatus?: string | null;
}) {
  if (!input.hasLockedReferral || !input.isNewAccount || input.isSelfReferral) {
    return false;
  }
  if (!input.isFirstQualifyingBooking) return false;
  const bookingStatus = String(input.bookingStatus || "").trim().toLowerCase();
  const paymentStatus = String(input.paymentStatus || "").trim().toLowerCase();
  if (bookingStatus === "canceled" || bookingStatus === "cancelled") return false;
  if (paymentStatus === "refunded") return false;
  return (
    QUALIFIED_BOOKING_STATUSES.has(bookingStatus) &&
    QUALIFIED_PAYMENT_STATUSES.has(paymentStatus)
  );
}

export function readCookieValue(
  cookieHeader: string | null | undefined,
  name: string,
) {
  const source = String(cookieHeader || "");
  if (!source || !name) return "";
  for (const part of source.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    const raw = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return "";
}

/**
 * Last touch before signup: an explicit link wins, then the validated cookie,
 * then Auth metadata. Attribution is still locked by user id on the server.
 */
export function incomingAmbassadorCode(input: {
  queryCode?: string | null;
  cookieHeader?: string | null;
  metadataCode?: string | null;
}) {
  const fromQuery = normalizeReferralCode(input.queryCode);
  if (fromQuery) return fromQuery;
  const fromCookie = normalizeReferralCode(
    readCookieValue(input.cookieHeader, "sitguru_ambassador_code") ||
      readCookieValue(input.cookieHeader, "sitguru_ambassador_ref"),
  );
  if (fromCookie) return fromCookie;
  return normalizeReferralCode(input.metadataCode);
}

export function referralDateWindow(preset: string, now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (preset === "7d") start.setDate(start.getDate() - 6);
  else if (preset === "90d") start.setDate(start.getDate() - 89);
  else if (preset === "year") start.setMonth(0, 1);
  else if (preset === "all") return { start: null as Date | null, end };
  else start.setDate(start.getDate() - 29);
  return { start, end };
}
