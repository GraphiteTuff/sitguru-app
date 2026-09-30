import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAuthOtpSmsMetadata,
  buildOngoingSmsConsentMetadata,
  formatSitGuruOtpSms,
  isTwilioSmsOptOutError,
  SMS_OTP_AUTH_DISCLOSURE,
  SMS_TRANSACTIONAL_OPT_IN_LABEL,
} from "./disclosures";

describe("sms disclosures", () => {
  it("keeps OTP auth disclosure separate from ongoing transactional opt-in", () => {
    assert.match(SMS_OTP_AUTH_DISCLOSURE, /one-time authentication text/i);
    assert.match(SMS_OTP_AUTH_DISCLOSURE, /STOP/);
    assert.match(SMS_OTP_AUTH_DISCLOSURE, /HELP/);
    assert.match(SMS_TRANSACTIONAL_OPT_IN_LABEL, /Message frequency varies/);
    assert.match(SMS_TRANSACTIONAL_OPT_IN_LABEL, /not a condition of purchase/i);
  });

  it("formats OTP SMS with HELP/STOP and SitGuru identity", () => {
    const body = formatSitGuruOtpSms("123456");
    assert.match(body, /^SitGuru: Your secure login code is 123456\./);
    assert.match(body, /Happy tails are one step away!/);
    assert.match(body, /Keep this code private/);
    assert.match(body, /HELP/);
    assert.match(body, /STOP/);
    assert.doesNotMatch(body, /\{\{otp\}\}/);
  });

  it("does not treat OTP request metadata as ongoing SMS consent", () => {
    const authOnly = buildAuthOtpSmsMetadata();
    assert.ok(authOnly.auth_otp_sms_authorized_at);
    assert.equal(
      "transactional_sms_opt_in" in authOnly,
      false,
      "auth OTP metadata must not set ongoing consent fields",
    );

    const optedOut = buildOngoingSmsConsentMetadata(false);
    assert.equal(optedOut.transactional_sms_opt_in, false);
    assert.equal(optedOut.sms_opt_in, false);
    assert.equal(optedOut.sms_consent, false);

    const optedIn = buildOngoingSmsConsentMetadata(true);
    assert.equal(optedIn.transactional_sms_opt_in, true);
    assert.equal(optedIn.sms_consent, true);
    assert.ok(optedIn.sms_consent_at);
  });

  it("detects Twilio opt-out errors", () => {
    assert.equal(isTwilioSmsOptOutError("21610: Attempt to send to unsubscribed recipient"), true);
    assert.equal(isTwilioSmsOptOutError("network timeout"), false);
  });
});
