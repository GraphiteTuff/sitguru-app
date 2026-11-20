import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GURU_EMPTY_CREDENTIAL_COPY,
  NEGATIVE_CREDENTIAL_PHRASES,
  AMERICAN_HEALTH_TRAINING,
  canGuruSetStatus,
  chooseExpirationNotice,
  cleanProviderExploreUrl,
  credentialAnalyticsSlug,
  expirationFromCertificate,
  guruMatchesCredentialFilters,
  isCleanProviderUrl,
  isCurrentPublicCredential,
  isExpiringSoon,
  isExpiredCredential,
  publicCredentialHasPrivateFields,
  selectSearchChips,
  toPublicCredential,
  type CredentialRecord,
} from "./model";

function record(overrides: Partial<CredentialRecord> = {}): CredentialRecord {
  return {
    id: "cred-1",
    guruId: "guru-1",
    ownerUserId: "user-1",
    status: "verified",
    typeSlug: "liability-insurance",
    filterKey: "insured",
    chipLabel: "Insured",
    badgeLabel: "Pet-Care Liability Insured",
    icon: "shield",
    sortOrder: 20,
    providerName: "Sample Carrier",
    expirationDate: "2027-08-20",
    reference: "POL-123456789",
    storagePath: "user-1/cred-1/coi.pdf",
    verificationNotes: "internal",
    coverageLimit: "$1,000,000",
    ...overrides,
  };
}

describe("trust credentials visibility", () => {
  it("shows a future verified credential and hides pending, rejected, and expired", () => {
    assert.equal(isCurrentPublicCredential(record(), "2026-09-30"), true);
    assert.equal(
      toPublicCredential(record({ status: "submitted" }), "2026-09-30"),
      null,
    );
    assert.equal(
      toPublicCredential(record({ status: "rejected" }), "2026-09-30"),
      null,
    );
    assert.equal(
      isCurrentPublicCredential(
        record({ expirationDate: "2026-09-01" }),
        "2026-09-30",
      ),
      false,
    );
    assert.equal(
      isExpiredCredential(record({ expirationDate: "2026-09-01" }), "2026-09-30"),
      true,
    );
  });

  it("sends one expiration reminder for the closest window", () => {
    assert.deepEqual(chooseExpirationNotice(45, {}), { window: 60, mark: [60] });
    assert.deepEqual(chooseExpirationNotice(20, { 60: true }), {
      window: 30,
      mark: [30],
    });
    assert.deepEqual(chooseExpirationNotice(5, {}), {
      window: 7,
      mark: [60, 30, 7],
    });
    assert.equal(chooseExpirationNotice(5, { 60: true, 30: true, 7: true }), null);
    assert.equal(chooseExpirationNotice(90, {}), null);
  });

  it("derives expiring soon without treating it as expired", () => {
    assert.equal(
      isExpiringSoon(record({ expirationDate: "2026-10-20" }), "2026-09-30", 60),
      true,
    );
    assert.equal(
      isCurrentPublicCredential(
        record({ expirationDate: "2026-10-20" }),
        "2026-09-30",
      ),
      true,
    );
  });

  it("never puts private fields on the public highlight", () => {
    const highlight = toPublicCredential(record(), "2026-09-30");
    assert.ok(highlight);
    assert.equal(highlight?.summary, "Current coverage verified");
    assert.equal(highlight?.validThrough, "August 2027");
    assert.equal(
      publicCredentialHasPrivateFields(highlight as unknown as Record<string, unknown>),
      false,
    );
    assert.equal(JSON.stringify(highlight).includes("POL-123456789"), false);
    assert.equal(JSON.stringify(highlight).includes("coi.pdf"), false);
  });
});

describe("trust credentials search", () => {
  it("requires every selected credential and ignores non-current ones", () => {
    const today = "2026-09-30";
    const current = [
      record({
        id: "cpr",
        typeSlug: "pet-cpr-first-aid",
        filterKey: "pet_cpr",
        expirationDate: null,
      }),
      record({
        id: "ins",
        typeSlug: "liability-insurance",
        filterKey: "insured",
        expirationDate: "2027-08-20",
      }),
      record({
        id: "bond",
        typeSlug: "bonding",
        filterKey: "bonded",
        expirationDate: "2027-01-01",
      }),
      record({
        id: "pending",
        status: "submitted",
        filterKey: "psi",
        expirationDate: null,
      }),
      record({
        id: "rejected",
        status: "rejected",
        filterKey: "professional",
        expirationDate: null,
      }),
      record({
        id: "expired",
        filterKey: "insured",
        expirationDate: "2026-01-01",
      }),
    ];
    const keys = current
      .map((item) => toPublicCredential(item, today)?.filterKey)
      .filter((key): key is string => Boolean(key));

    assert.deepEqual(keys.sort(), ["bonded", "insured", "pet_cpr"]);
    assert.equal(guruMatchesCredentialFilters(keys, []), true);
    assert.equal(guruMatchesCredentialFilters([], []), true);
    assert.equal(guruMatchesCredentialFilters(keys, ["pet_cpr"]), true);
    assert.equal(guruMatchesCredentialFilters(keys, ["pet_cpr", "insured"]), true);
    assert.equal(
      guruMatchesCredentialFilters(keys, ["pet_cpr", "insured", "bonded"]),
      true,
    );
    assert.equal(
      guruMatchesCredentialFilters(keys, ["pet_cpr", "insured", "psi"]),
      false,
    );
    assert.equal(guruMatchesCredentialFilters([], ["insured"]), false);
    assert.equal(
      guruMatchesCredentialFilters(
        current
          .filter((item) => item.status === "submitted")
          .map((item) => toPublicCredential(item, today)?.filterKey)
          .filter((key): key is string => Boolean(key)),
        ["psi"],
      ),
      false,
    );
    assert.equal(
      toPublicCredential(record({ status: "rejected" }), today),
      null,
    );
    assert.equal(
      toPublicCredential(
        record({ expirationDate: "2026-01-01" }),
        today,
      ),
      null,
    );
  });

  it("caps search chips and counts the rest", () => {
    const highlights = ["pet_cpr", "insured", "bonded", "psi"].map((key) =>
      toPublicCredential(
        record({
          id: key,
          filterKey: key,
          chipLabel: key,
          typeSlug: key,
          expirationDate: null,
        }),
        "2026-09-30",
      ),
    );
    const visible = selectSearchChips(
      highlights.filter((item): item is NonNullable<typeof item> => Boolean(item)),
      3,
    );
    assert.equal(visible.chips.length, 3);
    assert.equal(visible.extraCount, 1);
  });
});

describe("american health training", () => {
  it("uses the clean course URL and stays non-partner", () => {
    assert.equal(
      AMERICAN_HEALTH_TRAINING.trainingUrl,
      "https://www.americanhealthtraining.com/pet-cpr/",
    );
    assert.equal(AMERICAN_HEALTH_TRAINING.isPartner, false);
    assert.equal(AMERICAN_HEALTH_TRAINING.logoAuthorized, false);
    assert.equal(
      isCleanProviderUrl(AMERICAN_HEALTH_TRAINING.trainingUrl),
      true,
    );
    assert.equal(
      isCleanProviderUrl(
        "https://www.americanhealthtraining.com/pet-cpr/?utm_source=ads&gclid=abc&gbraid=1&gad_source=1",
      ),
      false,
    );
    assert.equal(
      cleanProviderExploreUrl(
        "https://www.americanhealthtraining.com/pet-cpr/?utm_campaign=spring",
        AMERICAN_HEALTH_TRAINING.publicUrl,
      ),
      AMERICAN_HEALTH_TRAINING.publicUrl,
    );
    assert.equal(
      cleanProviderExploreUrl(AMERICAN_HEALTH_TRAINING.trainingUrl, null),
      AMERICAN_HEALTH_TRAINING.trainingUrl,
    );
    assert.equal(
      credentialAnalyticsSlug("pet-cpr-first-aid"),
      "pet_cpr_first_aid",
    );
    assert.equal(
      credentialAnalyticsSlug(AMERICAN_HEALTH_TRAINING.slug),
      "american_health_training",
    );
  });

  it("does not invent an expiration and still accepts an explicit date", () => {
    assert.equal(expirationFromCertificate(null), null);
    assert.equal(expirationFromCertificate(""), null);
    assert.equal(expirationFromCertificate("2028-04-01"), "2028-04-01");
    const aht = toPublicCredential(
      record({
        typeSlug: "pet-cpr-first-aid",
        filterKey: "pet_cpr",
        chipLabel: "CPR & First Aid",
        badgeLabel: "Pet CPR & First Aid Certified",
        providerName: "American Health Training",
        expirationDate: null,
        reference: "AHT-998877",
        storagePath: "user/cert.pdf",
      }),
      "2026-09-30",
    );
    assert.equal(aht?.providerName, "American Health Training");
    assert.equal(aht?.validThrough, null);
    assert.equal(aht?.chipLabel, "CPR & First Aid");
    assert.equal(JSON.stringify(aht).includes("AHT-998877"), false);
    assert.equal(JSON.stringify(aht).includes("cert.pdf"), false);
    const other = toPublicCredential(
      record({
        id: "other-cpr",
        typeSlug: "pet-cpr-first-aid",
        filterKey: "pet_cpr",
        providerName: "Other recognized provider",
        expirationDate: null,
      }),
      "2026-09-30",
    );
    assert.equal(
      guruMatchesCredentialFilters(
        [aht?.filterKey || "", other?.filterKey || ""],
        ["pet_cpr"],
      ),
      true,
    );
    assert.equal(
      toPublicCredential(
        record({
          filterKey: "pet_cpr",
          expirationDate: "2026-01-01",
        }),
        "2026-09-30",
      ),
      null,
    );
  });
});

describe("guru empty state", () => {
  it("does not use negative credential language", () => {
    const copy = `${GURU_EMPTY_CREDENTIAL_COPY.title} ${GURU_EMPTY_CREDENTIAL_COPY.body}`.toLowerCase();
    for (const phrase of NEGATIVE_CREDENTIAL_PHRASES) {
      assert.equal(copy.includes(phrase), false, phrase);
    }
  });
});

describe("guru authorization rules", () => {
  it("lets a Guru submit but not self-verify", () => {
    assert.equal(canGuruSetStatus("submitted"), true);
    assert.equal(canGuruSetStatus("draft"), true);
    assert.equal(canGuruSetStatus("verified"), false);
    assert.equal(canGuruSetStatus("revoked"), false);
  });
});
