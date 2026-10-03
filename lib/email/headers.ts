/**
 * Minimal email header hygiene used by Resend webhook suppression.
 * Keep subjects / addresses free of CR/LF.
 */

const CONTROL_CHARS = /[\r\n\u0000]/g;

/** Strip CR/LF/NUL from a single-line header value. */
export function sanitizeEmailHeaderValue(value: string): string {
  return String(value || "")
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeEmailAddress(value: string): string {
  return sanitizeEmailHeaderValue(value).toLowerCase();
}
