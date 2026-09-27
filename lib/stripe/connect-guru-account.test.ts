import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildGuruExpressAccountParams,
  isApplePrivateRelayEmail,
  resolveGuruPublicProfileUrl,
} from "./connect-guru-account";

describe("connect-guru-account", () => {
  it("detects Apple Private Relay emails", () => {
    assert.equal(
      isApplePrivateRelayEmail("8psrn7wt5v@privaterelay.appleid.com"),
      true,
    );
    assert.equal(isApplePrivateRelayEmail("ashley@gmail.com"), false);
  });

  it("builds a public SitGuru profile URL from slug", () => {
    const url = resolveGuruPublicProfileUrl({
      id: "g1",
      user_id: "u1",
      slug: "ashley-boekers-0061a488",
    });
    assert.match(url, /\/guru\/ashley-boekers-0061a488$/);
  });

  it("requests transfers only and prefills website + descriptor", () => {
    const params = buildGuruExpressAccountParams({
      guru: {
        id: "guru-1",
        user_id: "user-1",
        email: "8psrn7wt5v@privaterelay.appleid.com",
        full_name: "Ashley Boekers",
        slug: "ashley-boekers-0061a488",
      },
      authEmail: "8psrn7wt5v@privaterelay.appleid.com",
    });

    assert.equal(params.type, "express");
    assert.equal(params.capabilities?.transfers?.requested, true);
    assert.equal(params.capabilities?.card_payments, undefined);
    assert.match(String(params.business_profile?.url || ""), /ashley-boekers/);
    assert.equal(params.settings?.payments?.statement_descriptor, "SITGURU");
    assert.equal(params.individual?.first_name, "Ashley");
    assert.equal(
      (params.metadata as Record<string, string>).apple_private_relay,
      "1",
    );
  });
});
