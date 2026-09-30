import {
  isReferralAcquisition,
  normalizeReferralCode,
  readCookieValue,
  REFERRAL_CAPTURE_SKEW_MS,
} from "@/lib/ambassador/creator-referral";

export { isReferralAcquisition, REFERRAL_CAPTURE_SKEW_MS };
import {
  AMBASSADOR_CODE_COOKIE,
  AMBASSADOR_REF_COOKIE,
  AMBASSADOR_REF_COOKIE_MAX_AGE_SEC,
} from "@/lib/ambassador/ledger-types";

/** HttpOnly. The browser cannot mint this timestamp. */
export const AMBASSADOR_CAPTURED_AT_COOKIE = "sitguru_ambassador_captured_at";
/** HttpOnly HMAC over the code and the capture timestamp. */
export const AMBASSADOR_CAPTURE_MAC_COOKIE = "sitguru_ambassador_capture_mac";

/**
 * Keep the original server capture time while the pending code stays the same.
 * A different valid code may replace it before signup. After signup, checkout
 * ignores this cookie and reads the locked row.
 */
export function referralCaptureTimestamp(input: {
  incomingCode: string;
  existingCode?: string | null;
  existingCapturedAt?: string | null;
  existingTrusted: boolean;
  now?: string;
}) {
  const incoming = normalizeReferralCode(input.incomingCode);
  const existing = normalizeReferralCode(input.existingCode);
  if (
    input.existingTrusted &&
    incoming &&
    existing === incoming &&
    input.existingCapturedAt
  ) {
    return input.existingCapturedAt;
  }
  return input.now || new Date().toISOString();
}

function captureSecret() {
  return (
    process.env.REFERRAL_CAPTURE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function signReferralCapture(
  code: string,
  capturedAt: string,
  secret = captureSecret(),
) {
  const normalized = normalizeReferralCode(code);
  if (!normalized || !capturedAt || !secret) return "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${normalized}.${capturedAt}`),
  );
  return bytesToHex(new Uint8Array(signature));
}

export async function verifyReferralCapture(input: {
  code?: string | null;
  capturedAt?: string | null;
  mac?: string | null;
  secret?: string;
}) {
  const code = normalizeReferralCode(input.code);
  const capturedAt = String(input.capturedAt || "").trim();
  const mac = String(input.mac || "").trim().toLowerCase();
  if (!code || !capturedAt || !mac) return false;
  const expected = (
    await signReferralCapture(code, capturedAt, input.secret)
  ).toLowerCase();
  if (!expected || expected.length !== mac.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ mac.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function readTrustedReferralCapture(
  cookieHeader: string | null | undefined,
) {
  const code = normalizeReferralCode(
    readCookieValue(cookieHeader, AMBASSADOR_CODE_COOKIE) ||
      readCookieValue(cookieHeader, AMBASSADOR_REF_COOKIE),
  );
  const capturedAt = readCookieValue(cookieHeader, AMBASSADOR_CAPTURED_AT_COOKIE);
  const mac = readCookieValue(cookieHeader, AMBASSADOR_CAPTURE_MAC_COOKIE);
  const trusted = await verifyReferralCapture({ code, capturedAt, mac });
  if (!trusted) return null;
  return { code, capturedAt };
}

type CookieResponse = {
  cookies: {
    set: (cookie: {
      name: string;
      value: string;
      httpOnly?: boolean;
      sameSite?: "lax" | "strict" | "none";
      secure?: boolean;
      path?: string;
      maxAge?: number;
    }) => void;
  };
};

export async function sealReferralOnResponse(
  response: CookieResponse,
  code: string,
  capturedAt?: string,
  cookieHeader?: string | null,
) {
  const normalized = normalizeReferralCode(code);
  const existing = await readTrustedReferralCapture(cookieHeader);
  const stamp = referralCaptureTimestamp({
    incomingCode: normalized,
    existingCode: existing?.code,
    existingCapturedAt: existing?.capturedAt,
    existingTrusted: Boolean(existing),
    now: capturedAt,
  });
  const mac = await signReferralCapture(normalized, stamp);
  if (!normalized || !mac) return null;

  const shared = {
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AMBASSADOR_REF_COOKIE_MAX_AGE_SEC,
  };

  response.cookies.set({
    name: AMBASSADOR_REF_COOKIE,
    value: normalized,
    httpOnly: true,
    ...shared,
  });
  // Signup still reads this one value in the browser. The timestamp and MAC do not.
  response.cookies.set({
    name: AMBASSADOR_CODE_COOKIE,
    value: normalized,
    httpOnly: false,
    ...shared,
  });
  response.cookies.set({
    name: AMBASSADOR_CAPTURED_AT_COOKIE,
    value: stamp,
    httpOnly: true,
    ...shared,
  });
  response.cookies.set({
    name: AMBASSADOR_CAPTURE_MAC_COOKIE,
    value: mac,
    httpOnly: true,
    ...shared,
  });

  return { code: normalized, capturedAt: stamp, mac };
}
