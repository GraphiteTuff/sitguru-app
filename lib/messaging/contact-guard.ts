/**
 * In-app messaging contact-data guardrails.
 * Blocks phone numbers and email addresses from leaving SitGuru chat.
 */

export const SITGURU_CONTACT_GUARD_ALERT =
  "🐾 For your platform security and verification protection, keeping contact data inside SitGuru chat is mandatory.";

/** US-style phone patterns: 555-123-4567, 555.123.4567, 5551234567 */
export const PHONE_CONTACT_PATTERN = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;

/** Simple email structure */
export const EMAIL_CONTACT_PATTERN =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

export type ContactGuardResult =
  | { blocked: false }
  | { blocked: true; reason: "phone" | "email"; alert: string };

export function scanMessageForOffPlatformContact(
  value: string,
): ContactGuardResult {
  const text = String(value || "");
  if (PHONE_CONTACT_PATTERN.test(text)) {
    return {
      blocked: true,
      reason: "phone",
      alert: SITGURU_CONTACT_GUARD_ALERT,
    };
  }
  if (EMAIL_CONTACT_PATTERN.test(text)) {
    return {
      blocked: true,
      reason: "email",
      alert: SITGURU_CONTACT_GUARD_ALERT,
    };
  }
  return { blocked: false };
}

export function containsOffPlatformContact(value: string) {
  return scanMessageForOffPlatformContact(value).blocked;
}
