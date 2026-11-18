/**
 * Central SitGuru email sender configuration.
 *
 * Stream separation principle:
 * - PERSONAL (jason@sitguru.com) — human Microsoft 365 only; never app From
 * - SUPPORT — human-facing Reply-To / support mailbox
 * - TRANSACTIONAL / OPERATIONAL — Resend From addresses on sitguru.com
 * - MARKETING — Resend + unsubscribe headers; do not impersonate Jason
 * - AUTH — Supabase Auth (dashboard SMTP), not this module
 *
 * Env names match existing production conventions. Values are never logged here.
 */

import { SITE_CONFIG } from "@/lib/config/site";

export const EMAIL_STREAMS = {
  PERSONAL: "personal",
  SUPPORT: "support",
  TRANSACTIONAL: "transactional",
  OPERATIONAL: "operational",
  MARKETING: "marketing",
  AUTH: "auth",
  RECRUITING: "recruiting",
} as const;

export type EmailStream = (typeof EMAIL_STREAMS)[keyof typeof EMAIL_STREAMS];

/** Addresses that must never be used as automated Resend From. */
export const PROTECTED_PERSONAL_MAILBOXES = [
  "jason@sitguru.com",
] as const;

const DEFAULT_SUPPORT = SITE_CONFIG.supportEmail;
const DEFAULT_ALERT_FROM = SITE_CONFIG.alertFromEmail;

function cleanEnv(name: string): string {
  return String(process.env[name] || "").trim();
}

function firstEnv(...names: string[]): string {
  for (const name of names) {
    const value = cleanEnv(name);
    if (value) return value;
  }
  return "";
}

export function getResendApiKeyConfigured(): boolean {
  return Boolean(cleanEnv("RESEND_API_KEY"));
}

/** Primary Resend From (required for shared helper). */
export function getTransactionalFromEmail(): string {
  return (
    firstEnv("RESEND_FROM_EMAIL", "SITGURU_FROM_EMAIL") ||
    `SitGuru <${DEFAULT_SUPPORT}>`
  );
}

export function getSupportFromEmail(): string {
  return (
    firstEnv("SITGURU_SUPPORT_FROM", "SUPPORT_FROM_EMAIL", "RESEND_FROM_EMAIL") ||
    `SitGuru Support <${DEFAULT_SUPPORT}>`
  );
}

export function getSupportReplyToEmail(): string {
  return (
    firstEnv(
      "RESEND_REPLY_TO_EMAIL",
      "SITGURU_SUPPORT_EMAIL",
      "SUPPORT_TO_EMAIL",
    ) || DEFAULT_SUPPORT
  );
}

export function getAlertFromEmail(): string {
  return (
    firstEnv(
      "SITGURU_ALERT_FROM_EMAIL",
      "ALERT_FROM_EMAIL",
      "RESEND_FROM_EMAIL",
    ) || DEFAULT_ALERT_FROM
  );
}

export function getMarketingFromEmail(): string {
  return (
    firstEnv("RESEND_FROM_EMAIL", "SITGURU_FROM_EMAIL") ||
    `SitGuru <${DEFAULT_SUPPORT}>`
  );
}

/** Canonical public origin for links inside SitGuru-controlled emails. */
export function getEmailBaseUrl(): string {
  return (
    firstEnv("NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL", "SITE_URL") ||
    SITE_CONFIG.productionOrigin
  ).replace(/\/$/, "");
}

/**
 * Guard: automated mail must not use Jason's personal mailbox as From.
 * Returns true when the From address is protected and must be blocked.
 */
export function isProtectedPersonalFrom(fromHeader: string): boolean {
  const lower = String(fromHeader || "").toLowerCase();
  const mailboxMatch = lower.match(/<([^>]+)>/);
  const mailbox = (mailboxMatch?.[1] || lower).trim();
  return (PROTECTED_PERSONAL_MAILBOXES as readonly string[]).includes(mailbox);
}

/**
 * Recommended long-term stream map (DNS/subdomains not auto-created).
 * Documented for ops — do not invent mailboxes without Microsoft / Resend setup.
 */
export const RECOMMENDED_SENDER_ARCHITECTURE = {
  personal: "Jason Graff <jason@sitguru.com>",
  support: "SitGuru Support <support@sitguru.com>",
  transactional: "SitGuru <notifications@sitguru.com> (or keep current Resend From)",
  alerts: "SitGuru Alerts <alerts@sitguru.com>",
  marketing:
    "SitGuru Updates <hello@sitguru.com> (prefer dedicated subdomain after DNS plan)",
  auth: "Configured in Supabase Auth SMTP / custom SMTP — not jason@",
} as const;

/** Env var names used by SitGuru email (documentation / ops checklist). */
export const EMAIL_ENV_VAR_NAMES = [
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_REPLY_TO_EMAIL",
  "SITGURU_FROM_EMAIL",
  "SITGURU_SUPPORT_FROM",
  "SITGURU_SUPPORT_EMAIL",
  "SITGURU_ALERT_FROM_EMAIL",
  "ALERT_FROM_EMAIL",
  "SUPPORT_FROM_EMAIL",
  "SUPPORT_TO_EMAIL",
  "FINANCE_ALERT_FROM_EMAIL",
  "FINANCIAL_EXPORT_FROM_EMAIL",
  "ADMIN_ALERT_EMAILS",
  "SITGURU_ADMIN_ALERT_EMAILS",
  "SIGNUP_ALERT_EMAILS",
  "MARKETING_LEAD_ALERT_EMAILS",
  "SITGURU_BROADCAST_EMAILS",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "SITE_URL",
  "SITGURU_EMAIL_LOGO_URL",
  "SENDGRID_API_KEY",
  "RESEND_WEBHOOK_SECRET",
] as const;
