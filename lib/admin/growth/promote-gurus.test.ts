import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { selectPromotableGurus } from "./promote-gurus";

const visible = {
  is_public: true,
  is_public_visible: true,
  is_active: true,
  public_status: "public",
  application_status: "approved",
};

describe("promotable gurus", () => {
  it("drops inactive, incomplete, and non-bookable profiles and dedupes by user id", () => {
    const items = selectPromotableGurus([
      {
        ...visible,
        id: "old",
        user_id: "user-1",
        full_name: "Kyra",
        slug: "kyra",
        service_city: "Philadelphia",
        service_state: "PA",
        services: ["Drop-in"],
        is_bookable: true,
        updated_at: "2026-01-01",
      },
      {
        ...visible,
        id: "new",
        user_id: "user-1",
        full_name: "Kyra",
        slug: "kyra-new",
        service_city: "Philadelphia",
        service_state: "PA",
        services: ["Drop-in"],
        is_bookable: true,
        updated_at: "2026-10-01",
      },
      {
        ...visible,
        id: "other-kyra",
        user_id: "user-2",
        full_name: "Kyra",
        slug: "kyra-2",
        is_bookable: true,
        service_city: "Doylestown",
        service_state: "PA",
      },
      { ...visible, id: "inactive", full_name: "Hidden", is_active: false, is_bookable: true },
      { ...visible, id: "closed", full_name: "Closed", is_bookable: false },
      { ...visible, id: "incomplete", full_name: "Setup", application_status: "profile_incomplete", is_bookable: true },
      { ...visible, id: "blank", full_name: "", is_bookable: true },
    ]);

    assert.deepEqual(
      items.map((item) => item.id).sort(),
      ["new", "other-kyra"],
    );
    const kyra = items.find((item) => item.id === "new");
    assert.equal(kyra?.market, "Philadelphia, PA");
    assert.ok(kyra?.badges.includes("Bookable"));
    assert.equal(kyra?.badges.includes("payout"), false);
  });
});
