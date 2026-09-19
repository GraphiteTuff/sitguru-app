/**
 * Developer note — Apple Private Email Relay delivery
 *
 * SitGuru sends transactional email via Resend (`lib/email/resend.ts`) using
 * `RESEND_FROM_EMAIL` / `RESEND_API_KEY`. Apple Hide My Email addresses
 * (`@privaterelay.appleid.com`, `@private.icloud.com`) are valid recipients,
 * but Apple may silently drop mail unless the sending domain is registered
 * for Private Email Relay in Apple Developer.
 *
 * Manual steps (do NOT automate DNS / Apple Developer settings from app code):
 * 1. Apple Developer → Certificates, Identifiers & Profiles → More →
 *    Configure Sign in with Apple for Email Communication
 * 2. Register the SitGuru sending domain(s) used in RESEND_FROM_EMAIL
 * 3. Complete Apple's SPF domain verification for those domains
 * 4. Confirm Resend domain authentication (SPF/DKIM/DMARC) matches
 *
 * Do not expose this note in user-facing UI. Relay addresses must never be
 * labeled fake, disposable, or invalid inside SitGuru product copy.
 */

export const APPLE_PRIVATE_RELAY_DELIVERY_NOTE = {
  sendingService: "Resend",
  fromEnv: "RESEND_FROM_EMAIL",
  apiKeyEnv: "RESEND_API_KEY",
  relayDomains: [
    "privaterelay.appleid.com",
    "private.icloud.com",
  ] as const,
  requiresAppleDeveloperRelayRegistration: true,
} as const;
