import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assessAmbassadorReferralQaEnvironment } from "./ambassador-referral-qa-guard";

const STAGING = {
  qaEnv: "staging",
  supabaseUrl: "https://staging-project.supabase.co",
  anonKey: "staging-anon-key-value-not-a-secret-used-in-prod",
  serviceRoleKey: "staging-service-role-key-value-not-used-in-production-xx",
  baseUrl: "http://127.0.0.1:3000",
  stripeSecretKey: "",
  emailDomain: "example.com",
};

describe("ambassador referral QA guard", () => {
  it("refuses the production Supabase project", () => {
    const decision = assessAmbassadorReferralQaEnvironment({
      ...STAGING,
      supabaseUrl: "https://mmtjhxnzuglbyumbsjhs.supabase.co",
    });
    assert.equal(decision.ok, false);
    assert.match(decision.reasons.join(" "), /production project/);
  });

  it("refuses a dummy service role and a live Stripe key", () => {
    const decision = assessAmbassadorReferralQaEnvironment({
      ...STAGING,
      serviceRoleKey: "service_role_dummy",
      stripeSecretKey: "sk_live_example",
    });
    assert.equal(decision.ok, false);
    assert.match(decision.reasons.join(" "), /service role/);
    assert.match(decision.reasons.join(" "), /live mode/);
  });

  it("allows an explicit staging project on localhost", () => {
    const decision = assessAmbassadorReferralQaEnvironment({
      ...STAGING,
      stripeSecretKey: "sk_test_example",
    });
    assert.equal(decision.ok, true);
    assert.equal(decision.payments, "stripe_test");
  });

  it("refuses www.sitguru.com as the application base", () => {
    const decision = assessAmbassadorReferralQaEnvironment({
      ...STAGING,
      baseUrl: "https://www.sitguru.com",
    });
    assert.equal(decision.ok, false);
    assert.match(decision.reasons.join(" "), /production SitGuru/);
  });
});
