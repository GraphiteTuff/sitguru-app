import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decryptSecret,
  encryptSecret,
  looksEncrypted,
  resolveAccountingEncryptionKey,
} from "./encryption";
import { isValidWaveOAuthStateFormat } from "./wave/oauth";
import { suggestAccountMappings } from "./mapping";
import {
  buildCanonicalAccountingEvent,
  refundReversesAmounts,
  salesTaxStaysSeparate,
} from "./events";
import { isRecognizedWaveWebhook } from "./wave/webhooks";

describe("accounting token encryption", () => {
  it("round-trips a secret without putting the plaintext in the payload", () => {
    const secret = "wave-access-token-example";
    const payload = encryptSecret(secret, "sitguru-test-key");
    assert.equal(looksEncrypted(payload), true);
    assert.equal(payload.includes(secret), false);
    assert.equal(decryptSecret(payload, "sitguru-test-key"), secret);
  });

  it("uses a 32-byte standard Base64 key as the AES-256-GCM key", () => {
    const base64Key = Buffer.alloc(32, 7).toString("base64");
    const resolved = resolveAccountingEncryptionKey(base64Key);
    assert.equal(resolved.length, 32);
    assert.equal(Buffer.compare(resolved, Buffer.alloc(32, 7)), 0);
  });
});

describe("wave oauth state", () => {
  it("accepts 48 hex chars and rejects junk", () => {
    assert.equal(isValidWaveOAuthStateFormat("a".repeat(48)), true);
    assert.equal(isValidWaveOAuthStateFormat("not-a-state"), false);
    assert.equal(isValidWaveOAuthStateFormat(""), false);
  });
});

describe("wave account mapping", () => {
  it("does not duplicate the same Wave account across SitGuru ledgers", () => {
    const mapped = suggestAccountMappings([
      { id: "inc", name: "Sales", type: "INCOME", subtype: "INCOME", archived: false },
      { id: "tax", name: "Sales Tax Payable", type: "LIABILITY", subtype: "SALES_TAX", archived: false },
      { id: "cogs", name: "Contractor Payments", type: "EXPENSE", subtype: "COST_OF_GOODS_SOLD", archived: false },
    ]);
    const used = mapped.map((row) => row.providerAccountId).filter(Boolean);
    assert.equal(new Set(used).size, used.length);
    assert.equal(
      mapped.find((row) => row.sitguruAccountKey === "sales_tax_payable")?.providerAccountId,
      "tax",
    );
  });
});

describe("canonical accounting events", () => {
  it("keeps sales tax, tips, guru payouts, and refunds separate", () => {
    const event = buildCanonicalAccountingEvent({
      sourceKey: "pay_1",
      eventDate: "2026-09-04",
      grossServiceAmount: 40,
      salesTax: 2.4,
      tip: 8,
      guruPayout: 40,
      refundAmount: 5,
    });
    assert.equal(event.tip, 8);
    assert.equal(event.salesTax, 2.4);
    assert.equal(event.guruPayout, 40);
    assert.equal(salesTaxStaysSeparate(event), true);
    assert.equal(refundReversesAmounts(event).grossServiceAmount, 35);
  });
});

describe("wave webhooks stay dormant", () => {
  it("recognizes known event names without enabling writes", () => {
    assert.equal(isRecognizedWaveWebhook("transaction.changed"), true);
    assert.equal(isRecognizedWaveWebhook("invoice.send"), false);
  });
});
