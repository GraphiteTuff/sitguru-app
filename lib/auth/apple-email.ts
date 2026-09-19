/**
 * Apple Private Relay / Hide My Email helpers.
 *
 * Apple may supply `@privaterelay.appleid.com` or `@private.icloud.com`
 * addresses. These are valid authentication emails — never treat them as
 * disposable, temporary, or fake.
 */

const APPLE_PRIVATE_RELAY_SUFFIXES = [
  "@privaterelay.appleid.com",
  "@private.icloud.com",
] as const;

export type AuthProviderHint =
  | "apple"
  | "google"
  | "email"
  | "phone"
  | "unknown";

export function normalizeEmail(email: string | null | undefined): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function isApplePrivateRelayEmail(
  email: string | null | undefined,
): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  return APPLE_PRIVATE_RELAY_SUFFIXES.some((suffix) =>
    normalized.endsWith(suffix),
  );
}

export function resolveAuthProvider(input: {
  provider?: string | null;
  appMetadata?: Record<string, unknown> | null;
  userMetadata?: Record<string, unknown> | null;
  identities?: Array<{ provider?: string | null }> | null;
}): AuthProviderHint {
  const candidates: string[] = [];

  if (typeof input.provider === "string" && input.provider.trim()) {
    candidates.push(input.provider.trim().toLowerCase());
  }

  const appProvider = input.appMetadata?.provider;
  if (typeof appProvider === "string" && appProvider.trim()) {
    candidates.push(appProvider.trim().toLowerCase());
  }

  const appProviders = input.appMetadata?.providers;
  if (Array.isArray(appProviders)) {
    for (const value of appProviders) {
      if (typeof value === "string" && value.trim()) {
        candidates.push(value.trim().toLowerCase());
      }
    }
  }

  if (Array.isArray(input.identities)) {
    for (const identity of input.identities) {
      if (typeof identity?.provider === "string" && identity.provider.trim()) {
        candidates.push(identity.provider.trim().toLowerCase());
      }
    }
  }

  const metaProvider = input.userMetadata?.provider;
  if (typeof metaProvider === "string" && metaProvider.trim()) {
    candidates.push(metaProvider.trim().toLowerCase());
  }

  if (candidates.some((value) => value === "apple" || value.includes("apple"))) {
    return "apple";
  }
  if (candidates.some((value) => value === "google" || value.includes("google"))) {
    return "google";
  }
  if (candidates.some((value) => value === "phone" || value.includes("phone"))) {
    return "phone";
  }
  if (
    candidates.some(
      (value) =>
        value === "email" ||
        value === "password" ||
        value.includes("email"),
    )
  ) {
    return "email";
  }

  return "unknown";
}

export function applePrivateRelayLabel(
  email: string | null | undefined,
): string | null {
  return isApplePrivateRelayEmail(email) ? "Apple Private Relay" : null;
}
