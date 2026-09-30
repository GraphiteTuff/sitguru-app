import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GURU_EMPTY_CREDENTIAL_COPY,
  NEGATIVE_CREDENTIAL_PHRASES,
  canGuruSetStatus,
  chooseExpirationNotice,
  guruMatchesCredentialFilters,
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
  it("keeps zero-credential Gurus when no filter is selected", () => {
    assert.equal(guruMatchesCredentialFilters([], []), true);
    assert.equal(guruMatchesCredentialFilters([], ["insured"]), false);
    assert.equal(guruMatchesCredentialFilters(["pet_cpr"], ["insured"]), false);
    assert.equal(
      guruMatchesCredentialFilters(["insured", "bonded"], ["insured"]),
      true,
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
