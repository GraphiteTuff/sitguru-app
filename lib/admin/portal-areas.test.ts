import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAdminPathAllowedForModules,
  modulesFromPortalAreas,
} from "./portal-areas";

const avaAreas = [
  "social_media",
  "growth_marketing",
  "operations",
  "analytics_admin",
] as const;

describe("financial export paths", () => {
  it("keeps tax exports off an account without Financials", () => {
    const modules = modulesFromPortalAreas(avaAreas);

    assert.equal(
      isAdminPathAllowedForModules("/admin/financials/exports", modules),
      false,
    );
    assert.equal(isAdminPathAllowedForModules("/admin/exports", modules), false);
    assert.equal(
      isAdminPathAllowedForModules("/admin/financials/tax-reports", modules),
      false,
    );
    assert.equal(isAdminPathAllowedForModules("/admin/analytics", modules), true);
    assert.equal(isAdminPathAllowedForModules("/admin/settings", modules), true);
  });

  it("keeps the export center on an account with Financials", () => {
    const modules = modulesFromPortalAreas(["financials"]);

    assert.equal(
      isAdminPathAllowedForModules("/admin/financials/exports", modules),
      true,
    );
    assert.equal(isAdminPathAllowedForModules("/admin/exports", modules), true);
  });
});
