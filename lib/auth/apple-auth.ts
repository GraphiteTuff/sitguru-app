/**
 * Shared Apple Sign-In config helpers.
 */

export function getAppleClientId() {
  return (
    process.env.APPLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ||
    ""
  ).trim();
}

export function getPublicAppleClientId() {
  return (
    process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ||
    process.env.APPLE_CLIENT_ID ||
    ""
  ).trim();
}

/** Official Apple JWKS endpoint (public signing keys). */
export const APPLE_JWKS_URI = "https://appleid.apple.com/auth/keys";
export const APPLE_ISSUER = "https://appleid.apple.com";
