/**
 * Shared SMS / A2P 10DLC disclosure copy for SitGuru (Graff Enterprises LLC DBA SitGuru).
 * Keep Privacy, Terms, signup, phone login, and OTP templates consistent.
 */

export const SITGURU_LEGAL_ENTITY =
  "Graff Enterprises LLC doing business as SitGuru";

export const SMS_PRIVACY_PATH = "/privacy";
export const SMS_TERMS_PATH = "/terms";
export const SMS_PRIVACY_URL = "https://www.sitguru.com/privacy";
export const SMS_TERMS_URL = "https://www.sitguru.com/terms";
export const SMS_SUPPORT_EMAIL = "support@sitguru.com";

/** Unchecked signup checkbox — ongoing transactional SMS (not marketing). */
export const SMS_TRANSACTIONAL_OPT_IN_LABEL =
  "Send me transactional SMS from SitGuru about account setup and security, login verification, bookings, safety, service updates, and customer support. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. SMS consent is optional and is not a condition of purchase. See our Privacy Policy and Terms & Conditions.";

/** Shown before phone OTP send — authorizes the one-time auth text only. */
export const SMS_OTP_AUTH_DISCLOSURE =
  "By requesting a code, you agree to receive a one-time authentication text from SitGuru at the mobile number provided. Message and data rates may apply. Reply HELP for help or STOP to opt out. You may use email login instead.";

export const SMS_OTP_MESSAGE_TEMPLATE =
  "SitGuru: Your secure login code is {{otp}}. Happy tails are one step away! Keep this code private. Reply HELP for help, STOP to opt out.";

export function formatSitGuruOtpSms(otp: string) {
  return SMS_OTP_MESSAGE_TEMPLATE.replace("{{otp}}", String(otp || "").trim());
}

export const SMS_OPTED_OUT_USER_MESSAGE =
  "This phone number has opted out of SitGuru texts. Text START to the SitGuru number, then request a new login code, or use email login.";

export function isTwilioSmsOptOutError(error?: string | null) {
  const text = String(error || "").toLowerCase();
  return (
    text.includes("21610") ||
    text.includes("unsubscribed") ||
    text.includes("opted out") ||
    text.includes("blacklist") ||
    text.includes("blacklisted") ||
    (text.includes("stop") && text.includes("recipient"))
  );
}

/** Metadata for a one-time auth OTP request — not ongoing transactional consent. */
export function buildAuthOtpSmsMetadata() {
  return {
    auth_otp_sms_authorized_at: new Date().toISOString(),
  };
}

/**
 * Ongoing transactional SMS preference fields.
 * Never set these true merely because a user requested an OTP.
 */
export function buildOngoingSmsConsentMetadata(optedIn: boolean) {
  if (!optedIn) {
    return {
      transactional_sms_opt_in: false,
      sms_opt_in: false,
      sms_consent: false,
      phone_notifications_enabled: false,
    };
  }

  return {
    transactional_sms_opt_in: true,
    sms_opt_in: true,
    sms_consent: true,
    sms_consent_at: new Date().toISOString(),
    phone_notifications_enabled: true,
  };
}
