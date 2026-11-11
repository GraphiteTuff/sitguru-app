/**
 * Shared email header hygiene helpers.
 * Keep subjects / display names / Reply-To free of CR/LF to reduce injection risk.
 */

const CONTROL_CHARS = /[\r\n\u0000]/g;

/** Strip CR/LF/NUL from a single-line header value. */
export function sanitizeEmailHeaderValue(value: string): string {
  return String(value || "")
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a safe From header like `Display Name <mailbox@domain>`.
 * Mailbox domain is never taken from untrusted input.
 */
export function buildSafeFromHeader(
  displayName: string,
  mailbox: string,
): string {
  const safeName =
    sanitizeEmailHeaderValue(displayName).replace(/[<>"]/g, "") || "SitGuru";
  const safeMailbox = sanitizeEmailHeaderValue(mailbox).replace(/[<>\s]/g, "");
  if (!safeMailbox.includes("@")) {
    throw new Error("Invalid From mailbox.");
  }
  return `${safeName} <${safeMailbox}>`;
}

export type MarketingUnsubscribeHeaders = {
  "List-Unsubscribe": string;
  "List-Unsubscribe-Post": string;
};

/**
 * RFC 8058 one-click unsubscribe headers for marketing mail only.
 * Do not attach these to auth/security/OTP messages.
 */
export function buildMarketingUnsubscribeHeaders(params: {
  unsubscribeUrl: string;
}): MarketingUnsubscribeHeaders {
  const url = sanitizeEmailHeaderValue(params.unsubscribeUrl);
  if (!/^https:\/\//i.test(url)) {
    throw new Error("Unsubscribe URL must be an absolute https URL.");
  }
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/** True when a string looks like a usable email address (not Apple-hostile). */
export function isProbablyValidEmail(value: string): boolean {
  const cleaned = sanitizeEmailHeaderValue(value).toLowerCase();
  if (!cleaned || cleaned.length > 254) return false;
  // Allow Apple Private Relay and other valid forms with + / dots.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
}

export function normalizeEmailAddress(value: string): string {
  return sanitizeEmailHeaderValue(value).toLowerCase();
}
