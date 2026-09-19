/**
 * SitGuru account email resolution.
 *
 * AUTH EMAIL  — identity from the auth provider (may be Apple Private Relay).
 * CONTACT EMAIL — optional address the user provides for SitGuru communications.
 *
 * Never overwrite a stored auth/login email just because contact email changes.
 * Never overwrite a non-empty contact email during auth-email backfill.
 */

import {
  isApplePrivateRelayEmail,
  normalizeEmail,
  resolveAuthProvider,
  type AuthProviderHint,
} from "@/lib/auth/apple-email";

export type AccountEmailSources = {
  /** Explicit contact email collected by the product (preferred for outreach). */
  contactEmail?: string | null;
  /** Stored profile / guru login email (SitGuru copy of auth email). */
  profileEmail?: string | null;
  /** Guru application snapshot email. */
  guruEmail?: string | null;
  /** Authenticated Supabase user.email. */
  authEmail?: string | null;
};

export type ResolvedAccountEmails = {
  /** Login / authentication email (may be Apple Private Relay). */
  authEmail: string | null;
  /** Optional business/contact email, distinct from login when present. */
  contactEmail: string | null;
  /** Best email for display / communications / Stripe fallback. */
  displayEmail: string | null;
  authProvider: AuthProviderHint;
  isPrivateRelay: boolean;
};

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const normalized = normalizeEmail(value);
    if (normalized) return normalized;
  }
  return null;
}

/**
 * Resolve emails for Guru application / Admin / Stripe.
 * Order for display/login email:
 * 1. stored guru email
 * 2. stored profile email
 * 3. auth user email
 *
 * Contact email stays separate when present.
 */
export function resolveAccountEmails(
  sources: AccountEmailSources & {
    provider?: string | null;
    appMetadata?: Record<string, unknown> | null;
    userMetadata?: Record<string, unknown> | null;
    identities?: Array<{ provider?: string | null }> | null;
  },
): ResolvedAccountEmails {
  const authEmail = firstNonEmpty(
    sources.guruEmail,
    sources.profileEmail,
    sources.authEmail,
  );

  const contactEmail = normalizeEmail(sources.contactEmail);
  const distinctContact =
    contactEmail && contactEmail !== authEmail ? contactEmail : null;

  const authProvider = resolveAuthProvider({
    provider: sources.provider,
    appMetadata: sources.appMetadata,
    userMetadata: sources.userMetadata,
    identities: sources.identities,
  });

  return {
    authEmail,
    contactEmail: distinctContact,
    displayEmail: distinctContact || authEmail,
    authProvider,
    isPrivateRelay: isApplePrivateRelayEmail(authEmail),
  };
}

/**
 * Prefer contact email for Stripe / outreach when the user supplied one;
 * otherwise fall back to the authentication email (including Apple relay).
 */
export function resolvePreferredContactEmail(
  sources: AccountEmailSources,
): string | null {
  const resolved = resolveAccountEmails(sources);
  return resolved.contactEmail || resolved.authEmail;
}

/**
 * Whether a SitGuru profile/guru `email` field should be repaired from auth.
 * Idempotent: only when destination is empty and auth has a value.
 */
export function shouldBackfillAuthEmail(input: {
  existingEmail: string | null | undefined;
  authEmail: string | null | undefined;
}): boolean {
  const existing = normalizeEmail(input.existingEmail);
  const auth = normalizeEmail(input.authEmail);
  return !existing && Boolean(auth);
}

/**
 * Whether contact_email should be written. Never overwrites a non-empty value
 * with auth email during repair. Only write when empty and a distinct contact
 * was explicitly supplied.
 */
export function shouldWriteContactEmail(input: {
  existingContactEmail: string | null | undefined;
  nextContactEmail: string | null | undefined;
  authEmail?: string | null | undefined;
}): boolean {
  const existing = normalizeEmail(input.existingContactEmail);
  if (existing) return false;

  const next = normalizeEmail(input.nextContactEmail);
  if (!next) return false;

  const auth = normalizeEmail(input.authEmail);
  if (auth && next === auth) return false;

  return true;
}
