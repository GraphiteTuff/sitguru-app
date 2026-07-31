// lib/config/site.ts
/**
 * Production site / URL configuration for SitGuru.
 * Prefer env overrides; fall back to canonical production hosts.
 */

export const SITE_CONFIG = {
  /** Canonical marketing / app origin (no trailing slash) */
  productionOrigin: "https://www.sitguru.com",
  /** Short SMS-style host (no www) used in trackable live links */
  smsOrigin: "https://sitguru.com",
  supportEmail: "support@sitguru.com",
  alertFromEmail: "SitGuru <alerts@sitguru.com>",
  vapidSubjectDefault: "mailto:support@sitguru.com",
} as const;

/**
 * Resolves the public app origin for absolute links (emails, SMS, sitemaps).
 */
export function getAppOrigin(): string {
  const fromEnv =
    String(process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "") ||
    String(process.env.SITE_URL || "").trim().replace(/\/$/, "");

  if (fromEnv) return fromEnv;
  return SITE_CONFIG.productionOrigin;
}

/**
 * Pet Parent live walk URL used in product UI and rich emails.
 */
export function buildParentWalkUrl(bookingId: string): string {
  const id = String(bookingId || "").trim();
  return `${getAppOrigin()}/parent/walk/${id}`;
}

/**
 * SMS trackable link format: https://sitguru.com/{bookingId}
 * (Product-specified short form for Twilio bodies.)
 */
export function buildSmsTrackableUrl(bookingId: string): string {
  const id = String(bookingId || "").trim().replace(/^\//, "");
  const origin =
    String(process.env.NEXT_PUBLIC_SMS_ORIGIN || "").trim().replace(/\/$/, "") ||
    SITE_CONFIG.smsOrigin;
  return `${origin}/${id}`;
}

/**
 * Absolute Help Center URL for sitemaps and outbound links.
 */
export function buildHelpUrl(path = "/help"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getAppOrigin()}${normalized}`;
}
