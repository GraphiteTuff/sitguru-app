import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decryptSecret,
  encryptSecret,
  looksEncrypted,
  resolveAccountingEncryptionKey,
} from "./encryption";
import { isValidWaveOAuthStateFormat } from "./wave/oauth";
import { hasWaveWriteScope } from "./wave/config";
import { suggestAccountMappings } from "./mapping";
import {
  buildCanonicalAccountingEvent,
  refundReversesAmounts,
  salesTaxStaysSeparate,
} from "./events";
import { isRecognizedWaveWebhook } from "./wave/webhooks";
import { buildWavePushItems } from "./wave/push-draft";

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
      { id: "int", name: "Interest Income", type: "INCOME", subtype: "OTHER_INCOME", archived: false },
    ]);
    const used = mapped.map((row) => row.providerAccountId).filter(Boolean);
    assert.equal(new Set(used).size, used.length);
    assert.equal(
      mapped.find((row) => row.sitguruAccountKey === "sales_tax_payable")?.providerAccountId,
      "tax",
    );
    assert.notEqual(
      mapped.find((row) => row.sitguruAccountKey === "service_revenue")?.providerAccountId,
      "int",
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

describe("wave push draft", () => {
  it("posts fees, tax, payouts, and expenses and skips zeros", () => {
    const items = buildWavePushItems({
      taxYear: 2026,
      asOf: "2026-09-05",
      fees: 12.5,
      tax: 0,
      payouts: 40,
      expenses: 5,
      refunds: 0,
    });
    assert.deepEqual(
      items.map((row) => row.key),
      ["platform-fees", "guru-payouts", "operating-expenses"],
    );
    assert.equal(items[0]?.externalId, "sitguru:ytd:2026:platform-fees");
    assert.equal(items[0]?.anchorKey, "stripe_clearing");
    assert.equal(items[0]?.direction, "DEPOSIT");
    assert.equal(items[1]?.direction, "WITHDRAWAL");
  });
});

describe("wave write scopes", () => {
  it("requires transaction:write before Tax Center can post books", () => {
    assert.equal(hasWaveWriteScope("user:read business:read account:read"), false);
    assert.equal(
      hasWaveWriteScope("user:read business:read account:read transaction:write"),
      true,
    );
  });
});

describe("wave webhooks", () => {
  it("recognizes known event names", () => {
    assert.equal(isRecognizedWaveWebhook("transaction.changed"), true);
    assert.equal(isRecognizedWaveWebhook("invoice.send"), false);
  });
});
